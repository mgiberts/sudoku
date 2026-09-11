import { difficultyPolicy } from "./difficultyPolicy";
import { RATING_VERSION } from "./difficultyRating";
import type { Difficulty } from "./types";

export const GENERATOR_VERSION = "0.2.0";
export type GenerationSample = {
	sequence?: number;
	difficulty: Difficulty;
	runtime: "browser-worker" | "browser-simulation" | "bun";
	strategy: string;
	generatorVersion: string;
	ratingVersion: number;
	policyVersion?: number;
	durationMs: number;
	generationMs: number;
	uniquenessMs: number;
	ratingMs: number;
	attempts: number;
	accepted: boolean;
	rejections: Record<string, number>;
};
export type MetricGroup = {
	requests: number;
	accepted: number;
	attempts: number;
	totalMs: number;
	successfulMs: number;
	rejections: Record<string, number>;
	samples: GenerationSample[];
};
export type Metrics = {
	groups: Record<string, MetricGroup>;
	events: Record<string, number>;
};
export const emptyMetrics = (): Metrics => ({ groups: {}, events: {} });
export function addSample(metrics: Metrics, sample: GenerationSample): void {
	const key = [
		sample.runtime,
		sample.difficulty,
		sample.strategy,
		sample.generatorVersion,
		sample.ratingVersion,
		sample.policyVersion ?? 1,
	].join("/");
	metrics.groups[key] ??= {
		requests: 0,
		accepted: 0,
		attempts: 0,
		totalMs: 0,
		successfulMs: 0,
		rejections: {},
		samples: [],
	};
	const group = metrics.groups[key];
	group.requests++;
	group.accepted += Number(sample.accepted);
	group.attempts += sample.attempts;
	group.totalMs += sample.durationMs;
	if (sample.accepted) group.successfulMs += sample.durationMs;
	for (const [reason, count] of Object.entries(sample.rejections))
		group.rejections[reason] = (group.rejections[reason] ?? 0) + count;
	group.samples.push({
		...sample,
		sequence: Object.values(metrics.groups).reduce(
			(sum, g) => sum + g.requests,
			0,
		),
	});
	const groups = Object.values(metrics.groups).filter(
		(g) => g.samples[0]?.difficulty === sample.difficulty,
	);
	while (groups.reduce((sum, g) => sum + g.samples.length, 0) > 200) {
		const oldest = groups
			.filter((g) => g.samples.length)
			.sort(
				(a, b) => (a.samples[0].sequence ?? 0) - (b.samples[0].sequence ?? 0),
			)[0];
		oldest.samples.shift();
	}
}
export function summarizeMetrics(metrics: Metrics) {
	return Object.fromEntries(
		Object.entries(metrics.groups).map(([key, group]) => {
			const times = group.samples
				.map((s) => s.durationMs)
				.sort((a, b) => a - b);
			return [
				key,
				{
					...group,
					samples: undefined,
					meanSuccessfulMs: group.accepted
						? group.successfulMs / group.accepted
						: null,
					costPerAcceptedMs: group.accepted
						? group.totalMs / group.accepted
						: null,
					recentP50Ms: times[Math.ceil(times.length * 0.5) - 1] ?? null,
					recentP95Ms: times[Math.ceil(times.length * 0.95) - 1] ?? null,
				},
			];
		}),
	);
}
const KEY = "sudoku.generationMetrics.v1";
let memory = emptyMetrics();
let loaded = false;
function load(): Metrics {
	if (loaded) return memory;
	loaded = true;
	try {
		const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
		if (
			data &&
			typeof data.groups === "object" &&
			typeof data.events === "object"
		)
			memory = data;
	} catch {
		/* Diagnostics must never prevent play. */
	}
	return memory;
}
function save(metrics: Metrics) {
	memory = metrics;
	try {
		localStorage.setItem(KEY, JSON.stringify(metrics));
	} catch {
		/* Retain in memory when storage is unavailable. */
	}
}
export function recordGeneration(sample: GenerationSample) {
	try {
		const metrics = load();
		addSample(metrics, sample);
		save(metrics);
	} catch {
		memory = emptyMetrics();
	}
}
export function recordGenerationEvent(
	difficulty: Difficulty,
	event: string,
	amount = 1,
) {
	try {
		const metrics = load();
		const key = `${difficulty}/${event}`;
		metrics.events[key] = (metrics.events[key] ?? 0) + amount;
		save(metrics);
	} catch {
		memory = emptyMetrics();
	}
}
export const generationDiagnostics = {
	report: () => ({ summary: summarizeMetrics(load()), events: load().events }),
	export: () => JSON.stringify(load(), null, 2),
	reset: () => save(emptyMetrics()),
};
if (typeof window !== "undefined")
	Object.assign(window, { sudokuGeneration: generationDiagnostics });
export function newSample(
	difficulty: Difficulty,
	runtime: GenerationSample["runtime"],
	strategy: string,
): GenerationSample {
	return {
		difficulty,
		runtime,
		strategy,
		generatorVersion: GENERATOR_VERSION,
		ratingVersion: RATING_VERSION,
		policyVersion:
			difficultyPolicy.stage === "reviewed" ? difficultyPolicy.version : 1,
		durationMs: 0,
		generationMs: 0,
		uniquenessMs: 0,
		ratingMs: 0,
		attempts: 0,
		accepted: false,
		rejections: {},
	};
}
