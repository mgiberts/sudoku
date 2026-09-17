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
import type { SudokuGameDataV1 } from "./gameData";
import { getElapsedSeconds, hasPlayerProgress } from "./gameState";
import { Header } from "./Header";
import { Keypad } from "./Keypad";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { difficultyLabels, SettingsPanel } from "./SettingsPanel";
import { SudokuProvider, useGame } from "./SudokuContext";
import {
	BEST_TIME_ERROR_LIMITS,
	isNewBestTime,
	sudokuStorage,
} from "./storage";
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
	const {
		consumeQueuedGame,
		isWorking,
		requestQueuedGame,
		reserveQueuedGame,
		restoreQueuedGame,
	} = usePuzzleQueue(settings.difficulty);
	const [generationError, setGenerationError] = useState<string | null>(null);
	const loadingRequestRef = useRef<symbol | null>(null);
	const [bestTimes, setBestTimes] = useState<BestTimes>(() =>
		sudokuStorage.loadBestTimes(),
	);
	const [highScoreFinish, setHighScoreFinish] = useState<{
		key: string;
		isHighScore: boolean;
	} | null>(null);
	const scoredCompletionRef = useRef<string | null>(null);
	const [bestTimesOpen, setBestTimesOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
	const reservedResetGameRef = useRef<SudokuGameDataV1 | null>(null);
	const resetPrefetchGameKeyRef = useRef<string | null>(null);
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
		const completionKey = `${difficulty}:${startedAt}:${completedAt}`;
		if (scoredCompletionRef.current === completionKey) return;
		scoredCompletionRef.current = completionKey;

		const elapsedSeconds = Math.max(
			0,
			Math.floor(
				(elapsedBeforePause + Math.max(0, completedAt - startedAt)) / 1000,
			),
		);
		const score = { seconds: elapsedSeconds, errors };
		const previous = sudokuStorage.loadBestTimes()[difficulty];
		setHighScoreFinish({
			key: completionKey,
			isHighScore: isNewBestTime(difficulty, score, previous),
		});
		setBestTimes(sudokuStorage.recordBestTime(difficulty, score));
	}, [completedAt, difficulty, elapsedBeforePause, errors, startedAt]);

	const startNewDifficulty = (difficulty: Difficulty) => {
		updateDifficulty(difficulty);
		startNewGame(difficulty);
		setSettingsOpen(false);
	};

	const startNewGame = async (
		difficulty: Difficulty,
		reservedGame: SudokuGameDataV1 | null = null,
	) => {
		if (loadingRequestRef.current) {
			return;
		}

		setGenerationError(null);
		const game = reservedGame ?? consumeQueuedGame(difficulty);

		if (game) {
			sudokuStorage.recordRecentGameId(difficulty, game.id, 12);
			dispatch({ type: "new-game-data", game });
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
			sudokuStorage.recordRecentGameId(difficulty, queuedGame.id, 12);
			dispatch({ type: "new-game-data", game: queuedGame });
		} else {
			setGenerationError(
				`No validated ${difficultyLabels[difficulty]} puzzle is available. Please try again later.`,
			);
		}

		loadingRequestRef.current = null;
		setLoadingDifficulty(null);
	};

	const openResetConfirmation = () => {
		if (resetConfirmOpen || loadingRequestRef.current) return;
		const gameKey = `${state.difficulty}:${state.seed}:${state.startedAt}`;
		if (resetPrefetchGameKeyRef.current !== gameKey) {
			resetPrefetchGameKeyRef.current = gameKey;
			reservedResetGameRef.current = reserveQueuedGame(state.difficulty);
		}
		setResetConfirmOpen(true);
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
			{generationError && <p role="alert">{generationError}</p>}
			<section className="game-stage" aria-label="Sudoku game">
				<Header
					bestTimesOpen={bestTimesOpen}
					onBestTimesToggle={() => setBestTimesOpen((open) => !open)}
					onReset={openResetConfirmation}
					onSettingsToggle={() => setSettingsOpen((open) => !open)}
					settingsOpen={settingsOpen}
					workerActive={isWorking}
				/>
				<Controls
					onReset={openResetConfirmation}
					resetDisabled={loadingDifficulty !== null}
				/>

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
				isHighScore={
					highScoreFinish?.key ===
						`${state.difficulty}:${state.startedAt}:${state.completedAt}` &&
					highScoreFinish.isHighScore
				}
				newPuzzleDisabled={loadingDifficulty !== null}
				onNewPuzzle={() => startNewGame(state.difficulty)}
			/>
			<ResetConfirmationDialog
				open={resetConfirmOpen}
				onCancel={() => {
					if (reservedResetGameRef.current) {
						restoreQueuedGame(state.difficulty, reservedResetGameRef.current);
						reservedResetGameRef.current = null;
					}
					setResetConfirmOpen(false);
				}}
				onConfirm={() => {
					const reservedGame = reservedResetGameRef.current;
					reservedResetGameRef.current = null;
					startNewGame(state.difficulty, reservedGame);
					setResetConfirmOpen(false);
				}}
			/>
			<LoadingPuzzleDialog difficulty={loadingDifficulty} />

			{pendingDifficulty ? (
				<DifficultyChangeDialog
					open={!!pendingDifficulty}
					difficulty={pendingDifficulty}
					onCancel={() => setPendingDifficulty(null)}
					onConfirm={() => {
						startNewDifficulty(pendingDifficulty);
						setPendingDifficulty(null);
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
			message={difficulty ? "The game board is updating. Please wait." : ""}
			title="Updating game board"
		/>
	);
};

export const CompletionDialog = ({
	errors,
	isHighScore,
	newPuzzleDisabled,
	onNewPuzzle,
	open,
}: {
	errors: number;
	isHighScore: boolean;
	newPuzzleDisabled: boolean;
	onNewPuzzle: () => void;
	open?: boolean;
}) => {
	const { state } = useGame();
	const {
		settings: { playMode },
	} = useSettings();
	const elapsedSeconds = state.completedAt
		? getElapsedSeconds(state, state.completedAt)
		: 0;
	const duration = formatDuration(elapsedSeconds);
	const difficultyLabel = difficultyLabels[state.difficulty];
	const difficultyArticle = difficultyLabel === "Easy" ? "an" : "a";
	const isOverBestTimeLimit =
		errors >= BEST_TIME_ERROR_LIMITS[state.difficulty];
	const isPerfectExpert = state.difficulty === "expert" && errors === 0;

	return (
		<GameDialog
			open={open}
			actions={
				<button
					className="primary-action"
					disabled={newPuzzleDisabled}
					onClick={onNewPuzzle}
					type="button"
				>
					<Play size={18} />
					New puzzle
				</button>
			}
			icon={isPerfectExpert ? <Brain size={32} /> : <Sparkles size={32} />}
			label={isPerfectExpert ? "Expert puzzle complete" : "Puzzle complete"}
			message={
				<>
					{isPerfectExpert ? (
						<>You solved an Expert puzzle in {duration} with 0 errors.</>
					) : playMode === "zen" ? (
						<>Finished in {duration}.</>
					) : (
						<>
							Finished {difficultyArticle} {difficultyLabel} puzzle in{" "}
							{duration} with{" "}
							<span
								className={isOverBestTimeLimit ? "score-errors over-limit" : ""}
							>
								{errors} {errors === 1 ? "error" : "errors"}
							</span>
						</>
					)}
					{isHighScore && (
						<span className="completion-high-score">New best time!</span>
					)}
				</>
			}
			title={isPerfectExpert ? "Expert mastery" : "Complete"}
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
