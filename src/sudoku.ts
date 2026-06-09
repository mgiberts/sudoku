import type { Board, Difficulty, Digit } from "./types";

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type DifficultyConfig = {
	clues: number;
	minCluesPerBox: number;
};

const difficultyConfig: Record<Difficulty, DifficultyConfig> = {
	easy: { clues: 42, minCluesPerBox: 3 },
	medium: { clues: 34, minCluesPerBox: 2 },
	hard: { clues: 26, minCluesPerBox: 1 },
	master: { clues: 24, minCluesPerBox: 1 },
	expert: { clues: 18, minCluesPerBox: 1 },
};

export const createSeed = (): number => {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
};

export const createPuzzle = (difficulty: Difficulty, seed = createSeed()) => {
	const random = seededRandom(seed);
	const solution = generateSolvedBoard(random);
	const puzzle = hideCells(solution, difficultyConfig[difficulty], random);

	return { puzzle, solution, seed };
};

export const getPeers = (index: number): number[] => {
	const row = Math.floor(index / 9);
	const col = index % 9;
	const boxRow = Math.floor(row / 3) * 3;
	const boxCol = Math.floor(col / 3) * 3;
	const peers = new Set<number>();

	for (let i = 0; i < 9; i += 1) {
		peers.add(row * 9 + i);
		peers.add(i * 9 + col);
	}

	for (let r = boxRow; r < boxRow + 3; r += 1) {
		for (let c = boxCol; c < boxCol + 3; c += 1) {
			peers.add(r * 9 + c);
		}
	}

	peers.delete(index);
	return [...peers];
};

export const isSolved = (board: Board, solution: Digit[]): boolean => {
	return board.every((value, index) => value === solution[index]);
};

export const isValidSolvedBoard = (board: Board): boolean => {
	if (board.length !== 81 || board.some((value) => value === null)) {
		return false;
	}

	for (let i = 0; i < 9; i += 1) {
		const row = board.slice(i * 9, i * 9 + 9);
		const col = DIGITS.map((_, rowIndex) => board[rowIndex * 9 + i]);

		if (!containsDigits(row) || !containsDigits(col)) {
			return false;
		}
	}

	for (let boxRow = 0; boxRow < 3; boxRow += 1) {
		for (let boxCol = 0; boxCol < 3; boxCol += 1) {
			const box: Board = [];

			for (let r = boxRow * 3; r < boxRow * 3 + 3; r += 1) {
				for (let c = boxCol * 3; c < boxCol * 3 + 3; c += 1) {
					box.push(board[r * 9 + c]);
				}
			}

			if (!containsDigits(box)) {
				return false;
			}
		}
	}

	return true;
};

export const hasSolution = (board: Board): boolean => {
	return countSolutions([...board], 1) === 1;
};

const generateSolvedBoard = (random: () => number): Digit[] => {
	const board: Board = Array.from({ length: 81 }, () => null);
	solveBoard(board, random);
	return board as Digit[];
};

const solveBoard = (board: Board, random: () => number): boolean => {
	const emptyIndex = findBestEmptyCell(board);

	if (emptyIndex === -1) {
		return true;
	}

	for (const digit of shuffle(DIGITS, random)) {
		if (!canPlace(board, emptyIndex, digit)) {
			continue;
		}

		board[emptyIndex] = digit;

		if (solveBoard(board, random)) {
			return true;
		}

		board[emptyIndex] = null;
	}

	return false;
};

const findBestEmptyCell = (board: Board): number => {
	let bestIndex = -1;
	let bestCount = 10;

	for (let index = 0; index < board.length; index += 1) {
		if (board[index] !== null) {
			continue;
		}

		const count = DIGITS.filter((digit) =>
			canPlace(board, index, digit),
		).length;

		if (count < bestCount) {
			bestCount = count;
			bestIndex = index;
		}
	}

	return bestIndex;
};

const canPlace = (board: Board, index: number, digit: Digit): boolean => {
	return getPeers(index).every((peerIndex) => board[peerIndex] !== digit);
};

const hideCells = (
	solution: Digit[],
	config: DifficultyConfig,
	random: () => number,
): Board => {
	const puzzle: Board = [...solution];
	const targetHiddenCount = 81 - config.clues;
	let hiddenCount = 0;

	for (const index of shuffle(
		Array.from({ length: 81 }, (_, cellIndex) => cellIndex),
		random,
	)) {
		if (hiddenCount >= targetHiddenCount) {
			break;
		}

		const value = puzzle[index];
		puzzle[index] = null;

		if (meetsBoxMinimums(puzzle, config.minCluesPerBox)) {
			hiddenCount += 1;
		} else {
			puzzle[index] = value;
		}
	}

	return puzzle;
};

const meetsBoxMinimums = (board: Board, minCluesPerBox: number): boolean => {
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

			if (clueCount < minCluesPerBox) {
				return false;
			}
		}
	}

	return true;
};

const countSolutions = (board: Board, limit: number): number => {
	if (limit <= 0) {
		return 0;
	}

	const emptyIndex = findBestEmptyCell(board);

	if (emptyIndex === -1) {
		return isValidSolvedBoard(board) ? 1 : 0;
	}

	let count = 0;

	for (const digit of DIGITS) {
		if (!canPlace(board, emptyIndex, digit)) {
			continue;
		}

		board[emptyIndex] = digit;
		count += countSolutions(board, limit - count);
		board[emptyIndex] = null;

		if (count >= limit) {
			return count;
		}
	}

	return count;
};

const containsDigits = (values: Board): boolean => {
	return DIGITS.every((digit) => values.includes(digit));
};

const shuffle = <T>(items: T[], random: () => number): T[] => {
	const next = [...items];

	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1));
		[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
	}

	return next;
};

const seededRandom = (seed: number): (() => number) => {
	let value = seed % 2147483647;

	if (value <= 0) {
		value += 2147483646;
	}

	return () => {
		value = (value * 16807) % 2147483647;
		return (value - 1) / 2147483646;
	};
};
