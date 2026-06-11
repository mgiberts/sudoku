export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CellValue = Digit | null;
export type Board = CellValue[];
export type Difficulty = "easy" | "medium" | "hard" | "master" | "expert";
export type ThemeSetting = "light" | "dark" | "auto";
export type SymbolSet = "digits" | "kanji" | "emoji";
export type NumberColorScheme = "color" | "monochrome";
export type InputStyle = "single" | "flow";
export type EmptyCellDisplay = "clean" | "dots";
export type PlayMode = "timer" | "zen";

export type BestTime = {
	seconds: number;
	errors: number;
};

export type BestTimes = Partial<Record<Difficulty, BestTime>>;

export type SettingsState = {
	difficulty: Difficulty;
	emptyCellDisplay: EmptyCellDisplay;
	inputStyle: InputStyle;
	numberColorScheme: NumberColorScheme;
	playMode: PlayMode;
	symbolSet: SymbolSet;
	theme: ThemeSetting;
};

export type Cell = {
	value: CellValue;
	given: boolean;
	notes: Digit[];
	invalid: boolean;
};

export type GameState = {
	cells: Cell[];
	solution: Digit[];
	selectedIndex: number | null;
	selectedDigit: Digit | null;
	difficulty: Difficulty;
	pencilMode: boolean;
	errors: number;
	startedAt: number;
	elapsedBeforePause: number;
	pausedAt: number | null;
	completedAt: number | null;
	undoHistory: number[];
	seed: number;
};
