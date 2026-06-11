import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from "react";
import { selectCuratedExpertGame, selectStarterGame } from "./gameCatalog";
import { gameDataToInitialState } from "./gameData";
import type { GameAction } from "./gameState";
import { createInitialGame, gameReducer } from "./gameState";
import { sudokuStorage } from "./storage";
import type { Difficulty, GameState } from "./types";

const SudokuContext = createContext<
	| {
			state: GameState;
			dispatch: React.Dispatch<GameAction>;
	  }
	| undefined
>(undefined);

export const SudokuProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);
	const value = useMemo(() => ({ state, dispatch }), [state]);

	useEffect(() => {
		sudokuStorage.saveGame(state);
	}, [state]);

	return (
		<SudokuContext.Provider value={value}>{children}</SudokuContext.Provider>
	);
};

export const useGame = () => {
	const context = useContext(SudokuContext);

	if (!context) {
		throw new Error("useGame must be used inside SudokuProvider");
	}

	return context;
};

const loadGame = (): GameState => {
	return (
		sudokuStorage.loadGame() ??
		createInitialGameForDifficulty(sudokuStorage.loadDefaultDifficulty())
	);
};

export const createInitialGameForDifficulty = (
	difficulty: Difficulty,
): GameState => {
	const game =
		difficulty === "expert"
			? selectCuratedExpertGame()
			: selectStarterGame(difficulty);

	return game ? gameDataToInitialState(game) : createInitialGame(difficulty);
};
