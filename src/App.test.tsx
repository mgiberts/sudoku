import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { App, CompletionDialog } from "./App";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { newSample } from "./generationMetrics";
import type {
	PuzzleWorkerRequest,
	PuzzleWorkerResponse,
} from "./puzzleWorkerMessages";
import { SettingsProvider } from "./SettingsContext";
import {
	createInitialGameForDifficulty,
	SudokuProvider,
} from "./SudokuContext";
import { sudokuStorage } from "./storage";
import type { Difficulty } from "./types";

const renderCompletion = (
	difficulty: Difficulty,
	errors: number,
	isHighScore: boolean,
) => {
	const game = createInitialGameForDifficulty(difficulty);
	sudokuStorage.saveGame({
		...game,
		errors,
		startedAt: 1_000,
		completedAt: 901_000,
		elapsedBeforePause: 0,
	});
	return render(
		<SudokuProvider>
			<SettingsProvider>
				<CompletionDialog
					errors={errors}
					isHighScore={isHighScore}
					newPuzzleDisabled={false}
					onNewPuzzle={() => {}}
					open
				/>
			</SettingsProvider>
		</SudokuProvider>,
	);
};

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

it("starts at most one speculative refill while reset is canceled on the same board", () => {
	class FakeWorker {
		static current: FakeWorker;
		onmessage: ((event: { data: PuzzleWorkerResponse }) => void) | null = null;
		requests: PuzzleWorkerRequest[] = [];
		constructor() {
			FakeWorker.current = this;
		}
		postMessage(request: PuzzleWorkerRequest) {
			this.requests.push(request);
		}
		terminate() {}
	}
	localStorage.clear();
	vi.stubGlobal("Worker", FakeWorker);
	render(<App />);
	const worker = FakeWorker.current;
	const initialRequest = worker.requests[0];
	if (!initialRequest) throw new Error("Expected initial refill");
	act(() => {
		worker.onmessage?.({
			data: {
				type: "generated",
				requestId: initialRequest.requestId,
				difficulty: "easy",
				game: starterPuzzlesByDifficulty.easy[0],
				metrics: {
					...newSample("easy", "browser-worker", "greedy"),
					accepted: true,
				},
			},
		});
	});
	const queuedBeforeReset = sudokuStorage.loadGeneratedGameCache("easy")[0]?.id;
	fireEvent.click(screen.getByTitle("Reset"));
	expect(worker.requests).toHaveLength(2);
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(sudokuStorage.loadGeneratedGameCache("easy")[0]?.id).toBe(
		queuedBeforeReset,
	);
	const resetRequest = worker.requests[1];
	act(() => {
		worker.onmessage?.({
			data: {
				type: "generated",
				requestId: resetRequest.requestId,
				difficulty: "easy",
				game: starterPuzzlesByDifficulty.easy[1],
				metrics: {
					...newSample("easy", "browser-worker", "greedy"),
					accepted: true,
				},
			},
		});
	});
	fireEvent.click(screen.getByTitle("Reset"));
	expect(worker.requests).toHaveLength(2);
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
});

it("shows the Brain and custom copy for a zero-error Expert finish", () => {
	renderCompletion("expert", 0, true);
	const dialog = screen.getByRole("dialog", { name: "Expert puzzle complete" });
	expect(dialog.querySelector(".lucide-brain")).not.toBeNull();
	expect(screen.getByText(/You solved an Expert puzzle/)).toBeTruthy();
	expect(screen.getByText("New best time!")).toBeTruthy();
});

it("keeps the standard completion for Expert with errors", () => {
	renderCompletion("expert", 1, false);
	const dialog = screen.getByRole("dialog", { name: "Puzzle complete" });
	expect(dialog.querySelector(".lucide-sparkles")).not.toBeNull();
	expect(screen.getByText(/Finished an? Expert puzzle/)).toBeTruthy();
	expect(screen.queryByText("New best time!")).toBeNull();
});

it("adds high-score text to the standard completion", () => {
	renderCompletion("hard", 0, true);
	expect(screen.getByRole("dialog", { name: "Puzzle complete" })).toBeTruthy();
	expect(screen.getByText("New best time!")).toBeTruthy();
});

it("announces a newly recorded best time only for the completion that earned it", async () => {
	const game = createInitialGameForDifficulty("hard");
	sudokuStorage.saveGame({
		...game,
		errors: 0,
		startedAt: 1_000,
		completedAt: 901_000,
		elapsedBeforePause: 0,
	});
	const first = render(<App />);
	expect(await screen.findByText("New best time!")).toBeTruthy();
	first.unmount();
	render(<App />);
	await waitFor(() => expect(screen.queryByText("New best time!")).toBeNull());
});
