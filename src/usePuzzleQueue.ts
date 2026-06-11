import { useCallback, useEffect, useRef, useState } from "react";
import type { SudokuGameDataV1 } from "./gameData";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
	WorkerDifficulty,
} from "./puzzleWorkerMessages";
import { sudokuStorage } from "./storage";

const NORMAL_DIFFICULTIES: WorkerDifficulty[] = [
	"easy",
	"medium",
	"hard",
	"master",
];
const QUEUE_TARGET = 1;
const MIN_WORKER_STATUS_MS = 4800;

export const usePuzzleQueue = () => {
	const [isWorking, setIsWorking] = useState(false);
	const statusStartedAtRef = useRef(0);
	const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const workerRef = useRef<Worker | null>(null);
	const queuesRef = useRef<Record<WorkerDifficulty, SudokuGameDataV1[]>>({
		easy: sudokuStorage.loadGeneratedGameCache("easy"),
		medium: sudokuStorage.loadGeneratedGameCache("medium"),
		hard: sudokuStorage.loadGeneratedGameCache("hard"),
		master: sudokuStorage.loadGeneratedGameCache("master"),
	});
	const waitersRef = useRef<
		Record<WorkerDifficulty, Array<(game: SudokuGameDataV1 | null) => void>>
	>({
		easy: [],
		medium: [],
		hard: [],
		master: [],
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
			if (pendingRef.current.has(difficulty)) {
				return;
			}

			const worker = workerRef.current;

			if (!worker) {
				return;
			}

			pendingRef.current.add(difficulty);
			updateWorkingState();
			worker.postMessage({
				type: "generate",
				requestId: createRequestId(),
				difficulty,
			} satisfies PuzzleWorkerRequest);
		},
		[updateWorkingState],
	);

	const fillQueue = useCallback(
		(difficulty: WorkerDifficulty) => {
			if (
				queuesRef.current[difficulty].length >= QUEUE_TARGET ||
				pendingRef.current.has(difficulty)
			) {
				return;
			}

			requestGeneration(difficulty);
		},
		[requestGeneration],
	);

	const warmQueue = useCallback(
		(difficulties: readonly WorkerDifficulty[] = NORMAL_DIFFICULTIES) => {
			for (const difficulty of difficulties) {
				fillQueue(difficulty);
			}
		},
		[fillQueue],
	);

	const consumeQueuedGame = useCallback(
		(difficulty: WorkerDifficulty): SudokuGameDataV1 | null => {
			const game = queuesRef.current[difficulty].shift() ?? null;
			sudokuStorage.saveGeneratedGameCache(
				difficulty,
				queuesRef.current[difficulty],
				QUEUE_TARGET,
			);
			fillQueue(difficulty);
			return game;
		},
		[fillQueue],
	);

	const requestQueuedGame = useCallback(
		(difficulty: WorkerDifficulty): Promise<SudokuGameDataV1 | null> => {
			const queuedGame = queuesRef.current[difficulty].shift() ?? null;

			if (queuedGame) {
				sudokuStorage.saveGeneratedGameCache(
					difficulty,
					queuesRef.current[difficulty],
					QUEUE_TARGET,
				);
				fillQueue(difficulty);
				return Promise.resolve(queuedGame);
			}

			if (!workerRef.current) {
				return Promise.resolve(null);
			}

			return new Promise((resolve) => {
				waitersRef.current[difficulty].push(resolve);
				requestGeneration(difficulty);
			});
		},
		[fillQueue, requestGeneration],
	);

	useEffect(() => {
		if (typeof Worker === "undefined") {
			return;
		}

		const worker = new Worker(new URL("./puzzleWorker.ts", import.meta.url), {
			type: "module",
		});
		workerRef.current = worker;

		worker.onmessage = (event: MessageEvent<PuzzleWorkerResponse>) => {
			const message = event.data;

			if (message.type === "generated") {
				pendingRef.current.delete(message.difficulty);
				updateWorkingState();
				const waiter = waitersRef.current[message.difficulty].shift();

				if (waiter) {
					waiter(message.game);
				} else {
					queuesRef.current[message.difficulty] = [
						...queuesRef.current[message.difficulty],
						message.game,
					].slice(0, QUEUE_TARGET);
					sudokuStorage.saveGeneratedGameCache(
						message.difficulty,
						queuesRef.current[message.difficulty],
						QUEUE_TARGET,
					);
				}

				fillQueue(message.difficulty);
				return;
			}

			if (message.type === "timeout" || message.type === "error") {
				if (message.difficulty) {
					pendingRef.current.delete(message.difficulty);
					updateWorkingState();
					resolveWaiters(message.difficulty, null);
				}
			}
		};

		warmQueue();

		return () => {
			worker.terminate();
			workerRef.current = null;
			pendingRef.current.clear();
			if (statusTimerRef.current) {
				clearTimeout(statusTimerRef.current);
			}
			statusStartedAtRef.current = 0;
			statusTimerRef.current = null;
			for (const difficulty of NORMAL_DIFFICULTIES) {
				resolveWaiters(difficulty, null);
			}
		};
	}, [fillQueue, resolveWaiters, updateWorkingState, warmQueue]);

	return {
		consumeQueuedGame,
		isWorking,
		requestQueuedGame,
		warmQueue,
	};
};

const createRequestId = (): string => {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
