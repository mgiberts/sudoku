import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { boardToCompactString } from "../src/gameData";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";

const SAMPLE_INPUT = "/tmp/sudoku-curated-import-sample.txt";

await mkdir(dirname(SAMPLE_INPUT), { recursive: true });
await writeFile(
	SAMPLE_INPUT,
	[
		"# Uniquely solvable Expert fixture under the current rating policy.",
		boardToCompactString(curatedExpertGames[0].puzzle),
		"",
	].join("\n"),
);

process.argv = [
	process.argv[0],
	process.argv[1],
	"--input",
	SAMPLE_INPUT,
	"--output",
	"/tmp/sudoku-curated-import-smoke.ts",
	"--require-count",
	"1",
	"--dry-run",
];

await import("./import-curated-expert");
