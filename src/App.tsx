import { Play, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BestTimesPanel } from "./BestTimesPanel";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { formatDuration } from "./formatDuration";
import { GameDialog } from "./GameDialog";
import { hasPlayerProgress } from "./gameState";
import { Header } from "./Header";
import { Keypad } from "./Keypad";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { difficultyLabels, SettingsPanel } from "./SettingsPanel";
import { SudokuProvider, useGame } from "./SudokuContext";
import { BEST_TIME_ERROR_LIMITS, sudokuStorage } from "./storage";
import type { BestTimes, Difficulty } from "./types";

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
	const { settings, updateDifficulty } = useSettings();
	const [bestTimes, setBestTimes] = useState<BestTimes>(() =>
		sudokuStorage.loadBestTimes(),
	);
	const [bestTimesOpen, setBestTimesOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
	const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(
		null,
	);

	useEffect(() => {
		if (!state.completedAt) {
			return;
		}

		const elapsedSeconds = Math.max(
			0,
			Math.floor((state.completedAt - state.startedAt) / 1000),
		);
		setBestTimes(
			sudokuStorage.recordBestTime(state.difficulty, {
				seconds: elapsedSeconds,
				errors: state.errors,
			}),
		);
	}, [state.completedAt, state.difficulty, state.errors, state.startedAt]);

	const startNewDifficulty = (difficulty: Difficulty) => {
		updateDifficulty(difficulty);
		dispatch({ type: "new-game", difficulty });
	};

	const requestDifficultyChange = (difficulty: Difficulty) => {
		if (difficulty === settings.difficulty) {
			return;
		}

		if (hasPlayerProgress(state)) {
			setPendingDifficulty(difficulty);
			return;
		}

		startNewDifficulty(difficulty);
	};

	return (
		<main className="app-shell">
			<section className="game-stage" aria-label="Sudoku game">
				<Header
					bestTimesOpen={bestTimesOpen}
					onBestTimesToggle={() => setBestTimesOpen((open) => !open)}
					onReset={() => setResetConfirmOpen(true)}
					onSettingsToggle={() => setSettingsOpen((open) => !open)}
					settingsOpen={settingsOpen}
				/>
				<Controls onReset={() => setResetConfirmOpen(true)} />

				<Board />
				<Keypad />
			</section>

			<SettingsPanel
				onDifficultyChange={requestDifficultyChange}
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
			/>
			<BestTimesPanel
				bestTimes={bestTimes}
				onClose={() => setBestTimesOpen(false)}
				onReset={() => {
					sudokuStorage.removeStats();
					setBestTimes({});
				}}
				open={bestTimesOpen}
			/>

			<CompletionDialog open={!!state.completedAt} errors={state.errors} />
			<ResetConfirmationDialog
				open={resetConfirmOpen}
				onCancel={() => setResetConfirmOpen(false)}
				onConfirm={() => {
					dispatch({ type: "new-game", difficulty: state.difficulty });
					setResetConfirmOpen(false);
				}}
			/>

			{pendingDifficulty ? (
				<DifficultyChangeDialog
					open={!!pendingDifficulty}
					difficulty={pendingDifficulty}
					onCancel={() => setPendingDifficulty(null)}
					onConfirm={() => {
						startNewDifficulty(pendingDifficulty);
						setPendingDifficulty(null);
						setSettingsOpen(false);
					}}
				/>
			) : null}
		</main>
	);
};

const CompletionDialog = ({
	errors,
	open,
}: {
	errors: number;
	open?: boolean;
}) => {
	const { state, dispatch } = useGame();
	const elapsedSeconds = state.completedAt
		? Math.max(0, Math.floor((state.completedAt - state.startedAt) / 1000))
		: 0;
	const isOverBestTimeLimit =
		errors >= BEST_TIME_ERROR_LIMITS[state.difficulty];

	return (
		<GameDialog
			open={open}
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
			message={
				<>
					{formatDuration(elapsedSeconds)} with{" "}
					<span
						className={isOverBestTimeLimit ? "score-errors over-limit" : ""}
					>
						{errors} {errors === 1 ? "error" : "errors"}
					</span>
				</>
			}
			title="Complete"
		/>
	);
};

const ResetConfirmationDialog = ({
	onCancel,
	onConfirm,
	open,
}: {
	onCancel: () => void;
	onConfirm: () => void;
	open?: boolean;
}) => {
	return (
		<GameDialog
			open={open}
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

const DifficultyChangeDialog = ({
	difficulty,
	onCancel,
	onConfirm,
	open,
}: {
	difficulty: Difficulty;
	onCancel: () => void;
	onConfirm: () => void;
	open?: boolean;
}) => {
	return (
		<GameDialog
			open={open}
			actions={
				<>
					<button className="secondary-action" onClick={onCancel} type="button">
						Cancel
					</button>
					<button className="primary-action" onClick={onConfirm} type="button">
						<Play size={18} />
						New puzzle
					</button>
				</>
			}
			icon={<Play size={32} />}
			label="Difficulty change confirmation"
			message={`This discards the current puzzle and starts a ${difficultyLabels[difficulty]} puzzle.`}
			title="Change difficulty?"
		/>
	);
};
