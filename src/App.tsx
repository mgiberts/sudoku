import {
	Brain,
	LoaderCircle,
	Pause,
	Play,
	RotateCcw,
	Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BestTimesPanel } from "./BestTimesPanel";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { formatDuration } from "./formatDuration";
import { GameDialog } from "./GameDialog";
import { selectCuratedExpertGame, selectStarterGame } from "./gameCatalog";
import { getElapsedSeconds, hasPlayerProgress } from "./gameState";
import { Header } from "./Header";
import { Keypad } from "./Keypad";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { difficultyLabels, SettingsPanel } from "./SettingsPanel";
import { SudokuProvider, useGame } from "./SudokuContext";
import { BEST_TIME_ERROR_LIMITS, sudokuStorage } from "./storage";
import type { BestTimes, Difficulty } from "./types";
import { usePuzzleQueue } from "./usePuzzleQueue";

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
	const { consumeQueuedGame, isWorking, requestQueuedGame, warmQueue } =
		usePuzzleQueue();
	const loadingRequestRef = useRef<symbol | null>(null);
	const [bestTimes, setBestTimes] = useState<BestTimes>(() =>
		sudokuStorage.loadBestTimes(),
	);
	const [bestTimesOpen, setBestTimesOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
	const [expertWelcomeOpen, setExpertWelcomeOpen] = useState(false);
	const [loadingDifficulty, setLoadingDifficulty] = useState<Difficulty | null>(
		null,
	);
	const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(
		null,
	);
	const { completedAt, difficulty, elapsedBeforePause, errors, startedAt } =
		state;

	useEffect(() => {
		if (!completedAt) {
			return;
		}

		const elapsedSeconds = Math.max(
			0,
			Math.floor(
				(elapsedBeforePause + Math.max(0, completedAt - startedAt)) / 1000,
			),
		);
		setBestTimes(
			sudokuStorage.recordBestTime(difficulty, {
				seconds: elapsedSeconds,
				errors,
			}),
		);
	}, [completedAt, difficulty, elapsedBeforePause, errors, startedAt]);

	useEffect(() => {
		if (settings.difficulty !== "expert") {
			warmQueue([settings.difficulty]);
		}
	}, [settings.difficulty, warmQueue]);

	const startNewDifficulty = (
		difficulty: Difficulty,
		options: { showExpertWelcome?: boolean } = {},
	) => {
		updateDifficulty(difficulty);
		startNewGame(difficulty);

		if (difficulty === "expert" && options.showExpertWelcome) {
			setExpertWelcomeOpen(true);
		}
	};

	const startNewGame = async (difficulty: Difficulty) => {
		if (loadingRequestRef.current) {
			return;
		}

		const game =
			difficulty === "expert"
				? selectCuratedExpertGame()
				: (consumeQueuedGame(difficulty) ?? selectStarterGame(difficulty));

		if (game) {
			dispatch({ type: "new-game-data", game });
			return;
		}

		if (difficulty === "expert") {
			dispatch({ type: "new-game", difficulty });
			return;
		}

		const requestId = Symbol("loading-puzzle");
		loadingRequestRef.current = requestId;
		setLoadingDifficulty(difficulty);

		const queuedGame = await requestQueuedGame(difficulty);

		if (loadingRequestRef.current !== requestId) {
			return;
		}

		if (queuedGame) {
			dispatch({ type: "new-game-data", game: queuedGame });
		} else {
			dispatch({ type: "new-game", difficulty });
		}

		loadingRequestRef.current = null;
		setLoadingDifficulty(null);
	};

	const requestDifficultyChange = (difficulty: Difficulty) => {
		if (difficulty === settings.difficulty) {
			return;
		}

		if (hasPlayerProgress(state)) {
			setPendingDifficulty(difficulty);
			return;
		}

		startNewDifficulty(difficulty, {
			showExpertWelcome: difficulty === "expert",
		});
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
					workerActive={isWorking}
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

			<PauseDialog />
			<CompletionDialog
				open={!!state.completedAt}
				errors={state.errors}
				onNewPuzzle={() => startNewGame(state.difficulty)}
			/>
			<ResetConfirmationDialog
				open={resetConfirmOpen}
				onCancel={() => setResetConfirmOpen(false)}
				onConfirm={() => {
					startNewGame(state.difficulty);
					setResetConfirmOpen(false);
				}}
			/>
			<ExpertWelcomeDialog
				open={expertWelcomeOpen}
				onStart={() => {
					setExpertWelcomeOpen(false);
					setSettingsOpen(false);
				}}
			/>
			<LoadingPuzzleDialog difficulty={loadingDifficulty} />

			{pendingDifficulty ? (
				<DifficultyChangeDialog
					open={!!pendingDifficulty}
					difficulty={pendingDifficulty}
					onCancel={() => setPendingDifficulty(null)}
					onConfirm={() => {
						startNewDifficulty(pendingDifficulty, {
							showExpertWelcome: pendingDifficulty === "expert",
						});
						setPendingDifficulty(null);
						setSettingsOpen(false);
					}}
				/>
			) : null}
		</main>
	);
};

const LoadingPuzzleDialog = ({
	difficulty,
}: {
	difficulty: Difficulty | null;
}) => {
	return (
		<GameDialog
			open={difficulty !== null}
			actions={null}
			icon={<LoaderCircle className="spin-icon" size={32} />}
			label="Preparing puzzle"
			message={
				difficulty
					? `Generating a unique ${difficultyLabels[difficulty]} puzzle.`
					: ""
			}
			title="Preparing puzzle"
		/>
	);
};

const CompletionDialog = ({
	errors,
	onNewPuzzle,
	open,
}: {
	errors: number;
	onNewPuzzle: () => void;
	open?: boolean;
}) => {
	const { state } = useGame();
	const elapsedSeconds = state.completedAt
		? getElapsedSeconds(state, state.completedAt)
		: 0;
	const isOverBestTimeLimit =
		errors >= BEST_TIME_ERROR_LIMITS[state.difficulty];

	return (
		<GameDialog
			open={open}
			actions={
				<button className="primary-action" onClick={onNewPuzzle} type="button">
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

const ExpertWelcomeDialog = ({
	onStart,
	open,
}: {
	onStart: () => void;
	open?: boolean;
}) => {
	return (
		<GameDialog
			open={open}
			actions={
				<button className="primary-action" onClick={onStart} type="button">
					<Play size={18} />
					Start
				</button>
			}
			icon={<Brain size={32} />}
			label="Curated Sudoku"
			message="Welcome to curated Expert Sudoku. Expert puzzles are carefully pre-generated and verified to have a unique solution."
			title="Expert Sudoku"
		/>
	);
};

const PauseDialog = () => {
	const { dispatch, state } = useGame();

	return (
		<GameDialog
			open={state.pausedAt !== null}
			actions={
				<button
					className="primary-action"
					onClick={() => dispatch({ type: "resume" })}
					type="button"
				>
					<Play size={18} />
					Resume
				</button>
			}
			icon={<Pause size={32} />}
			label="Game paused"
			message="Game is paused. Resume when you are ready."
			title="Paused"
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
