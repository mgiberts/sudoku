import {
	CircleDot,
	Grid3X3,
	Locate,
	LocateFixed,
	Moon,
	Sun,
	SunMoon,
	Timer,
	TimerOff,
} from "lucide-react";
import { ModalPanel } from "./ModalPanel";
import { useSettings } from "./SettingsContext";
import { symbolSetLabels, symbolSetOptions } from "./symbolSets";
import type {
	Difficulty,
	EmptyCellDisplay,
	InputStyle,
	NumberColorScheme,
	PlayMode,
	ThemeSetting,
} from "./types";

const difficultyLabels: Record<Difficulty, string> = {
	easy: "Chill",
	medium: "Steady",
	hard: "Sharp",
	master: "Master",
	expert: "Expert",
};
const difficultyOptions = Object.keys(difficultyLabels) as Difficulty[];

const inputStyleLabels: Record<InputStyle, string> = {
	single: "Single",
	flow: "Flow",
};
const inputStyleOptions = Object.keys(inputStyleLabels) as InputStyle[];

const playModeLabels: Record<PlayMode, string> = {
	timer: "Timer",
	zen: "Zen",
};
const playModeOptions = Object.keys(playModeLabels) as PlayMode[];

const emptyCellDisplayLabels: Record<EmptyCellDisplay, string> = {
	clean: "Lines",
	dots: "Dots",
};
const emptyCellDisplayOptions = Object.keys(
	emptyCellDisplayLabels,
) as EmptyCellDisplay[];

const themeLabels: Record<ThemeSetting, string> = {
	light: "Light",
	dark: "Dark",
	auto: "Auto",
};
const themeOptions = Object.keys(themeLabels) as ThemeSetting[];

const numberColorSchemeLabels: Record<NumberColorScheme, string> = {
	color: "Color",
	monochrome: "Monochrome",
};
const numberColorSchemeOptions = Object.keys(
	numberColorSchemeLabels,
) as NumberColorScheme[];

export const SettingsPanel = ({
	onDifficultyChange,
	open,
	onClose,
}: {
	onDifficultyChange: (difficulty: Difficulty) => void;
	open: boolean;
	onClose: () => void;
}) => {
	const {
		settings,
		updateEmptyCellDisplay,
		updateInputStyle,
		updateNumberColorScheme,
		updatePlayMode,
		updateSymbolSet,
		updateTheme,
	} = useSettings();

	return open ? (
		<ModalPanel label="Settings" onClose={onClose} open={open} title="Settings">
			<fieldset className="segmented settings-control">
				<legend>Theme</legend>
				{themeOptions.map((option) => (
					<button
						className={option === settings.theme ? "active" : ""}
						key={option}
						onClick={() => updateTheme(option)}
						type="button"
					>
						{option === "light" && <Sun size={14} />}
						{option === "dark" && <Moon size={14} />}
						{option === "auto" && <SunMoon size={14} />}
						{themeLabels[option]}
					</button>
				))}
			</fieldset>
			<fieldset className="segmented settings-control">
				<legend>Difficulty</legend>
				{difficultyOptions.map((option) => (
					<button
						className={option === settings.difficulty ? "active" : ""}
						key={option}
						onClick={() => onDifficultyChange(option)}
						type="button"
					>
						{difficultyLabels[option]}
					</button>
				))}
			</fieldset>
			<fieldset className="segmented settings-control">
				<legend>Play mode</legend>
				{playModeOptions.map((option) => (
					<button
						className={option === settings.playMode ? "active" : ""}
						key={option}
						onClick={() => updatePlayMode(option)}
						type="button"
					>
						{option === "timer" && <Timer size={14} />}
						{option === "zen" && <TimerOff size={14} />}
						{playModeLabels[option]}
					</button>
				))}
			</fieldset>
			<fieldset className="segmented settings-control">
				<legend>Input style</legend>
				{inputStyleOptions.map((option) => (
					<button
						className={option === settings.inputStyle ? "active" : ""}
						key={option}
						onClick={() => updateInputStyle(option)}
						type="button"
					>
						{option === "single" && <Locate size={14} />}
						{option === "flow" && <LocateFixed size={14} />}
						{inputStyleLabels[option]}
					</button>
				))}
			</fieldset>
			<fieldset className="segmented settings-control">
				<legend>Symbols</legend>
				{symbolSetOptions.map((option) => (
					<button
						className={option === settings.symbolSet ? "active" : ""}
						key={option}
						onClick={() => updateSymbolSet(option)}
						type="button"
					>
						{symbolSetLabels[option]}
					</button>
				))}
			</fieldset>
			<fieldset className="segmented settings-control">
				<legend>Board numbers</legend>
				{numberColorSchemeOptions.map((option) => (
					<button
						className={option === settings.numberColorScheme ? "active" : ""}
						key={option}
						onClick={() => updateNumberColorScheme(option)}
						type="button"
					>
						{numberColorSchemeLabels[option]}
					</button>
				))}
			</fieldset>
			<fieldset className="segmented settings-control">
				<legend>Empty cells</legend>
				{emptyCellDisplayOptions.map((option) => (
					<button
						className={option === settings.emptyCellDisplay ? "active" : ""}
						key={option}
						onClick={() => updateEmptyCellDisplay(option)}
						type="button"
					>
						{option === "clean" && <Grid3X3 size={14} />}
						{option === "dots" && <CircleDot size={14} />}
						{emptyCellDisplayLabels[option]}
					</button>
				))}
			</fieldset>
			<div className="settings-footer">
				<a
					href="https://github.com/mgiberts/sudoku"
					rel="noreferrer"
					target="_blank"
				>
					GitHub
				</a>
			</div>
		</ModalPanel>
	) : null;
};

export { difficultyLabels, difficultyOptions };
