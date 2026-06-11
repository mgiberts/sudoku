import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const SAMPLE_INPUT = "/tmp/sudoku-curated-import-sample.txt";

await mkdir(dirname(SAMPLE_INPUT), { recursive: true });
await writeFile(
	SAMPLE_INPUT,
	[
		"# Known uniquely solvable 17-clue Sudoku sample.",
		"000000010400000000020000000000050407008000300001090000300400200050100000000806000",
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
