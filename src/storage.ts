import type {
	BestTime,
	BestTimes,
	Difficulty,
	GameState,
	InputStyle,
	NumberColorScheme,
	SettingsState,
	SymbolSet,
	ThemeSetting,
} from "./types";

const GAME_STORAGE_KEY = "sudoku.game.v1";
const SETTINGS_STORAGE_KEY = "sudoku.settings.v1";
const STATS_STORAGE_KEY = "sudoku.stats.v1";

const DEFAULT_DIFFICULTY: Difficulty = "easy";
const DEFAULT_SETTINGS: SettingsState = {
	difficulty: DEFAULT_DIFFICULTY,
	inputStyle: "single",
	numberColorScheme: "color",
	symbolSet: "digits",
	theme: "auto",
};
const DIFFICULTIES = new Set<Difficulty>([
	"easy",
	"medium",
	"hard",
	"master",
	"expert",
]);
const INPUT_STYLES = new Set<InputStyle>(["single", "flow"]);
const NUMBER_COLOR_SCHEMES = new Set<NumberColorScheme>([
	"color",
	"monochrome",
]);
const SYMBOL_SETS = new Set<SymbolSet>(["digits", "kanji", "emoji"]);
const THEMES = new Set<ThemeSetting>(["light", "dark", "auto"]);
export const BEST_TIME_ERROR_LIMITS: Record<Difficulty, number> = {
	easy: 10,
	medium: 10,
	hard: 5,
	master: 5,
	expert: 3,
};

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
				return {
					...parsed,
					difficulty,
					selectedDigit: normalizeDigit(parsed.selectedDigit),
					pausedAt: normalizeTimestamp(parsed.pausedAt),
					undoHistory: normalizeUndoHistory(parsed.undoHistory),
				};
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
				inputStyle:
					normalizeInputStyle(parsed.inputStyle) ?? DEFAULT_SETTINGS.inputStyle,
				numberColorScheme:
					normalizeNumberColorScheme(parsed.numberColorScheme) ??
					DEFAULT_SETTINGS.numberColorScheme,
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

	const removeStats = (): void => {
		localStorage.removeItem(STATS_STORAGE_KEY);
	};

	const loadBestTimes = (): BestTimes => {
		const saved = localStorage.getItem(STATS_STORAGE_KEY);

		if (!saved) {
			return {};
		}

		try {
			const parsed = JSON.parse(saved) as Partial<Record<Difficulty, BestTime>>;
			const bestTimes: BestTimes = {};

			for (const difficulty of DIFFICULTIES) {
				const score = parsed[difficulty];

				if (isBestTime(score)) {
					bestTimes[difficulty] = score;
				}
			}

			return bestTimes;
		} catch {
			removeStats();
			return {};
		}
	};

	const saveBestTimes = (bestTimes: BestTimes): void => {
		localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(bestTimes));
	};

	const recordBestTime = (
		difficulty: Difficulty,
		score: BestTime,
	): BestTimes => {
		const bestTimes = loadBestTimes();
		const threshold = BEST_TIME_ERROR_LIMITS[difficulty];

		if (score.errors >= threshold) {
			return bestTimes;
		}

		const current = bestTimes[difficulty];
		const isBetter =
			!current ||
			score.seconds < current.seconds ||
			(score.seconds === current.seconds && score.errors < current.errors);

		if (!isBetter) {
			return bestTimes;
		}

		const next = { ...bestTimes, [difficulty]: score };
		saveBestTimes(next);
		return next;
	};

	const loadDefaultDifficulty = (): Difficulty => {
		return loadSettings().difficulty;
	};

	return {
		loadBestTimes,
		loadDefaultDifficulty,
		loadGame,
		loadSettings,
		removeGame,
		removeSettings,
		removeStats,
		recordBestTime,
		saveBestTimes,
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

const normalizeInputStyle = (inputStyle?: string): InputStyle | null => {
	return INPUT_STYLES.has(inputStyle as InputStyle)
		? (inputStyle as InputStyle)
		: null;
};

const normalizeDigit = (digit: unknown): GameState["selectedDigit"] => {
	return typeof digit === "number" &&
		Number.isInteger(digit) &&
		digit >= 1 &&
		digit <= 9
		? (digit as GameState["selectedDigit"])
		: null;
};

const normalizeTimestamp = (timestamp: unknown): number | null => {
	return typeof timestamp === "number" && Number.isFinite(timestamp)
		? timestamp
		: null;
};

const normalizeUndoHistory = (undoHistory: unknown): number[] => {
	if (!Array.isArray(undoHistory)) {
		return [];
	}

	return undoHistory.filter(
		(index): index is number =>
			typeof index === "number" &&
			Number.isInteger(index) &&
			index >= 0 &&
			index < 81,
	);
};

const normalizeSymbolSet = (symbolSet?: string): SymbolSet | null => {
	return SYMBOL_SETS.has(symbolSet as SymbolSet)
		? (symbolSet as SymbolSet)
		: null;
};

const normalizeNumberColorScheme = (
	numberColorScheme?: string,
): NumberColorScheme | null => {
	return NUMBER_COLOR_SCHEMES.has(numberColorScheme as NumberColorScheme)
		? (numberColorScheme as NumberColorScheme)
		: null;
};

const normalizeTheme = (theme?: string): ThemeSetting | null => {
	return THEMES.has(theme as ThemeSetting) ? (theme as ThemeSetting) : null;
};

const isBestTime = (score: unknown): score is BestTime => {
	if (!score || typeof score !== "object") {
		return false;
	}

	const candidate = score as Partial<BestTime>;
	return (
		typeof candidate.seconds === "number" &&
		Number.isFinite(candidate.seconds) &&
		candidate.seconds >= 0 &&
		typeof candidate.errors === "number" &&
		Number.isInteger(candidate.errors) &&
		candidate.errors >= 0
	);
};
