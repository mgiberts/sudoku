import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
	compactGameDataV1,
	createGameDataV1,
	difficultyThresholds,
	type CompactSudokuGameDataV1,
	type SudokuGameDataV1,
	validateGameDataV1,
} from "../src/gameData";
import { createSeed, createUniquePuzzle } from "../src/sudoku";
import type { Difficulty } from "../src/types";

type StarterDifficulty = Exclude<Difficulty, "expert">;

type Options = {
	count: number;
	output: string;
	timeoutMs: number;
	maxTotalAttempts: number;
};

const STARTER_DIFFICULTIES: StarterDifficulty[] = [
	"easy",
	"medium",
	"hard",
	"master",
];
const GENERATOR_NAME = "starter-puzzle-generator";
const GENERATOR_VERSION = "0.1.0";
const DEFAULT_OUTPUT = "src/generated/starterPuzzles.ts";

const options = parseArgs(process.argv.slice(2));
const gamesByDifficulty: Record<StarterDifficulty, SudokuGameDataV1[]> = {
	easy: [],
	medium: [],
	hard: [],
	master: [],
};

for (const difficulty of STARTER_DIFFICULTIES) {
	const acceptedIds = new Set<string>();
	let attempts = 0;

	while (
		gamesByDifficulty[difficulty].length < options.count &&
		attempts < options.maxTotalAttempts
	) {
		attempts += 1;
		const startedAt = performance.now();
		const seed = createSeed();
		const puzzleResult = createUniquePuzzle(difficulty, seed, {
			strategy: "greedy",
			targetClues: difficultyThresholds[difficulty].targetClues,
			timeoutMs: options.timeoutMs,
		});
		const durationMs = Math.round(performance.now() - startedAt);

		if (!puzzleResult) {
			logProgress(
				difficulty,
				gamesByDifficulty[difficulty].length,
				attempts,
				durationMs,
				durationMs >= options.timeoutMs ? "timeout" : "miss",
			);
			continue;
		}

		const game = createGameDataV1({
			difficulty,
			generatedAt: new Date().toISOString(),
			generator: {
				name: GENERATOR_NAME,
				version: GENERATOR_VERSION,
				runtime: "bun",
				durationMs,
				attempts,
			},
			puzzle: puzzleResult.puzzle,
			seed: puzzleResult.seed,
			solution: puzzleResult.solution,
			source: "starter",
		});
		const errors = validateGameDataV1(game, { requireUnique: true });

		if (errors.length > 0 || acceptedIds.has(game.id)) {
			logProgress(difficulty, gamesByDifficulty[difficulty].length, attempts, durationMs, "reject");
			continue;
		}

		gamesByDifficulty[difficulty].push(game);
		acceptedIds.add(game.id);
		logProgress(difficulty, gamesByDifficulty[difficulty].length, attempts, durationMs, "accept");
	}

	if (gamesByDifficulty[difficulty].length < options.count) {
		throw new Error(
			`Stopped after ${attempts} attempts with ${gamesByDifficulty[difficulty].length}/${options.count} accepted ${difficulty} starter games.`,
		);
	}
}

await writeTextAtomically(options.output, formatStarterModule(gamesByDifficulty));

function parseArgs(args: string[]): Options {
	return {
		count: Number(readOption(args, "--count", "3")),
		output: readOption(args, "--output", DEFAULT_OUTPUT),
		timeoutMs: Number(readOption(args, "--timeout-ms", "10000")),
		maxTotalAttempts: Number(readOption(args, "--max-total-attempts", "100")),
	};
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

async function writeTextAtomically(path: string, content: string): Promise<void> {
	const absolutePath = resolve(path);
	const tmpPath = `${absolutePath}.tmp`;
	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(tmpPath, content);
	await rename(tmpPath, absolutePath);
}

function formatStarterModule(
	gamesByDifficulty: Record<StarterDifficulty, SudokuGameDataV1[]>,
): string {
	const payload = {
		easy: gamesByDifficulty.easy.map(compactGameDataV1),
		medium: gamesByDifficulty.medium.map(compactGameDataV1),
		hard: gamesByDifficulty.hard.map(compactGameDataV1),
		master: gamesByDifficulty.master.map(compactGameDataV1),
		expert: [],
	} satisfies Record<Difficulty, CompactSudokuGameDataV1[]>;

	return `import { expandGameDataV1, type CompactSudokuGameDataV1, type SudokuGameDataV1 } from "../gameData";
import type { Difficulty } from "../types";

const compactStarterPuzzlesByDifficulty = ${JSON.stringify(payload, null, "\t")} satisfies Record<Difficulty, CompactSudokuGameDataV1[]>;

export const starterPuzzlesByDifficulty = Object.fromEntries(
	Object.entries(compactStarterPuzzlesByDifficulty).map(([difficulty, games]) => [
		difficulty,
		games.map(expandGameDataV1),
	]),
) as Record<Difficulty, SudokuGameDataV1[]>;
`;
}

function logProgress(
	difficulty: StarterDifficulty,
	accepted: number,
	attempts: number,
	durationMs: number,
	status: "accept" | "miss" | "reject" | "timeout",
): void {
	console.info(
		[
			`difficulty=${difficulty}`,
			`accepted=${accepted}`,
			`attempts=${attempts}`,
			`status=${status}`,
			`last=${durationMs}ms`,
		].join(" "),
	);
}
