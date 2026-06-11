import { describe, expect, it } from "vitest";
import {
	compactGameDataV1,
	countClues,
	createGameDataV1,
	expandGameDataV1,
	gameDataToInitialState,
	validateGameDataV1,
} from "./gameData";
import { createPuzzle, hasUniqueSolution } from "./sudoku";

describe("game data", () => {
	it("creates and validates versioned game data", () => {
		const { puzzle, solution, seed } = createPuzzle("easy", 12345);
		const game = createGameDataV1({
			difficulty: "easy",
			puzzle,
			seed,
			solution,
			source: "starter",
		});

		expect(game.version).toBe(1);
		expect(game.clues).toBe(countClues(puzzle));
		expect(validateGameDataV1(game)).toEqual([]);
	});

	it("rejects mismatched clue counts and givens", () => {
		const { puzzle, solution, seed } = createPuzzle("easy", 12345);
		const game = createGameDataV1({
			difficulty: "easy",
			puzzle,
			seed,
			solution,
			source: "starter",
		});
		const firstGivenIndex = game.puzzle.findIndex((value) => value !== null);
		const invalid = {
			...game,
			clues: game.clues + 1,
			puzzle: game.puzzle.map((value, index) =>
				index === firstGivenIndex ? 9 : value,
			),
		};

		expect(validateGameDataV1(invalid)).toContain(
			"Clue count does not match puzzle",
		);
		expect(validateGameDataV1(invalid)).toContain(
			"Puzzle givens do not match solution",
		);
	});

	it("can require uniqueness", () => {
		const { solution } = createPuzzle("easy", 12345);
		const puzzle = solution.map(() => null);
		const game = createGameDataV1({
			difficulty: "easy",
			puzzle,
			solution,
			source: "starter",
		});

		expect(hasUniqueSolution(puzzle)).toBe(false);
		expect(validateGameDataV1(game, { requireUnique: true })).toContain(
			"Puzzle does not have exactly one solution",
		);
	});

	it("converts game data into clean runtime game state", () => {
		const { puzzle, solution, seed } = createPuzzle("easy", 12345);
		const game = createGameDataV1({
			difficulty: "easy",
			puzzle,
			seed,
			solution,
			source: "starter",
		});
		const state = gameDataToInitialState(game);

		expect(state.cells).toHaveLength(81);
		expect(state.difficulty).toBe("easy");
		expect(state.selectedIndex).toBeNull();
		expect(state.cells.every((cell) => cell.notes.length === 0)).toBe(true);
		expect(state.errors).toBe(0);
		expect(state.undoHistory).toEqual([]);
		expect(state.pausedAt).toBeNull();
		expect(state.completedAt).toBeNull();
	});

	it("round-trips compact game data strings", () => {
		const { puzzle, solution, seed } = createPuzzle("easy", 12345);
		const game = createGameDataV1({
			difficulty: "easy",
			puzzle,
			seed,
			solution,
			source: "starter",
		});
		const compact = compactGameDataV1(game);
		const expanded = expandGameDataV1(compact);

		expect(compact.puzzle).toHaveLength(81);
		expect(compact.solution).toHaveLength(81);
		expect(compact.puzzle).not.toContain(",");
		expect(expanded).toEqual(game);
		expect(validateGameDataV1(expanded, { requireUnique: true })).toEqual([]);
	});
});
