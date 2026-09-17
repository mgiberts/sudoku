import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { SudokuGameDataV1 } from "./gameData";
import { curatedExpertGames } from "./generated/curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { newSample } from "./generationMetrics";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
} from "./puzzleWorkerMessages";
import type { Difficulty } from "./types";
import { usePuzzleQueue } from "./usePuzzleQueue";

class FakeWorker {
	static current: FakeWorker;
	static instances: FakeWorker[] = [];
	onmessage: ((event: { data: PuzzleWorkerResponse }) => void) | null = null;
	onerror: (() => void) | null = null;
	requests: PuzzleWorkerRequest[] = [];
	terminate = vi.fn();
	constructor() {
		FakeWorker.current = this;
		FakeWorker.instances.push(this);
	}
	postMessage(request: PuzzleWorkerRequest) {
		this.requests.push(request);
	}
}
beforeEach(() => {
	localStorage.clear();
	FakeWorker.instances = [];
	vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
it("delivers a rated worker result to a waiting request and refills", async () => {
	const { result, unmount } = renderHook(() => usePuzzleQueue("master"));
	const worker = FakeWorker.current;
	let pending: Promise<unknown> = Promise.resolve();
	act(() => {
		for (let i = 0; i < 3; i++)
			expect(result.current.consumeQueuedGame("master")).not.toBeNull();
		pending = result.current.requestQueuedGame("master");
	});
	const game = starterPuzzlesByDifficulty.master[0];
	act(() => {
		worker.onmessage?.({
			data: {
				type: "generated",
				requestId: "test",
				difficulty: "master",
				game,
				metrics: {
					...newSample("master", "browser-worker", "greedy"),
					accepted: true,
				},
			},
		});
	});
	expect(await pending).toEqual(game);
	expect(
		worker.requests.filter(
			(r) => r.type === "generate" && r.difficulty === "master",
		),
	).toHaveLength(2);
	unmount();
});
it("restarts a failed worker and retries a waiting request", async () => {
	vi.useFakeTimers();
	const { result, unmount } = renderHook(() => usePuzzleQueue("hard"));
	let pending: Promise<unknown> = Promise.resolve();
	act(() => {
		for (let i = 0; i < 3; i++) result.current.consumeQueuedGame("hard");
		pending = result.current.requestQueuedGame("hard");
	});
	const firstWorker = FakeWorker.current;
	act(() => FakeWorker.current.onerror?.());
	expect(firstWorker.terminate).toHaveBeenCalled();
	expect(FakeWorker.instances).toHaveLength(2);
	act(() => vi.advanceTimersByTime(1_000));
	const retry = FakeWorker.current;
	const request = retry.requests.find((item) => item.type === "generate");
	if (request?.type !== "generate") throw new Error("Expected retry");
	const game = starterPuzzlesByDifficulty.hard[0];
	act(() =>
		retry.onmessage?.({
			data: {
				type: "generated",
				requestId: request.requestId,
				difficulty: "hard",
				game,
				metrics: {
					...newSample("hard", "browser-worker", "greedy"),
					accepted: true,
				},
			},
		}),
	);
	expect(await pending).toEqual(game);
	unmount();
});

it.each([
	"easy",
	"medium",
	"hard",
	"master",
	"expert",
] as const)("starts %s from three prepared starters and refills a consumed slot", (difficulty) => {
	const { result, unmount } = renderHook(() => usePuzzleQueue(difficulty));
	const worker = FakeWorker.current;
	expect(worker.requests).toHaveLength(0);
	const games: Array<SudokuGameDataV1 | null> = [];
	act(() => {
		for (let i = 0; i < 3; i++)
			games.push(result.current.consumeQueuedGame(difficulty));
	});
	expect(games.every(Boolean)).toBe(true);
	expect(new Set(games.map((game) => game?.id)).size).toBe(3);
	expect(games.every((game) => game?.source === "starter")).toBe(true);
	expect(games.map((game) => game?.id).sort()).toEqual(
		starterPuzzlesByDifficulty[difficulty].map((game) => game.id).sort(),
	);
	expect(
		worker.requests.filter(
			(request) =>
				request.type === "generate" && request.difficulty === difficulty,
		),
	).toHaveLength(1);
	expect(result.current.consumeQueuedGame(difficulty)).toBeNull();
	unmount();
});

it("keeps an exhausted Expert request waiting through the hard stop", async () => {
	vi.useFakeTimers();
	const { result, unmount } = renderHook(() => usePuzzleQueue("expert"));
	act(() => {
		for (let i = 0; i < 3; i++) result.current.consumeQueuedGame("expert");
	});
	const firstWorker = FakeWorker.current;
	let waiting: Promise<unknown> = Promise.resolve();
	act(() => {
		waiting = result.current.requestQueuedGame("expert");
	});
	act(() => vi.advanceTimersByTime(17_000));
	expect(firstWorker.terminate).toHaveBeenCalled();
	expect(FakeWorker.instances).toHaveLength(2);
	act(() => vi.advanceTimersByTime(1_000));
	const retry = FakeWorker.current;
	const request = retry.requests.find((item) => item.type === "generate");
	if (request?.type !== "generate") throw new Error("Expected Expert retry");
	const game = curatedExpertGames[0];
	act(() =>
		retry.onmessage?.({
			data: {
				type: "generated",
				requestId: request.requestId,
				difficulty: "expert",
				game,
				metrics: {
					...newSample("expert", "browser-worker", "greedy"),
					accepted: true,
				},
			},
		}),
	);
	expect(await waiting).toMatchObject({ difficulty: "expert" });
	unmount();
});

it.each([
	"easy",
	"medium",
	"hard",
	"master",
	"expert",
] as const)("does not restore %s starters after the queue is exhausted", (difficulty) => {
	const first = renderHook(() => usePuzzleQueue(difficulty));
	act(() => {
		for (let i = 0; i < 3; i++) {
			expect(first.result.current.consumeQueuedGame(difficulty)).not.toBeNull();
		}
	});
	first.unmount();
	const second = renderHook(() => usePuzzleQueue(difficulty));
	expect(second.result.current.consumeQueuedGame(difficulty)).toBeNull();
	second.unmount();
});

it("keeps an Expert waiter when switching from another difficulty", async () => {
	const { result, rerender, unmount } = renderHook(
		({ difficulty }) => usePuzzleQueue(difficulty),
		{ initialProps: { difficulty: "easy" as Difficulty } },
	);
	act(() => {
		for (let i = 0; i < 3; i++) result.current.consumeQueuedGame("expert");
	});
	let waiting: Promise<unknown> = Promise.resolve();
	act(() => {
		waiting = result.current.requestQueuedGame("expert");
	});
	rerender({ difficulty: "expert" });
	const worker = FakeWorker.current;
	const request = worker.requests.find(
		(item) => item.type === "generate" && item.difficulty === "expert",
	);
	if (request?.type !== "generate") throw new Error("Expected Expert request");
	const game = curatedExpertGames[0];
	act(() =>
		worker.onmessage?.({
			data: {
				type: "generated",
				requestId: request.requestId,
				difficulty: "expert",
				game,
				metrics: {
					...newSample("expert", "browser-worker", "greedy"),
					accepted: true,
				},
			},
		}),
	);
	expect(await waiting).toEqual(game);
	unmount();
});
