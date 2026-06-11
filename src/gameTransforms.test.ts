import { describe, expect, it } from "vitest";
import {
	compactStringToBoard,
	createGameDataV1,
	validateGameDataV1,
} from "./gameData";
import { transformGameDataV1 } from "./gameTransforms";
import { solveUniqueBoard } from "./sudoku";

describe("game transforms", () => {
	it("preserves validity and uniqueness", () => {
		const puzzle = compactStringToBoard(
			"000000010400000000020000000000050407008000300001090000300400200050100000000806000",
		);
		const solution = solveUniqueBoard(puzzle);

		if (!solution) {
			throw new Error("Expected fixture to have a unique solution");
		}

		const game = createGameDataV1({
			difficulty: "expert",
			puzzle,
			solution,
			source: "curated",
		});
		const transformed = transformGameDataV1(game, 12345);

		expect(transformed.id).not.toBe(game.id);
		expect(transformed.clues).toBe(game.clues);
		expect(validateGameDataV1(transformed, { requireUnique: true })).toEqual(
			[],
		);
	});
});
