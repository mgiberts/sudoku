import { describe, expect, it } from "vitest";
import {
	createPuzzle,
	createUniquePuzzle,
	createUniquePuzzleCandidate,
	getPeers,
	hasUniqueSolution,
	isValidSolvedBoard,
	solveUniqueBoard,
} from "./sudoku";
import type { Board, Digit } from "./types";

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

	it("can create a puzzle with exactly one solution", () => {
		const result = createUniquePuzzle("easy", 12345, { timeoutMs: 5000 });

		expect(result).not.toBeNull();
		expect(result?.puzzle.filter(Boolean)).toHaveLength(42);
		expect(hasUniqueSolution(result?.puzzle ?? [])).toBe(true);
	});

	it("can use search strategy for unique clue removal", () => {
		const result = createUniquePuzzle("easy", 12345, {
			maxSearchNodes: 5000,
			strategy: "search",
			targetClues: 42,
			timeoutMs: 5000,
		});

		expect(result).not.toBeNull();
		expect(result?.puzzle.filter(Boolean)).toHaveLength(42);
		expect(hasUniqueSolution(result?.puzzle ?? [])).toBe(true);
	});

	it("can remix a sparse unique expert puzzle", () => {
		const result = createUniquePuzzle("expert", 1, {
			maxClues: 20,
			minClues: 17,
			maxSearchNodes: 200,
			strategy: "remix",
			targetClues: 17,
			timeoutMs: 10000,
		});
		const clues = result?.puzzle.filter(Boolean).length ?? 0;

		expect(result).not.toBeNull();
		expect(clues).toBeGreaterThanOrEqual(17);
		expect(clues).toBeLessThanOrEqual(20);
		expect(hasUniqueSolution(result?.puzzle ?? [])).toBe(true);
	});

	it("can accept unique puzzles within a clue range", () => {
		const result = createUniquePuzzle("easy", 12345, {
			maxClues: 44,
			minClues: 40,
			strategy: "search",
			targetClues: 40,
			timeoutMs: 5000,
		});
		const clues = result?.puzzle.filter(Boolean).length ?? 0;

		expect(result).not.toBeNull();
		expect(clues).toBeGreaterThanOrEqual(40);
		expect(clues).toBeLessThanOrEqual(44);
		expect(hasUniqueSolution(result?.puzzle ?? [])).toBe(true);
	});

	it("can return a profiled unique puzzle candidate", () => {
		const candidate = createUniquePuzzleCandidate("easy", 12345, {
			maxClues: 44,
			minClues: 40,
			strategy: "search",
			targetClues: 40,
			timeoutMs: 5000,
		});

		expect(candidate).not.toBeNull();
		expect(candidate?.accepted).toBe(true);
		expect(candidate?.clues).toBe(candidate?.puzzle.filter(Boolean).length);
		expect(hasUniqueSolution(candidate?.puzzle ?? [])).toBe(true);
	});

	it("solves a uniquely solvable sparse puzzle", () => {
		const puzzle =
			"000000010400000000020000000000050407008000300001090000300400200050100000000806000"
				.split("")
				.map((value) =>
					value === "0" ? null : (Number(value) as Digit),
				) as Board;
		const solution = solveUniqueBoard(puzzle);

		expect(solution).not.toBeNull();
		expect(isValidSolvedBoard(solution ?? [])).toBe(true);
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
