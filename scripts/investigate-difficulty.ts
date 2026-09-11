import assert from "node:assert/strict";
import { boardToCompactString } from "../src/gameData";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "../src/generated/starterPuzzles";
import {
	createUniquePuzzleCandidate,
	getPeers,
	hasUniqueSolution,
} from "../src/sudoku";
import type { Board, Digit } from "../src/types";

// Investigation only: exhausting singles is a lower bound, not a difficulty rating.
const digits: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const units = Array.from({ length: 27 }, (_, unit) =>
	Array.from({ length: 9 }, (_, offset) => {
		if (unit < 9) return unit * 9 + offset;
		if (unit < 18) return offset * 9 + unit - 9;
		const box = unit - 18;
		return (
			Math.floor(box / 3) * 27 +
			(box % 3) * 3 +
			Math.floor(offset / 3) * 9 +
			(offset % 3)
		);
	}),
);
const peers = Array.from({ length: 81 }, (_, index) => getPeers(index));

function remainingAfterSingles(puzzle: Board, solution: Digit[]): number {
	const board = [...puzzle];
	while (true) {
		const candidates = board.map((value, index) =>
			value === null
				? digits.filter((digit) =>
						peers[index].every((peer) => board[peer] !== digit),
					)
				: [],
		);
		let index = candidates.findIndex((values) => values.length === 1);
		let digit = candidates[index]?.[0];
		if (index === -1) {
			outer: for (const unit of units) {
				for (const value of digits) {
					const places = unit.filter((cell) =>
						candidates[cell].includes(value),
					);
					if (places.length === 1) {
						index = places[0];
						digit = value;
						break outer;
					}
				}
			}
		}
		if (index === -1) return board.filter((value) => value === null).length;
		assert.equal(
			digit,
			solution[index],
			"Every deduction must match the verified solution",
		);
		board[index] = digit;
	}
}

type Sample = {
	id: string;
	puzzle: Board;
	solution: Digit[];
	accepted?: boolean;
};
function summarize(label: string, samples: Sample[]) {
	const groups = new Map<string, { count: number; example: unknown }>();
	for (const sample of samples) {
		assert(hasUniqueSolution(sample.puzzle), `${sample.id}: non-unique puzzle`);
		const remaining = remainingAfterSingles(sample.puzzle, sample.solution);
		const clues = sample.puzzle.filter((value) => value !== null).length;
		const key = `${sample.accepted === undefined ? "shipped" : sample.accepted ? "accepted" : "rejected"}/${remaining === 0 ? "singles-solved" : "singles-stalled"}/${clues}-clues`;
		const group = groups.get(key) ?? {
			count: 0,
			example: {
				id: sample.id,
				remaining,
				puzzle: boardToCompactString(sample.puzzle),
			},
		};
		group.count += 1;
		groups.set(key, group);
	}
	return { label, total: samples.length, groups: Object.fromEntries(groups) };
}

const reports = [
	summarize("shipped-master", starterPuzzlesByDifficulty.master),
	summarize("shipped-expert", curatedExpertGames),
];
for (const difficulty of ["master", "expert"] as const) {
	const samples: Sample[] = [];
	for (let seed = 1; seed <= 100; seed += 1) {
		// No wall-clock cutoff: isolate clue policy from timeout effects.
		const candidate = createUniquePuzzleCandidate(difficulty, seed, {
			strategy: "greedy",
		});
		assert(candidate);
		samples.push({ ...candidate, id: `seed-${seed}` });
	}
	reports.push(
		summarize(`greedy-${difficulty}-seeds-1-100-exact-target`, samples),
	);
}
console.info(JSON.stringify(reports, null, 2));
