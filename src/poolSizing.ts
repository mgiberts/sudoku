import type { Difficulty } from "./types";
export type PoolSample = { durationMs: number; accepted: boolean };
export type PoolRequest = {
	atMs: number;
	difficulty: Exclude<Difficulty, "expert">;
};
/** Deterministic replay with one shared worker and FIFO requests. Durations are
 * sampled cyclically from measurements; this models scenarios, not real players. */
export function replayPools(
	samples: Record<string, PoolSample[]>,
	requests: PoolRequest[],
	starterCount: number,
	capacity: number,
	warmStart = false,
) {
	const levels = ["easy", "medium", "hard", "master"] as const;
	if (
		starterCount < 1 ||
		capacity < 1 ||
		levels.some((d) => !samples[d]?.length)
	)
		throw new Error("Replay requires samples and positive pool sizes");
	const cache: Record<string, number> = {
		easy: 0,
		medium: 0,
		hard: 0,
		master: 0,
	};
	if (warmStart) for (const d of levels) cache[d] = capacity;
	const cursors: Record<string, number> = {
		easy: 0,
		medium: 0,
		hard: 0,
		master: 0,
	};
	const randomState: Record<string, number> = {
		easy: 1,
		medium: 2,
		hard: 3,
		master: 4,
	};
	const selectionRecent: Record<string, number[]> = {
		easy: [],
		medium: [],
		hard: [],
		master: [],
	};
	const recent: Record<string, number[]> = {
		easy: [],
		medium: [],
		hard: [],
		master: [],
	};
	const pending = new Set<string>();
	const tasks: string[] = [];
	let active: { difficulty: string; sample: PoolSample; end: number } | null =
		null;
	let now = 0,
		cacheHits = 0,
		starterFallbacks = 0,
		repeatedStarters = 0,
		generationMs = 0,
		generationRequests = 0;
	const schedule = (d: string) => {
		if (!pending.has(d) && cache[d] < capacity) {
			pending.add(d);
			tasks.push(d);
		}
	};
	const start = () => {
		if (active || !tasks.length) return;
		const d = tasks.shift() as string;
		const sample = samples[d][cursors[d]++ % samples[d].length];
		active = {
			difficulty: d,
			sample,
			end: now + Math.max(0.001, sample.durationMs),
		};
		generationMs += sample.durationMs;
		generationRequests++;
	};
	for (const d of levels) schedule(d);
	start();
	const advance = (deadline: number) => {
		while (active && active.end <= deadline) {
			const completed = active;
			active = null;
			now = completed.end;
			pending.delete(completed.difficulty);
			if (completed.sample.accepted) {
				cache[completed.difficulty]++;
				schedule(completed.difficulty);
			}
			start();
		}
		if (Number.isFinite(deadline)) now = deadline;
	};
	for (const request of [...requests].sort((a, b) => a.atMs - b.atMs)) {
		advance(request.atMs);
		const d = request.difficulty;
		if (cache[d]) {
			cache[d]--;
			cacheHits++;
			selectionRecent[d] = [...selectionRecent[d], -cacheHits].slice(-2);
		} else {
			starterFallbacks++;
			const all = Array.from({ length: starterCount }, (_, i) => i);
			const fresh = all.filter((id) => !selectionRecent[d].includes(id));
			const pool = fresh.length ? fresh : all;
			randomState[d] = (Math.imul(randomState[d], 1664525) + 1013904223) >>> 0;
			const id = pool[Math.floor((randomState[d] / 4294967296) * pool.length)];
			selectionRecent[d] = [...selectionRecent[d], id].slice(-2);
			if (recent[d].includes(id)) repeatedStarters++;
			recent[d].push(id);
			recent[d] = recent[d].slice(-10);
		}
		schedule(d);
		start();
	}
	advance(Number.POSITIVE_INFINITY);
	return {
		requests: requests.length,
		cacheHits,
		starterFallbacks,
		repeatedStarters,
		generationMs,
		generationRequests,
		waitMs: 0,
		retainedGenerated: Object.values(cache).reduce((a, b) => a + b, 0),
	};
}
