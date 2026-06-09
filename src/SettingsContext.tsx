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
	NumberColorScheme,
	SettingsState,
	SymbolSet,
	ThemeSetting,
} from "./types";

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const NUMBER_CLASSES = [
	"n1",
	"n2",
	"n3",
	"n4",
	"n5",
	"n6",
	"n7",
	"n8",
	"n9",
] as const;

type SettingsContextValue = {
	settings: SettingsState;
	symbols: Record<Digit, string>;
	updateDifficulty: (difficulty: Difficulty) => void;
	updateNumberColorScheme: (numberColorScheme: NumberColorScheme) => void;
	updateSymbolSet: (symbolSet: SymbolSet) => void;
	updateTheme: (theme: ThemeSetting) => void;
	digits: Digit[];
	numberClasses: readonly string[];
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

		const updateNumberColorScheme = (numberColorScheme: NumberColorScheme) => {
			setSettings((current) => ({ ...current, numberColorScheme }));
		};

		const updateTheme = (theme: ThemeSetting) => {
			setSettings((current) => ({ ...current, theme }));
		};

		return {
			settings,
			symbols: symbolSets[settings.symbolSet],
			updateDifficulty,
			updateNumberColorScheme,
			updateSymbolSet,
			updateTheme,
			digits: DIGITS,
			numberClasses: NUMBER_CLASSES,
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
