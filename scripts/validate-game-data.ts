import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import { starterPuzzlesByDifficulty } from "../src/generated/starterPuzzles";
import { validateGameDataV1 } from "../src/gameData";
import type { SudokuGameDataV1 } from "../src/gameData";
import type { Difficulty } from "../src/types";

type Options = {
	requireExpertCount: number | null;
};

const STARTER_DIFFICULTIES: Difficulty[] = [
	"easy",
	"medium",
	"hard",
	"master",
];

const options = parseArgs(process.argv.slice(2));
const errors: string[] = [];
const seenIds = new Set<string>();
let curatedExpertMockCount = 0;
let curatedExpertRealCount = 0;

for (const difficulty of STARTER_DIFFICULTIES) {
	const games = starterPuzzlesByDifficulty[difficulty];

	if (games.length !== 3) {
		errors.push(`${difficulty} starter count is ${games.length}, expected 3`);
	}

	for (const game of games) {
		validateGame(game, "starter");
	}
}

if (starterPuzzlesByDifficulty.expert.length !== 0) {
	errors.push("Expert starter cache must stay empty; use curatedExpertGames");
}

for (const game of curatedExpertGames) {
	validateGame(game, "curated");

	if (isMockGame(game)) {
		curatedExpertMockCount += 1;

		if (options.requireExpertCount !== null) {
			errors.push(`${game.id}: mock curated Expert game cannot satisfy final Expert count`);
		}
	} else {
		curatedExpertRealCount += 1;
	}
}

if (
	options.requireExpertCount !== null &&
	curatedExpertRealCount !== options.requireExpertCount
) {
	errors.push(
		`Real curated Expert count is ${curatedExpertRealCount}, expected ${options.requireExpertCount}`,
	);
}

if (errors.length > 0) {
	console.error(errors.join("\n"));
	process.exit(1);
}

console.info(
	[
		`starter=${STARTER_DIFFICULTIES.reduce(
			(count, difficulty) => count + starterPuzzlesByDifficulty[difficulty].length,
			0,
		)}`,
		`curatedExpert=${curatedExpertGames.length}`,
		`curatedExpertReal=${curatedExpertRealCount}`,
		`curatedExpertMock=${curatedExpertMockCount}`,
		`uniqueIds=${seenIds.size}`,
	].join(" "),
);

function validateGame(
	game: SudokuGameDataV1,
	expectedSource: string,
): void {
	const validationErrors = validateGameDataV1(game, { requireUnique: true });

	if (validationErrors.length > 0) {
		errors.push(`${game.id}: ${validationErrors.join("; ")}`);
	}

	if (game.source !== expectedSource) {
		errors.push(`${game.id}: source is ${game.source}, expected ${expectedSource}`);
	}

	if (seenIds.has(game.id)) {
		errors.push(`${game.id}: duplicate game id`);
	}

	seenIds.add(game.id);
}

function isMockGame(game: SudokuGameDataV1): boolean {
	return game.generator?.name.includes("mock") === true;
}

function parseArgs(args: string[]): Options {
	const requireExpertCount = readOption(args, "--require-expert-count");

	return {
		requireExpertCount:
			requireExpertCount === null ? null : Number(requireExpertCount),
	};
}

function readOption(args: string[], name: string): string | null {
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
