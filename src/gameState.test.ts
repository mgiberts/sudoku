import { describe, expect, it } from "vitest";
import { gameReducer, isDigitComplete } from "./gameState";
import type { Digit, GameState } from "./types";

const createTestState = (overrides: Partial<GameState> = {}): GameState => {
	const solution = Array.from({ length: 81 }, (_, index) => {
		const row = Math.floor(index / 9);
		const col = index % 9;
		return ((row * 3 + Math.floor(row / 3) + col) % 9) + 1;
	}) as Digit[];

	return {
		cells: solution.map((value, index) => ({
			value: index === 0 ? null : value,
			given: index !== 0,
			notes: [],
			invalid: false,
		})),
		solution,
		selectedIndex: 0,
		difficulty: "easy",
		pencilMode: false,
		errors: 0,
		startedAt: Date.now() - 5000,
		elapsedBeforePause: 0,
		completedAt: null,
		seed: 101,
		...overrides,
	};
};

describe("game state", () => {
	it("increments errors and marks visible conflicts invalid", () => {
		const state = createTestState();
		const next = gameReducer(state, { type: "enter", digit: 2 });

		expect(next.errors).toBe(1);
		expect(next.cells[0].value).toBe(2);
		expect(next.cells[0].invalid).toBe(true);
	});

	it("does not count non-conflicting guesses against the hidden solution", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 ? { ...cell, given: false, value: null } : cell,
			),
		});
		const sparseState = {
			...state,
			cells: state.cells.map((cell) => ({
				...cell,
				given: false,
				value: null,
			})),
		};
		const next = gameReducer(sparseState, { type: "enter", digit: 2 });

		expect(next.errors).toBe(0);
		expect(next.cells[0].value).toBe(2);
		expect(next.cells[0].invalid).toBe(false);
		expect(next.completedAt).toBeNull();
	});

	it("removes matching pencil notes from peers after a correct value", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 1
					? { ...cell, given: false, value: null, notes: [1, 4] }
					: cell,
			),
		});
		const next = gameReducer(state, { type: "enter", digit: 1 });

		expect(next.cells[1].notes).toEqual([4]);
	});

	it("toggles pencil notes without setting a cell value", () => {
		const pencilState = createTestState({ pencilMode: true });
		const next = gameReducer(pencilState, { type: "enter", digit: 7 });

		expect(next.cells[0].value).toBeNull();
		expect(next.cells[0].notes).toEqual([7]);
	});

	it("does not clear an invalid filled cell when entering notes", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 ? { ...cell, given: false, value: 2, invalid: true } : cell,
			),
			errors: 1,
			pencilMode: true,
		});
		const next = gameReducer(state, { type: "enter", digit: 2 });

		expect(next.cells[0].value).toBe(2);
		expect(next.cells[0].notes).toEqual([]);
		expect(next.cells[0].invalid).toBe(true);
		expect(next.errors).toBe(1);
	});

	it("can edit a user-entered valid value", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 || index === 1
					? { ...cell, given: false, value: null }
					: cell,
			),
		});
		const withCorrectValue = gameReducer(state, { type: "enter", digit: 1 });
		const next = gameReducer(withCorrectValue, { type: "enter", digit: 3 });

		expect(next.cells[0].value).toBe(3);
		expect(next.cells[0].invalid).toBe(true);
		expect(next.errors).toBe(1);
	});

	it("can erase a user-entered valid value", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 || index === 1
					? { ...cell, given: false, value: null }
					: cell,
			),
		});
		const withCorrectValue = gameReducer(state, { type: "enter", digit: 1 });
		const next = gameReducer(withCorrectValue, { type: "erase" });

		expect(next.cells[0].value).toBeNull();
		expect(next.cells[0].invalid).toBe(false);
	});

	it("starts a fresh puzzle for a new game", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0
					? { ...cell, value: 4, notes: [1, 2], invalid: true }
					: cell,
			),
			errors: 2,
			completedAt: Date.now(),
		});
		const next = gameReducer(state, { type: "new-game", difficulty: "easy" });

		expect(next.seed).not.toBe(state.seed);
		expect(next.cells).not.toEqual(state.cells);
		expect(next.errors).toBe(0);
		expect(next.completedAt).toBeNull();
	});

	it("records completion when the last value is correct", () => {
		const state = createTestState();
		const next = gameReducer(state, { type: "enter", digit: 1 });

		expect(next.completedAt).toEqual(expect.any(Number));
	});

	it("marks a digit complete after nine valid placements", () => {
		const state = createTestState();

		expect(isDigitComplete(state.cells, 2)).toBe(true);
	});

	it("does not mark a digit complete when one placement is invalid", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 1 ? { ...cell, invalid: true } : cell,
			),
		});

		expect(isDigitComplete(state.cells, 2)).toBe(false);
	});
});
