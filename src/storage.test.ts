import { afterEach, describe, expect, it } from "vitest";
import { sudokuStorage } from "./storage";

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
