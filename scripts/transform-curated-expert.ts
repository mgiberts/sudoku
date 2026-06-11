import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import { validateGameDataV1 } from "../src/gameData";
import { transformGameDataV1 } from "../src/gameTransforms";
import type { SudokuGameDataV1 } from "../src/gameData";
import { formatCuratedExpertModule } from "./game-data-module";

type Options = {
	allowMockSeeds: boolean;
	output: string;
	target: number;
	maxAttempts: number;
};

const DEFAULT_OUTPUT = "src/generated/curatedExpert.v1.ts";

const options = parseArgs(process.argv.slice(2));
const seedGames = curatedExpertGames.filter(
	(game) => options.allowMockSeeds || !isMockGame(game),
);

if (seedGames.length === 0) {
	throw new Error("No curated Expert seed games found");
}

const games: SudokuGameDataV1[] = [...seedGames];
const seenIds = new Set(games.map((game) => game.id));
let attempts = 0;

while (games.length < options.target && attempts < options.maxAttempts) {
	attempts += 1;
	const seedGame = seedGames[attempts % seedGames.length];
	const transformed = createTransformedGame(seedGame);

	if (seenIds.has(transformed.id)) {
		continue;
	}

	const errors = validateGameDataV1(transformed, { requireUnique: true });

	if (errors.length > 0) {
		throw new Error(`${transformed.id}: ${errors.join("; ")}`);
	}

	seenIds.add(transformed.id);
	games.push(transformed);
}

if (games.length < options.target) {
	throw new Error(
		`Created ${games.length}/${options.target} curated Expert games after ${attempts} attempts`,
	);
}

await writeTextAtomically(options.output, formatCuratedExpertModule(games));
console.info(`Created ${games.length} curated Expert games with transforms.`);

function parseArgs(args: string[]): Options {
	return {
		allowMockSeeds: args.includes("--allow-mock-seeds"),
		output: readOption(args, "--output", DEFAULT_OUTPUT),
		target: Number(readOption(args, "--target", "100")),
		maxAttempts: Number(readOption(args, "--max-attempts", "10000")),
	};
}

function createTransformedGame(game: SudokuGameDataV1): SudokuGameDataV1 {
	const transformed = transformGameDataV1(game);

	if (!isMockGame(game)) {
		return transformed;
	}

	return {
		...transformed,
		generator: {
			...transformed.generator,
			name: "curated-expert-mock-transform",
			version: transformed.generator?.version ?? "0.1.0",
			runtime: transformed.generator?.runtime ?? "bun",
		},
		id: transformed.id,
	};
}

function isMockGame(game: SudokuGameDataV1): boolean {
	return game.generator?.name.includes("mock") === true;
}

function readOption(args: string[], name: string, fallback: string): string {
	const index = args.indexOf(name);

	if (index === -1) {
		return fallback;
	}

	const value = args[index + 1];

	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${name}`);
	}

	return value;
}

async function writeTextAtomically(path: string, content: string): Promise<void> {
	const absolutePath = resolve(path);
	const tmpPath = `${absolutePath}.tmp`;
	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(tmpPath, content);
	await rename(tmpPath, absolutePath);
}
