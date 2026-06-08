import type { Digit, SymbolSet } from "./types";

export const symbolSetLabels: Record<SymbolSet, string> = {
	digits: "9",
	kanji: "六",
	emoji: "🤘",
};
export const symbolSetOptions = Object.keys(symbolSetLabels) as SymbolSet[];
export const symbolSets: Record<SymbolSet, Record<Digit, string>> = {
	digits: {
		1: "1",
		2: "2",
		3: "3",
		4: "4",
		5: "5",
		6: "6",
		7: "7",
		8: "8",
		9: "9",
	},
	kanji: {
		1: "一",
		2: "二",
		3: "三",
		4: "四",
		5: "五",
		6: "六",
		7: "七",
		8: "八",
		9: "九",
	},
	emoji: {
		1: "🚗",
		2: "⚡️",
		3: "🔋",
		4: "🩵",
		5: "🦖",
		6: "💯",
		7: "🤘",
		8: "🖖",
		9: "🥀",
	},
};
