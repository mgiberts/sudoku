import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { difficultyPolicy } from "../src/difficultyPolicy";
import {
	type CompactSudokuGameDataV1,
	compactGameDataV1,
	type SudokuGameDataV1,
	validateGameDataV1,
} from "../src/gameData";
import {
	addSample,
	emptyMetrics,
	summarizeMetrics,
} from "../src/generationMetrics";
import { generateRatedGame } from "../src/puzzleGeneration";
import type { Difficulty } from "../src/types";

type StarterDifficulty = Difficulty;

type Options = {
	count: number | null;
	output: string;
	timeoutMs: number;
	maxTotalAttempts: number;
};

const STARTER_DIFFICULTIES: StarterDifficulty[] = [
	"easy",
	"medium",
	"hard",
	"master",
	"expert",
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
	expert: [],
};

const requestedCount = (difficulty: StarterDifficulty) =>
	options.count ?? difficultyPolicy.levels[difficulty].starterCount;
const metrics = emptyMetrics();
const progressPath = `${options.output}.progress.json`;
try {
	const saved = JSON.parse(await readFile(progressPath, "utf8"));
	if (saved.count === options.count && saved.timeoutMs === options.timeoutMs) {
		for (const difficulty of STARTER_DIFFICULTIES)
			gamesByDifficulty[difficulty] = (saved.games[difficulty] ?? [])
				.filter(
					(game: SudokuGameDataV1) =>
						validateGameDataV1(game, { requireUnique: true }).length === 0,
				)
				.slice(0, requestedCount(difficulty));
		Object.assign(metrics, saved.metrics ?? emptyMetrics());
	}
} catch {
	/* No usable checkpoint. */
}
for (const difficulty of STARTER_DIFFICULTIES) {
	const games = gamesByDifficulty[difficulty];
	for (
		let attempt = 0;
		games.length < requestedCount(difficulty) &&
		attempt < options.maxTotalAttempts;
		attempt++
	) {
		const { game, metrics: sample } = generateRatedGame(difficulty, {
			runtime: "bun",
			timeoutMs: options.timeoutMs,
		});
		if (game && games.some((g) => g.id === game.id)) {
			sample.accepted = false;
			sample.rejections.duplicate = 1;
		} else if (game) {
			game.source = "starter";
			games.push(game);
		}
		addSample(metrics, sample);
		await writeTextAtomically(
			progressPath,
			JSON.stringify({
				count: options.count,
				timeoutMs: options.timeoutMs,
				games: gamesByDifficulty,
				metrics,
			}),
		);
		await writeTextAtomically(
			`${options.output}.metrics.json`,
			JSON.stringify(summarizeMetrics(metrics), null, 2),
		);
		logProgress(
			difficulty,
			games.length,
			attempt + 1,
			sample.durationMs,
			sample.accepted ? "accept" : "reject",
		);
	}
	if (games.length < requestedCount(difficulty))
		throw new Error(
			`Incomplete ${difficulty} pool. Progress saved; catalog unchanged.`,
		);
}
console.log(JSON.stringify(summarizeMetrics(metrics), null, 2));

await writeTextAtomically(
	options.output,
	formatStarterModule(gamesByDifficulty),
);

function parseArgs(args: string[]): Options {
	return {
		count: args.includes("--count")
			? Number(readOption(args, "--count", "3"))
			: null,
		output: readOption(args, "--output", DEFAULT_OUTPUT),
		timeoutMs: Number(readOption(args, "--timeout-ms", "15000")),
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

async function writeTextAtomically(
	path: string,
	content: string,
): Promise<void> {
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
		expert: gamesByDifficulty.expert.map(compactGameDataV1),
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
