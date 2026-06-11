import { describe, expect, it } from "vitest";
import { pickGameAvoidingRecent } from "./gameCatalog";
import type { SudokuGameDataV1 } from "./gameData";

const createCatalogGame = (id: string): SudokuGameDataV1 =>
	({ id }) as SudokuGameDataV1;

describe("game catalog", () => {
	it("prefers games outside recent expert history", () => {
		const selected = pickGameAvoidingRecent(
			[createCatalogGame("recent"), createCatalogGame("fresh")],
			["recent"],
			() => 0,
		);

		expect(selected?.id).toBe("fresh");
	});

	it("prefers games outside recent starter history", () => {
		const selected = pickGameAvoidingRecent(
			[
				createCatalogGame("recent-a"),
				createCatalogGame("recent-b"),
				createCatalogGame("fresh"),
			],
			["recent-a", "recent-b"],
			() => 0,
		);

		expect(selected?.id).toBe("fresh");
	});

	it("falls back to all games when every expert game is recent", () => {
		const selected = pickGameAvoidingRecent(
			[createCatalogGame("a"), createCatalogGame("b")],
			["a", "b"],
			() => 0.99,
		);

		expect(selected?.id).toBe("b");
	});

	it("returns null when no curated expert games exist", () => {
		expect(pickGameAvoidingRecent([], [])).toBeNull();
	});
});
