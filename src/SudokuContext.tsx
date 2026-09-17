import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from "react";
import { requiresRating } from "./difficultyRating";
import { selectStarterGame } from "./gameCatalog";
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
	const stateRef = useRef(state);
	stateRef.current = state;
	const value = useMemo(() => ({ state, dispatch }), [state]);

	useEffect(() => {
		sudokuStorage.saveGame(state);
	}, [state]);

	useEffect(() => {
		const pauseForLostFocus = () => {
			const action: GameAction = { type: "pause", at: Date.now() };
			const paused = gameReducer(stateRef.current, action);
			if (paused === stateRef.current) return;
			stateRef.current = paused;
			sudokuStorage.saveGame(paused);
			dispatch(action);
		};
		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") pauseForLostFocus();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("blur", pauseForLostFocus);
		window.addEventListener("pagehide", pauseForLostFocus);
		onVisibilityChange();

		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("blur", pauseForLostFocus);
			window.removeEventListener("pagehide", pauseForLostFocus);
		};
	}, []);

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
	const game = selectStarterGame(difficulty);

	if (!game && requiresRating(difficulty))
		throw new Error(`No validated ${difficulty} puzzle is available`);
	return game ? gameDataToInitialState(game) : createInitialGame(difficulty);
};
