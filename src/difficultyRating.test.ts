import { describe, expect, it } from "vitest";
import {
	candidateMasks,
	findDeduction,
	matchesDifficulty,
	peers,
	rateDifficulty,
	solveLogically,
	units,
} from "./difficultyRating";
import { curatedExpertGames } from "./generated/curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "./generated/starterPuzzles";
import { getSolutionCount, hasUniqueSolutionWithin } from "./sudoku";
import type { Board } from "./types";

const mask = (...ds: number[]) => ds.reduce((a, d) => a | (1 << d), 0);
describe("logical rating", () => {
	it("distinguishes singles completion, cancellation, and unsupported puzzles", () => {
		const board = [...curatedExpertGames[0].solution] as Board;
		board[0] = null;
		expect(rateDifficulty(board).tier).toBe("singles");
		expect(rateDifficulty(board)).toEqual(rateDifficulty(board));
		expect(rateDifficulty([]).status).toBe("invalid");
		expect(matchesDifficulty("expert", rateDifficulty(board))).toBe(false);
		expect(rateDifficulty(board, () => true).status).toBe("budget");
		expect(rateDifficulty(Array(81).fill(null)).tier).toBe("unrated");
	});
	it("finds locked candidates without removing their supporting candidates", () => {
		const m = Array(81).fill(1022);
		for (const c of [9, 10, 11, 18, 19, 20]) m[c] &= ~(1 << 1);
		const step = findDeduction(m, "hard");
		expect(step?.technique).toBe("Locked candidates");
		expect(step?.removed).toEqual(
			[3, 4, 5, 6, 7, 8].map((cell) => ({ cell, digit: 1 })),
		);
		expect(findDeduction(Array(81).fill(1022), "expert")).toBeNull();
	});
	it("finds a naked pair and does not treat a three-digit union as a pair", () => {
		const m = Array(81).fill(1022);
		m[0] = mask(1, 2);
		m[1] = mask(1, 2);
		expect(findDeduction(m, "hard")?.technique).toBe("Naked subset 2");
		m[1] = mask(1, 3);
		expect(findDeduction(m, "hard")).toBeNull();
	});
	// Keep CI bounded as catalogs grow; exhaustive checks run via validate:games:expert.
	it("replays one trace per difficulty against its stored solution", () => {
		for (const game of [
			curatedExpertGames[0],
			...Object.values(starterPuzzlesByDifficulty).flatMap((games) =>
				games.slice(0, 1),
			),
		]) {
			const rating = rateDifficulty(game.puzzle);
			const m = candidateMasks(game.puzzle);
			for (const step of rating.trace) {
				if (step.chain) {
					expect(step.chain.at(-1)).toBe(step.chain[0] - 1);
					for (let i = 1; i < step.chain.length; i++) {
						const a = step.chain[i - 1],
							b = step.chain[i];
						const ac = Math.floor(a / 18),
							bc = Math.floor(b / 18);
						const ad = (Math.floor(a / 2) % 9) + 1,
							bd = (Math.floor(b / 2) % 9) + 1;
						expect(a % 2).not.toBe(b % 2);
						if (a % 2)
							expect(
								ac === bc ? ad !== bd : ad === bd && peers[ac].includes(bc),
							).toBe(true);
						else
							expect(
								ac === bc
									? m[ac] === ((1 << ad) | (1 << bd))
									: ad === bd &&
											units.some(
												(u) =>
													u.includes(ac) &&
													u.includes(bc) &&
													u.filter((c) => m[c] & (1 << ad)).length === 2,
											),
							).toBe(true);
					}
				}
				if (step.placed) {
					const { cell, digit } = step.placed;
					expect(digit, `${game.id}: ${step.technique}`).toBe(
						game.solution[cell],
					);
					expect(m[cell] & (1 << digit)).not.toBe(0);
					m[cell] = 0;
					for (const p of peers[cell]) m[p] &= ~(1 << digit);
				}
				for (const { cell, digit } of step.removed) {
					expect(digit, `${game.id}: ${step.technique}`).not.toBe(
						game.solution[cell],
					);
					expect(m[cell] & (1 << digit)).not.toBe(0);
					m[cell] &= ~(1 << digit);
				}
				if (step.chain) expect(step.chain.length - 1).toBeLessThanOrEqual(12);
			}
			if (["hard", "master", "expert"].includes(game.difficulty)) {
				expect(rating.tier, game.id).toBe(game.difficulty);
				const lower =
					game.difficulty === "hard"
						? "singles"
						: game.difficulty === "master"
							? "hard"
							: "master";
				expect(solveLogically(game.puzzle, lower).status).toBe("stalled");
			}
		}
	});
	it("does not certify a search interrupted after its first solution", () => {
		const board = Array(81).fill(null);
		let calls = 0;
		expect(hasUniqueSolutionWithin(board, () => ++calls >= 165)).toBe(false);
		expect(getSolutionCount(board)).toBe(2);
	});
});

it("recognizes subsets, fish and wings in isolated candidate fixtures", () => {
	for (const n of [2, 3, 4]) {
		const cells = [0, 3, 6, 8].slice(0, n),
			digits = [1, 2, 3, 4].slice(0, n);
		const naked = Array(81).fill(1022),
			hidden = Array(81).fill(1022);
		for (const c of cells) naked[c] = mask(...digits);
		for (let c = 0; c < 9; c++)
			if (!cells.includes(c)) hidden[c] &= ~mask(...digits);
		expect(findDeduction(naked, "master")?.technique).toBe(`Naked subset ${n}`);
		expect(findDeduction(hidden, "master")?.technique).toBe(
			`Hidden subset ${n}`,
		);
	}
	for (const n of [2, 3]) {
		const m = Array(81).fill(1022);
		for (const r of [0, 3, 6].slice(0, n))
			for (let c = 0; c < 9; c++)
				if (![1, 4, 7].slice(0, n).includes(c)) m[r * 9 + c] &= ~(1 << 1);
		const step = findDeduction(m, "master");
		expect(step?.technique).toBe(n === 2 ? "X-Wing" : "Swordfish");
		expect(
			step?.removed.every(
				(x) =>
					x.digit === 1 &&
					![0, 3, 6].slice(0, n).includes(Math.floor(x.cell / 9)),
			),
		).toBe(true);
	}
	const xy = Array(81).fill(1022);
	xy[0] = mask(1, 2);
	xy[4] = mask(1, 3);
	xy[36] = mask(2, 3);
	expect(findDeduction(xy, "master")?.technique).toBe("XY-Wing");
	expect(findDeduction(xy, "master")?.removed).toEqual([
		{ cell: 40, digit: 3 },
	]);
	const xyz = Array(81).fill(1022);
	xyz[0] = mask(1, 2, 3);
	xyz[4] = mask(1, 3);
	xyz[9] = mask(2, 3);
	expect(findDeduction(xyz, "master")?.technique).toBe("XYZ-Wing");
	expect(findDeduction(xyz, "master")?.removed).toEqual([
		{ cell: 1, digit: 3 },
		{ cell: 2, digit: 3 },
	]);
	const w = Array(81).fill(1022);
	w[0] = mask(1, 2);
	w[28] = mask(1, 2);
	for (let r = 0; r < 9; r++)
		if (![0, 3].includes(r)) w[r * 9 + 4] &= ~(1 << 1);
	expect(findDeduction(w, "master")?.technique).toBe("W-Wing");
	// Break the conjugate link: this no longer establishes the wing implication.
	w[76] |= 1 << 1;
	expect(findDeduction(w, "master")).toBeNull();
	const sky = Array(81).fill(1022);
	for (const r of [0, 3])
		for (let c = 0; c < 9; c++)
			if (!(r === 0 ? [0, 4] : [0, 5]).includes(c)) sky[r * 9 + c] &= ~(1 << 1);
	expect(findDeduction(sky, "master")?.technique).toBe("Skyscraper");
});
