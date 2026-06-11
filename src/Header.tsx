import { Bubbles, Settings, Star } from "lucide-react";
import { ElapsedTime } from "./ElapsedTime";
import { useSettings } from "./SettingsContext";
import { difficultyLabels } from "./SettingsPanel";
import { Stat } from "./Stat";
import { useGame } from "./SudokuContext";

const settingsIcon = <Settings size={19} />;
const bestTimesIcon = <Star size={19} />;
const workerIcon = <Bubbles size={18} />;

export const Header = ({
	bestTimesOpen,
	onBestTimesToggle,
	onSettingsToggle,
	settingsOpen,
	workerActive,
}: {
	bestTimesOpen: boolean;
	onBestTimesToggle: () => void;
	onReset: () => void;
	onSettingsToggle: () => void;
	settingsOpen: boolean;
	workerActive?: boolean;
}) => {
	const { state } = useGame();
	const {
		settings: { playMode, symbolSet },
	} = useSettings();
	const gameName = symbolSet === "kanji" ? "数独" : "Sudoku";

	return (
		<>
			<header className="grid9 top-bar">
				<div className="title-group">
					<p className="eyebrow">{difficultyLabels[state.difficulty]}</p>
					<h1>{gameName}</h1>
				</div>
				<div className="app-settings">
					{workerActive ? (
						<span
							aria-label="Generating puzzle"
							className="worker-status"
							role="status"
							title="Generating puzzle"
						>
							{workerIcon}
						</span>
					) : null}
					<button
						className={`icon-button settings-button ${
							bestTimesOpen ? "active" : ""
						}`}
						onClick={onBestTimesToggle}
						title="Best times"
						type="button"
					>
						{bestTimesIcon}
					</button>
					<button
						className={`icon-button settings-button ${
							settingsOpen ? "active" : ""
						}`}
						onClick={onSettingsToggle}
						title="Settings"
						type="button"
					>
						{settingsIcon}
					</button>
				</div>
			</header>

			{playMode === "timer" ? (
				<div className="grid game-stats">
					<ElapsedTime />
					<Stat label="Errors" value={String(state.errors)} />
				</div>
			) : null}
		</>
	);
};
