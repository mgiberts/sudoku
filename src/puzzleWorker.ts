import {
	createGameDataV1,
	difficultyThresholds,
	validateGameDataV1,
} from "./gameData";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
	WorkerDifficulty,
} from "./puzzleWorkerMessages";
import { createSeed, createUniquePuzzle } from "./sudoku";

const GENERATOR_NAME = "browser-worker-puzzle-generator";
const GENERATOR_VERSION = "0.1.0";

self.addEventListener("message", (event: MessageEvent<PuzzleWorkerRequest>) => {
	const message = event.data;

	if (message.type === "warm") {
		for (const difficulty of message.difficulties) {
			generateAndPost(createRequestId(), difficulty);
		}
		return;
	}

	generateAndPost(message.requestId, message.difficulty);
});

const generateAndPost = (requestId: string, difficulty: WorkerDifficulty) => {
	const startedAt = performance.now();

	try {
		const threshold = difficultyThresholds[difficulty];
		const seed = createSeed();
		const puzzleResult = createUniquePuzzle(difficulty, seed, {
			strategy: "greedy",
			targetClues: threshold.targetClues,
			timeoutMs: threshold.maxGenerationMs,
		});
		const durationMs = Math.round(performance.now() - startedAt);

		if (!puzzleResult || durationMs >= threshold.maxGenerationMs) {
			post({
				type: "timeout",
				requestId,
				difficulty,
				durationMs,
			});
			return;
		}

		const game = createGameDataV1({
			difficulty,
			generatedAt: new Date().toISOString(),
			generator: {
				name: GENERATOR_NAME,
				version: GENERATOR_VERSION,
				runtime: "browser-worker",
				durationMs,
			},
			puzzle: puzzleResult.puzzle,
			seed: puzzleResult.seed,
			solution: puzzleResult.solution,
			source: "worker",
		});
		const errors = validateGameDataV1(game, { requireUnique: true });

		if (errors.length > 0) {
			post({
				type: "error",
				requestId,
				difficulty,
				message: errors.join("; "),
			});
			return;
		}

		post({
			type: "generated",
			requestId,
			difficulty,
			game,
		});
	} catch (error) {
		post({
			type: "error",
			requestId,
			difficulty,
			message: error instanceof Error ? error.message : "Unknown worker error",
		});
	}
};

const post = (message: PuzzleWorkerResponse) => {
	self.postMessage(message);
};

const createRequestId = (): string => {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
