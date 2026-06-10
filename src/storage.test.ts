import { afterEach, describe, expect, it } from "vitest";
import { sudokuStorage } from "./storage";
import type { Digit } from "./types";

describe("sudoku storage", () => {
	afterEach(() => {
		localStorage.clear();
	});

	it("defaults board numbers to color", () => {
		expect(sudokuStorage.loadSettings().numberColorScheme).toBe("color");
	});

	it("loads a saved monochrome board number color scheme", () => {
		localStorage.setItem(
			"sudoku.settings.v1",
			JSON.stringify({
				difficulty: "master",
				inputStyle: "flow",
				numberColorScheme: "monochrome",
				symbolSet: "kanji",
				theme: "dark",
			}),
		);

		expect(sudokuStorage.loadSettings()).toMatchObject({
			difficulty: "master",
			inputStyle: "flow",
			numberColorScheme: "monochrome",
			symbolSet: "kanji",
			theme: "dark",
		});
	});

	it("falls back to color for missing or invalid board number color schemes", () => {
		localStorage.setItem(
			"sudoku.settings.v1",
			JSON.stringify({ numberColorScheme: "rainbow" }),
		);

		expect(sudokuStorage.loadSettings().numberColorScheme).toBe("color");
	});

	it("falls back to single input style for missing or invalid input styles", () => {
		localStorage.setItem(
			"sudoku.settings.v1",
			JSON.stringify({ inputStyle: "double" }),
		);

		expect(sudokuStorage.loadSettings().inputStyle).toBe("single");
	});

	it("normalizes missing undo history on saved games", () => {
		const solution = Array.from({ length: 81 }, (_, index) => {
			const row = Math.floor(index / 9);
			const col = index % 9;
			return ((row * 3 + Math.floor(row / 3) + col) % 9) + 1;
		}) as Digit[];

		localStorage.setItem(
			"sudoku.game.v1",
			JSON.stringify({
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
				startedAt: 1,
				elapsedBeforePause: 0,
				completedAt: null,
				seed: 101,
			}),
		);

		expect(sudokuStorage.loadGame()).toMatchObject({
			pausedAt: null,
			undoHistory: [],
		});
	});

	it("records better qualifying best times by difficulty", () => {
		expect(
			sudokuStorage.recordBestTime("hard", { seconds: 120, errors: 2 }).hard,
		).toEqual({ seconds: 120, errors: 2 });
		expect(
			sudokuStorage.recordBestTime("hard", { seconds: 120, errors: 1 }).hard,
		).toEqual({ seconds: 120, errors: 1 });
		expect(
			sudokuStorage.recordBestTime("hard", { seconds: 130, errors: 0 }).hard,
		).toEqual({ seconds: 120, errors: 1 });
	});

	it("ignores best times at or above the difficulty error threshold", () => {
		const next = sudokuStorage.recordBestTime("expert", {
			seconds: 80,
			errors: 3,
		});

		expect(next.expert).toBeUndefined();
		expect(sudokuStorage.loadBestTimes().expert).toBeUndefined();
	});
});
