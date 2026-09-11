import type { Difficulty } from "./types";

/** Bump when accepting a different effort profile. Independent of solver/generator versions. */
export const EFFORT_POLICY_VERSION = 2;
export type EffortThresholds = {
	minScore: number;
	maxScore: number;
	minEpisodes: number;
	minProgressBands: number;
};
export type LevelPolicy = {
	repertoire: "singles" | "hard" | "master" | "expert";
	targetClues: number;
	maxGenerationMs: number;
	starterCount: number;
	cacheCapacity: number;
	/** Copy reviewed proposals here. Null deliberately prevents activation. */
	effort: EffortThresholds | null;
};
export type DifficultyPolicy = {
	version: number;
	stage: "calibration" | "reviewed";
	levels: Record<Difficulty, LevelPolicy>;
};
export const difficultyPolicy: DifficultyPolicy = {
	version: EFFORT_POLICY_VERSION,
	stage: "reviewed",
	levels: {
		easy: {
			repertoire: "singles",
			targetClues: 42,
			maxGenerationMs: 250,
			starterCount: 3,
			cacheCapacity: 1,
			effort: {
				minScore: 0,
				maxScore: 0.1875041026524401,
				minEpisodes: 0,
				minProgressBands: 0,
			},
		},
		medium: {
			repertoire: "singles",
			targetClues: 34,
			maxGenerationMs: 500,
			starterCount: 3,
			cacheCapacity: 1,
			effort: {
				minScore: 0.1875041026524401,
				maxScore: 1.000001,
				minEpisodes: 0,
				minProgressBands: 0,
			},
		},
		hard: {
			repertoire: "hard",
			targetClues: 26,
			maxGenerationMs: 1500,
			starterCount: 3,
			cacheCapacity: 1,
			effort: {
				minScore: 0,
				maxScore: 9007199254740991,
				minEpisodes: 2,
				minProgressBands: 1,
			},
		},
		master: {
			repertoire: "master",
			targetClues: 24,
			maxGenerationMs: 3000,
			starterCount: 3,
			cacheCapacity: 1,
			effort: {
				minScore: 0,
				maxScore: 9007199254740991,
				minEpisodes: 2,
				minProgressBands: 1,
			},
		},
		expert: {
			repertoire: "expert",
			targetClues: 28,
			maxGenerationMs: 300000,
			starterCount: 100,
			cacheCapacity: 0,
			effort: {
				minScore: 0,
				maxScore: 9007199254740991,
				minEpisodes: 2,
				minProgressBands: 2,
			},
		},
	},
};
export const calibrationConfig = {
	clueTargets: [20, 24, 28, 32, 36, 40, 44],
	perRepertoire: 200,
	playtestPerLevel: 10,
	scarcityWeight: 0.5,
	hiddenEpisodeWeight: 0.5,
	progressBands: 3,
	throttleRates: [1, 4, 6],
	requestsPerLevel: 100,
	starterSizes: [3, 6, 12],
	cacheSizes: [1, 2, 3],
};
export function assertReviewedPolicy(policy: DifficultyPolicy): void {
	if (policy.stage !== "reviewed")
		throw new Error("Effort policy is awaiting playtest and phone review");
	for (const [level, config] of Object.entries(policy.levels)) {
		const e = config.effort;
		if (
			!e ||
			!Object.values(e).every(Number.isFinite) ||
			e.minScore < 0 ||
			e.maxScore < e.minScore ||
			e.minEpisodes < 0 ||
			e.minProgressBands < 0 ||
			e.minProgressBands > calibrationConfig.progressBands ||
			config.starterCount < 1 ||
			config.cacheCapacity < 0
		)
			throw new Error(`Incomplete effort policy: ${level}`);
	}
}
