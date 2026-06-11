import { difficultyThresholds } from "../src/gameData";
import { createSeed, createUniquePuzzleCandidate } from "../src/sudoku";
import type { Difficulty } from "../src/types";

type Options = {
	acceptClueRange: boolean;
	attempts: number;
	difficulty: Difficulty;
	maxClues: number;
	maxSearchNodes: number;
	minClues: number;
	strategy: "greedy" | "grow" | "remix" | "search";
	targetClues: number;
	timeoutMs: number;
};

const options = parseArgs(process.argv.slice(2));
const histogram = new Map<number, number>();
let accepted = 0;
let nullResults = 0;
let minObserved = Number.POSITIVE_INFINITY;
let maxObserved = 0;
const startedAt = performance.now();

for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
	const candidate = createUniquePuzzleCandidate(options.difficulty, createSeed(), {
		maxClues: options.maxClues,
		maxSearchNodes: options.maxSearchNodes,
		minClues: options.minClues,
		strategy: options.strategy,
		targetClues: options.targetClues,
		timeoutMs: options.timeoutMs,
	});

	if (!candidate) {
		nullResults += 1;
		continue;
	}

	accepted += candidate.accepted ? 1 : 0;
	minObserved = Math.min(minObserved, candidate.clues);
	maxObserved = Math.max(maxObserved, candidate.clues);
	histogram.set(candidate.clues, (histogram.get(candidate.clues) ?? 0) + 1);
}

console.info(
	[
		`difficulty=${options.difficulty}`,
		`attempts=${options.attempts}`,
		`accepted=${accepted}`,
		`null=${nullResults}`,
		`targetClues=${options.targetClues}`,
		`minClues=${options.minClues}`,
		`maxClues=${options.maxClues}`,
		`strategy=${options.strategy}`,
		`observedMin=${Number.isFinite(minObserved) ? minObserved : "none"}`,
		`observedMax=${maxObserved || "none"}`,
		`durationMs=${Math.round(performance.now() - startedAt)}`,
	].join(" "),
);

console.info(
	`histogram=${[...histogram.entries()]
		.sort(([left], [right]) => left - right)
		.map(([clues, count]) => `${clues}:${count}`)
		.join(",")}`,
);

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
		attempts: Number(readOption(args, "--attempts", "100")),
		difficulty,
		maxClues: Number(
			readOptionalOption(args, "--max-clues") ??
				String(acceptClueRange ? threshold.maxClues : targetClues),
		),
		maxSearchNodes: Number(readOption(args, "--max-search-nodes", "20000")),
		minClues: Number(
			readOptionalOption(args, "--min-clues") ??
				String(acceptClueRange ? threshold.minClues : targetClues),
		),
		strategy: readStrategy(args),
		targetClues,
		timeoutMs: Number(
			readOption(args, "--timeout-ms", String(threshold.maxGenerationMs)),
		),
	};
}

function readStrategy(args: string[]): Options["strategy"] {
	const strategy = readOption(args, "--strategy", "greedy");

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
