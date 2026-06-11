import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import type { SudokuGameDataV1 } from "../src/gameData";

type ProgressFile = {
	accepted?: SudokuGameDataV1[];
	attempts?: number;
	rejected?: number;
	target?: number;
	timeouts?: number;
	updatedAt?: string;
};

type InputSummary = {
	duplicateRows: number;
	invalidRows: number;
	path: string;
	rows: number;
	validRows: number;
};

const FINAL_EXPERT_COUNT = 100;
const DEFAULT_INPUT = "scripts/input/curated-expert.txt";
const DEFAULT_PROGRESS = "scripts/output/curatedExpert.progress.json";

const args = process.argv.slice(2);
const inputPath = readOption(args, "--input", DEFAULT_INPUT);
const progressPath = readOption(args, "--progress", DEFAULT_PROGRESS);
const mockGames = curatedExpertGames.filter(isMockGame);
const realGames = curatedExpertGames.filter((game) => !isMockGame(game));
const inputSummary = await loadInputSummary(inputPath);
const progress = await loadProgress(progressPath);

console.info(
	[
		`curatedExpert=${curatedExpertGames.length}`,
		`curatedExpertReal=${realGames.length}`,
		`curatedExpertMock=${mockGames.length}`,
		`finalTarget=${FINAL_EXPERT_COUNT}`,
		`ready=${realGames.length === FINAL_EXPERT_COUNT && mockGames.length === 0}`,
	].join(" "),
);

if (progress) {
	console.info(
		[
			`progressAccepted=${progress.accepted?.length ?? 0}`,
			`progressTarget=${progress.target ?? "unknown"}`,
			`progressAttempts=${progress.attempts ?? "unknown"}`,
			`progressRejected=${progress.rejected ?? "unknown"}`,
			`progressTimeouts=${progress.timeouts ?? "unknown"}`,
			`progressUpdatedAt=${progress.updatedAt ?? "unknown"}`,
		].join(" "),
	);
} else {
	console.info(`progressFile=missing path=${progressPath}`);
}

if (inputSummary) {
	console.info(
		[
			`inputRows=${inputSummary.rows}`,
			`inputValidRows=${inputSummary.validRows}`,
			`inputInvalidRows=${inputSummary.invalidRows}`,
			`inputDuplicateRows=${inputSummary.duplicateRows}`,
			`inputPath=${inputSummary.path}`,
		].join(" "),
	);
} else {
	console.info(`inputFile=missing path=${inputPath}`);
}

console.info(`next=${getNextCommand(realGames.length, mockGames.length)}`);

function getNextCommand(realCount: number, mockCount: number): string {
	if (realCount === FINAL_EXPERT_COUNT && mockCount === 0) {
		return "bun run validate:games:expert";
	}

	if (realCount > 0) {
		return "bun run validate:games:expert";
	}

	return "bun run import:expert:check or caffeinate -dimsu bun run generate:expert:probe";
}

async function loadProgress(path: string): Promise<ProgressFile | null> {
	try {
		const raw = await readFile(resolve(path), "utf8");
		return JSON.parse(raw) as ProgressFile;
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			return null;
		}

		throw error;
	}
}

async function loadInputSummary(path: string): Promise<InputSummary | null> {
	try {
		const raw = await readFile(resolve(path), "utf8");
		const seenRows = new Set<string>();
		let duplicateRows = 0;
		let invalidRows = 0;
		let rows = 0;
		let validRows = 0;

		for (const rawLine of raw.split(/\r?\n/)) {
			const value = rawLine.trim();

			if (value.length === 0 || value.startsWith("#")) {
				continue;
			}

			rows += 1;
			const normalized = value.replaceAll(".", "0");

			if (!/^[0-9]{81}$/.test(normalized)) {
				invalidRows += 1;
				continue;
			}

			if (seenRows.has(normalized)) {
				duplicateRows += 1;
			} else {
				seenRows.add(normalized);
			}

			validRows += 1;
		}

		return {
			duplicateRows,
			invalidRows,
			path,
			rows,
			validRows,
		};
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			return null;
		}

		throw error;
	}
}

function isMockGame(game: SudokuGameDataV1): boolean {
	return game.generator?.name.includes("mock") === true;
}

function readOption(args: string[], name: string, fallback: string): string {
	const index = args.indexOf(name);

	if (index === -1) {
		return fallback;
	}

	const value = args[index + 1];

	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${name}`);
	}

	return value;
}
