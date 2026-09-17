import { generateRatedGame } from "./puzzleGeneration";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
	WorkerDifficulty,
} from "./puzzleWorkerMessages";

self.addEventListener("message", (event: MessageEvent<PuzzleWorkerRequest>) => {
	const message = event.data;
	generateAndPost(message.requestId, message.difficulty);
});
function generateAndPost(requestId: string, difficulty: WorkerDifficulty) {
	const { game, metrics } = generateRatedGame(difficulty);
	const response: PuzzleWorkerResponse = game
		? { type: "generated", requestId, difficulty, game, metrics }
		: {
				type: metrics.rejections.error ? "rejected" : "timeout",
				requestId,
				difficulty,
				durationMs: metrics.durationMs,
				metrics,
			};
	self.postMessage(response);
}
