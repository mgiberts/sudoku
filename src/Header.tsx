import { Eraser, PenLine, RotateCcw, Settings, Star } from "lucide-react";
import { ElapsedTime } from "./ElapsedTime";
import { difficultyLabels } from "./ModalSettings";
import { useSettings } from "./SettingsContext";
import { Stat } from "./Stat";
import { useGame } from "./SudokuContext";

const settingsIcon = <Settings size={19} />;
const bestTimesIcon = <Star size={19} />;
const pencilIcon = <PenLine size={19} />;
const eraserIcon = <Eraser size={19} />;
const resetIcon = <RotateCcw size={19} />;

export const Header = ({
	bestTimesOpen,
	onBestTimesToggle,
	onReset,
	onSettingsToggle,
	settingsOpen,
}: {
	bestTimesOpen: boolean;
	onBestTimesToggle: () => void;
	onReset: () => void;
	onSettingsToggle: () => void;
	settingsOpen: boolean;
}) => {
	const { state, dispatch } = useGame();
	const {
		settings: { symbolSet },
	} = useSettings();
	const gameName = symbolSet === "kanji" ? "数独" : "Sudoku";

	return (
		<>
			<header className="top-bar">
				<div className="title-group">
					<p className="eyebrow">{difficultyLabels[state.difficulty]}</p>
					<h1>{gameName}</h1>
				</div>
				<div className="app-settings">
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

			<div className="sub-bar stats">
				<ElapsedTime />
				<Stat label="Errors" value={String(state.errors)} />
			</div>

			<div className="controls-row">
				<button
					aria-pressed={state.pencilMode}
					className={`icon-button ${state.pencilMode ? "active" : ""}`}
					onClick={() => dispatch({ type: "toggle-pencil" })}
					title="Pencil mode"
					type="button"
				>
					{pencilIcon}
				</button>
				<button
					className="icon-button"
					onClick={() => dispatch({ type: "erase" })}
					title="Erase"
					type="button"
				>
					{eraserIcon}
				</button>
				<button
					className="icon-button"
					onClick={onReset}
					title="Reset"
					type="button"
				>
					{resetIcon}
				</button>
			</div>
		</>
	);
};
