import { generateRatedGame } from "./puzzleGeneration";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
	WorkerDifficulty,
} from "./puzzleWorkerMessages";

self.addEventListener("message", (event: MessageEvent<PuzzleWorkerRequest>) => {
	const message = event.data;
	if (message.type === "warm") {
		for (const difficulty of message.difficulties)
			generateAndPost(crypto.randomUUID(), difficulty);
	} else generateAndPost(message.requestId, message.difficulty);
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
