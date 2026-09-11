import type { SudokuGameDataV1 } from "./gameData";
import type { GenerationSample } from "./generationMetrics";
import type { Difficulty } from "./types";

export type WorkerDifficulty = Exclude<Difficulty, "expert">;

export type PuzzleWorkerRequest =
	| {
			type: "generate";
			requestId: string;
			difficulty: WorkerDifficulty;
	  }
	| {
			type: "warm";
			difficulties: WorkerDifficulty[];
	  };

export type PuzzleWorkerResponse =
	| {
			type: "generated";
			metrics: GenerationSample;
			requestId: string;
			difficulty: WorkerDifficulty;
			game: SudokuGameDataV1;
	  }
	| {
			type: "timeout" | "rejected";
			metrics: GenerationSample;
			requestId: string;
			difficulty: WorkerDifficulty;
			durationMs: number;
	  }
	| {
			type: "error";
			requestId: string;
			difficulty?: WorkerDifficulty;
			message: string;
	  };
