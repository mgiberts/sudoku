import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import {
	assertReviewedPolicy,
	difficultyPolicy,
} from "../src/difficultyPolicy";
import {
	compactGameDataV1,
	type SudokuGameDataV1,
	validateGameDataV1,
} from "../src/gameData";
import {
	addSample,
	emptyMetrics,
	type Metrics,
	summarizeMetrics,
} from "../src/generationMetrics";
import { generateRatedGame } from "../src/puzzleGeneration";
import type { Difficulty } from "../src/types";

assertReviewedPolicy(difficultyPolicy);
const directory = "scripts/output/reviewed";
await mkdir(directory, { recursive: true });
const config = JSON.stringify(difficultyPolicy);
let progress: {
	config: string;
	games: Partial<Record<Difficulty, SudokuGameDataV1[]>>;
	metrics: Metrics;
} = { config, games: {}, metrics: emptyMetrics() };
try {
	const saved = JSON.parse(
		await readFile(`${directory}/progress.json`, "utf8"),
	);
	if (saved.config === config) progress = saved;
} catch {
	/* No matching checkpoint. */
}
const save = async () => {
	await writeFile(`${directory}/progress.json.tmp`, JSON.stringify(progress));
	await rename(`${directory}/progress.json.tmp`, `${directory}/progress.json`);
};
let stopped = false;
process.on("SIGINT", () => {
	stopped = true;
});
process.on("SIGTERM", () => {
	stopped = true;
});
for (const difficulty of Object.keys(difficultyPolicy.levels) as Difficulty[]) {
	const games = progress.games[difficulty] ?? [];
	progress.games[difficulty] = games;
	for (
		let request = 0;
		games.length < difficultyPolicy.levels[difficulty].starterCount &&
		request < 1000 &&
		!stopped;
		request++
	) {
		const { game, metrics } = generateRatedGame(difficulty, {
			runtime: "bun",
			timeoutMs: 10000,
		});
		if (game && !games.some((g) => g.id === game.id)) {
			game.source = "starter";
			games.push(game);
		} else if (game) {
			metrics.accepted = false;
			metrics.rejections.duplicate = 1;
		}
		addSample(progress.metrics, metrics);
		await save();
		console.log(difficulty, games.length);
	}
	if (games.length < difficultyPolicy.levels[difficulty].starterCount)
		throw new Error(
			"Incomplete catalog; resumable progress saved, shipped catalogs unchanged",
		);
}
for (const game of Object.values(progress.games).flat()) {
	const errors = validateGameDataV1(game, { requireUnique: true });
	if (errors.length) throw new Error(`${game.id}: ${errors.join("; ")}`);
}
const compact = Object.fromEntries(
	Object.entries(progress.games).map(([d, games]) => [
		d,
		games.map(compactGameDataV1),
	]),
);
await writeFile(
	`${directory}/report.json`,
	JSON.stringify(summarizeMetrics(progress.metrics), null, 2),
);
await writeFile(
	"src/generated/starterPuzzles.ts.tmp",
	`import {expandGameDataV1,type CompactSudokuGameDataV1,type SudokuGameDataV1} from '../gameData';import type {Difficulty} from '../types';

const compact=${JSON.stringify(compact)} satisfies Record<Difficulty,CompactSudokuGameDataV1[]>;export const starterPuzzlesByDifficulty=Object.fromEntries(Object.entries(compact).map(([d,games])=>[d,games.map(expandGameDataV1)])) as Record<Difficulty,SudokuGameDataV1[]>;`,
);
await rename(
	"src/generated/starterPuzzles.ts.tmp",
	"src/generated/starterPuzzles.ts",
);
