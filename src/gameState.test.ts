import { afterEach, describe, expect, it, vi } from "vitest";
import {
	gameReducer,
	getElapsedSeconds,
	hasPlayerProgress,
	isDigitComplete,
} from "./gameState";
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
		selectedDigit: null,
		difficulty: "easy",
		pencilMode: false,
		errors: 0,
		startedAt: Date.now() - 5000,
		elapsedBeforePause: 0,
		pausedAt: null,
		completedAt: null,
		undoHistory: [],
		seed: 101,
		...overrides,
	};
};

describe("game state", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("increments errors and marks visible conflicts invalid", () => {
		const state = createTestState();
		const next = gameReducer(state, { type: "enter", digit: 2 });

		expect(next.errors).toBe(1);
		expect(next.cells[0].value).toBe(2);
		expect(next.cells[0].invalid).toBe(true);
		expect(next.undoHistory).toEqual([0]);
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
		expect(next.undoHistory).toEqual([]);
	});

	it("toggles the selected flow digit", () => {
		const state = createTestState();
		const selected = gameReducer(state, { type: "select-digit", digit: 7 });
		const toggled = gameReducer(selected, { type: "select-digit", digit: 7 });

		expect(selected.selectedDigit).toBe(7);
		expect(toggled.selectedDigit).toBeNull();
	});

	it("enters the selected flow digit into a clicked editable cell", () => {
		const state = createTestState({ selectedDigit: 1, selectedIndex: 5 });
		const next = gameReducer(state, { type: "select-and-enter", index: 0 });

		expect(next.selectedIndex).toBe(0);
		expect(next.cells[0].value).toBe(1);
		expect(next.completedAt).toEqual(expect.any(Number));
	});

	it("toggles a matching selected flow digit out of an editable cell", () => {
		const state = createTestState({
			selectedDigit: 4,
			cells: createTestState().cells.map((cell, index) =>
				index === 0 ? { ...cell, value: 4, invalid: true } : cell,
			),
			errors: 1,
		});
		const next = gameReducer(state, { type: "select-and-enter", index: 0 });

		expect(next.selectedIndex).toBe(0);
		expect(next.cells[0].value).toBeNull();
		expect(next.cells[0].invalid).toBe(false);
		expect(next.errors).toBe(1);
	});

	it("adds the selected flow digit as a note in pencil mode", () => {
		const state = createTestState({
			pencilMode: true,
			selectedDigit: 4,
			selectedIndex: 5,
		});
		const next = gameReducer(state, { type: "select-and-enter", index: 0 });

		expect(next.selectedIndex).toBe(0);
		expect(next.cells[0].value).toBeNull();
		expect(next.cells[0].notes).toEqual([4]);
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
				index === 0 || index === 1 || index === 2
					? { ...cell, given: false, value: null }
					: cell,
			),
		});
		const withCorrectValue = gameReducer(state, { type: "enter", digit: 1 });
		const next = gameReducer(withCorrectValue, { type: "enter", digit: 3 });

		expect(next.cells[0].value).toBe(3);
		expect(next.cells[0].invalid).toBe(true);
		expect(next.errors).toBe(1);
		expect(next.undoHistory).toEqual([0, 0]);
	});

	it("undo clears the last value-entered cell without restoring a previous value", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 || index === 1
					? { ...cell, given: false, value: null }
					: cell,
			),
		});
		const withCorrectValue = gameReducer(state, { type: "enter", digit: 1 });
		const withEditedValue = gameReducer(withCorrectValue, {
			type: "enter",
			digit: 3,
		});
		const next = gameReducer(withEditedValue, { type: "undo" });

		expect(next.cells[0].value).toBeNull();
		expect(next.cells[0].invalid).toBe(false);
		expect(next.undoHistory).toEqual([0]);
	});

	it("undo clears the most recent value-entered cell", () => {
		const state = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 || index === 1 || index === 2
					? { ...cell, given: false, value: null }
					: cell,
			),
		});
		const first = gameReducer(state, { type: "enter", digit: 1 });
		const second = gameReducer(
			{ ...first, selectedIndex: 1 },
			{ type: "enter", digit: 2 },
		);
		const next = gameReducer(second, { type: "undo" });

		expect(next.selectedIndex).toBe(1);
		expect(next.cells[0].value).toBe(1);
		expect(next.cells[1].value).toBeNull();
		expect(next.undoHistory).toEqual([0]);
	});

	it("undo does nothing when there is no value-entry history", () => {
		const state = createTestState();

		expect(gameReducer(state, { type: "undo" })).toBe(state);
	});

	it("pauses elapsed time until resume", () => {
		vi.spyOn(Date, "now").mockReturnValue(10_000);
		const state = createTestState({
			startedAt: 4_000,
			elapsedBeforePause: 2_000,
		});
		const paused = gameReducer(state, { type: "pause" });

		expect(paused.elapsedBeforePause).toBe(8_000);
		expect(paused.startedAt).toBe(10_000);
		expect(paused.pausedAt).toBe(10_000);
		expect(getElapsedSeconds(paused, 30_000)).toBe(8);

		vi.mocked(Date.now).mockReturnValue(30_000);
		const resumed = gameReducer(paused, { type: "resume" });

		expect(resumed.elapsedBeforePause).toBe(8_000);
		expect(resumed.startedAt).toBe(30_000);
		expect(resumed.pausedAt).toBeNull();
		expect(getElapsedSeconds(resumed, 35_000)).toBe(13);
	});

	it("ignores game input while paused", () => {
		const state = createTestState({ pausedAt: Date.now() });

		expect(gameReducer(state, { type: "enter", digit: 1 })).toBe(state);
		expect(gameReducer(state, { type: "select", index: 1 })).toBe(state);
		expect(gameReducer(state, { type: "erase" })).toBe(state);
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
		expect(next.selectedDigit).toBeNull();
		expect(next.pausedAt).toBeNull();
		expect(next.undoHistory).toEqual([]);
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

	it("detects player progress from values, notes, or errors", () => {
		const valueState = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 ? { ...cell, value: 1 } : cell,
			),
		});
		const notesState = createTestState({
			cells: createTestState().cells.map((cell, index) =>
				index === 0 ? { ...cell, notes: [1] } : cell,
			),
		});
		const errorState = createTestState({ errors: 1 });

		expect(hasPlayerProgress(createTestState())).toBe(false);
		expect(hasPlayerProgress(valueState)).toBe(true);
		expect(hasPlayerProgress(notesState)).toBe(true);
		expect(hasPlayerProgress(errorState)).toBe(true);
	});
});
