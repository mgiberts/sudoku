import { hasCurrentAssessment, type SudokuGameDataV1 } from "./gameData";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { recordGenerationEvent } from "./generationMetrics";
import { sudokuStorage } from "./storage";
import type { Difficulty } from "./types";

const RECENT_STARTER_LIMIT = 12;
export const selectStarterGame = (
	difficulty: Difficulty,
): SudokuGameDataV1 | null => {
	const cachedGame = sudokuStorage.consumeGeneratedGameCache(difficulty);

	if (cachedGame) {
		sudokuStorage.recordRecentGameId(
			difficulty,
			cachedGame.id,
			RECENT_STARTER_LIMIT,
		);
		return cachedGame;
	}

	const starterGame = pickGameAvoidingRecent(
		starterPuzzlesByDifficulty[difficulty].filter(hasCurrentAssessment),
		sudokuStorage.loadRecentGameIds(difficulty),
	);

	if (starterGame) {
		recordGenerationEvent(difficulty, "starter-fallback");
		sudokuStorage.recordRecentGameId(
			difficulty,
			starterGame.id,
			RECENT_STARTER_LIMIT,
		);
	}

	return starterGame;
};

export const pickGameAvoidingRecent = (
	games: readonly SudokuGameDataV1[],
	recentIds: readonly string[],
	random: () => number = Math.random,
): SudokuGameDataV1 | null => {
	if (games.length === 0) {
		return null;
	}

	const recent = new Set(recentIds);
	const freshGames = games.filter((game) => !recent.has(game.id));
	const pool = freshGames.length > 0 ? freshGames : games;
	const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));

	return pool[index] ?? null;
};
