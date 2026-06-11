import { createGameDataV1, type SudokuGameDataV1 } from "./gameData";
import { createSeed } from "./sudoku";
import type { Board, Digit } from "./types";

type BoardTransform = {
	colOrder: number[];
	digitMap: Record<Digit, Digit>;
	rowOrder: number[];
	transpose: boolean;
};

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const transformGameDataV1 = (
	game: SudokuGameDataV1,
	seed = createSeed(),
): SudokuGameDataV1 => {
	const random = seededRandom(seed);
	const transform = createBoardTransform(random);

	return createGameDataV1({
		difficulty: game.difficulty,
		generatedAt: new Date().toISOString(),
		generator: {
			name: "sudoku-game-transform",
			version: "0.1.0",
			runtime: "bun",
		},
		puzzle: transformBoard(game.puzzle, transform),
		seed,
		solution: transformBoard(game.solution, transform) as Digit[],
		source: game.source,
	});
};

const createBoardTransform = (random: () => number): BoardTransform => {
	const digitOrder = shuffle(DIGITS, random);
	const digitMap = Object.fromEntries(
		DIGITS.map((digit, index) => [digit, digitOrder[index]]),
	) as Record<Digit, Digit>;

	return {
		colOrder: createUnitOrder(random),
		digitMap,
		rowOrder: createUnitOrder(random),
		transpose: random() >= 0.5,
	};
};

const createUnitOrder = (random: () => number): number[] => {
	return shuffle([0, 1, 2], random).flatMap((band) =>
		shuffle([0, 1, 2], random).map((offset) => band * 3 + offset),
	);
};

const transformBoard = (
	board: Board | Digit[],
	transform: BoardTransform,
): Board => {
	const next: Board = Array.from({ length: 81 }, () => null);

	for (let row = 0; row < 9; row += 1) {
		for (let col = 0; col < 9; col += 1) {
			const sourceRow = transform.transpose
				? transform.colOrder[col]
				: transform.rowOrder[row];
			const sourceCol = transform.transpose
				? transform.rowOrder[row]
				: transform.colOrder[col];
			const value = board[sourceRow * 9 + sourceCol];

			next[row * 9 + col] = value === null ? null : transform.digitMap[value];
		}
	}

	return next;
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
