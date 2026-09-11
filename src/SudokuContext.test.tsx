import { afterEach, describe, expect, it } from "vitest";
import { curatedExpertGames } from "./generated/curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { createInitialGameForDifficulty } from "./SudokuContext";

describe("Sudoku context initial game", () => {
	afterEach(() => {
		localStorage.clear();
	});

	it.each([
		"easy",
		"medium",
		"hard",
		"master",
	] as const)("uses reviewed starter data for %s first-load games", (difficulty) => {
		const state = createInitialGameForDifficulty(difficulty);
		const starterPuzzles = starterPuzzlesByDifficulty[difficulty].map((game) =>
			game.puzzle.join(","),
		);

		expect(starterPuzzles).toContain(
			state.cells.map((cell) => cell.value).join(","),
		);
	});

	it("uses curated game data for Expert first-load games", () => {
		const state = createInitialGameForDifficulty("expert");
		const curatedPuzzles = curatedExpertGames.map((game) =>
			game.puzzle.join(","),
		);

		expect(curatedPuzzles).toContain(
			state.cells.map((cell) => cell.value).join(","),
		);
	});
});
