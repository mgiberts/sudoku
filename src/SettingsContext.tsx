import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useGame } from "./SudokuContext";
import { sudokuStorage } from "./storage";
import { symbolSets } from "./symbolSets";
import type {
	Difficulty,
	Digit,
	SettingsState,
	SymbolSet,
	ThemeSetting,
} from "./types";

type SettingsContextValue = {
	settings: SettingsState;
	symbols: Record<Digit, string>;
	updateDifficulty: (difficulty: Difficulty) => void;
	updateSymbolSet: (symbolSet: SymbolSet) => void;
	updateTheme: (theme: ThemeSetting) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
	undefined,
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
	const { dispatch } = useGame();
	const [settings, setSettings] = useState(() => sudokuStorage.loadSettings());

	useEffect(() => {
		sudokuStorage.saveSettings(settings);
	}, [settings]);

	useEffect(() => {
		document.documentElement.dataset.theme = settings.theme;
	}, [settings.theme]);

	const value = useMemo<SettingsContextValue>(() => {
		const updateDifficulty = (difficulty: Difficulty) => {
			setSettings((current) => ({ ...current, difficulty }));
			dispatch({ type: "new-game", difficulty });
		};

		const updateSymbolSet = (symbolSet: SymbolSet) => {
			setSettings((current) => ({ ...current, symbolSet }));
		};

		const updateTheme = (theme: ThemeSetting) => {
			setSettings((current) => ({ ...current, theme }));
		};

		return {
			settings,
			symbols: symbolSets[settings.symbolSet],
			updateDifficulty,
			updateSymbolSet,
			updateTheme,
		};
	}, [dispatch, settings]);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
};

export const useSettings = () => {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error("useSettings must be used inside SettingsProvider");
	}

	return context;
};
