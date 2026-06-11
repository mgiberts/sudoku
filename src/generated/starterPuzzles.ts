import {
	type CompactSudokuGameDataV1,
	expandGameDataV1,
	type SudokuGameDataV1,
} from "../gameData";
import type { Difficulty } from "../types";

const compactStarterPuzzlesByDifficulty = {
	easy: [
		{
			version: 1,
			difficulty: "easy",
			puzzle:
				"023071008006802030578034219739465800002100004801007905080003490060008000100250003",
			solution:
				"923571648416892537578634219739465821652189374841327965285713496367948152194256783",
			clues: 42,
			seed: 2917973260415483,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.378Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 36,
				attempts: 1,
			},
			id: "sdk-v1-easy-0r8mk1v",
		},
		{
			version: 1,
			difficulty: "easy",
			puzzle:
				"000403297020185634034200001005700386071006940400020010340000168706810020102004000",
			solution:
				"518463297927185634634297851295741386871356942463928715349572168756819423182634579",
			clues: 42,
			seed: 6360310522503113,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.404Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 24,
				attempts: 2,
			},
			id: "sdk-v1-easy-171auwk",
		},
		{
			version: 1,
			difficulty: "easy",
			puzzle:
				"200080017400007356710500800594002700371008064002400590008035070000720183930040605",
			solution:
				"256384917489217356713596842594162738371958264862473591128635479645729183937841625",
			clues: 42,
			seed: 4546978338772693,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.428Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 23,
				attempts: 3,
			},
			id: "sdk-v1-easy-1epkj63",
		},
	],
	medium: [
		{
			version: 1,
			difficulty: "medium",
			puzzle:
				"070045000080007256605080473000069005450200098000003047000308004506000901800000700",
			solution:
				"372645819184937256695182473718469325453271698269853147927318564536724981841596732",
			clues: 34,
			seed: 108168106233348,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.452Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 25,
				attempts: 1,
			},
			id: "sdk-v1-medium-0lmfueb",
		},
		{
			version: 1,
			difficulty: "medium",
			puzzle:
				"600035800140090030083004000094210700031900008007000901300409006020500004400780005",
			solution:
				"672135849145892637983674512894216753231957468567348921358429176729561384416783295",
			clues: 34,
			seed: 8631959630009019,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.482Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 29,
				attempts: 2,
			},
			id: "sdk-v1-medium-0qogx87",
		},
		{
			version: 1,
			difficulty: "medium",
			puzzle:
				"800730004047090162050406000070004059001000000008960000000201083100003045004859001",
			solution:
				"816732594347598162952416738673124859591387426428965317765241983189673245234859671",
			clues: 34,
			seed: 3700089808327682,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.507Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 25,
				attempts: 3,
			},
			id: "sdk-v1-medium-14o8acw",
		},
	],
	hard: [
		{
			version: 1,
			difficulty: "hard",
			puzzle:
				"709400800000060700831900000000000000000876004090000002002000070506010040000085130",
			solution:
				"769451823425368791831927465648192357253876914197534682312649578586713249974285136",
			clues: 26,
			seed: 2905913650560163,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.532Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 26,
				attempts: 1,
			},
			id: "sdk-v1-hard-1h2swol",
		},
		{
			version: 1,
			difficulty: "hard",
			puzzle:
				"041000030080900000900607002294000000050029010000035000007090080500000000800200570",
			solution:
				"641852937782943165935617842294186753358729614176435298427591386569378421813264579",
			clues: 26,
			seed: 848691561057642,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.561Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 28,
				attempts: 2,
			},
			id: "sdk-v1-hard-16sq1sr",
		},
		{
			version: 1,
			difficulty: "hard",
			puzzle:
				"010002000000130070532000080906000030005390067000060150000000400000604000003000508",
			solution:
				"617982345894135672532746981976521834145398267328467159759813426281654793463279518",
			clues: 26,
			seed: 6503424586465643,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.587Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 26,
				attempts: 3,
			},
			id: "sdk-v1-hard-1ngl18f",
		},
	],
	master: [
		{
			version: 1,
			difficulty: "master",
			puzzle:
				"000048000042001375000000000000100430305000098090000600706000100009060000500300000",
			solution:
				"673548912842691375951237846268159437315476298497823651736985124129764583584312769",
			clues: 24,
			seed: 4035442702208435,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.613Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 26,
				attempts: 1,
			},
			id: "sdk-v1-master-1qgg8dd",
		},
		{
			version: 1,
			difficulty: "master",
			puzzle:
				"900004083020080700007000000000000074008300900300020000570009061406000050000600000",
			solution:
				"951274683623981745847563192265198374718345926394726518572439861436817259189652437",
			clues: 24,
			seed: 7145292763199817,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.692Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 26,
				attempts: 4,
			},
			id: "sdk-v1-master-13kp86v",
		},
		{
			version: 1,
			difficulty: "master",
			puzzle:
				"010309000003000040004280000005000090020530600700000200200900304000800051000005000",
			solution:
				"812349576963751842574286139185672493429538617736194285258917364647823951391465728",
			clues: 24,
			seed: 3382909189597496,
			source: "starter",
			generatedAt: "2026-06-11T00:58:16.744Z",
			generator: {
				name: "starter-puzzle-generator",
				version: "0.1.0",
				runtime: "bun",
				durationMs: 26,
				attempts: 6,
			},
			id: "sdk-v1-master-19r05cu",
		},
	],
	expert: [],
} satisfies Record<Difficulty, CompactSudokuGameDataV1[]>;

export const starterPuzzlesByDifficulty = Object.fromEntries(
	Object.entries(compactStarterPuzzlesByDifficulty).map(
		([difficulty, games]) => [difficulty, games.map(expandGameDataV1)],
	),
) as Record<Difficulty, SudokuGameDataV1[]>;
