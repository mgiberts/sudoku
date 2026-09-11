import {
	assertReviewedPolicy,
	type DifficultyPolicy,
	difficultyPolicy,
} from "./difficultyPolicy";
import {
	matchesDifficulty,
	RATING_VERSION,
	type RatingSummary,
	rateDifficulty,
	requiresRating,
	summarizeRating,
} from "./difficultyRating";
import {
	assessEffort,
	type EffortAssessment,
	effortRejection,
} from "./effortRating";
import {
	hasSolution,
	hasUniqueSolution,
	hasUniqueSolutionWithin,
	isValidSolvedBoard,
} from "./sudoku";
import type { Board, Difficulty, Digit, GameState } from "./types";

export const GAME_DATA_VERSION = 1;

export type GameDataSource = "starter" | "worker" | "curated" | "script";
export type GameDataRuntime =
	| "browser-worker"
	| "browser-simulation"
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
	rating?: RatingSummary;
	assessment?: EffortAssessment;
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

export const difficultyThresholds = Object.fromEntries(
	Object.entries(difficultyPolicy.levels).map(([difficulty, config]) => [
		difficulty,
		{
			targetClues: config.targetClues,
			minClues: 17,
			maxClues: 81,
			maxGenerationMs: config.maxGenerationMs,
		},
	]),
) as Record<Difficulty, DifficultyThreshold>;

export const createGameDataV1 = ({
	difficulty,
	generatedAt,
	generator,
	puzzle,
	seed,
	solution,
	source,
	rating,
	assessment,
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
		assessment:
			assessment ??
			(difficultyPolicy.stage === "reviewed"
				? assessEffort(puzzle).assessment
				: undefined),
		rating: rating ? summarizeRating(rating) : undefined,
	};

	return {
		...gameWithoutId,
		id: hashGameDataV1(gameWithoutId),
	};
};

export const validateGameDataV1 = (
	game: SudokuGameDataV1,
	options: {
		policy?: DifficultyPolicy;
		requireUnique?: boolean;
		requireDifficulty?: boolean;
		shouldStop?: () => boolean;
	} = {},
): string[] => {
	const errors: string[] = [];
	const policy = options.policy ?? difficultyPolicy;
	const useEffort = options.policy !== undefined || policy.stage === "reviewed";
	if (!options.policy && useEffort) assertReviewedPolicy(policy);
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

	if (errors.length > 0) return errors;

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
		!useEffort &&
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

	if (!options.shouldStop && !hasSolution(game.puzzle)) {
		errors.push("Puzzle has no solution");
	}

	if (
		options.requireUnique &&
		!(options.shouldStop
			? hasUniqueSolutionWithin(game.puzzle, options.shouldStop)
			: hasUniqueSolution(game.puzzle))
	) {
		errors.push("Puzzle does not have exactly one solution");
	}

	if (game.id !== hashGameDataV1(game)) {
		errors.push("Game id does not match puzzle hash");
	}

	if (errors.length === 0 && useEffort && options.requireDifficulty !== false) {
		const { assessment, rating } = assessEffort(
			game.puzzle,
			options.shouldStop,
			policy.version,
		);
		const reason = effortRejection(game.difficulty, assessment, policy);
		if (reason) errors.push(`Difficulty policy: ${reason}`);
		if (
			game.rating &&
			(game.rating.version !== rating.version ||
				game.rating.tier !== rating.tier ||
				game.rating.status !== rating.status)
		)
			errors.push("Rating metadata does not match recomputed difficulty");
		if (
			game.assessment &&
			(game.assessment.policyVersion !== policy.version ||
				game.assessment.ratingVersion !== assessment.ratingVersion ||
				game.assessment.repertoire !== assessment.repertoire)
		)
			errors.push("Stale difficulty assessment");
	} else if (
		errors.length === 0 &&
		options.requireDifficulty !== false &&
		requiresRating(game.difficulty)
	) {
		const rating = rateDifficulty(game.puzzle, options.shouldStop);
		if (
			game.rating &&
			(game.rating.version !== rating.version ||
				game.rating.tier !== rating.tier ||
				game.rating.status !== rating.status)
		)
			errors.push("Rating metadata does not match recomputed difficulty");
		if (!matchesDifficulty(game.difficulty, rating))
			errors.push(
				`Difficulty mismatch: expected ${game.difficulty}, rated ${rating.tier} (${rating.status})`,
			);
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
	rating: game.rating ? summarizeRating(game.rating) : undefined,
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

export const hasCurrentAssessment = (game: SudokuGameDataV1): boolean =>
	difficultyPolicy.stage !== "reviewed" ||
	Boolean(
		game.assessment &&
			game.assessment.ratingVersion === RATING_VERSION &&
			!effortRejection(game.difficulty, game.assessment),
	);
