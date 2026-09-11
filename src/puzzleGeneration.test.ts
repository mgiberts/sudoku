import { describe, expect, it, vi } from "vitest";
import { validateGameDataV1 } from "./gameData";
import { generateRatedGame } from "./puzzleGeneration";

describe("rated generation", () => {
	it("returns a validated board with complete request metrics", () => {
		const { game, metrics } = generateRatedGame("hard", {
			runtime: "bun",
			seed: 1,
			timeoutMs: 10000,
		});
		expect(game).not.toBeNull();
		if (!game) return;
		expect(validateGameDataV1(game, { requireUnique: true })).toEqual([]);
		expect(game.rating?.tier).toBe("hard");
		expect(metrics.accepted).toBe(true);
		expect(metrics.durationMs).toBeGreaterThanOrEqual(
			metrics.generationMs + metrics.uniquenessMs + metrics.ratingMs,
		);
		expect(game.generator?.durationMs).toBe(metrics.durationMs);
	});
	it("respects an expired request without accepting a partial result", () => {
		let now = 0;
		const clock = vi
			.spyOn(performance, "now")
			.mockImplementation(() => (now += 100));
		try {
			const { game, metrics } = generateRatedGame("master", { timeoutMs: 1 });
			expect(game).toBeNull();
			expect(metrics.accepted).toBe(false);
			expect(metrics.attempts).toBe(0);
		} finally {
			clock.mockRestore();
		}
	});
});

it("supports isolated effort-policy previews without changing production", async () => {
	const { difficultyPolicy } = await import("./difficultyPolicy");
	const policy = structuredClone(difficultyPolicy);
	for (const level of Object.values(policy.levels))
		level.effort = {
			minScore: 0,
			maxScore: 1e9,
			minEpisodes: 0,
			minProgressBands: 0,
		};
	const { game, metrics } = generateRatedGame("easy", {
		policy,
		runtime: "bun",
		seed: 1,
		timeoutMs: 5000,
	});
	expect(game?.assessment?.policyVersion).toBe(policy.version);
	expect(game?.rating?.tier).toBe("singles");
	expect(metrics.policyVersion).toBe(policy.version);
	expect(difficultyPolicy.stage).toBe("reviewed");
});
