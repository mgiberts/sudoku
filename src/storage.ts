import type {
	Difficulty,
	GameState,
	SettingsState,
	SymbolSet,
	ThemeSetting,
} from "./types";

const GAME_STORAGE_KEY = "sudoku.game.v1";
const SETTINGS_STORAGE_KEY = "sudoku.settings.v1";

const DEFAULT_DIFFICULTY: Difficulty = "easy";
const DEFAULT_SETTINGS: SettingsState = {
	difficulty: DEFAULT_DIFFICULTY,
	symbolSet: "digits",
	theme: "auto",
};
const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
const SYMBOL_SETS = new Set<SymbolSet>(["digits", "kanji", "emoji"]);
const THEMES = new Set<ThemeSetting>(["light", "dark", "auto"]);

const createSudokuStorage = () => {
	const removeGame = (): void => {
		localStorage.removeItem(GAME_STORAGE_KEY);
	};

	const loadGame = (): (GameState & { difficulty: Difficulty }) | null => {
		const saved = localStorage.getItem(GAME_STORAGE_KEY);

		if (!saved) {
			return null;
		}

		try {
			const parsed = JSON.parse(saved) as GameState & { difficulty?: string };
			const difficulty = normalizeDifficulty(parsed.difficulty);

			if (
				parsed.cells?.length === 81 &&
				parsed.solution?.length === 81 &&
				difficulty
			) {
				return { ...parsed, difficulty };
			}
		} catch {
			removeGame();
		}

		return null;
	};

	const saveGame = (state: GameState): void => {
		localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
	};

	const removeSettings = (): void => {
		localStorage.removeItem(SETTINGS_STORAGE_KEY);
	};

	const loadSettings = (): SettingsState => {
		const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

		if (!saved) {
			return DEFAULT_SETTINGS;
		}

		try {
			const parsed = JSON.parse(saved) as Partial<SettingsState>;

			return {
				difficulty:
					normalizeDifficulty(parsed.difficulty) ?? DEFAULT_SETTINGS.difficulty,
				symbolSet:
					normalizeSymbolSet(parsed.symbolSet) ?? DEFAULT_SETTINGS.symbolSet,
				theme: normalizeTheme(parsed.theme) ?? DEFAULT_SETTINGS.theme,
			};
		} catch {
			removeSettings();
			return DEFAULT_SETTINGS;
		}
	};

	const saveSettings = (settings: SettingsState): void => {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	};

	const loadDefaultDifficulty = (): Difficulty => {
		return loadSettings().difficulty;
	};

	return {
		loadDefaultDifficulty,
		loadGame,
		loadSettings,
		removeGame,
		removeSettings,
		saveGame,
		saveSettings,
	};
};

export const sudokuStorage = createSudokuStorage();

const normalizeDifficulty = (difficulty?: string): Difficulty | null => {
	if (!difficulty) {
		return null;
	}

	if (difficulty === "difficult") {
		return "hard";
	}

	return DIFFICULTIES.has(difficulty as Difficulty)
		? (difficulty as Difficulty)
		: null;
};

const normalizeSymbolSet = (symbolSet?: string): SymbolSet | null => {
	return SYMBOL_SETS.has(symbolSet as SymbolSet)
		? (symbolSet as SymbolSet)
		: null;
};

const normalizeTheme = (theme?: string): ThemeSetting | null => {
	return THEMES.has(theme as ThemeSetting) ? (theme as ThemeSetting) : null;
};
