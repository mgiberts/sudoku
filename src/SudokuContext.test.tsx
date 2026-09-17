import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import {
	createInitialGameForDifficulty,
	SudokuProvider,
	useGame,
} from "./SudokuContext";
import { sudokuStorage } from "./storage";

const wrapper = ({ children }: { children: ReactNode }) => (
	<SudokuProvider>{children}</SudokuProvider>
);

describe("Sudoku context initial game", () => {
	afterEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it.each([
		"easy",
		"medium",
		"hard",
		"master",
		"expert",
	] as const)("uses reviewed starter data for %s first-load games", (difficulty) => {
		const state = createInitialGameForDifficulty(difficulty);
		const starterPuzzles = starterPuzzlesByDifficulty[difficulty].map((game) =>
			game.puzzle.join(","),
		);

		expect(starterPuzzles).toContain(
			state.cells.map((cell) => cell.value).join(","),
		);
	});
});

describe("automatic pause", () => {
	afterEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it.each([
		"blur",
		"visibilitychange",
		"pagehide",
	] as const)("pauses and saves immediately on %s", (eventName) => {
		const game = createInitialGameForDifficulty("easy");
		sudokuStorage.saveGame({ ...game, startedAt: 1_000 });
		vi.spyOn(Date, "now").mockReturnValue(11_000);
		const { result, unmount } = renderHook(() => useGame(), { wrapper });
		if (eventName === "visibilitychange") {
			vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
		}
		let persistedAtEvent: number | null | undefined;
		act(() => {
			if (eventName === "visibilitychange")
				document.dispatchEvent(new Event(eventName));
			else window.dispatchEvent(new Event(eventName));
			persistedAtEvent = sudokuStorage.loadGame()?.pausedAt;
		});
		expect(persistedAtEvent).toBe(11_000);
		expect(result.current.state.pausedAt).toBe(11_000);
		expect(result.current.state.elapsedBeforePause).toBe(10_000);
		expect(sudokuStorage.loadGame()?.pausedAt).toBe(11_000);
		unmount();
	});

	it("pauses an unfinished game that mounts in a hidden tab", () => {
		const game = createInitialGameForDifficulty("easy");
		sudokuStorage.saveGame(game);
		vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
		const { result, unmount } = renderHook(() => useGame(), { wrapper });
		expect(result.current.state.pausedAt).not.toBeNull();
		unmount();
	});

	it("keeps the first pause time across repeated focus events and reload", () => {
		const game = createInitialGameForDifficulty("easy");
		sudokuStorage.saveGame({ ...game, startedAt: 1_000 });
		const now = vi.spyOn(Date, "now").mockReturnValue(11_000);
		const first = renderHook(() => useGame(), { wrapper });
		act(() => window.dispatchEvent(new Event("blur")));
		now.mockReturnValue(21_000);
		act(() => window.dispatchEvent(new Event("pagehide")));
		expect(first.result.current.state.pausedAt).toBe(11_000);
		first.unmount();
		const second = renderHook(() => useGame(), { wrapper });
		expect(second.result.current.state.pausedAt).toBe(11_000);
		second.unmount();
	});

	it("leaves completed games unchanged", () => {
		const game = createInitialGameForDifficulty("easy");
		sudokuStorage.saveGame({ ...game, completedAt: Date.now() });
		const { result, unmount } = renderHook(() => useGame(), { wrapper });
		act(() => window.dispatchEvent(new Event("blur")));
		expect(result.current.state.pausedAt).toBeNull();
		unmount();
	});

	it("keeps a manual pause when the page loses focus", () => {
		const game = createInitialGameForDifficulty("easy");
		sudokuStorage.saveGame({ ...game, pausedAt: 1_000 });
		const { result, unmount } = renderHook(() => useGame(), { wrapper });
		act(() => window.dispatchEvent(new Event("blur")));
		expect(result.current.state.pausedAt).toBe(1_000);
		expect(sudokuStorage.loadGame()?.pausedAt).toBe(1_000);
		unmount();
	});
});
