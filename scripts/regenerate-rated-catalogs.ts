import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { difficultyPolicy } from "../src/difficultyPolicy";
import { RATING_VERSION, rateDifficulty } from "../src/difficultyRating";
import {
	compactGameDataV1,
	createGameDataV1,
	type SudokuGameDataV1,
	validateGameDataV1,
} from "../src/gameData";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import {
	addSample,
	emptyMetrics,
	type Metrics,
	newSample,
	summarizeMetrics,
} from "../src/generationMetrics";
import { generateRatedGame } from "../src/puzzleGeneration";
import { hasUniqueSolution, tradePuzzleClues } from "../src/sudoku";
import { formatCuratedExpertModule } from "./game-data-module";

if (difficultyPolicy.stage === "reviewed")
	throw new Error(
		"Use publish:reviewed-catalogs for the reviewed effort policy",
	);
const path = "scripts/output/rated-catalog-progress.json";
const limit =
	Number(process.argv[process.argv.indexOf("--max-attempts") + 1]) || 1000000;
let progress: {
	version: number;
	attempts: number;
	experts: SudokuGameDataV1[];
	starters: Record<string, SudokuGameDataV1[]>;
	metrics: Metrics;
} = {
	version: RATING_VERSION,
	attempts: 0,
	experts: [],
	starters: {},
	metrics: emptyMetrics(),
};
try {
	const saved = JSON.parse(await readFile(path, "utf8"));
	if (saved.version === RATING_VERSION) progress = saved;
} catch {
	/* First run. */
}
await mkdir("scripts/output", { recursive: true });
const save = async () => {
	await writeFile(`${path}.tmp`, JSON.stringify(progress));
	await rename(`${path}.tmp`, path);
};
let interrupted = false;
process.on("SIGINT", () => {
	interrupted = true;
});
process.on("SIGTERM", () => {
	interrupted = true;
});
for (const difficulty of ["easy", "medium", "hard", "master"] as const) {
	const games = (progress.starters[difficulty] ??= []);
	while (
		games.length < difficultyPolicy.levels[difficulty].starterCount &&
		!interrupted
	) {
		const { game, metrics } = generateRatedGame(difficulty, {
			runtime: "bun",
			timeoutMs: 10000,
		});
		if (game && games.some((g) => g.id === game.id)) {
			metrics.accepted = false;
			metrics.rejections.duplicate = 1;
		} else if (game) {
			game.source = "starter";
			games.push(game);
		}
		addSample(progress.metrics, metrics);
		await save();
		console.log(difficulty, games.length, metrics.durationMs);
	}
}
if (!progress.experts.length)
	for (const original of curatedExpertGames) {
		const rating = rateDifficulty(original.puzzle);
		if (rating.tier === "expert")
			progress.experts.push({ ...original, rating });
	}
const seen = new Set(progress.experts.map((g) => g.puzzle.join("")));
// Change actual givens, never rotate/relabel a board to manufacture catalog size.
// Existing low-clue boards supply a productive unique neighborhood.
const reservoir = [...curatedExpertGames, ...progress.experts];
for (
	let attempt = 0;
	progress.experts.length < difficultyPolicy.levels.expert.starterCount &&
	attempt < limit &&
	!interrupted;
	attempt++
) {
	const start = performance.now();
	const sample = newSample("expert", "bun", "guided-clue-trade");
	sample.attempts = 1;
	progress.attempts++;
	const base = reservoir[Math.floor(Math.random() * reservoir.length)];
	const puzzle = tradePuzzleClues(base.puzzle, base.solution);
	sample.generationMs = performance.now() - start;
	const uniqueStart = performance.now();
	const clues = puzzle.filter((v) => v !== null).length;
	const unique = clues >= 17 && clues <= 20 && hasUniqueSolution(puzzle);
	sample.uniquenessMs = performance.now() - uniqueStart;
	let reason = clues < 17 || clues > 20 ? "clue-mismatch" : "non-unique";
	if (unique) {
		if (
			reservoir.length < 10000 &&
			!reservoir.some((g) => g.puzzle.every((v, c) => v === puzzle[c]))
		)
			reservoir.push({ ...base, puzzle });
		const ratingStart = performance.now();
		const rating = rateDifficulty(puzzle);
		sample.ratingMs = performance.now() - ratingStart;
		reason = rating.tier === "unrated" ? "unrated" : "too-easy";
		if (rating.tier === "expert") {
			const key = puzzle.join("");
			reason = "duplicate";
			if (!seen.has(key)) {
				const game = createGameDataV1({
					difficulty: "expert",
					puzzle,
					solution: base.solution,
					source: "curated",
					rating,
					generatedAt: new Date().toISOString(),
					generator: {
						name: "guided-clue-trade",
						version: sample.generatorVersion,
						runtime: "bun",
						durationMs: performance.now() - start,
						attempts: 1,
					},
				});
				progress.experts.push(game);
				reservoir.push(game);
				seen.add(key);
				sample.accepted = true;
				console.log(
					`Expert ${progress.experts.length}/${difficultyPolicy.levels.expert.starterCount} after ${progress.attempts} trades`,
				);
			}
		}
	}
	if (!sample.accepted) sample.rejections[reason] = 1;
	sample.durationMs = performance.now() - start;
	addSample(progress.metrics, sample);
	if (sample.accepted || attempt % 1000 === 0) await save();
}
await save();
const report = {
	runtime: `Bun ${process.versions.bun}`,
	platform: process.platform,
	arch: process.arch,
	generatedAt: new Date().toISOString(),
	summary: summarizeMetrics(progress.metrics),
	expertsRetained: progress.experts.filter(
		(g) => g.generator?.name === "curated-expert-generator",
	).length,
	experts: progress.experts.length,
};
await writeFile(
	"scripts/output/rated-generation-report.json",
	JSON.stringify(report, null, 2),
);
if (
	interrupted ||
	progress.experts.length < difficultyPolicy.levels.expert.starterCount
)
	throw new Error(
		"Catalog incomplete; resumable progress saved, shipped files unchanged",
	);
for (const game of progress.experts) game.source = "curated";
for (const game of [
	...Object.values(progress.starters).flat(),
	...progress.experts,
]) {
	const errors = validateGameDataV1(game, { requireUnique: true });
	if (errors.length) throw new Error(`${game.id}: ${errors.join("; ")}`);
}
const starters = Object.fromEntries(
	Object.entries(progress.starters).map(([d, games]) => [
		d,
		games.map(compactGameDataV1),
	]),
);
const starterText = `import { expandGameDataV1, type CompactSudokuGameDataV1, type SudokuGameDataV1 } from "../gameData";\nimport type { Difficulty } from "../types";\nconst compactStarters = ${JSON.stringify({ ...starters, expert: [] })} satisfies Record<Difficulty, CompactSudokuGameDataV1[]>;\nexport const starterPuzzlesByDifficulty = Object.fromEntries(Object.entries(compactStarters).map(([d,games])=>[d,games.map(expandGameDataV1)])) as Record<Difficulty, SudokuGameDataV1[]>;\n`;
await writeFile("src/generated/starterPuzzles.ts.tmp", starterText);
await writeFile(
	"src/generated/curatedExpert.v1.ts.tmp",
	formatCuratedExpertModule(progress.experts),
);
await rename(
	"src/generated/starterPuzzles.ts.tmp",
	"src/generated/starterPuzzles.ts",
);
await rename(
	"src/generated/curatedExpert.v1.ts.tmp",
	"src/generated/curatedExpert.v1.ts",
);
console.log(JSON.stringify(report, null, 2));
