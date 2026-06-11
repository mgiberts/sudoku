import { hasSolution, hasUniqueSolution, isValidSolvedBoard } from "./sudoku";
import type { Board, Difficulty, Digit, GameState } from "./types";

export const GAME_DATA_VERSION = 1;

export type GameDataSource = "starter" | "worker" | "curated" | "script";
export type GameDataRuntime =
	| "browser-worker"
	| "bun"
	| "node"
	| "native"
	| "unknown";

export type SudokuGameDataV1 = {
	version: typeof GAME_DATA_VERSION;
	id: string;
	difficulty: Difficulty;
	puzzle: Board;
	solution: Digit[];
	clues: number;
	seed?: number;
	source: GameDataSource;
	generatedAt?: string;
	generator?: {
		name: string;
		version: string;
		runtime: GameDataRuntime;
		durationMs?: number;
		attempts?: number;
	};
};

export type CompactSudokuGameDataV1 = Omit<
	SudokuGameDataV1,
	"puzzle" | "solution"
> & {
	puzzle: string;
	solution: string;
};

export type DifficultyThreshold = {
	targetClues: number;
	minClues: number;
	maxClues: number;
	maxGenerationMs: number;
};

export const difficultyThresholds: Record<Difficulty, DifficultyThreshold> = {
	easy: { targetClues: 42, minClues: 40, maxClues: 44, maxGenerationMs: 250 },
	medium: { targetClues: 34, minClues: 32, maxClues: 36, maxGenerationMs: 500 },
	hard: { targetClues: 26, minClues: 25, maxClues: 28, maxGenerationMs: 1500 },
	master: {
		targetClues: 24,
		minClues: 23,
		maxClues: 25,
		maxGenerationMs: 3000,
	},
	expert: {
		targetClues: 18,
		minClues: 17,
		maxClues: 20,
		maxGenerationMs: 300000,
	},
};

export const createGameDataV1 = ({
	difficulty,
	generatedAt,
	generator,
	puzzle,
	seed,
	solution,
	source,
}: Omit<SudokuGameDataV1, "clues" | "id" | "version">): SudokuGameDataV1 => {
	const clues = countClues(puzzle);
	const gameWithoutId: Omit<SudokuGameDataV1, "id"> = {
		version: GAME_DATA_VERSION,
		difficulty,
		puzzle,
		solution,
		clues,
		seed,
		source,
		generatedAt,
		generator,
	};

	return {
		...gameWithoutId,
		id: hashGameDataV1(gameWithoutId),
	};
};

export const validateGameDataV1 = (
	game: SudokuGameDataV1,
	options: { requireUnique?: boolean } = {},
): string[] => {
	const errors: string[] = [];
	const threshold = difficultyThresholds[game.difficulty];

	if (game.version !== GAME_DATA_VERSION) {
		errors.push(`Unsupported game data version: ${game.version}`);
	}

	if (!threshold) {
		errors.push(`Unsupported difficulty: ${game.difficulty}`);
	}

	if (!Array.isArray(game.puzzle) || game.puzzle.length !== 81) {
		errors.push("Puzzle must contain 81 cells");
	}

	if (!Array.isArray(game.solution) || game.solution.length !== 81) {
		errors.push("Solution must contain 81 cells");
	}

	if (game.puzzle.some((value) => value !== null && !isDigit(value))) {
		errors.push("Puzzle contains an invalid cell value");
	}

	if (game.solution.some((value) => !isDigit(value))) {
		errors.push("Solution contains an invalid cell value");
	}

	if (isValidSolvedBoard(game.solution) === false) {
		errors.push("Solution is not a valid solved board");
	}

	if (game.clues !== countClues(game.puzzle)) {
		errors.push("Clue count does not match puzzle");
	}

	if (
		threshold &&
		(game.clues < threshold.minClues || game.clues > threshold.maxClues)
	) {
		errors.push(
			`Clue count ${game.clues} is outside ${game.difficulty} threshold ${threshold.minClues}-${threshold.maxClues}`,
		);
	}

	if (
		game.puzzle.some(
			(value, index) => value !== null && value !== game.solution[index],
		)
	) {
		errors.push("Puzzle givens do not match solution");
	}

	if (!hasSolution(game.puzzle)) {
		errors.push("Puzzle has no solution");
	}

	if (options.requireUnique && !hasUniqueSolution(game.puzzle)) {
		errors.push("Puzzle does not have exactly one solution");
	}

	if (game.id !== hashGameDataV1(game)) {
		errors.push("Game id does not match puzzle hash");
	}

	return errors;
};

export const gameDataToInitialState = (game: SudokuGameDataV1): GameState => {
	const now = Date.now();

	return {
		cells: game.puzzle.map((value) => ({
			value,
			given: value !== null,
			notes: [],
			invalid: false,
		})),
		solution: game.solution,
		selectedIndex: null,
		selectedDigit: null,
		difficulty: game.difficulty,
		pencilMode: false,
		errors: 0,
		startedAt: now,
		elapsedBeforePause: 0,
		pausedAt: null,
		completedAt: null,
		undoHistory: [],
		seed: game.seed ?? numericSeedFromId(game.id),
	};
};

export const compactGameDataV1 = (
	game: SudokuGameDataV1,
): CompactSudokuGameDataV1 => ({
	...game,
	puzzle: boardToCompactString(game.puzzle),
	solution: digitsToCompactString(game.solution),
});

export const expandGameDataV1 = (
	game: CompactSudokuGameDataV1,
): SudokuGameDataV1 => ({
	...game,
	puzzle: compactStringToBoard(game.puzzle),
	solution: compactStringToDigits(game.solution),
});

export const boardToCompactString = (board: Board): string => {
	return board.map((value) => value ?? 0).join("");
};

export const digitsToCompactString = (digits: Digit[]): string => {
	return digits.join("");
};

export const compactStringToBoard = (value: string): Board => {
	return [...value].map((cell) =>
		cell === "0" ? null : compactCharToDigit(cell),
	);
};

export const compactStringToDigits = (value: string): Digit[] => {
	return [...value].map(compactCharToDigit);
};

export const hashGameDataV1 = (
	game: Pick<
		SudokuGameDataV1,
		"version" | "difficulty" | "puzzle" | "solution"
	>,
): string => {
	const payload = JSON.stringify({
		version: game.version,
		difficulty: game.difficulty,
		puzzle: game.puzzle,
		solution: game.solution,
	});
	let hash = 2166136261;

	for (let index = 0; index < payload.length; index += 1) {
		hash ^= payload.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return `sdk-v${game.version}-${game.difficulty}-${(hash >>> 0)
		.toString(36)
		.padStart(7, "0")}`;
};

export const countClues = (board: Board): number => {
	return board.filter((value) => value !== null).length;
};

const isDigit = (value: unknown): value is Digit => {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 1 &&
		value <= 9
	);
};

const compactCharToDigit = (value: string): Digit => {
	const digit = Number(value);

	if (!isDigit(digit)) {
		throw new Error(`Invalid compact Sudoku digit: ${value}`);
	}

	return digit;
};

const numericSeedFromId = (id: string): number => {
	let seed = 0;

	for (let index = 0; index < id.length; index += 1) {
		seed = (seed * 31 + id.charCodeAt(index)) % Number.MAX_SAFE_INTEGER;
	}

	return seed;
};
