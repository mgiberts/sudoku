import {
	calibrationConfig,
	type DifficultyPolicy,
	difficultyPolicy,
} from "./difficultyPolicy";
import {
	candidateMasks,
	peers,
	RATING_VERSION,
	type Rating,
	type RatingSummary,
	rateDifficulty,
	units,
} from "./difficultyRating";
import type { Board, Difficulty } from "./types";

export type EffortProfile = {
	placements: number;
	meanAvailableFraction: number;
	hiddenEpisodes: number;
	/** An episode may contain several eliminations before the next placement. */
	demandingDeductions: number;
	episodes: { progress: number; deductions: number }[];
	progressBands: number;
	singlesScore: number;
};
export type EffortAssessment = {
	policyVersion: number;
	ratingVersion: number;
	repertoire: RatingSummary["tier"];
	status: RatingSummary["status"];
	profile: EffortProfile;
};
export const techniqueLevel = (name: string) =>
	name.includes("single")
		? 0
		: name === "Locked candidates" || /subset [23]$/.test(name)
			? 1
			: name === "X-Cycle" || name === "Alternating inference chain"
				? 3
				: 2;
export function availableSingles(masks: number[]) {
	const naked = new Set<number>();
	const hidden = new Set<number>();
	for (let c = 0; c < 81; c++)
		if (masks[c] && (masks[c] & (masks[c] - 1)) === 0) naked.add(c);
	for (const unit of units)
		for (let d = 1; d <= 9; d++) {
			const cells = unit.filter((c) => masks[c] & (1 << d));
			if (cells.length === 1) hidden.add(cells[0]);
		}
	return { naked, hidden, distinct: new Set([...naked, ...hidden]) };
}
/** Replay a verified deterministic trace; no additional solving or guessing. */
export function profileTrace(board: Board, rating: Rating): EffortProfile {
	const masks = candidateMasks(board);
	const empty = board.filter((v) => v === null).length;
	const tierLevel = ["singles", "hard", "master", "expert"].indexOf(
		rating.tier,
	);
	let placements = 0,
		fractionSum = 0,
		hiddenEpisodes = 0,
		demandingDeductions = 0;
	const episodes: EffortProfile["episodes"] = [];
	let active: EffortProfile["episodes"][number] | null = null;
	for (const step of rating.trace) {
		if (
			!step.placed &&
			tierLevel > 0 &&
			techniqueLevel(step.technique) === tierLevel
		) {
			demandingDeductions++;
			if (!active) {
				active = { progress: empty ? placements / empty : 0, deductions: 0 };
				episodes.push(active);
			}
			active.deductions++;
		}
		if (step.placed) {
			const singles = availableSingles(masks);
			fractionSum += singles.distinct.size / Math.max(1, empty - placements);
			if (!singles.naked.size && step.technique === "Hidden single")
				hiddenEpisodes++;
			placements++;
			active = null;
			const { cell, digit } = step.placed;
			masks[cell] = 0;
			for (const p of peers[cell]) masks[p] &= ~(1 << digit);
		} else
			for (const { cell, digit } of step.removed) masks[cell] &= ~(1 << digit);
	}
	const meanAvailableFraction = placements ? fractionSum / placements : 0;
	return {
		placements,
		meanAvailableFraction,
		hiddenEpisodes,
		demandingDeductions,
		episodes,
		progressBands: new Set(
			episodes.map((e) =>
				Math.min(
					calibrationConfig.progressBands - 1,
					Math.floor(e.progress * calibrationConfig.progressBands),
				),
			),
		).size,
		singlesScore: placements
			? calibrationConfig.scarcityWeight * (1 - meanAvailableFraction) +
				(calibrationConfig.hiddenEpisodeWeight * hiddenEpisodes) / placements
			: 0,
	};
}
export function assessEffort(
	board: Board,
	stop: () => boolean = () => false,
	policyVersion = difficultyPolicy.version,
): { rating: Rating; assessment: EffortAssessment } {
	const rating = rateDifficulty(board, stop);
	const profile =
		board.length === 81
			? profileTrace(board, rating)
			: {
					placements: 0,
					meanAvailableFraction: 0,
					hiddenEpisodes: 0,
					demandingDeductions: 0,
					episodes: [],
					progressBands: 0,
					singlesScore: 0,
				};
	return {
		rating,
		assessment: {
			policyVersion,
			ratingVersion: rating.version,
			repertoire: rating.tier,
			status: rating.status,
			profile,
		},
	};
}
export function effortRejection(
	difficulty: Difficulty,
	assessment: EffortAssessment,
	policy: DifficultyPolicy = difficultyPolicy,
): string | null {
	const level = policy.levels[difficulty];
	const limits = level.effort;
	if (assessment.policyVersion !== policy.version) return "stale-policy";
	if (assessment.ratingVersion !== RATING_VERSION) return "stale-rating";
	if (assessment.status !== "solved")
		return assessment.status === "budget" ? "rating-budget" : "unrated";
	if (assessment.repertoire !== level.repertoire) return "knowledge-mismatch";
	if (!limits) return "uncalibrated";
	const p = assessment.profile;
	if (
		!p ||
		!Array.isArray(p.episodes) ||
		![
			p.placements,
			p.meanAvailableFraction,
			p.hiddenEpisodes,
			p.demandingDeductions,
			p.progressBands,
			p.singlesScore,
		].every(Number.isFinite) ||
		p.episodes.some(
			(e) =>
				!e || !Number.isFinite(e.progress) || !Number.isFinite(e.deductions),
		)
	)
		return "invalid-effort-profile";
	if (!p.placements) return "insufficient-effort";
	const score =
		level.repertoire === "singles" ? p.singlesScore : p.episodes.length;
	if (
		score < limits.minScore ||
		p.episodes.length < limits.minEpisodes ||
		p.progressBands < limits.minProgressBands
	)
		return "insufficient-effort";
	if (score >= limits.maxScore) return "excessive-effort";
	return null;
}
