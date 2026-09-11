import { expect, it } from "vitest";
import { type PoolRequest, replayPools } from "./poolSizing";

const requests: PoolRequest[] = Array.from({ length: 40 }, (_, i) => ({
	atMs: i * 500,
	difficulty: "master",
}));
it("counts cold misses and starter repetition even when generation never succeeds", () => {
	const samples = Object.fromEntries(
		["easy", "medium", "hard", "master"].map((d) => [
			d,
			[{ durationMs: 3000, accepted: false }],
		]),
	);
	const small = replayPools(samples, requests, 3, 1),
		large = replayPools(samples, requests, 12, 1);
	expect(small.cacheHits).toBe(0);
	expect(small.starterFallbacks).toBe(40);
	expect(small.repeatedStarters).toBe(37);
	expect(large.repeatedStarters).toBeGreaterThan(0);
	expect(large.repeatedStarters).toBeLessThan(small.repeatedStarters);
	expect(large.waitMs).toBe(0);
});
it("models one shared worker and caps idle cache capacity", () => {
	const samples = Object.fromEntries(
		["easy", "medium", "hard", "master"].map((d) => [
			d,
			[{ durationMs: 100, accepted: true }],
		]),
	);
	const result = replayPools(
		samples,
		[
			{ atMs: 0, difficulty: "easy" },
			{ atMs: 1000, difficulty: "master" },
		],
		3,
		2,
	);
	expect(result.starterFallbacks).toBe(1);
	expect(result.cacheHits).toBe(1);
	expect(result.retainedGenerated).toBe(8);
	expect(result.generationRequests).toBe(9);
	expect(result.generationMs).toBe(900);
});

it("replays a reload with valid persisted caches without a cold fallback", () => {
	const samples = Object.fromEntries(
		["easy", "medium", "hard", "master"].map((d) => [
			d,
			[{ durationMs: 100, accepted: true }],
		]),
	);
	const result = replayPools(
		samples,
		[{ atMs: 0, difficulty: "master" }],
		3,
		1,
		true,
	);
	expect(result.cacheHits).toBe(1);
	expect(result.starterFallbacks).toBe(0);
	expect(result.generationRequests).toBe(1);
});
