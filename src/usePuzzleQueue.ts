import { useCallback, useEffect, useRef, useState } from "react";
import { difficultyPolicy, GENERATION_DEADLINE_MS } from "./difficultyPolicy";
import type { SudokuGameDataV1 } from "./gameData";
import { hasCurrentAssessment } from "./gameData";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { recordGeneration, recordGenerationEvent } from "./generationMetrics";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
	WorkerDifficulty,
} from "./puzzleWorkerMessages";
import { sudokuStorage } from "./storage";
import type { Difficulty } from "./types";

const DIFFICULTIES: WorkerDifficulty[] = [
	"easy",
	"medium",
	"hard",
	"master",
	"expert",
];
const queueTarget = (difficulty: WorkerDifficulty) =>
	difficultyPolicy.levels[difficulty].cacheCapacity;
const MIN_WORKER_STATUS_MS = 4800;
const WORKER_HARD_STOP_MS = GENERATION_DEADLINE_MS + 2_000;
const RETRY_DELAY_MS = 1_000;
const LEGACY_EXPERT_RESERVE_KEY = "sudoku.expert.reserve.initialized.v1";

const loadStarterQueue = (difficulty: WorkerDifficulty): SudokuGameDataV1[] => {
	const saved = sudokuStorage.loadGeneratedGameCache(difficulty);
	const initializedKey = `sudoku.${difficulty}.starters.initialized.v1`;
	if (
		localStorage.getItem(initializedKey) ||
		(difficulty === "expert" && localStorage.getItem(LEGACY_EXPERT_RESERVE_KEY))
	)
		return saved;
	const seen = new Set([
		...sudokuStorage.loadRecentGameIds(difficulty),
		...saved.map((game) => game.id),
	]);
	const games = [
		...saved,
		...starterPuzzlesByDifficulty[difficulty].filter(
			(game) => hasCurrentAssessment(game) && !seen.has(game.id),
		),
	].slice(0, queueTarget(difficulty));
	sudokuStorage.saveGeneratedGameCache(
		difficulty,
		games,
		queueTarget(difficulty),
	);
	localStorage.setItem(initializedKey, "1");
	return games;
};

const loadQueues = (): Record<WorkerDifficulty, SudokuGameDataV1[]> =>
	Object.fromEntries(
		DIFFICULTIES.map((difficulty) => [
			difficulty,
			loadStarterQueue(difficulty),
		]),
	) as Record<WorkerDifficulty, SudokuGameDataV1[]>;

export const usePuzzleQueue = (activeDifficulty: Difficulty = "easy") => {
	const [isWorking, setIsWorking] = useState(false);
	const statusStartedAtRef = useRef(0);
	const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const workerRef = useRef<Worker | null>(null);
	const workerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const workerHardStopRef = useRef<(() => void) | null>(null);
	const [initialQueues] = useState(loadQueues);
	const queuesRef = useRef(initialQueues);
	const waitersRef = useRef<
		Record<WorkerDifficulty, Array<(game: SudokuGameDataV1 | null) => void>>
	>({
		easy: [],
		medium: [],
		hard: [],
		master: [],
		expert: [],
	});
	const pendingRef = useRef<Set<WorkerDifficulty>>(new Set());

	const updateWorkingState = useCallback(() => {
		if (pendingRef.current.size > 0) {
			if (statusTimerRef.current) {
				clearTimeout(statusTimerRef.current);
				statusTimerRef.current = null;
			}

			if (statusStartedAtRef.current === 0) {
				statusStartedAtRef.current = performance.now();
			}

			setIsWorking(true);
			return;
		}

		if (statusStartedAtRef.current === 0) {
			setIsWorking(false);
			return;
		}

		const elapsed = performance.now() - statusStartedAtRef.current;
		const delay = Math.max(0, MIN_WORKER_STATUS_MS - elapsed);

		if (statusTimerRef.current) {
			clearTimeout(statusTimerRef.current);
		}

		statusTimerRef.current = setTimeout(() => {
			statusStartedAtRef.current = 0;
			statusTimerRef.current = null;
			setIsWorking(false);
		}, delay);
	}, []);

	const resolveWaiters = useCallback(
		(difficulty: WorkerDifficulty, game: SudokuGameDataV1 | null) => {
			const waiters = waitersRef.current[difficulty];
			waitersRef.current[difficulty] = [];

			for (const waiter of waiters) {
				waiter(game);
			}
		},
		[],
	);

	const requestGeneration = useCallback(
		(difficulty: WorkerDifficulty) => {
			if (difficulty !== activeDifficulty) return;
			if (pendingRef.current.has(difficulty)) {
				return;
			}

			const worker = workerRef.current;

			if (!worker) {
				return;
			}

			pendingRef.current.add(difficulty);
			updateWorkingState();
			const requestId = createRequestId();
			workerTimerRef.current = setTimeout(() => {
				workerHardStopRef.current?.();
			}, WORKER_HARD_STOP_MS);
			worker.postMessage({
				type: "generate",
				requestId,
				difficulty,
			} satisfies PuzzleWorkerRequest);
		},
		[activeDifficulty, updateWorkingState],
	);

	const fillQueue = useCallback(
		(difficulty: WorkerDifficulty) => {
			if (
				queuesRef.current[difficulty].length >= queueTarget(difficulty) ||
				pendingRef.current.has(difficulty)
			) {
				return;
			}

			requestGeneration(difficulty);
		},
		[requestGeneration],
	);

	const takeQueuedGame = useCallback(
		(
			difficulty: WorkerDifficulty,
			recordCacheEvent: boolean,
		): SudokuGameDataV1 | null => {
			const game = queuesRef.current[difficulty].shift() ?? null;
			if (recordCacheEvent)
				recordGenerationEvent(difficulty, game ? "cache-hit" : "cache-miss");
			sudokuStorage.saveGeneratedGameCache(
				difficulty,
				queuesRef.current[difficulty],
				queueTarget(difficulty),
			);
			fillQueue(difficulty);
			return game;
		},
		[fillQueue],
	);

	const consumeQueuedGame = useCallback(
		(difficulty: WorkerDifficulty) => takeQueuedGame(difficulty, true),
		[takeQueuedGame],
	);
	const reserveQueuedGame = useCallback(
		(difficulty: WorkerDifficulty) => takeQueuedGame(difficulty, false),
		[takeQueuedGame],
	);

	const restoreQueuedGame = useCallback(
		(difficulty: WorkerDifficulty, game: SudokuGameDataV1) => {
			queuesRef.current[difficulty] = [
				game,
				...queuesRef.current[difficulty].filter(
					(queued) => queued.id !== game.id,
				),
			].slice(0, queueTarget(difficulty));
			sudokuStorage.saveGeneratedGameCache(
				difficulty,
				queuesRef.current[difficulty],
				queueTarget(difficulty),
			);
		},
		[],
	);

	const requestQueuedGame = useCallback(
		(difficulty: WorkerDifficulty): Promise<SudokuGameDataV1 | null> => {
			const queuedGame = queuesRef.current[difficulty].shift() ?? null;
			recordGenerationEvent(
				difficulty,
				queuedGame ? "cache-hit" : "cache-miss",
			);

			if (queuedGame) {
				sudokuStorage.saveGeneratedGameCache(
					difficulty,
					queuesRef.current[difficulty],
					queueTarget(difficulty),
				);
				fillQueue(difficulty);
				return Promise.resolve(queuedGame);
			}

			if (!workerRef.current) {
				return Promise.resolve(null);
			}

			return new Promise((resolve) => {
				const started = performance.now();
				recordGenerationEvent(difficulty, "wait-count");
				waitersRef.current[difficulty].push((game) => {
					recordGenerationEvent(
						difficulty,
						"wait-ms",
						performance.now() - started,
					);
					resolve(game);
				});
				requestGeneration(difficulty);
			});
		},
		[fillQueue, requestGeneration],
	);

	useEffect(() => {
		if (typeof Worker === "undefined") {
			return;
		}
		let disposed = false;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;
		const clearWorkerTimer = () => {
			if (workerTimerRef.current) clearTimeout(workerTimerRef.current);
			workerTimerRef.current = null;
		};
		const retryGeneration = () => {
			if (
				disposed ||
				document.visibilityState === "hidden" ||
				waitersRef.current[activeDifficulty].length === 0
			)
				return;
			if (retryTimer) clearTimeout(retryTimer);
			retryTimer = setTimeout(() => {
				retryTimer = null;
				fillQueue(activeDifficulty);
			}, RETRY_DELAY_MS);
		};
		const createWorker = () => {
			const worker = new Worker(new URL("./puzzleWorker.ts", import.meta.url), {
				type: "module",
			});
			workerRef.current = worker;
			worker.onmessage = (event: MessageEvent<PuzzleWorkerResponse>) => {
				if (workerRef.current !== worker) return;
				const message = event.data;
				if ("metrics" in message) recordGeneration(message.metrics);
				clearWorkerTimer();

				if (message.type === "generated") {
					pendingRef.current.delete(message.difficulty);
					updateWorkingState();
					const waiter = waitersRef.current[message.difficulty].shift();
					if (waiter) waiter(message.game);
					else {
						queuesRef.current[message.difficulty] = [
							...queuesRef.current[message.difficulty],
							message.game,
						].slice(0, queueTarget(message.difficulty));
						sudokuStorage.saveGeneratedGameCache(
							message.difficulty,
							queuesRef.current[message.difficulty],
							queueTarget(message.difficulty),
						);
					}
					fillQueue(message.difficulty);
					return;
				}

				if (message.difficulty) {
					pendingRef.current.delete(message.difficulty);
					updateWorkingState();
					retryGeneration();
				}
			};
			worker.onerror = () => {
				if (workerRef.current !== worker) return;
				worker.terminate();
				workerRef.current = null;
				clearWorkerTimer();
				for (const difficulty of pendingRef.current) {
					recordGenerationEvent(difficulty, "worker-error");
				}
				pendingRef.current.clear();
				updateWorkingState();
				if (!disposed) {
					createWorker();
					retryGeneration();
				}
			};
		};
		createWorker();
		workerHardStopRef.current = () => {
			workerRef.current?.terminate();
			workerRef.current = null;
			clearWorkerTimer();
			recordGenerationEvent(activeDifficulty, "hard-stop");
			pendingRef.current.delete(activeDifficulty);
			updateWorkingState();
			if (!disposed) {
				createWorker();
				retryGeneration();
			}
		};
		fillQueue(activeDifficulty);
		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				if (retryTimer) clearTimeout(retryTimer);
				retryTimer = null;
				workerRef.current?.terminate();
				workerRef.current = null;
				clearWorkerTimer();
				pendingRef.current.delete(activeDifficulty);
				updateWorkingState();
			} else if (!workerRef.current) {
				createWorker();
				fillQueue(activeDifficulty);
			}
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			disposed = true;
			document.removeEventListener("visibilitychange", onVisibilityChange);
			if (retryTimer) clearTimeout(retryTimer);
			clearWorkerTimer();
			workerHardStopRef.current = null;
			workerRef.current?.terminate();
			workerRef.current = null;
			pendingRef.current.clear();
			setIsWorking(false);
			if (statusTimerRef.current) {
				clearTimeout(statusTimerRef.current);
			}
			statusStartedAtRef.current = 0;
			statusTimerRef.current = null;
			resolveWaiters(activeDifficulty, null);
		};
	}, [activeDifficulty, fillQueue, resolveWaiters, updateWorkingState]);

	return {
		consumeQueuedGame,
		isWorking,
		requestQueuedGame,
		reserveQueuedGame,
		restoreQueuedGame,
	};
};

const createRequestId = (): string => {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
