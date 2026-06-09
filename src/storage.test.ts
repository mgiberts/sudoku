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
				difficulty: "medium",
				numberColorScheme: "monochrome",
				symbolSet: "kanji",
				theme: "dark",
			}),
		);

		expect(sudokuStorage.loadSettings()).toMatchObject({
			difficulty: "medium",
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
});
