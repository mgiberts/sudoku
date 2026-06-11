import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
	compactGameDataV1,
	type CompactSudokuGameDataV1,
	createGameDataV1,
	difficultyThresholds,
	expandGameDataV1,
	type SudokuGameDataV1,
	validateGameDataV1,
} from "../src/gameData";
import { createSeed, createUniquePuzzle } from "../src/sudoku";
import type { Difficulty } from "../src/types";
import { formatCuratedExpertModule } from "./game-data-module";

type ProgressFile = {
	version: 1;
	difficulty: Difficulty;
	target: number;
	config: ProgressConfig;
	accepted: SudokuGameDataV1[];
	rejected: number;
	timeouts: number;
	attempts: number;
	startedAt: string;
	updatedAt: string;
	generatorVersion: string;
};

type PersistedProgressFile = Omit<ProgressFile, "accepted"> & {
	accepted: ProgressGameData[];
};

type ProgressGameData = CompactSudokuGameDataV1 | SudokuGameDataV1;

type ProgressConfig = {
	difficulty: Difficulty;
	maxClues: number;
	maxSearchNodes: number;
	minClues: number;
	output: string;
	source: SudokuGameDataV1["source"];
	strategy: "greedy" | "grow" | "remix" | "search";
	targetClues: number;
	timeoutMs: number;
};

type Options = {
	acceptClueRange: boolean;
	allowProgressConfigChange: boolean;
	difficulty: Difficulty;
	maxClues: number;
	maxSearchNodes: number;
	maxTotalAttempts: number;
	minClues: number;
	strategy: ProgressConfig["strategy"];
	target: number;
	targetClues: number;
	timeoutMs: number;
	output: string;
	persistEvery: number;
	progress: string;
	resetProgress: boolean;
	source: SudokuGameDataV1["source"];
};

const GENERATOR_NAME = "curated-expert-generator";
const GENERATOR_VERSION = "0.1.0";
const DEFAULT_OUTPUT = "src/generated/curatedExpert.v1.ts";
const DEFAULT_PROGRESS = "scripts/output/curatedExpert.progress.json";

const options = parseArgs(process.argv.slice(2));
const progress = await loadProgress(options);
const acceptedIds = new Set(progress.accepted.map((game) => game.id));
let lastPersistedAttempt = progress.attempts;
let stopRequested = false;

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, () => {
		stopRequested = true;
		console.info(`Received ${signal}. Persisting progress before exit...`);
	});
}

while (
	!stopRequested &&
	progress.accepted.length < options.target &&
	progress.attempts < options.maxTotalAttempts
) {
	progress.attempts += 1;
	const startedAt = performance.now();
	const seed = createSeed();
	const puzzleResult = createUniquePuzzle(options.difficulty, seed, {
		maxClues: options.maxClues,
		maxSearchNodes: options.maxSearchNodes,
		minClues: options.minClues,
		shouldStop: () => stopRequested,
		strategy: options.strategy,
		targetClues: options.targetClues,
		timeoutMs: options.timeoutMs,
	});
	const durationMs = Math.round(performance.now() - startedAt);

	if (!puzzleResult) {
		if (durationMs >= options.timeoutMs) {
			progress.timeouts += 1;
		} else {
			progress.rejected += 1;
		}
		progress.updatedAt = new Date().toISOString();
		logProgress(progress, options, durationMs);
		await persistIfDue(progress, options);
		continue;
	}

	const game = createGameDataV1({
		difficulty: options.difficulty,
		generatedAt: new Date().toISOString(),
		generator: {
			name: GENERATOR_NAME,
			version: GENERATOR_VERSION,
			runtime: "bun",
			durationMs,
			attempts: progress.attempts,
		},
		puzzle: puzzleResult.puzzle,
		seed: puzzleResult.seed,
		solution: puzzleResult.solution,
		source: options.source,
	});
	const errors = validateGameDataV1(game, { requireUnique: true });

	if (durationMs >= options.timeoutMs) {
		progress.timeouts += 1;
	} else if (errors.length > 0 || acceptedIds.has(game.id)) {
		progress.rejected += 1;
	} else {
		progress.accepted.push(game);
		acceptedIds.add(game.id);
		progress.updatedAt = new Date().toISOString();
		await persist(progress, options);
		lastPersistedAttempt = progress.attempts;
	}

	progress.updatedAt = new Date().toISOString();
	logProgress(progress, options, durationMs);
	await persistIfDue(progress, options);
}

await persist(progress, options);

if (stopRequested) {
	process.exitCode = 130;
	console.info(
		`Stopped by signal after ${progress.attempts} attempts with ${progress.accepted.length}/${options.target} accepted ${options.difficulty} games.`,
	);
	process.exit();
}

if (progress.accepted.length < options.target) {
	throw new Error(
		`Stopped after ${progress.attempts} attempts with ${progress.accepted.length}/${options.target} accepted ${options.difficulty} games.`,
	);
}

console.info(`Done. Accepted ${progress.accepted.length}/${options.target} ${options.difficulty} games.`);

function parseArgs(args: string[]): Options {
	const difficulty = readOption(args, "--difficulty", "expert") as Difficulty;
	const threshold = difficultyThresholds[difficulty];
	const acceptClueRange = args.includes("--accept-clue-range");

	if (!threshold) {
		throw new Error(`Unsupported difficulty: ${difficulty}`);
	}

	const targetClues = Number(
		readOptionalOption(args, "--target-clues") ??
			String(acceptClueRange ? threshold.minClues : threshold.maxClues),
	);

	return {
		acceptClueRange,
		allowProgressConfigChange: args.includes("--allow-progress-config-change"),
		difficulty,
		maxClues: Number(
			readOptionalOption(args, "--max-clues") ??
				String(acceptClueRange ? threshold.maxClues : targetClues),
		),
		maxSearchNodes: Number(
			readOption(args, "--max-search-nodes", "20000"),
		),
		maxTotalAttempts: Number(
			readOption(args, "--max-total-attempts", String(Number.MAX_SAFE_INTEGER)),
		),
		minClues: Number(
			readOptionalOption(args, "--min-clues") ??
				String(acceptClueRange ? threshold.minClues : targetClues),
		),
		strategy: readStrategy(args),
		target: Number(readOption(args, "--target", "100")),
		targetClues,
		timeoutMs: Number(
			readOption(args, "--timeout-ms", String(threshold.maxGenerationMs)),
		),
		output: readOption(args, "--output", DEFAULT_OUTPUT),
		persistEvery: Number(readOption(args, "--persist-every", "25")),
		progress: readOption(args, "--progress", DEFAULT_PROGRESS),
		resetProgress: args.includes("--reset-progress"),
		source: readOption(args, "--source", "curated") as SudokuGameDataV1["source"],
	};
}

function readStrategy(args: string[]): Options["strategy"] {
	const strategy = readOption(args, "--strategy", "search");

	if (
		strategy !== "greedy" &&
		strategy !== "grow" &&
		strategy !== "remix" &&
		strategy !== "search"
	) {
		throw new Error(`Unsupported strategy: ${strategy}`);
	}

	return strategy;
}

function readOption(args: string[], name: string, fallback: string): string {
	return readOptionalOption(args, name) ?? fallback;
}

function readOptionalOption(args: string[], name: string): string | null {
	const index = args.indexOf(name);

	if (index === -1) {
		return null;
	}

	const value = args[index + 1];

	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${name}`);
	}

	return value;
}

async function loadProgress(options: Options): Promise<ProgressFile> {
	const progressPath = resolve(options.progress);

	if (options.resetProgress) {
		return createEmptyProgress(options);
	}

	const raw = await readOptionalText(progressPath);

	if (raw === null) {
		return createEmptyProgress(options);
	}

	const progress = JSON.parse(raw) as PersistedProgressFile;
	validateProgressConfig(progress, options);

	return {
		...progress,
		config: createProgressConfig(options),
		difficulty: options.difficulty,
		target: options.target,
		accepted: dedupeGames(progress.accepted.map(expandProgressGame)),
	};
}

async function readOptionalText(path: string): Promise<string | null> {
	try {
		return await readFile(path, "utf8");
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

function createEmptyProgress(
	options: Options,
): ProgressFile {
	const now = new Date().toISOString();

	return {
		version: 1,
		difficulty: options.difficulty,
		target: options.target,
		config: createProgressConfig(options),
		accepted: [],
		rejected: 0,
		timeouts: 0,
		attempts: 0,
		startedAt: now,
		updatedAt: now,
		generatorVersion: GENERATOR_VERSION,
	};
}

function createProgressConfig(options: Options): ProgressConfig {
	return {
		difficulty: options.difficulty,
		maxClues: options.maxClues,
		maxSearchNodes: options.maxSearchNodes,
		minClues: options.minClues,
		output: options.output,
		source: options.source,
		strategy: options.strategy,
		targetClues: options.targetClues,
		timeoutMs: options.timeoutMs,
	};
}

function validateProgressConfig(
	progress: Pick<ProgressFile, "config" | "difficulty">,
	options: Options,
): void {
	const existingConfig = progress.config ?? {
		difficulty: progress.difficulty,
		maxClues: options.targetClues,
		maxSearchNodes: options.maxSearchNodes,
		minClues: options.targetClues,
		output: options.output,
		source: options.source,
		strategy: options.strategy,
		targetClues: options.targetClues,
		timeoutMs: options.timeoutMs,
	};
	const normalizedExistingConfig = {
		...existingConfig,
		maxClues: existingConfig.maxClues ?? existingConfig.targetClues,
		minClues: existingConfig.minClues ?? existingConfig.targetClues,
	};
	const nextConfig = createProgressConfig(options);
	const mismatches = Object.entries(nextConfig)
		.filter(([key, value]) => {
			return normalizedExistingConfig[key as keyof ProgressConfig] !== value;
		})
		.map(([key, value]) => {
			const previous = normalizedExistingConfig[key as keyof ProgressConfig];
			return `${key}: progress=${String(previous)} current=${String(value)}`;
		});

	if (mismatches.length === 0) {
		return;
	}

	const message = [
		"Progress file was created with different generator settings:",
		...mismatches.map((mismatch) => `- ${mismatch}`),
		"Use --reset-progress for a clean run or --allow-progress-config-change to continue intentionally.",
	].join("\n");

	if (!options.allowProgressConfigChange) {
		throw new Error(message);
	}

	console.warn(message);
}

async function persist(
	progress: ProgressFile,
	options: Pick<Options, "output" | "progress">,
): Promise<void> {
	await writeJsonAtomically(options.progress, compactProgress(progress));
	await writeTextAtomically(options.output, formatCuratedExpertModule(progress.accepted));
}

async function persistIfDue(
	progress: ProgressFile,
	options: Pick<Options, "output" | "persistEvery" | "progress">,
): Promise<void> {
	if (
		options.persistEvery <= 0 ||
		progress.attempts - lastPersistedAttempt < options.persistEvery
	) {
		return;
	}

	await persist(progress, options);
	lastPersistedAttempt = progress.attempts;
}

async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
	await writeTextAtomically(path, `${JSON.stringify(value, null, "\t")}\n`);
}

async function writeTextAtomically(path: string, content: string): Promise<void> {
	const absolutePath = resolve(path);
	const tmpPath = `${absolutePath}.tmp`;
	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(tmpPath, content);
	await rename(tmpPath, absolutePath);
}

function dedupeGames(games: SudokuGameDataV1[]): SudokuGameDataV1[] {
	const seen = new Set<string>();
	const next: SudokuGameDataV1[] = [];

	for (const game of games) {
		if (seen.has(game.id)) {
			continue;
		}

		seen.add(game.id);
		next.push(game);
	}

	return next;
}

function compactProgress(progress: ProgressFile): PersistedProgressFile {
	return {
		...progress,
		accepted: progress.accepted.map(compactGameDataV1),
	};
}

function expandProgressGame(game: ProgressGameData): SudokuGameDataV1 {
	if (isCompactProgressGame(game)) {
		return expandGameDataV1(game);
	}

	return game;
}

function isCompactProgressGame(
	game: ProgressGameData,
): game is CompactSudokuGameDataV1 {
	return typeof game.puzzle === "string";
}

function logProgress(
	progress: ProgressFile,
	options: Pick<
		Options,
		"maxClues" | "minClues" | "strategy" | "target" | "targetClues"
	>,
	durationMs: number,
): void {
	console.info(
		[
			`accepted=${progress.accepted.length}/${options.target}`,
			`attempts=${progress.attempts}`,
			`rejected=${progress.rejected}`,
			`timeouts=${progress.timeouts}`,
			`minClues=${options.minClues}`,
			`maxClues=${options.maxClues}`,
			`targetClues=${options.targetClues}`,
			`strategy=${options.strategy}`,
			`last=${durationMs}ms`,
		].join(" "),
	);
}
