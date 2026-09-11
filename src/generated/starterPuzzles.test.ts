import { describe, expect, it } from "vitest";
import { difficultyPolicy } from "../difficultyPolicy";
import { validateGameDataV1 } from "../gameData";
import type { Difficulty } from "../types";
import { curatedExpertGames } from "./curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "./starterPuzzles";

const STARTER_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "master"];

describe("starter puzzles", () => {
	it("ships the configured number of validated unique games for each normal difficulty", () => {
		for (const difficulty of STARTER_DIFFICULTIES) {
			const games = starterPuzzlesByDifficulty[difficulty];

			expect(games).toHaveLength(
				difficultyPolicy.levels[difficulty].starterCount,
			);

			for (const game of games) {
				expect(game.difficulty).toBe(difficulty);
				expect(validateGameDataV1(game, { requireUnique: true })).toEqual([]);
			}
		}
	});

	it("does not ship starter Expert games", () => {
		expect(starterPuzzlesByDifficulty.expert).toEqual([]);
	});

	it("ships the configured number of validated curated Experts", () => {
		expect(curatedExpertGames).toHaveLength(
			difficultyPolicy.levels.expert.starterCount,
		);

		for (const game of curatedExpertGames) {
			expect(game.difficulty).toBe("expert");
			expect(validateGameDataV1(game, { requireUnique: true })).toEqual([]);
		}
	});
});
