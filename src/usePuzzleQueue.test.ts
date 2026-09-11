import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { newSample } from "./generationMetrics";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
} from "./puzzleWorkerMessages";
import { usePuzzleQueue } from "./usePuzzleQueue";

class FakeWorker {
	static current: FakeWorker;
	onmessage: ((event: { data: PuzzleWorkerResponse }) => void) | null = null;
	onerror: (() => void) | null = null;
	requests: PuzzleWorkerRequest[] = [];
	terminate = vi.fn();
	constructor() {
		FakeWorker.current = this;
	}
	postMessage(request: PuzzleWorkerRequest) {
		this.requests.push(request);
	}
}
beforeEach(() => {
	localStorage.clear();
	vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => vi.unstubAllGlobals());
it("delivers a rated worker result to a waiting request and refills", async () => {
	const { result, unmount } = renderHook(() => usePuzzleQueue());
	const worker = FakeWorker.current;
	let pending: Promise<unknown> = Promise.resolve();
	act(() => {
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
it("resolves waiters on worker failure and does not submit to a dead worker", async () => {
	const { result, unmount } = renderHook(() => usePuzzleQueue());
	let pending: Promise<unknown> = Promise.resolve();
	act(() => {
		pending = result.current.requestQueuedGame("hard");
	});
	act(() => FakeWorker.current.onerror?.());
	expect(await pending).toBeNull();
	expect(await result.current.requestQueuedGame("master")).toBeNull();
	expect(FakeWorker.current.terminate).toHaveBeenCalled();
	unmount();
});
