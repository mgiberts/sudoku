import {
	compactGameDataV1,
	type CompactSudokuGameDataV1,
	type SudokuGameDataV1,
} from "../src/gameData";

export const formatCuratedExpertModule = (
	games: SudokuGameDataV1[],
): string => `import {
	type CompactSudokuGameDataV1,
	expandGameDataV1,
	type SudokuGameDataV1,
} from "../gameData";

const compactCuratedExpertGames = ${formatCompactGames(games.map(compactGameDataV1))} satisfies CompactSudokuGameDataV1[];

export const curatedExpertGames = compactCuratedExpertGames.map(
	expandGameDataV1,
) satisfies SudokuGameDataV1[];
`;

const formatCompactGames = (games: CompactSudokuGameDataV1[]): string => {
	const formattedGames = games.map(
		(game) => `{
\t\tversion: ${game.version},
\t\tdifficulty: ${JSON.stringify(game.difficulty)},
\t\tpuzzle:
\t\t\t${JSON.stringify(game.puzzle)},
\t\tsolution:
\t\t\t${JSON.stringify(game.solution)},
\t\tclues: ${game.clues},
${game.seed === undefined ? "" : `\t\tseed: ${game.seed},\n`}\t\tsource: ${JSON.stringify(game.source)},
${game.generatedAt === undefined ? "" : `\t\tgeneratedAt: ${JSON.stringify(game.generatedAt)},\n`}${formatGenerator(game.generator)}\t\tid: ${JSON.stringify(game.id)},
\t}`,
	);

	return `[\n\t${formattedGames.join(",\n\t")},\n]`;
};

const formatGenerator = (
	generator: CompactSudokuGameDataV1["generator"],
): string => {
	if (!generator) {
		return "";
	}

	return `\t\tgenerator: {
\t\t\tname: ${JSON.stringify(generator.name)},
\t\t\tversion: ${JSON.stringify(generator.version)},
\t\t\truntime: ${JSON.stringify(generator.runtime)},
${generator.durationMs === undefined ? "" : `\t\t\tdurationMs: ${generator.durationMs},\n`}${generator.attempts === undefined ? "" : `\t\t\tattempts: ${generator.attempts},\n`}\t\t},
`;
};
