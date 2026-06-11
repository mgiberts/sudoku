import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import {
	compactStringToBoard,
	createGameDataV1,
	type SudokuGameDataV1,
	validateGameDataV1,
} from "../src/gameData";
import { solveUniqueBoard } from "../src/sudoku";
import { formatCuratedExpertModule } from "./game-data-module";

type Options = {
	dropMocks: boolean;
	dryRun: boolean;
	input: string;
	mergeExisting: boolean;
	output: string;
	requireCount: number | null;
};

type PuzzleLine = {
	lineNumber: number;
	value: string;
};

const DEFAULT_OUTPUT = "src/generated/curatedExpert.v1.ts";
const GENERATOR_NAME = "curated-expert-importer";
const GENERATOR_VERSION = "0.1.0";

const options = parseArgs(process.argv.slice(2));
const puzzles = await readPuzzleStrings(options.input);
const games: SudokuGameDataV1[] = [];
const seenIds = new Set<string>();
const importedPuzzleStrings = new Set<string>();
let duplicateGameCount = 0;
let duplicateInputCount = 0;
let importedCount = 0;

if (options.mergeExisting) {
	for (const game of curatedExpertGames) {
		if (options.dropMocks && isMockGame(game)) {
			continue;
		}

		addGame(game);
	}
}

for (const puzzleLine of puzzles) {
	if (importedPuzzleStrings.has(puzzleLine.value)) {
		duplicateInputCount += 1;
		continue;
	}

	importedPuzzleStrings.add(puzzleLine.value);
	const puzzle = compactStringToBoard(puzzleLine.value);
	const solution = solveUniqueBoard(puzzle);

	if (!solution) {
		throw new Error(
			`Line ${puzzleLine.lineNumber}: puzzle is not uniquely solvable`,
		);
	}

	const game = createGameDataV1({
		difficulty: "expert",
		generatedAt: new Date().toISOString(),
		generator: {
			name: GENERATOR_NAME,
			version: GENERATOR_VERSION,
			runtime: "bun",
		},
		puzzle,
		solution,
		source: "curated",
	});

	if (addGame(game)) {
		importedCount += 1;
	}
}

if (options.requireCount !== null && games.length !== options.requireCount) {
	throw new Error(
		`Imported ${games.length} unique curated Expert games, expected ${options.requireCount}`,
	);
}

if (!options.dryRun) {
	await writeTextAtomically(options.output, formatCuratedExpertModule(games));
}

console.info(
	[
		`${options.dryRun ? "Validated" : "Imported"} ${games.length} curated Expert games.`,
		`new=${importedCount}`,
		`mergedExisting=${countMergedExisting()}`,
		`duplicateInput=${duplicateInputCount}`,
		`duplicateGame=${duplicateGameCount}`,
		`dryRun=${options.dryRun}`,
	].join(" "),
);

function parseArgs(args: string[]): Options {
	const input = readOption(args, "--input");
	const requireCount = readOptionalOption(args, "--require-count");

	if (!input) {
		throw new Error("Missing --input path");
	}

	return {
		dropMocks: args.includes("--drop-mocks"),
		dryRun: args.includes("--dry-run"),
		input,
		mergeExisting: args.includes("--merge-existing"),
		output: readOptionalOption(args, "--output") ?? DEFAULT_OUTPUT,
		requireCount: requireCount === null ? null : Number(requireCount),
	};
}

function addGame(game: SudokuGameDataV1): boolean {
	const errors = validateGameDataV1(game, { requireUnique: true });

	if (errors.length > 0) {
		throw new Error(`${game.id}: ${errors.join("; ")}`);
	}

	if (seenIds.has(game.id)) {
		duplicateGameCount += 1;
		return false;
	}

	seenIds.add(game.id);
	games.push(game);
	return true;
}

function countMergedExisting(): number {
	if (!options.mergeExisting) {
		return 0;
	}

	if (!options.dropMocks) {
		return curatedExpertGames.length;
	}

	return curatedExpertGames.filter((game) => !isMockGame(game)).length;
}

function isMockGame(game: SudokuGameDataV1): boolean {
	return game.generator?.name.includes("mock") === true;
}

function readOption(args: string[], name: string): string | null {
	const value = readOptionalOption(args, name);

	if (!value) {
		return null;
	}

	return value;
}

function readOptionalOption(args: string[], name: string): string | null {
	const index = args.indexOf(name);

	if (index === -1) {
		return null;
	}

	const value = args[index + 1];

	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${name}`);
	}

	return value;
}

async function readPuzzleStrings(path: string): Promise<PuzzleLine[]> {
	const raw = await readFile(resolve(path), "utf8");

	return raw
		.split(/\r?\n/)
		.map((line, index) => ({
			lineNumber: index + 1,
			value: line.trim(),
		}))
		.filter((line) => line.value.length > 0 && !line.value.startsWith("#"))
		.map((line) => ({
			...line,
			value: line.value.replaceAll(".", "0"),
		}))
		.filter((line) => {
			if (!/^[0-9]{81}$/.test(line.value)) {
				throw new Error(
					`Line ${line.lineNumber}: invalid compact puzzle line; expected 81 digits using 0 for empty cells`,
				);
			}

			return true;
		});
}

async function writeTextAtomically(path: string, content: string): Promise<void> {
	const absolutePath = resolve(path);
	const tmpPath = `${absolutePath}.tmp`;
	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(tmpPath, content);
	await rename(tmpPath, absolutePath);
}
