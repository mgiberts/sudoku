import { beforeEach, expect, it } from "vitest";
import { validateGameDataV1 } from "./gameData";
import { createInitialGame } from "./gameState";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { sudokuStorage } from "./storage";

beforeEach(() => localStorage.clear());
it("drops unversioned advanced caches and retains current qualified entries", () => {
	const game = starterPuzzlesByDifficulty.master[0];
	sudokuStorage.saveGeneratedGameCache("master", [
		{ ...game, rating: undefined },
	]);
	expect(sudokuStorage.loadGeneratedGameCache("master")).toEqual([]);
	sudokuStorage.saveGeneratedGameCache("master", [game]);
	expect(sudokuStorage.consumeGeneratedGameCache("master")?.id).toBe(game.id);
	expect(sudokuStorage.loadGeneratedGameCache("master")).toEqual([]);
});
it("blocks unvalidated generation for every difficulty", () => {
	expect(() => createInitialGame("easy")).toThrow("validated game data");
	expect(() => createInitialGame("medium")).toThrow("validated game data");
	expect(() => createInitialGame("hard")).toThrow("validated game data");
	expect(() => createInitialGame("master")).toThrow("validated game data");
	expect(() => createInitialGame("expert")).toThrow("validated game data");
});
it("recomputes difficulty instead of trusting a forged Expert label", () => {
	const game = starterPuzzlesByDifficulty.hard[0];
	if (!game.rating) throw new Error("Expected rated fixture");
	const forged = {
		...game,
		rating: { ...game.rating, tier: "expert" as const },
	};
	// Structural validity remains the same: metadata cannot promote the puzzle.
	expect(validateGameDataV1(forged, { requireUnique: true })).toContain(
		"Rating metadata does not match recomputed difficulty",
	);
	expect(forged.difficulty).toBe("hard");
});
