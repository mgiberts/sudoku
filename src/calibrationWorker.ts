/** Offline calibration harness entry; never imported by the production app. */

import type { DifficultyPolicy } from "./difficultyPolicy";
import { generateRatedGame } from "./puzzleGeneration";
import type { Difficulty } from "./types";

self.onmessage = (
	event: MessageEvent<{
		type: "generate" | "cpu-probe";
		difficulty: Difficulty;
		policy: DifficultyPolicy;
		seed: number;
	}>,
) => {
	if (event.data.type === "cpu-probe") {
		const start = performance.now();
		let sum = 0;
		for (let i = 0; i < 5000000; i++) sum += Math.sqrt(i);
		self.postMessage({ durationMs: performance.now() - start, sum });
		return;
	}
	const { difficulty, policy, seed } = event.data;
	self.postMessage(generateRatedGame(difficulty, { policy, seed }));
};
