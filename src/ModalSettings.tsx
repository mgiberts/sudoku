import { Moon, Sun, SunMoon, X } from "lucide-react";
import { useSettings } from "./SettingsContext";
import { symbolSetLabels, symbolSetOptions } from "./symbolSets";
import type { Difficulty, NumberColorScheme, ThemeSetting } from "./types";

const difficultyLabels: Record<Difficulty, string> = {
	easy: "Easy",
	medium: "Medium",
	hard: "Hard",
};
const difficultyOptions = Object.keys(difficultyLabels) as Difficulty[];

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

export const ModalSettings = ({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) => {
	const {
		settings,
		updateDifficulty,
		updateNumberColorScheme,
		updateSymbolSet,
		updateTheme,
	} = useSettings();

	return open ? (
		<div className="settings-layer">
			<button
				aria-label="Close settings"
				className="settings-backdrop"
				onClick={onClose}
				type="button"
			/>
			<section className="settings-panel" aria-label="Settings">
				<div className="settings-header">
					<h2>Settings</h2>
					<button
						className="icon-button compact"
						onClick={onClose}
						title="Close settings"
						type="button"
					>
						<X size={18} />
					</button>
				</div>
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
							onClick={() => updateDifficulty(option)}
							type="button"
						>
							{difficultyLabels[option]}
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
				<div className="settings-footer">
					<a
						href="https://github.com/mgiberts/sudoku"
						rel="noreferrer"
						target="_blank"
					>
						GitHub
					</a>
				</div>
			</section>
		</div>
	) : null;
};

export { difficultyLabels };
