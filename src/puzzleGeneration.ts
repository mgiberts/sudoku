import {
	assertReviewedPolicy,
	type DifficultyPolicy,
	difficultyPolicy,
} from "./difficultyPolicy";
import {
	matchesDifficulty,
	rateDifficulty,
	requiresRating,
} from "./difficultyRating";
import { assessEffort, effortRejection } from "./effortRating";
import {
	createGameDataV1,
	difficultyThresholds,
	type SudokuGameDataV1,
} from "./gameData";
import {
	GENERATOR_VERSION,
	type GenerationSample,
	newSample,
} from "./generationMetrics";
import {
	createSeed,
	createUniquePuzzleCandidate,
	hasUniqueSolutionWithin,
} from "./sudoku";
import type { Difficulty } from "./types";

export function generateRatedGame(
	difficulty: Difficulty,
	options: {
		/** Explicit policy is isolated preview mode; production uses the reviewed configuration. */
		policy?: DifficultyPolicy;
		runtime?: GenerationSample["runtime"];
		timeoutMs?: number;
		seed?: number;
		shouldStop?: () => boolean;
	} = {},
): { game: SudokuGameDataV1 | null; metrics: GenerationSample } {
	const start = performance.now();
	const policy = options.policy ?? difficultyPolicy;
	const useEffort = options.policy !== undefined || policy.stage === "reviewed";
	if (options.policy) assertReviewedPolicy({ ...policy, stage: "reviewed" });
	else if (useEffort) assertReviewedPolicy(policy);
	const threshold = useEffort
		? { ...difficultyThresholds[difficulty], ...policy.levels[difficulty] }
		: difficultyThresholds[difficulty];
	const timeout = options.timeoutMs ?? threshold.maxGenerationMs;
	const stop = () =>
		performance.now() - start >= timeout || options.shouldStop?.() === true;
	const metrics = newSample(
		difficulty,
		options.runtime ?? "browser-worker",
		"greedy",
	);
	metrics.policyVersion = useEffort ? policy.version : 1;
	const reject = (reason: string) => {
		metrics.rejections[reason] = (metrics.rejections[reason] ?? 0) + 1;
	};
	let game: SudokuGameDataV1 | null = null;
	try {
		while (!stop()) {
			const seed =
				options.seed === undefined
					? createSeed()
					: options.seed + metrics.attempts;
			metrics.attempts++;
			let phase = performance.now();
			const candidate = createUniquePuzzleCandidate(difficulty, seed, {
				minClues: useEffort ? 17 : threshold.minClues,
				maxClues: useEffort ? 81 : threshold.maxClues,
				targetClues: threshold.targetClues,
				shouldStop: stop,
			});
			metrics.generationMs += performance.now() - phase;
			if (stop()) {
				reject("generation-deadline");
				break;
			}
			if (!candidate?.accepted) {
				reject("clue-mismatch");
				continue;
			}
			phase = performance.now();
			const unique = hasUniqueSolutionWithin(candidate.puzzle, stop);
			metrics.uniquenessMs += performance.now() - phase;
			if (stop()) {
				reject("generation-deadline");
				break;
			}
			if (!unique) {
				reject("non-unique");
				continue;
			}
			phase = performance.now();
			const assessed = useEffort
				? assessEffort(candidate.puzzle, stop, policy.version)
				: undefined;
			const rating =
				assessed?.rating ??
				(requiresRating(difficulty)
					? rateDifficulty(candidate.puzzle, stop)
					: undefined);
			const effortReason = assessed
				? effortRejection(difficulty, assessed.assessment, policy)
				: null;
			metrics.ratingMs += performance.now() - phase;
			if (effortReason) {
				reject(effortReason);
				continue;
			}
			if (!useEffort && rating && !matchesDifficulty(difficulty, rating)) {
				const levels = ["singles", "hard", "master", "expert"];
				reject(
					rating.status === "budget"
						? "rating-budget"
						: rating.tier === "unrated"
							? "unrated"
							: levels.indexOf(rating.tier) < levels.indexOf(difficulty)
								? "too-easy"
								: "beyond-tier",
				);
				continue;
			}
			if (stop()) {
				reject("generation-deadline");
				break;
			}
			game = createGameDataV1({
				difficulty,
				puzzle: candidate.puzzle,
				solution: candidate.solution,
				seed,
				rating,
				assessment: assessed?.assessment,
				source: options.runtime === "bun" ? "script" : "worker",
				generatedAt: new Date().toISOString(),
				generator: {
					name: "rated-puzzle-generator",
					version: GENERATOR_VERSION,
					runtime: options.runtime ?? "browser-worker",
					attempts: metrics.attempts,
				},
			});
			metrics.accepted = true;
			break;
		}
	} catch {
		reject("error");
	}
	if (!game && metrics.attempts === 0) reject("generation-deadline");
	metrics.durationMs = performance.now() - start;
	if (game?.generator) game.generator.durationMs = metrics.durationMs;
	return { game, metrics };
}
