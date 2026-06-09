import { Play, RotateCcw, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Board } from "./Board";
import { formatDuration } from "./formatDuration";
import { Header } from "./Header";
import { ModalSettings } from "./ModalSettings";
import { SettingsProvider } from "./SettingsContext";
import { SudokuProvider, useGame } from "./SudokuContext";

export const App = () => {
	return (
		<SudokuProvider>
			<SettingsProvider>
				<SudokuApp />
			</SettingsProvider>
		</SudokuProvider>
	);
};

const SudokuApp = () => {
	const { state, dispatch } = useGame();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

	return (
		<main className="app-shell">
			<section className="game-stage" aria-label="Sudoku game">
				<Header
					onReset={() => setResetConfirmOpen(true)}
					onSettingsToggle={() => setSettingsOpen((open) => !open)}
					settingsOpen={settingsOpen}
				/>

				<Board />
			</section>

			<ModalSettings
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
			/>

			{state.completedAt ? <CompletionDialog errors={state.errors} /> : null}

			{resetConfirmOpen ? (
				<ResetConfirmationDialog
					onCancel={() => setResetConfirmOpen(false)}
					onConfirm={() => {
						dispatch({ type: "new-game", difficulty: state.difficulty });
						setResetConfirmOpen(false);
					}}
				/>
			) : null}
		</main>
	);
};

const CompletionDialog = ({ errors }: { errors: number }) => {
	const { state, dispatch } = useGame();
	const elapsedSeconds = state.completedAt
		? Math.max(0, Math.floor((state.completedAt - state.startedAt) / 1000))
		: 0;

	return (
		<GameDialog
			actions={
				<button
					className="primary-action"
					onClick={() =>
						dispatch({ type: "new-game", difficulty: state.difficulty })
					}
					type="button"
				>
					<Play size={18} />
					New puzzle
				</button>
			}
			icon={<Sparkles size={32} />}
			label="Puzzle complete"
			message={`${formatDuration(elapsedSeconds)} with ${errors} ${
				errors === 1 ? "error" : "errors"
			}`}
			title="Complete"
		/>
	);
};

const ResetConfirmationDialog = ({
	onCancel,
	onConfirm,
}: {
	onCancel: () => void;
	onConfirm: () => void;
}) => {
	return (
		<GameDialog
			actions={
				<>
					<button className="secondary-action" onClick={onCancel} type="button">
						Cancel
					</button>
					<button className="primary-action" onClick={onConfirm} type="button">
						<RotateCcw size={18} />
						Reset
					</button>
				</>
			}
			icon={<RotateCcw size={32} />}
			label="Reset puzzle confirmation"
			message="This discards the current puzzle and starts a fresh one at the same difficulty."
			title="Reset puzzle?"
		/>
	);
};

const GameDialog = ({
	actions,
	icon,
	label,
	message,
	title,
}: {
	actions: ReactNode;
	icon: ReactNode;
	label: string;
	message: string;
	title: string;
}) => {
	return (
		<div className="dialog-backdrop" role="presentation">
			<section
				className="dialog"
				role="dialog"
				aria-modal="true"
				aria-label={label}
			>
				{icon}
				<h2>{title}</h2>
				<p>{message}</p>
				<div className="dialog-actions">{actions}</div>
			</section>
		</div>
	);
};
