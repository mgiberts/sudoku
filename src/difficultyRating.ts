import { difficultyPolicy } from "./difficultyPolicy";
import type { Board, Difficulty, Digit } from "./types";

export const RATING_VERSION = 1;
export type Repertoire = "singles" | "hard" | "master" | "expert";
export type Deduction = {
	technique: string;
	cells: number[];
	digits: number[];
	removed: { cell: number; digit: number }[];
	placed?: { cell: number; digit: number };
	/** Literal path for chains: candidate * 2 + truth value. */
	chain?: number[];
};
export type Rating = {
	version: typeof RATING_VERSION;
	tier: Repertoire | "unrated";
	status: "solved" | "stalled" | "budget" | "invalid";
	trace: Deduction[];
	strongestTechnique: string | null;
	bottlenecks: number;
};
export type RatingSummary = Omit<Rating, "trace">;
export const summarizeRating = ({
	version,
	tier,
	status,
	strongestTechnique,
	bottlenecks,
}: RatingSummary): RatingSummary => ({
	version,
	tier,
	status,
	strongestTechnique,
	bottlenecks,
});
export const units = Array.from({ length: 27 }, (_, u) =>
	Array.from({ length: 9 }, (_, i) =>
		u < 9
			? u * 9 + i
			: u < 18
				? i * 9 + u - 9
				: Math.floor((u - 18) / 3) * 27 +
					((u - 18) % 3) * 3 +
					Math.floor(i / 3) * 9 +
					(i % 3),
	),
);
export const peers = Array.from({ length: 81 }, (_, c) =>
	[...new Set(units.filter((u) => u.includes(c)).flat())].filter(
		(p) => p !== c,
	),
);
const sees = (a: number, b: number) => peers[a].includes(b);
const bits = (mask: number) =>
	Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => mask & (1 << d));
const size = (mask: number) => bits(mask).length;
const union = (values: number[]) => values.reduce((a, b) => a | b, 0);
function* combinations<T>(
	items: T[],
	n: number,
	start = 0,
	chosen: T[] = [],
): Generator<T[]> {
	if (chosen.length === n) {
		yield chosen;
		return;
	}
	for (let i = start; i <= items.length - n + chosen.length; i++)
		yield* combinations(items, n, i + 1, [...chosen, items[i]]);
}
export function candidateMasks(board: Board): number[] {
	return board.map((v, c) =>
		v
			? 0
			: 1022 &
				~union(peers[c].map((p) => (board[p] ? 1 << (board[p] as number) : 0))),
	);
}

/** Pure deduction finder; the caller owns and applies candidate state. */
export function findDeduction(
	m: number[],
	level: Repertoire,
	stop: () => boolean = () => false,
): Deduction | null {
	const eliminate = (
		technique: string,
		cells: number[],
		digits: number[],
		targets: number[],
		mask: number,
		chain?: number[],
	): Deduction | null => {
		const removed = targets.flatMap((cell) =>
			bits(m[cell] & mask).map((digit) => ({ cell, digit })),
		);
		return removed.length
			? { technique, cells, digits, removed, ...(chain ? { chain } : {}) }
			: null;
	};
	for (let c = 0; c < 81; c++)
		if (size(m[c]) === 1)
			return {
				technique: "Naked single",
				cells: [c],
				digits: bits(m[c]),
				removed: [],
				placed: { cell: c, digit: bits(m[c])[0] },
			};
	for (const u of units)
		for (let d = 1; d <= 9; d++) {
			const cells = u.filter((c) => m[c] & (1 << d));
			if (cells.length === 1)
				return {
					technique: "Hidden single",
					cells,
					digits: [d],
					removed: [],
					placed: { cell: cells[0], digit: d },
				};
		}
	if (level === "singles" || stop()) return null;
	for (const u of units)
		for (let d = 1; d <= 9; d++) {
			const cells = u.filter((c) => m[c] & (1 << d));
			if (cells.length < 2) continue;
			for (const v of units)
				if (v !== u && cells.every((c) => v.includes(c))) {
					const step = eliminate(
						"Locked candidates",
						cells,
						[d],
						v.filter((c) => !u.includes(c)),
						1 << d,
					);
					if (step) return step;
				}
		}
	for (let n = 2; n <= (level === "hard" ? 3 : 4); n++)
		for (const u of units) {
			if (stop()) return null;
			for (const cells of combinations(
				u.filter((c) => m[c] && size(m[c]) <= n),
				n,
			)) {
				const mask = union(cells.map((c) => m[c]));
				if (size(mask) !== n) continue;
				const step = eliminate(
					`Naked subset ${n}`,
					cells,
					bits(mask),
					u.filter((c) => !cells.includes(c)),
					mask,
				);
				if (step) return step;
			}
			for (const ds of combinations(bits(union(u.map((c) => m[c]))), n)) {
				const mask = union(ds.map((d) => 1 << d));
				const cells = u.filter((c) => m[c] & mask);
				if (cells.length !== n) continue;
				const step = eliminate(
					`Hidden subset ${n}`,
					cells,
					ds,
					cells,
					1022 & ~mask,
				);
				if (step) return step;
			}
		}
	if (level === "hard" || stop()) return null;
	for (let n = 2; n <= 3; n++)
		for (let axis = 0; axis < 2; axis++)
			for (let d = 1; d <= 9; d++) {
				const lines = units.slice(axis * 9, axis * 9 + 9);
				for (const bases of combinations(
					lines.filter((u) => {
						const k = u.filter((c) => m[c] & (1 << d)).length;
						return k >= 2 && k <= n;
					}),
					n,
				)) {
					const cells = bases.flat().filter((c) => m[c] & (1 << d));
					const covers = [
						...new Set(cells.map((c) => (axis ? Math.floor(c / 9) : c % 9))),
					];
					if (covers.length !== n) continue;
					const targets = covers
						.flatMap((i) => units[(1 - axis) * 9 + i])
						.filter((c) => !bases.some((u) => u.includes(c)));
					const step = eliminate(
						n === 2 ? "X-Wing" : "Swordfish",
						cells,
						[d],
						targets,
						1 << d,
					);
					if (step) return step;
				}
			}
	const bivalue = m.flatMap((mask, c) => (size(mask) === 2 ? [c] : []));
	for (let pivot = 0; pivot < 81; pivot++) {
		if (stop()) return null;
		if (size(m[pivot]) !== 2 && size(m[pivot]) !== 3) continue;
		for (const [a, b] of combinations(
			bivalue.filter((c) => sees(c, pivot)),
			2,
		)) {
			const all = m[a] | m[b] | m[pivot];
			const shared = m[a] & m[b];
			if (size(all) !== 3 || size(shared) !== 1 || m[a] === m[b]) continue;
			const xyz = size(m[pivot]) === 3;
			if (!xyz && m[pivot] & shared) continue;
			const targets = peers[a].filter(
				(c) => c !== pivot && c !== b && sees(c, b) && (!xyz || sees(c, pivot)),
			);
			const step = eliminate(
				xyz ? "XYZ-Wing" : "XY-Wing",
				[pivot, a, b],
				bits(all),
				targets,
				shared,
			);
			if (step) return step;
		}
	}
	for (let d = 1; d <= 9; d++) {
		const links = units
			.map((u) => u.filter((c) => m[c] & (1 << d)))
			.filter((u) => u.length === 2);
		// Two conjugate pairs with weakly linked bases (Skyscraper/two-string kite).
		for (const [a, b] of links)
			for (const [c, e] of links) {
				if (new Set([a, b, c, e]).size !== 4) continue;
				for (const [base1, tip1] of [
					[a, b],
					[b, a],
				])
					for (const [base2, tip2] of [
						[c, e],
						[e, c],
					])
						if (sees(base1, base2)) {
							const step = eliminate(
								(Math.floor(tip1 / 9) === Math.floor(base1 / 9) &&
									Math.floor(tip2 / 9) === Math.floor(base2 / 9)) ||
									(tip1 % 9 === base1 % 9 && tip2 % 9 === base2 % 9)
									? "Skyscraper"
									: "Two-string kite",
								[tip1, base1, base2, tip2],
								[d],
								peers[tip1].filter(
									(t) => sees(t, tip2) && ![a, b, c, e].includes(t),
								),
								1 << d,
							);
							if (step) return step;
						}
			}
		for (const [a, b] of combinations(bivalue, 2))
			if (m[a] === m[b])
				for (const [x, y] of links) {
					if (new Set([a, b, x, y]).size !== 4 || !(m[a] & (1 << d))) continue;
					if (!(sees(a, x) && sees(b, y)) && !(sees(a, y) && sees(b, x)))
						continue;
					const mask = m[a] & ~(1 << d);
					const step = eliminate(
						"W-Wing",
						[a, x, y, b],
						bits(m[a]),
						peers[a].filter((c) => sees(c, b)),
						mask,
					);
					if (step) return step;
				}
		// Color each connected conjugate component. Either color is true throughout.
		const visited = new Set<number>();
		for (const start of links.flat()) {
			if (visited.has(start)) continue;
			const colors = new Map<number, number>([[start, 0]]);
			const queue = [start];
			for (const c of queue) {
				visited.add(c);
				for (const pair of links.filter((p) => p.includes(c)))
					for (const next of pair)
						if (!colors.has(next)) {
							colors.set(next, 1 - (colors.get(c) as number));
							queue.push(next);
						}
			}
			for (const color of [0, 1]) {
				const group = queue.filter((c) => colors.get(c) === color);
				if (group.some((c) => group.some((p) => sees(c, p)))) {
					const step = eliminate("Simple coloring", queue, [d], group, 1 << d);
					if (step) return step;
				}
			}
			const targets = m.flatMap((mask, c) =>
				mask & (1 << d) &&
				!colors.has(c) &&
				[0, 1].every((color) =>
					queue.some((p) => colors.get(p) === color && sees(c, p)),
				)
					? [c]
					: [],
			);
			const step = eliminate("Simple coloring", queue, [d], targets, 1 << d);
			if (step) return step;
		}
	}
	if (level !== "expert" || stop()) return null;
	// Candidate literals: true implies all conflicting literals false; a conjugate
	// false implies its partner true. A path true -> false refutes its start.
	const graph = Array.from({ length: 1458 }, () => new Set<number>());
	const weak = (a: number, b: number) => {
		graph[a * 2 + 1].add(b * 2);
		graph[b * 2 + 1].add(a * 2);
	};
	const strong = (a: number, b: number) => {
		graph[a * 2].add(b * 2 + 1);
		graph[b * 2].add(a * 2 + 1);
	};
	const id = (c: number, d: number) => c * 9 + d - 1;
	for (let c = 0; c < 81; c++) {
		const ds = bits(m[c]);
		for (const [a, b] of combinations(ds, 2)) {
			weak(id(c, a), id(c, b));
			if (ds.length === 2) strong(id(c, a), id(c, b));
		}
	}
	for (const u of units)
		for (let d = 1; d <= 9; d++) {
			const cells = u.filter((c) => m[c] & (1 << d));
			for (const [a, b] of combinations(cells, 2)) {
				weak(id(a, d), id(b, d));
				if (cells.length === 2) strong(id(a, d), id(b, d));
			}
		}
	for (let c = 0; c < 81; c++)
		for (const d of bits(m[c])) {
			if (stop()) return null;
			const start = id(c, d) * 2 + 1;
			const previous = new Int16Array(1458).fill(-1);
			previous[start] = start;
			let frontier = [start];
			for (let depth = 0; depth < 12 && frontier.length; depth++) {
				const next: number[] = [];
				for (const node of frontier)
					for (const target of graph[node])
						if (previous[target] === -1) {
							previous[target] = node;
							if (target === start - 1) {
								const chain = [target];
								while (chain[0] !== start) chain.unshift(previous[chain[0]]);
								const digits = [
									...new Set(chain.map((n) => (Math.floor(n / 2) % 9) + 1)),
								];
								return eliminate(
									digits.length === 1
										? "X-Cycle"
										: "Alternating inference chain",
									[...new Set(chain.map((n) => Math.floor(n / 18)))],
									digits,
									[c],
									1 << d,
									chain,
								);
							}
							next.push(target);
						}
				frontier = next;
			}
		}
	return null;
}

const techniqueRank = (technique: string): number => {
	if (technique.includes("single")) return 0;
	if (technique === "Locked candidates" || /subset [23]$/.test(technique))
		return 1;
	if (technique === "X-Cycle" || technique === "Alternating inference chain")
		return 3;
	return 2;
};
export function solveLogically(
	board: Board,
	tier: Repertoire,
	shouldStop: () => boolean = () => false,
): Rating {
	const values = [...board];
	const m = board.length === 81 ? candidateMasks(board) : [];
	const trace: Deduction[] = [];
	const result = (status: Rating["status"]): Rating => ({
		version: RATING_VERSION,
		tier: status === "solved" ? tier : "unrated",
		status,
		trace,
		strongestTechnique:
			[...trace].sort(
				(a, b) => techniqueRank(b.technique) - techniqueRank(a.technique),
			)[0]?.technique ?? null,
		bottlenecks: trace.filter(
			(s) =>
				techniqueRank(s.technique) ===
					["singles", "hard", "master", "expert"].indexOf(tier) && !s.placed,
		).length,
	});
	if (
		board.length !== 81 ||
		board.some(
			(d, c) =>
				d !== null &&
				(!Number.isInteger(d) ||
					d < 1 ||
					d > 9 ||
					peers[c].some((p) => board[p] === d)),
		)
	)
		return result("invalid");
	for (let steps = 0; steps < 730; steps++) {
		if (shouldStop()) return result("budget");
		if (values.every((v) => v !== null)) return result("solved");
		if (m.some((mask, c) => !mask && values[c] === null))
			return result("invalid");
		const step = findDeduction(m, tier, shouldStop);
		if (shouldStop()) return result("budget");
		if (!step) return result("stalled");
		trace.push(step);
		if (step.placed) {
			const { cell, digit } = step.placed;
			values[cell] = digit as Digit;
			m[cell] = 0;
			for (const p of peers[cell]) m[p] &= ~(1 << digit);
		} else for (const { cell, digit } of step.removed) m[cell] &= ~(1 << digit);
	}
	return result("budget");
}

export function rateDifficulty(
	board: Board,
	shouldStop: () => boolean = () => false,
): Rating {
	for (const tier of ["singles", "hard", "master", "expert"] as const) {
		const rating = solveLogically(board, tier, shouldStop);
		if (rating.status !== "stalled" || tier === "expert") return rating;
	}
	throw new Error("Unreachable rating state");
}
export const requiresRating = (difficulty: Difficulty) =>
	difficultyPolicy.stage === "reviewed" ||
	["hard", "master", "expert"].includes(difficulty);
export const matchesDifficulty = (
	difficulty: Difficulty,
	rating: RatingSummary,
) =>
	!requiresRating(difficulty) ||
	(rating.status === "solved" &&
		rating.tier ===
			(difficulty === "easy" || difficulty === "medium"
				? "singles"
				: difficulty) &&
		rating.version === RATING_VERSION);
