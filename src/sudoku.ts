import type { Board, Difficulty, Digit } from "./types";

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type DifficultyConfig = {
	clues: number;
	minCluesPerBox: number;
};

type PuzzleResult = {
	puzzle: Board;
	solution: Digit[];
	seed: number;
};

type UniquePuzzleCandidate = PuzzleResult & {
	accepted: boolean;
	clues: number;
};

type UniquePuzzleOptions = {
	maxAttempts?: number;
	maxClues?: number;
	maxSearchNodes?: number;
	minClues?: number;
	shouldStop?: () => boolean;
	strategy?: "greedy" | "grow" | "remix" | "search";
	targetClues?: number;
	timeoutMs?: number;
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

export const createPuzzle = (
	difficulty: Difficulty,
	seed = createSeed(),
): PuzzleResult => {
	const random = seededRandom(seed);
	const solution = generateSolvedBoard(random);
	const puzzle = hideCells(solution, difficultyConfig[difficulty], random);

	return { puzzle, solution, seed };
};

export const createUniquePuzzle = (
	difficulty: Difficulty,
	seed = createSeed(),
	options: UniquePuzzleOptions = {},
): PuzzleResult | null => {
	const candidate = createUniquePuzzleCandidate(difficulty, seed, options);

	return candidate?.accepted ? candidate : null;
};

export const createUniquePuzzleCandidate = (
	difficulty: Difficulty,
	seed = createSeed(),
	options: UniquePuzzleOptions = {},
): UniquePuzzleCandidate | null => {
	const startedAt = performance.now();
	const maxAttempts = options.maxAttempts ?? 1;
	const maxSearchNodes = options.maxSearchNodes ?? 20_000;
	const strategy = options.strategy ?? "greedy";
	const targetClues = options.targetClues ?? difficultyConfig[difficulty].clues;
	const minClues = options.minClues ?? targetClues;
	const maxClues = options.maxClues ?? targetClues;
	const shouldStop = () =>
		hasTimedOut(startedAt, options.timeoutMs) ||
		options.shouldStop?.() === true;
	let lastCandidate: UniquePuzzleCandidate | null = null;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		if (shouldStop()) {
			return lastCandidate;
		}

		const attemptSeed = seed + attempt;
		const random = seededRandom(attemptSeed);
		const solution = generateSolvedBoard(random);
		const puzzle =
			strategy === "search"
				? searchUniquePuzzle(
						solution,
						difficultyConfig[difficulty],
						targetClues,
						maxClues,
						random,
						maxSearchNodes,
						shouldStop,
					)
				: strategy === "grow"
					? growUniquePuzzle(
							solution,
							difficultyConfig[difficulty],
							maxClues,
							random,
							shouldStop,
						)
					: strategy === "remix"
						? remixUniquePuzzle(
								solution,
								difficultyConfig[difficulty],
								targetClues,
								maxClues,
								random,
								maxSearchNodes,
								shouldStop,
							)
						: hideCellsUniquely(
								solution,
								difficultyConfig[difficulty],
								targetClues,
								random,
								shouldStop,
							);
		const clues = countClues(puzzle);
		const isAccepted =
			clues >= minClues &&
			clues <= maxClues &&
			hasUniqueSolutionWithin(puzzle, shouldStop);
		const candidate = {
			accepted: isAccepted,
			clues,
			puzzle,
			seed: attemptSeed,
			solution,
		};

		if (candidate.accepted) {
			return candidate;
		}

		lastCandidate = candidate;
	}

	return lastCandidate;
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

export const hasUniqueSolution = (board: Board): boolean => {
	return countSolutions([...board], 2) === 1;
};

export const hasUniqueSolutionWithin = (
	board: Board,
	shouldStop: () => boolean,
): boolean => {
	return countSolutions([...board], 2, shouldStop) === 1;
};

export const getSolutionCount = (board: Board, limit = 2): number => {
	return countSolutions([...board], limit);
};

export const solveUniqueBoard = (board: Board): Digit[] | null => {
	return findUniqueSolution([...board]);
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

const hideCellsUniquely = (
	solution: Digit[],
	config: DifficultyConfig,
	targetClues: number,
	random: () => number,
	shouldStop: () => boolean,
): Board => {
	const puzzle: Board = [...solution];
	const targetHiddenCount = 81 - targetClues;
	let hiddenCount = 0;

	for (const index of shuffle(
		Array.from({ length: 81 }, (_, cellIndex) => cellIndex),
		random,
	)) {
		if (hiddenCount >= targetHiddenCount || shouldStop()) {
			break;
		}

		const value = puzzle[index];
		puzzle[index] = null;

		if (
			meetsBoxMinimums(puzzle, config.minCluesPerBox) &&
			hasUniqueSolutionWithin(puzzle, shouldStop)
		) {
			hiddenCount += 1;
		} else {
			puzzle[index] = value;
		}
	}

	return puzzle;
};

const growUniquePuzzle = (
	solution: Digit[],
	config: DifficultyConfig,
	maxClues: number,
	random: () => number,
	shouldStop: () => boolean,
): Board => {
	const puzzle: Board = Array.from({ length: 81 }, () => null);
	let bestPuzzle: Board = [...puzzle];
	let bestClues = 0;

	for (const boxIndex of shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], random)) {
		if (shouldStop()) {
			return bestPuzzle;
		}

		const indexes = getBoxCellIndexes(boxIndex).filter(
			(index) => puzzle[index] === null,
		);
		const index = indexes[Math.floor(random() * indexes.length)];
		puzzle[index] = solution[index];
	}

	while (countClues(puzzle) <= maxClues && !shouldStop()) {
		const clues = countClues(puzzle);

		if (clues > bestClues) {
			bestClues = clues;
			bestPuzzle = [...puzzle];
		}

		if (
			meetsBoxMinimums(puzzle, config.minCluesPerBox) &&
			hasUniqueSolutionWithin(puzzle, shouldStop)
		) {
			return [...puzzle];
		}

		const alternative = findAlternativeSolution(
			puzzle,
			solution,
			random,
			shouldStop,
		);

		if (!alternative) {
			return [...puzzle];
		}

		const candidates = solution
			.map((value, index) => ({ index, value }))
			.filter(
				({ index, value }) =>
					puzzle[index] === null && alternative[index] !== value,
			);

		if (candidates.length === 0) {
			return bestPuzzle;
		}

		const next = pickMostConstrainedClue(
			puzzle,
			candidates,
			config,
			random,
			shouldStop,
		);
		puzzle[next.index] = next.value;
	}

	return bestPuzzle;
};

const pickMostConstrainedClue = (
	puzzle: Board,
	candidates: { index: number; value: Digit }[],
	config: DifficultyConfig,
	random: () => number,
	shouldStop: () => boolean,
): { index: number; value: Digit } => {
	const underfilledCandidates = candidates.filter(({ index }) => {
		const box = getBoxIndex(Math.floor(index / 9), index % 9);
		return (
			getBoxCellIndexes(box).filter((cell) => puzzle[cell] !== null).length <
			config.minCluesPerBox
		);
	});
	const pool = shuffle(
		underfilledCandidates.length > 0 ? underfilledCandidates : candidates,
		random,
	).slice(0, 12);
	let bestScore = Number.POSITIVE_INFINITY;
	let bestCandidates: { index: number; value: Digit }[] = [];

	for (const candidate of pool) {
		if (shouldStop()) {
			break;
		}

		puzzle[candidate.index] = candidate.value;
		const score = countSolutions(puzzle, 3, shouldStop);
		puzzle[candidate.index] = null;

		if (score < bestScore) {
			bestScore = score;
			bestCandidates = [candidate];
		} else if (score === bestScore) {
			bestCandidates.push(candidate);
		}

		if (score === 1) {
			break;
		}
	}

	return (
		bestCandidates[Math.floor(random() * bestCandidates.length)] ?? pool[0]
	);
};

const remixUniquePuzzle = (
	solution: Digit[],
	config: DifficultyConfig,
	targetClues: number,
	maxClues: number,
	random: () => number,
	maxSearchNodes: number,
	shouldStop: () => boolean,
): Board => {
	let current = hideCellsUniquely(
		solution,
		config,
		targetClues,
		random,
		shouldStop,
	);
	let bestPuzzle = [...current];
	let bestClues = countClues(bestPuzzle);

	for (
		let iteration = 0;
		iteration < maxSearchNodes && !shouldStop();
		iteration += 1
	) {
		current = minimizeUniquePuzzle(current, config, random, shouldStop);
		const currentClues = countClues(current);

		if (currentClues < bestClues) {
			bestClues = currentClues;
			bestPuzzle = [...current];
		}

		if (currentClues >= targetClues && currentClues <= maxClues) {
			return current;
		}

		const clueIndexes = shuffle(
			current
				.map((value, index) => (value === null ? null : index))
				.filter((index) => index !== null),
			random,
		);
		let nextPuzzle: Board | null = null;

		for (const clueIndex of clueIndexes.slice(0, 8)) {
			if (shouldStop()) {
				return bestPuzzle;
			}

			const candidate = [...current];
			candidate[clueIndex] = null;

			for (let additions = 0; additions < 3; additions += 1) {
				if (hasUniqueSolutionWithin(candidate, shouldStop)) {
					nextPuzzle = minimizeUniquePuzzle(
						candidate,
						config,
						random,
						shouldStop,
					);
					break;
				}

				const alternative = findAlternativeSolution(
					candidate,
					solution,
					random,
					shouldStop,
				);

				if (!alternative) {
					nextPuzzle = minimizeUniquePuzzle(
						candidate,
						config,
						random,
						shouldStop,
					);
					break;
				}

				const candidates = solution
					.map((value, index) => ({ index, value }))
					.filter(
						({ index, value }) =>
							candidate[index] === null && alternative[index] !== value,
					);

				if (candidates.length === 0) {
					break;
				}

				const next = pickMostConstrainedClue(
					candidate,
					candidates,
					config,
					random,
					shouldStop,
				);
				candidate[next.index] = next.value;
			}

			if (nextPuzzle) {
				break;
			}
		}

		current = nextPuzzle ?? bestPuzzle;
	}

	return bestPuzzle;
};

const minimizeUniquePuzzle = (
	puzzle: Board,
	config: DifficultyConfig,
	random: () => number,
	shouldStop: () => boolean,
): Board => {
	const next = [...puzzle];

	for (const index of shuffle(
		next
			.map((value, cellIndex) => (value === null ? null : cellIndex))
			.filter((cellIndex) => cellIndex !== null),
		random,
	)) {
		if (shouldStop()) {
			break;
		}

		const value = next[index];
		next[index] = null;

		if (
			!meetsBoxMinimums(next, config.minCluesPerBox) ||
			!hasUniqueSolutionWithin(next, shouldStop)
		) {
			next[index] = value;
		}
	}

	return next;
};

const searchUniquePuzzle = (
	solution: Digit[],
	config: DifficultyConfig,
	targetClues: number,
	maxClues: number,
	random: () => number,
	maxSearchNodes: number,
	shouldStop: () => boolean,
): Board => {
	const puzzle: Board = [...solution];
	let bestPuzzle: Board = [...puzzle];
	let bestClues = puzzle.length;
	let visitedNodes = 0;

	const search = (board: Board, removableIndexes: number[]): Board | null => {
		if (shouldStop() || visitedNodes >= maxSearchNodes) {
			return null;
		}

		visitedNodes += 1;
		const clues = countClues(board);

		if (clues < bestClues) {
			bestClues = clues;
			bestPuzzle = [...board];
		}

		if (clues <= maxClues && clues >= targetClues) {
			return [...board];
		}

		if (clues < targetClues || removableIndexes.length < clues - targetClues) {
			return null;
		}

		for (
			let orderIndex = 0;
			orderIndex < removableIndexes.length;
			orderIndex += 1
		) {
			const index = removableIndexes[orderIndex];
			const value = board[index];

			if (value === null) {
				continue;
			}

			board[index] = null;

			if (
				meetsBoxMinimums(board, config.minCluesPerBox) &&
				hasUniqueSolutionWithin(board, shouldStop)
			) {
				const result = search(board, removableIndexes.slice(orderIndex + 1));

				if (result) {
					return result;
				}
			}

			board[index] = value;

			if (shouldStop() || visitedNodes >= maxSearchNodes) {
				return null;
			}
		}

		return null;
	};

	return (
		search(
			puzzle,
			shuffle(
				Array.from({ length: 81 }, (_, cellIndex) => cellIndex),
				random,
			),
		) ?? bestPuzzle
	);
};

const hasTimedOut = (startedAt: number, timeoutMs?: number): boolean => {
	return timeoutMs !== undefined && performance.now() - startedAt > timeoutMs;
};

const countClues = (board: Board): number => {
	return board.filter((value) => value !== null).length;
};

const ALL_DIGIT_MASK = 0b111111111;

const digitToMask = (digit: Digit): number => {
	return 1 << (digit - 1);
};

const maskToDigit = (mask: number): Digit => {
	return (Math.log2(mask) + 1) as Digit;
};

const countMaskBits = (mask: number): number => {
	let count = 0;
	let next = mask;

	while (next !== 0) {
		next &= next - 1;
		count += 1;
	}

	return count;
};

const getBoxIndex = (row: number, col: number): number => {
	return Math.floor(row / 3) * 3 + Math.floor(col / 3);
};

const getBoxCellIndexes = (boxIndex: number): number[] => {
	const boxRow = Math.floor(boxIndex / 3) * 3;
	const boxCol = (boxIndex % 3) * 3;
	const indexes: number[] = [];

	for (let row = boxRow; row < boxRow + 3; row += 1) {
		for (let col = boxCol; col < boxCol + 3; col += 1) {
			indexes.push(row * 9 + col);
		}
	}

	return indexes;
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

const countSolutions = (
	board: Board,
	limit: number,
	shouldStop: () => boolean = () => false,
): number => {
	if (limit <= 0 || shouldStop()) {
		return 0;
	}

	const rows = Array.from({ length: 9 }, () => 0);
	const cols = Array.from({ length: 9 }, () => 0);
	const boxes = Array.from({ length: 9 }, () => 0);
	const emptyIndexes: number[] = [];

	for (let index = 0; index < board.length; index += 1) {
		const value = board[index];

		if (value === null) {
			emptyIndexes.push(index);
			continue;
		}

		const row = Math.floor(index / 9);
		const col = index % 9;
		const box = getBoxIndex(row, col);
		const mask = digitToMask(value);

		if (
			(rows[row] & mask) !== 0 ||
			(cols[col] & mask) !== 0 ||
			(boxes[box] & mask) !== 0
		) {
			return 0;
		}

		rows[row] |= mask;
		cols[col] |= mask;
		boxes[box] |= mask;
	}

	let count = 0;

	const search = (): void => {
		if (count >= limit || shouldStop()) {
			return;
		}

		let bestEmptyOffset = -1;
		let bestMask = 0;
		let bestCandidateCount = 10;

		for (let offset = 0; offset < emptyIndexes.length; offset += 1) {
			const index = emptyIndexes[offset];

			if (board[index] !== null) {
				continue;
			}

			const row = Math.floor(index / 9);
			const col = index % 9;
			const box = getBoxIndex(row, col);
			const used = rows[row] | cols[col] | boxes[box];
			const mask = ALL_DIGIT_MASK & ~used;
			const candidateCount = countMaskBits(mask);

			if (candidateCount === 0) {
				return;
			}

			if (candidateCount < bestCandidateCount) {
				bestCandidateCount = candidateCount;
				bestEmptyOffset = offset;
				bestMask = mask;

				if (candidateCount === 1) {
					break;
				}
			}
		}

		if (bestEmptyOffset === -1) {
			count += 1;
			return;
		}

		const index = emptyIndexes[bestEmptyOffset];
		const row = Math.floor(index / 9);
		const col = index % 9;
		const box = getBoxIndex(row, col);
		let mask = bestMask;

		while (mask !== 0 && count < limit && !shouldStop()) {
			const candidateMask = mask & -mask;
			mask -= candidateMask;
			const digit = maskToDigit(candidateMask);

			board[index] = digit;
			rows[row] |= candidateMask;
			cols[col] |= candidateMask;
			boxes[box] |= candidateMask;

			search();

			rows[row] &= ~candidateMask;
			cols[col] &= ~candidateMask;
			boxes[box] &= ~candidateMask;
			board[index] = null;
		}
	};

	search();

	return count;
};

const findUniqueSolution = (board: Board): Digit[] | null => {
	const rows = Array.from({ length: 9 }, () => 0);
	const cols = Array.from({ length: 9 }, () => 0);
	const boxes = Array.from({ length: 9 }, () => 0);
	const emptyIndexes: number[] = [];

	for (let index = 0; index < board.length; index += 1) {
		const value = board[index];

		if (value === null) {
			emptyIndexes.push(index);
			continue;
		}

		const row = Math.floor(index / 9);
		const col = index % 9;
		const box = getBoxIndex(row, col);
		const mask = digitToMask(value);

		if (
			(rows[row] & mask) !== 0 ||
			(cols[col] & mask) !== 0 ||
			(boxes[box] & mask) !== 0
		) {
			return null;
		}

		rows[row] |= mask;
		cols[col] |= mask;
		boxes[box] |= mask;
	}

	let solution: Digit[] | null = null;
	let count = 0;

	const search = (): void => {
		if (count > 1) {
			return;
		}

		let bestEmptyOffset = -1;
		let bestMask = 0;
		let bestCandidateCount = 10;

		for (let offset = 0; offset < emptyIndexes.length; offset += 1) {
			const index = emptyIndexes[offset];

			if (board[index] !== null) {
				continue;
			}

			const row = Math.floor(index / 9);
			const col = index % 9;
			const box = getBoxIndex(row, col);
			const mask = ALL_DIGIT_MASK & ~(rows[row] | cols[col] | boxes[box]);
			const candidateCount = countMaskBits(mask);

			if (candidateCount === 0) {
				return;
			}

			if (candidateCount < bestCandidateCount) {
				bestCandidateCount = candidateCount;
				bestEmptyOffset = offset;
				bestMask = mask;

				if (candidateCount === 1) {
					break;
				}
			}
		}

		if (bestEmptyOffset === -1) {
			count += 1;
			solution = [...board] as Digit[];
			return;
		}

		const index = emptyIndexes[bestEmptyOffset];
		const row = Math.floor(index / 9);
		const col = index % 9;
		const box = getBoxIndex(row, col);
		let mask = bestMask;

		while (mask !== 0 && count <= 1) {
			const candidateMask = mask & -mask;
			mask -= candidateMask;
			const digit = maskToDigit(candidateMask);

			board[index] = digit;
			rows[row] |= candidateMask;
			cols[col] |= candidateMask;
			boxes[box] |= candidateMask;

			search();

			rows[row] &= ~candidateMask;
			cols[col] &= ~candidateMask;
			boxes[box] &= ~candidateMask;
			board[index] = null;
		}
	};

	search();

	return count === 1 ? solution : null;
};

const findAlternativeSolution = (
	board: Board,
	targetSolution: Digit[],
	random: () => number,
	shouldStop: () => boolean,
): Digit[] | null => {
	const rows = Array.from({ length: 9 }, () => 0);
	const cols = Array.from({ length: 9 }, () => 0);
	const boxes = Array.from({ length: 9 }, () => 0);
	const emptyIndexes: number[] = [];

	for (let index = 0; index < board.length; index += 1) {
		const value = board[index];

		if (value === null) {
			emptyIndexes.push(index);
			continue;
		}

		const row = Math.floor(index / 9);
		const col = index % 9;
		const box = getBoxIndex(row, col);
		const mask = digitToMask(value);

		if (
			(rows[row] & mask) !== 0 ||
			(cols[col] & mask) !== 0 ||
			(boxes[box] & mask) !== 0
		) {
			return null;
		}

		rows[row] |= mask;
		cols[col] |= mask;
		boxes[box] |= mask;
	}

	let alternative: Digit[] | null = null;
	const digitMasks = shuffle(DIGITS, random).map(digitToMask);

	const search = (): void => {
		if (alternative || shouldStop()) {
			return;
		}

		let bestEmptyOffset = -1;
		let bestMask = 0;
		let bestCandidateCount = 10;

		for (let offset = 0; offset < emptyIndexes.length; offset += 1) {
			const index = emptyIndexes[offset];

			if (board[index] !== null) {
				continue;
			}

			const row = Math.floor(index / 9);
			const col = index % 9;
			const box = getBoxIndex(row, col);
			const mask = ALL_DIGIT_MASK & ~(rows[row] | cols[col] | boxes[box]);
			const candidateCount = countMaskBits(mask);

			if (candidateCount === 0) {
				return;
			}

			if (candidateCount < bestCandidateCount) {
				bestCandidateCount = candidateCount;
				bestEmptyOffset = offset;
				bestMask = mask;

				if (candidateCount === 1) {
					break;
				}
			}
		}

		if (bestEmptyOffset === -1) {
			if (board.some((value, index) => value !== targetSolution[index])) {
				alternative = [...board] as Digit[];
			}
			return;
		}

		const index = emptyIndexes[bestEmptyOffset];
		const row = Math.floor(index / 9);
		const col = index % 9;
		const box = getBoxIndex(row, col);

		for (const candidateMask of digitMasks) {
			if ((bestMask & candidateMask) === 0) {
				continue;
			}

			const digit = maskToDigit(candidateMask);

			board[index] = digit;
			rows[row] |= candidateMask;
			cols[col] |= candidateMask;
			boxes[box] |= candidateMask;

			search();

			rows[row] &= ~candidateMask;
			cols[col] &= ~candidateMask;
			boxes[box] &= ~candidateMask;
			board[index] = null;

			if (alternative || shouldStop()) {
				return;
			}
		}
	};

	search();

	return alternative;
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
