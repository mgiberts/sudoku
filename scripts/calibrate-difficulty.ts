import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { calibrationConfig, difficultyPolicy } from "../src/difficultyPolicy";
import { RATING_VERSION } from "../src/difficultyRating";
import { assessEffort, type EffortAssessment } from "../src/effortRating";
import { boardToCompactString, compactStringToBoard } from "../src/gameData";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "../src/generated/starterPuzzles";
import { createUniquePuzzleCandidate, hasUniqueSolution } from "../src/sudoku";
import type { Board, Digit } from "../src/types";

export type CalibrationRecord = {
	id: string;
	puzzle: string;
	solution: string;
	clues: number;
	seed?: number;
	target: number | null;
	assessment: EffortAssessment;
	strongestTechnique: string | null;
};
const output = "scripts/output/calibration/corpus.json";
const categories = ["singles", "hard", "master", "expert"] as const;
const goal = calibrationConfig.perRepertoire;
let state: {
	version: number;
	nextSeed: number;
	attempts: number;
	rejected: Record<string, number>;
	records: CalibrationRecord[];
} = {
	version: difficultyPolicy.version,
	nextSeed: 100000,
	attempts: 0,
	rejected: {},
	records: [],
};
try {
	const saved = JSON.parse(await readFile(output, "utf8"));
	if (
		saved.version === state.version &&
		saved.records.every(
			(r: CalibrationRecord) => r.assessment.ratingVersion === RATING_VERSION,
		)
	)
		state = saved;
} catch {
	/* First run. */
}
await mkdir("scripts/output/calibration", { recursive: true });
const seen = new Set(state.records.map((r) => r.puzzle));
const counts = () =>
	Object.fromEntries(
		categories.map((c) => [
			c,
			state.records.filter((r) => r.assessment.repertoire === c).length,
		]),
	);
const add = (
	board: Board,
	solution: Digit[],
	target: number | null,
	seed?: number,
) => {
	const puzzle = boardToCompactString(board);
	if (seen.has(puzzle)) return;
	const { rating, assessment } = assessEffort(board, () => false);
	const category = rating.tier;
	if (category === "unrated") {
		state.rejected[rating.status] = (state.rejected[rating.status] ?? 0) + 1;
		return;
	}
	if (counts()[category] >= goal) return;
	if (!hasUniqueSolution(board))
		throw new Error("Non-unique calibration sample");
	for (const step of rating.trace) {
		if (step.placed && solution[step.placed.cell] !== step.placed.digit)
			throw new Error("Unsound placement");
		for (const x of step.removed)
			if (solution[x.cell] === x.digit) throw new Error("Unsound elimination");
	}
	state.records.push({
		id: `cal-${state.records.length + 1}`,
		puzzle,
		solution: solution.join(""),
		clues: board.filter(Boolean).length,
		seed,
		target,
		assessment,
		strongestTechnique: rating.strongestTechnique,
	});
	seen.add(puzzle);
};
if (!state.records.length)
	for (const game of [
		...Object.values(starterPuzzlesByDifficulty).flat(),
		...curatedExpertGames,
	])
		add(game.puzzle, game.solution, null, game.seed);
const save = async () => {
	await writeFile(`${output}.tmp`, JSON.stringify(state));
	await rename(`${output}.tmp`, output);
};
let stopped = false;
process.on("SIGINT", () => {
	stopped = true;
});
process.on("SIGTERM", () => {
	stopped = true;
});
const maxAttempts =
	Number(process.argv[process.argv.indexOf("--max-attempts") + 1]) || 30000;
for (
	let i = 0;
	i < maxAttempts && !stopped && Object.values(counts()).some((n) => n < goal);
	i++
) {
	const seed = state.nextSeed++;
	const target =
		calibrationConfig.clueTargets[
			state.attempts % calibrationConfig.clueTargets.length
		];
	state.attempts++;
	const candidate = createUniquePuzzleCandidate("hard", seed, {
		targetClues: target,
		minClues: 17,
		maxClues: 81,
		timeoutMs: 2000,
	});
	if (candidate?.accepted)
		add(candidate.puzzle, candidate.solution, target, seed);
	else state.rejected.generation = (state.rejected.generation ?? 0) + 1;
	if (i % 100 === 0) {
		await save();
		console.log(JSON.stringify({ attempts: state.attempts, counts: counts() }));
		await new Promise((r) => setTimeout(r, 0));
	}
}
await save();
console.log(JSON.stringify({ attempts: state.attempts, counts: counts() }));
if (Object.values(counts()).some((n) => n < goal))
	throw new Error("Corpus incomplete; progress saved. Resume the command.");
// Independently recheck persisted records on completion/resume.
for (const record of state.records)
	if (!hasUniqueSolution(compactStringToBoard(record.puzzle)))
		throw new Error(`Invalid ${record.id}`);
