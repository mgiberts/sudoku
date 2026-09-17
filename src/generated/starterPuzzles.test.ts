import { describe, expect, it } from "vitest";
import { difficultyPolicy } from "../difficultyPolicy";
import { validateGameDataV1 } from "../gameData";
import type { Difficulty } from "../types";
import { curatedExpertGames } from "./curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "./starterPuzzles";

const STARTER_DIFFICULTIES: Difficulty[] = [
	"easy",
	"medium",
	"hard",
	"master",
	"expert",
];

describe("starter puzzles", () => {
	it("ships the configured starter counts and validates one board per difficulty", () => {
		for (const difficulty of STARTER_DIFFICULTIES) {
			const games = starterPuzzlesByDifficulty[difficulty];

			expect(games).toHaveLength(
				difficultyPolicy.levels[difficulty].starterCount,
			);

			for (const game of games) {
				expect(game.difficulty).toBe(difficulty);
			}
			expect(validateGameDataV1(games[0], { requireUnique: true })).toEqual([]);
		}
	});

	it("retains the historical Expert catalog as offline source data", () => {
		expect(curatedExpertGames).toHaveLength(100);
		for (const game of curatedExpertGames) {
			expect(game.difficulty).toBe("expert");
		}
		// Full uniqueness and effort validation belongs to the local catalog workflow.
		expect(
			validateGameDataV1(curatedExpertGames[0], { requireUnique: true }),
		).toEqual([]);
	});
});
