import {
	Eraser,
	Locate,
	LocateFixed,
	Pause,
	PenLine,
	// Play,
	RotateCcw,
	Undo,
} from "lucide-react";
import { useMemo } from "react";
import { useSettings } from "./SettingsContext";
import { useGame } from "./SudokuContext";

const pencilIcon = <PenLine size={19} />;
const eraserIcon = <Eraser size={19} />;
const resetIcon = <RotateCcw size={19} />;
// TODO: Implement Undo functionality
const undoIcon = <Undo size={19} />;
// TODO: Implement Play/Pause functionality
// const playIcon = <Play size={19} />;
const pauseIcon = <Pause size={19} />;
const locateIcon = <Locate size={19} />;
const locateFixedIcon = <LocateFixed size={19} />;

export const Controls = ({ onReset }: { onReset: () => void }) => {
	const { state, dispatch } = useGame();
	const { settings, updateInputStyle } = useSettings();

	const inputStyle = useMemo(() => {
		return settings.inputStyle;
	}, [settings.inputStyle]);
	const isFlow = inputStyle === "flow";

	return (
		<div className="grid controls-row">
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
				className={`icon-button ${isFlow ? "active" : ""}`}
				title={`Switch to ${isFlow ? "single" : "flow"} input mode`}
				type="button"
				onClick={() => updateInputStyle(isFlow ? "single" : "flow")}
			>
				{isFlow ? locateFixedIcon : locateIcon}
			</button>
			<button className="icon-button" title="Undo" type="button">
				{undoIcon}
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
			<button className="icon-button" title="Resume" type="button">
				{pauseIcon}
			</button>
		</div>
	);
};
