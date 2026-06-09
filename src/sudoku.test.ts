import { describe, expect, it } from "vitest";
import { createPuzzle, getPeers, isValidSolvedBoard } from "./sudoku";

describe("sudoku generation", () => {
	it("creates a valid solved board", () => {
		const { solution } = createPuzzle("easy", 12345);

		expect(isValidSolvedBoard(solution)).toBe(true);
	});

	it("hides more values as difficulty increases", () => {
		const easy = createPuzzle("easy", 12345).puzzle;
		const medium = createPuzzle("medium", 12345).puzzle;
		const hard = createPuzzle("hard", 12345).puzzle;
		const master = createPuzzle("master", 12345).puzzle;
		const expert = createPuzzle("expert", 12345).puzzle;

		expect(easy.filter(Boolean)).toHaveLength(42);
		expect(medium.filter(Boolean)).toHaveLength(34);
		expect(hard.filter(Boolean)).toHaveLength(26);
		expect(master.filter(Boolean)).toHaveLength(24);
		expect(expert.filter(Boolean)).toHaveLength(18);
	});

	it("keeps minimum revealed values in every block", () => {
		expect(
			Math.min(...getBoxClueCounts(createPuzzle("easy", 12345).puzzle)),
		).toBeGreaterThanOrEqual(3);
		expect(
			Math.min(...getBoxClueCounts(createPuzzle("medium", 12345).puzzle)),
		).toBeGreaterThanOrEqual(2);
		expect(
			Math.min(...getBoxClueCounts(createPuzzle("hard", 12345).puzzle)),
		).toBeGreaterThanOrEqual(1);
		expect(
			Math.min(...getBoxClueCounts(createPuzzle("master", 12345).puzzle)),
		).toBeGreaterThanOrEqual(1);
		expect(
			Math.min(...getBoxClueCounts(createPuzzle("expert", 12345).puzzle)),
		).toBeGreaterThanOrEqual(1);
	});

	it("finds row, column, and box peers", () => {
		const peers = getPeers(0);

		expect(peers).toHaveLength(20);
		expect(peers).toContain(1);
		expect(peers).toContain(9);
		expect(peers).toContain(10);
		expect(peers).not.toContain(0);
	});
});

const getBoxClueCounts = (board: unknown[]): number[] => {
	const counts: number[] = [];

	for (let boxRow = 0; boxRow < 3; boxRow += 1) {
		for (let boxCol = 0; boxCol < 3; boxCol += 1) {
			let clueCount = 0;

			for (let row = boxRow * 3; row < boxRow * 3 + 3; row += 1) {
				for (let col = boxCol * 3; col < boxCol * 3 + 3; col += 1) {
					if (board[row * 9 + col] !== null) {
						clueCount += 1;
					}
				}
			}

			counts.push(clueCount);
		}
	}

	return counts;
};
