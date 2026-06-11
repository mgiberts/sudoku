import { describe, expect, it } from "vitest";
import { validateGameDataV1 } from "../gameData";
import type { Difficulty } from "../types";
import { curatedExpertGames } from "./curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "./starterPuzzles";

const STARTER_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "master"];

describe("starter puzzles", () => {
	it("ships three validated unique games for each normal difficulty", () => {
		for (const difficulty of STARTER_DIFFICULTIES) {
			const games = starterPuzzlesByDifficulty[difficulty];

			expect(games).toHaveLength(3);

			for (const game of games) {
				expect(game.difficulty).toBe(difficulty);
				expect(validateGameDataV1(game, { requireUnique: true })).toEqual([]);
			}
		}
	});

	it("does not ship starter Expert games", () => {
		expect(starterPuzzlesByDifficulty.expert).toEqual([]);
	});

	it("ships temporary validated curated Expert mock games", () => {
		expect(curatedExpertGames.length).toBeGreaterThanOrEqual(3);

		for (const game of curatedExpertGames) {
			expect(game.difficulty).toBe("expert");
			expect(validateGameDataV1(game, { requireUnique: true })).toEqual([]);
		}
	});
});
