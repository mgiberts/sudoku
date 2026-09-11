import { describe, expect, it } from "vitest";
import {
	assertReviewedPolicy,
	type DifficultyPolicy,
	difficultyPolicy,
} from "./difficultyPolicy";
import fixtures from "./effortFixtures.json";
import {
	assessEffort,
	availableSingles,
	effortRejection,
} from "./effortRating";
import {
	compactStringToBoard,
	compactStringToDigits,
	createGameDataV1,
	validateGameDataV1,
} from "./gameData";

const policy = (): DifficultyPolicy => {
	const result = structuredClone(difficultyPolicy);
	result.stage = "reviewed";
	for (const level of Object.values(result.levels))
		level.effort = {
			minScore: 0,
			maxScore: 1e9,
			minEpisodes: 0,
			minProgressBands: 0,
		};
	return result;
};
describe("sustained effort", () => {
	it("counts an available cell once even when it is both a naked and several hidden singles", () => {
		const masks = Array(81).fill(0);
		masks[0] = 2;
		const singles = availableSingles(masks);
		expect(singles.naked.size).toBe(1);
		expect(singles.hidden.size).toBe(1);
		expect(singles.distinct.size).toBe(1);
	});
	it("groups advanced eliminations before a placement into the same episode", () => {
		const { assessment } = assessEffort(
			compactStringToBoard(fixtures.groupedEliminations.puzzle),
		);
		const p = assessment.profile;
		expect(p.demandingDeductions).toBeGreaterThan(p.episodes.length);
		expect(p.episodes.reduce((sum, e) => sum + e.deductions, 0)).toBe(
			p.demandingDeductions,
		);
		expect(p.episodes.some((e) => e.deductions > 1)).toBe(true);
	});
	it("separates singles effort without changing the Easy/Medium toolkit", () => {
		const easy = assessEffort(
			compactStringToBoard(fixtures.easy.puzzle),
		).assessment;
		const medium = assessEffort(
			compactStringToBoard(fixtures.medium.puzzle),
		).assessment;
		expect(easy.repertoire).toBe("singles");
		expect(medium.repertoire).toBe("singles");
		const p = policy();
		const split = (easy.profile.singlesScore + medium.profile.singlesScore) / 2;
		p.levels.easy.effort = {
			minScore: 0,
			maxScore: split,
			minEpisodes: 0,
			minProgressBands: 0,
		};
		p.levels.medium.effort = {
			minScore: split,
			maxScore: 1,
			minEpisodes: 0,
			minProgressBands: 0,
		};
		expect(effortRejection("easy", easy, p)).toBeNull();
		expect(effortRejection("medium", medium, p)).toBeNull();
		expect(effortRejection("medium", easy, p)).toBe("insufficient-effort");
	});
	it("rejects a single breakthrough when repeated Expert episodes are required", () => {
		const p = policy();
		p.levels.expert.effort = {
			minScore: 0,
			maxScore: 1e9,
			minEpisodes: 2,
			minProgressBands: 1,
		};
		const one = assessEffort(
			compactStringToBoard(fixtures.oneBreakthrough.puzzle),
		).assessment;
		const repeated = assessEffort(
			compactStringToBoard(fixtures.repeatedBreakthroughs.puzzle),
		).assessment;
		expect(effortRejection("expert", one, p)).toBe("insufficient-effort");
		expect(effortRejection("expert", repeated, p)).toBeNull();
	});
	it("admits a higher-clue Expert when technique and effort qualify", () => {
		const f = fixtures.higherClueExpert;
		const game = createGameDataV1({
			difficulty: "expert",
			puzzle: compactStringToBoard(f.puzzle),
			solution: compactStringToDigits(f.solution),
			source: "script",
		});
		expect(game.clues).toBeGreaterThanOrEqual(28);
		const sustainedPolicy = policy();
		sustainedPolicy.levels.expert.effort = {
			minScore: 0,
			maxScore: 1e9,
			minEpisodes: 2,
			minProgressBands: 2,
		};
		expect(
			validateGameDataV1(game, {
				requireUnique: true,
				policy: sustainedPolicy,
			}),
		).toEqual([]);
		expect(validateGameDataV1(game, { requireUnique: true })).toEqual([]);
	});
	it("is repeatable and rejects stale policies and cancellation", () => {
		const board = compactStringToBoard(fixtures.medium.puzzle);
		expect(assessEffort(board)).toEqual(assessEffort(board));
		expect(
			effortRejection(
				"medium",
				{ ...assessEffort(board).assessment, ratingVersion: 0 },
				policy(),
			),
		).toBe("stale-rating");
		expect(
			effortRejection(
				"medium",
				assessEffort(board, () => true).assessment,
				policy(),
			),
		).toBe("rating-budget");
		const p = policy();
		p.version++;
		expect(effortRejection("medium", assessEffort(board).assessment, p)).toBe(
			"stale-policy",
		);
		expect(() => assertReviewedPolicy(difficultyPolicy)).not.toThrow();
		expect(() =>
			assertReviewedPolicy({ ...difficultyPolicy, stage: "calibration" }),
		).toThrow("awaiting");
		expect(() =>
			assertReviewedPolicy({
				...difficultyPolicy,
				levels: {
					...difficultyPolicy.levels,
					easy: { ...difficultyPolicy.levels.easy, effort: null },
				},
			}),
		).toThrow("Incomplete");
	});
});

it("requires current effort assessments for Easy caches after policy activation", async () => {
	const { sudokuStorage } = await import("./storage");
	const { starterPuzzlesByDifficulty } = await import(
		"./generated/starterPuzzles"
	);
	const { createInitialGame } = await import("./gameState");
	const previous = difficultyPolicy.stage;
	localStorage.clear();
	try {
		sudokuStorage.saveGeneratedGameCache("easy", [
			{ ...starterPuzzlesByDifficulty.easy[0], assessment: undefined },
		]);
		difficultyPolicy.stage = "reviewed";
		expect(sudokuStorage.loadGeneratedGameCache("easy")).toEqual([]);
		expect(() => createInitialGame("easy")).toThrow("validated game data");
	} finally {
		difficultyPolicy.stage = previous;
		localStorage.clear();
	}
});
