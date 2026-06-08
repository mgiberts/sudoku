export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CellValue = Digit | null;
export type Board = CellValue[];
export type Difficulty = "easy" | "medium" | "hard";
export type ThemeSetting = "light" | "dark" | "auto";
export type SymbolSet = "digits" | "kanji" | "emoji";

export type SettingsState = {
	difficulty: Difficulty;
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
	selectedIndex: number;
	difficulty: Difficulty;
	pencilMode: boolean;
	errors: number;
	startedAt: number;
	elapsedBeforePause: number;
	completedAt: number | null;
	seed: number;
};
