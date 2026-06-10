import {
	createPuzzle,
	getPeers,
	hasSolution,
	isValidSolvedBoard,
} from "./sudoku";
import type { Cell, Difficulty, Digit, GameState } from "./types";

export type GameAction =
	| { type: "select"; index: number }
	| { type: "select-and-enter"; index: number }
	| { type: "select-digit"; digit: Digit }
	| { type: "toggle-pencil" }
	| { type: "enter"; digit: Digit }
	| { type: "erase" }
	| { type: "undo" }
	| { type: "pause" }
	| { type: "resume" }
	| { type: "new-game"; difficulty: Difficulty };

export const gameReducer = (
	state: GameState,
	action: GameAction,
): GameState => {
	switch (action.type) {
		case "select":
			if (state.pausedAt !== null) {
				return state;
			}
			return { ...state, selectedIndex: action.index };
		case "select-and-enter":
			if (state.pausedAt !== null) {
				return state;
			}
			return selectAndEnter(state, action.index);
		case "select-digit":
			if (state.pausedAt !== null) {
				return state;
			}
			return {
				...state,
				selectedDigit:
					state.selectedDigit === action.digit ? null : action.digit,
			};
		case "toggle-pencil":
			if (state.pausedAt !== null) {
				return state;
			}
			return { ...state, pencilMode: !state.pencilMode };
		case "enter":
			if (state.pausedAt !== null) {
				return state;
			}
			return enterDigit(state, action.digit);
		case "erase":
			if (state.pausedAt !== null) {
				return state;
			}
			return eraseCell(state);
		case "undo":
			if (state.pausedAt !== null) {
				return state;
			}
			return undoLastEntry(state);
		case "pause":
			return pauseGame(state);
		case "resume":
			return resumeGame(state);
		case "new-game":
			return createInitialGame(action.difficulty);
		default:
			return state;
	}
};

export const createInitialGame = (difficulty: Difficulty): GameState => {
	const { puzzle, solution, seed } = createPuzzle(difficulty);

	return {
		cells: puzzle.map<Cell>((value) => ({
			value,
			given: value !== null,
			notes: [],
			invalid: false,
		})),
		solution,
		selectedIndex: puzzle.indexOf(null),
		selectedDigit: null,
		difficulty,
		pencilMode: false,
		errors: 0,
		startedAt: Date.now(),
		elapsedBeforePause: 0,
		pausedAt: null,
		completedAt: null,
		undoHistory: [],
		seed,
	};
};

export const isDigitComplete = (cells: Cell[], digit: Digit): boolean => {
	return (
		cells.filter((cell) => cell.value === digit && !cell.invalid).length >= 9
	);
};

export const hasPlayerProgress = (state: GameState): boolean => {
	return (
		state.errors > 0 ||
		state.cells.some(
			(cell) => !cell.given && (cell.value !== null || cell.notes.length > 0),
		)
	);
};

export const getElapsedSeconds = (
	state: GameState,
	end = Date.now(),
): number => {
	const activeEnd = state.completedAt ?? state.pausedAt ?? end;
	const elapsedMilliseconds =
		state.elapsedBeforePause + Math.max(0, activeEnd - state.startedAt);

	return Math.max(0, Math.floor(elapsedMilliseconds / 1000));
};

const pauseGame = (state: GameState): GameState => {
	if (state.completedAt !== null || state.pausedAt !== null) {
		return state;
	}

	const pausedAt = Date.now();

	return {
		...state,
		elapsedBeforePause:
			state.elapsedBeforePause + Math.max(0, pausedAt - state.startedAt),
		startedAt: pausedAt,
		pausedAt,
	};
};

const resumeGame = (state: GameState): GameState => {
	if (state.completedAt !== null || state.pausedAt === null) {
		return state;
	}

	return {
		...state,
		startedAt: Date.now(),
		pausedAt: null,
	};
};

const selectAndEnter = (state: GameState, index: number): GameState => {
	const selectedState = { ...state, selectedIndex: index };

	if (state.selectedDigit === null) {
		return selectedState;
	}

	if (state.cells[index]?.given) {
		return selectedState;
	}

	if (!state.pencilMode && state.cells[index]?.value === state.selectedDigit) {
		return eraseCell(selectedState);
	}

	return enterDigit(selectedState, state.selectedDigit);
};

const enterDigit = (state: GameState, digit: Digit): GameState => {
	if (state.completedAt !== null) {
		return state;
	}

	const selectedCell = state.cells[state.selectedIndex];

	if (selectedCell.given) {
		return state;
	}

	if (state.pencilMode) {
		if (selectedCell.value !== null) {
			return state;
		}

		const cells = [...state.cells];
		const notes = selectedCell.notes.includes(digit)
			? selectedCell.notes.filter((note) => note !== digit)
			: [...selectedCell.notes, digit].sort();

		cells[state.selectedIndex] = { ...selectedCell, notes, invalid: false };
		return { ...state, cells };
	}

	const hasConflict = hasVisibleConflict(state, digit);
	const candidateCells = state.cells.map((cell, index) =>
		index === state.selectedIndex
			? {
					...cell,
					value: digit,
					notes: [],
					invalid: hasConflict,
				}
			: cell,
	);
	const canStillSolve =
		hasConflict || hasSolution(candidateCells.map((cell) => cell.value));
	const isInvalid = hasConflict || !canStillSolve;
	const cells = state.cells.map((cell, index) => {
		if (index === state.selectedIndex) {
			return {
				...cell,
				value: digit,
				notes: [],
				invalid: isInvalid,
			};
		}

		if (!isInvalid && getPeers(state.selectedIndex).includes(index)) {
			return {
				...cell,
				notes: cell.notes.filter((note) => note !== digit),
			};
		}

		return cell;
	});
	const nextState = {
		...state,
		cells,
		errors: isInvalid ? state.errors + 1 : state.errors,
		undoHistory: [...state.undoHistory, state.selectedIndex],
	};

	return finishIfSolved(nextState);
};

const eraseCell = (state: GameState): GameState => {
	return clearSelectedCell(state);
};

const undoLastEntry = (state: GameState): GameState => {
	if (state.completedAt !== null || state.undoHistory.length === 0) {
		return state;
	}

	const undoHistory = state.undoHistory.slice(0, -1);
	const selectedIndex = state.undoHistory[state.undoHistory.length - 1];

	return clearSelectedCell({
		...state,
		selectedIndex,
		undoHistory,
	});
};

const clearSelectedCell = (state: GameState): GameState => {
	if (state.completedAt !== null) {
		return state;
	}

	const selectedCell = state.cells[state.selectedIndex];

	if (selectedCell.given) {
		return state;
	}

	const cells = [...state.cells];
	cells[state.selectedIndex] = {
		...selectedCell,
		value: null,
		notes: [],
		invalid: false,
	};

	return { ...state, cells };
};

const finishIfSolved = (state: GameState): GameState => {
	const board = state.cells.map((cell) => cell.value);

	if (!isValidSolvedBoard(board)) {
		return state;
	}

	return {
		...state,
		completedAt: Date.now(),
	};
};

const hasVisibleConflict = (state: GameState, digit: Digit): boolean => {
	return getPeers(state.selectedIndex).some((peerIndex) => {
		const peer = state.cells[peerIndex];
		return peer.value === digit && !peer.invalid;
	});
};
