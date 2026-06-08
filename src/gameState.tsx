import {
	createPuzzle,
	getPeers,
	hasSolution,
	isValidSolvedBoard,
} from "./sudoku";
import type { Cell, Difficulty, Digit, GameState } from "./types";

export type GameAction =
	| { type: "select"; index: number }
	| { type: "toggle-pencil" }
	| { type: "enter"; digit: Digit }
	| { type: "erase" }
	| { type: "new-game"; difficulty: Difficulty };

export const gameReducer = (
	state: GameState,
	action: GameAction,
): GameState => {
	switch (action.type) {
		case "select":
			return { ...state, selectedIndex: action.index };
		case "toggle-pencil":
			return { ...state, pencilMode: !state.pencilMode };
		case "enter":
			return enterDigit(state, action.digit);
		case "erase":
			return eraseCell(state);
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
		difficulty,
		pencilMode: false,
		errors: 0,
		startedAt: Date.now(),
		elapsedBeforePause: 0,
		completedAt: null,
		seed,
	};
};

export const isDigitComplete = (cells: Cell[], digit: Digit): boolean => {
	return (
		cells.filter((cell) => cell.value === digit && !cell.invalid).length >= 9
	);
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
	};

	return finishIfSolved(nextState);
};

const eraseCell = (state: GameState): GameState => {
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
