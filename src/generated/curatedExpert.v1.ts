import {
	type CompactSudokuGameDataV1,
	expandGameDataV1,
	type SudokuGameDataV1,
} from "../gameData";

const compactCuratedExpertGames = [
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000000200710060030050004050008070090000305004600000069000000000030000040000600",
		solution:
			"417963582285714963936852714152398476698147325374625198569481237721536849843279651",
		clues: 20,
		seed: 5346816648629833,
		source: "curated",
		generatedAt: "2026-06-11T02:29:19.494Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3583,
			attempts: 2,
		},
		id: "sdk-v1-expert-1to1r59",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"004009500000700000500001000060083070009000001000000002000004300070020000008000640",
		solution:
			"714269583936758214582341796261483975859672431347195862695814327473926158128537649",
		clues: 20,
		seed: 8031212629080535,
		source: "curated",
		generatedAt: "2026-06-11T02:29:26.451Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3031,
			attempts: 5,
		},
		id: "sdk-v1-expert-1l4r0ij",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000100000300805040290000300005002009000000080000094900000000001000003007086000",
		solution:
			"673854129192367845548291637316945782429738516785612394954173268861529473237486951",
		clues: 20,
		seed: 5943884948485666,
		source: "curated",
		generatedAt: "2026-06-11T02:29:37.179Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1243,
			attempts: 8,
		},
		id: "sdk-v1-expert-0wxukje",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000006004000080000900000003008000002000300010056008000002140000034000500000007090",
		solution:
			"823516974417983265965472183348691752279354618156728349692145837734869521581237496",
		clues: 20,
		seed: 2915537351311062,
		source: "curated",
		generatedAt: "2026-06-11T02:29:45.600Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2384,
			attempts: 11,
		},
		id: "sdk-v1-expert-0db3bpg",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000000003000810000240600006300004100009000700008050600001300000000002500000080",
		solution:
			"967183425423596817851247693286315974145769238739428156672851349318974562594632781",
		clues: 20,
		seed: 3765113020010225,
		source: "curated",
		generatedAt: "2026-06-11T02:30:00.708Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 298,
			attempts: 16,
		},
		id: "sdk-v1-expert-1kx4pvy",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000000000078060900000210030600000000320100010000009000500000506000007002007030",
		solution:
			"823916754145278963967453218239641875758329146614785329371594682586132497492867531",
		clues: 20,
		seed: 8871271651991764,
		source: "curated",
		generatedAt: "2026-06-11T02:30:04.987Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1121,
			attempts: 18,
		},
		id: "sdk-v1-expert-05nkv7h",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000031650002007040000000000000900070526000000007002003900480000000000000010050",
		solution:
			"827459631659132847341768295562341978978526314134897562213975486795684123486213759",
		clues: 20,
		seed: 741408919769729,
		source: "curated",
		generatedAt: "2026-06-11T02:30:11.253Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1783,
			attempts: 20,
		},
		id: "sdk-v1-expert-1v0ryiu",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"005000000900000000000800203003100050200040090060080000000070008700069000000300006",
		solution:
			"825734169937612584614895273493126857278543691561987432356271948782469315149358726",
		clues: 20,
		seed: 2279764400833833,
		source: "curated",
		generatedAt: "2026-06-11T02:30:12.775Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1519,
			attempts: 21,
		},
		id: "sdk-v1-expert-1a1a6s3",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000000500600040008730001000005009000002000470900060007000000000000490006080050",
		solution:
			"734251986521698743698734521863475219159862374472913865217549638385126497946387152",
		clues: 20,
		seed: 6470199473504964,
		source: "curated",
		generatedAt: "2026-06-11T02:30:22.721Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1072,
			attempts: 26,
		},
		id: "sdk-v1-expert-1t8c0d9",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000800000700020050030009070000480000060000030090001009001000000000050000804702",
		solution:
			"267945813391786524458132679976213485142568937835497261529671348784329156613854792",
		clues: 20,
		seed: 6347405065795407,
		source: "curated",
		generatedAt: "2026-06-11T02:30:33.184Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 603,
			attempts: 31,
		},
		id: "sdk-v1-expert-1i7jule",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000010070090000080004000000000005090030000002001006400006034001020000000070900300",
		solution:
			"865413279392657184714289536647125893539748612281396457956834721423571968178962345",
		clues: 20,
		seed: 373885556636097,
		source: "curated",
		generatedAt: "2026-06-11T02:30:33.843Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 655,
			attempts: 32,
		},
		id: "sdk-v1-expert-17apusm",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000001010900006700005000002307500000800700030000020000003000003020010040000008",
		solution:
			"394276851215984376786135492462317589951842763837659124128593647673428915549761238",
		clues: 20,
		seed: 7889033095339441,
		source: "curated",
		generatedAt: "2026-06-11T02:30:41.506Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2046,
			attempts: 34,
		},
		id: "sdk-v1-expert-0hgd5p1",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"403000002050018000000000400000000300608000000000003050004002000200807006000300010",
		solution:
			"483765192952418763716239485529681347638574921147923658364152879291847536875396214",
		clues: 20,
		seed: 104788279153180,
		source: "curated",
		generatedAt: "2026-06-11T02:30:50.428Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 5992,
			attempts: 36,
		},
		id: "sdk-v1-expert-19r2pjn",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000020090130000600200030700000000005009500000020100000007800001000000062000040300",
		solution:
			"475628193138759624296431758761294835849573216523186479357862941984317562612945387",
		clues: 20,
		seed: 4530907671761529,
		source: "curated",
		generatedAt: "2026-06-11T02:30:50.690Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 257,
			attempts: 37,
		},
		id: "sdk-v1-expert-0ym6e56",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"095000040300000005000807020000000000000203004801700000000000010109030600000000700",
		solution:
			"295361847387942165614857329943586271756213984821794536532679418179438652468125793",
		clues: 20,
		seed: 6120968409703739,
		source: "curated",
		generatedAt: "2026-06-11T02:30:58.279Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 726,
			attempts: 41,
		},
		id: "sdk-v1-expert-0syydq9",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"006000002000005000008009060000000400002000000000030010045100080000028070300040009",
		solution:
			"596813742734265891128479365613982457472651938859734216245197683961328574387546129",
		clues: 20,
		seed: 829872714630944,
		source: "curated",
		generatedAt: "2026-06-11T02:31:17.448Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 5199,
			attempts: 45,
		},
		id: "sdk-v1-expert-0xgrqd3",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"090000031001000000002004000400000600000060200750100000000400000500000002003608090",
		solution:
			"695287431341596728872314956429853617138769245756142389987425163564931872213678594",
		clues: 20,
		seed: 381528768934452,
		source: "curated",
		generatedAt: "2026-06-11T02:31:19.700Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2232,
			attempts: 46,
		},
		id: "sdk-v1-expert-1bdmfts",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"008100002000030000040008000003040000070000509005002007090700000600000000004000350",
		solution:
			"538176942267439815149258673923547168476813529815692437391765284652384791784921356",
		clues: 20,
		seed: 1202101939606085,
		source: "curated",
		generatedAt: "2026-06-11T02:31:21.140Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1436,
			attempts: 47,
		},
		id: "sdk-v1-expert-100763g",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"320000000000405091000000040107030000000000080008000020000900700500018200090000000",
		solution:
			"324189576876425391915367842167832954259674183438591627682943715543718269791256438",
		clues: 20,
		seed: 8946927035912604,
		source: "curated",
		generatedAt: "2026-06-11T02:31:21.475Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 316,
			attempts: 48,
		},
		id: "sdk-v1-expert-1xy6e16",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000290000005006805040000000000100670000003200400000000083400020000070590000000",
		solution:
			"147368295932715846865942731389527164674891523251436987716283459423159678598674312",
		clues: 20,
		seed: 6447165241071835,
		source: "curated",
		generatedAt: "2026-06-11T02:31:37.485Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1906,
			attempts: 54,
		},
		id: "sdk-v1-expert-1ejqf2y",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000080070504000009010000000700000000080090600200100905000305000000009030840000000",
		solution:
			"962584173574631829318927456791456382485293617236178945129345768657819234843762591",
		clues: 20,
		seed: 8090692323128446,
		source: "curated",
		generatedAt: "2026-06-11T02:31:39.694Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2205,
			attempts: 55,
		},
		id: "sdk-v1-expert-1d3thpb",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000400200300020010006000053009000080000000036100930000000070009000000000058000400",
		solution:
			"815463297397825614246719853639547182574281936182936745463178529921654378758392461",
		clues: 20,
		seed: 3089619081441125,
		source: "curated",
		generatedAt: "2026-06-11T02:31:41.137Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 335,
			attempts: 57,
		},
		id: "sdk-v1-expert-1ylvko2",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"007000000000020054036000000200000009009803600000040080001000000000007300000954000",
		solution:
			"527418936918326754436795218283561479149873625765249183891632547654187392372954861",
		clues: 20,
		seed: 6007980832573997,
		source: "curated",
		generatedAt: "2026-06-11T02:31:43.072Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1933,
			attempts: 58,
		},
		id: "sdk-v1-expert-196p83z",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000070000500000060000000085200000007000005004300106200070000001040010090060030000",
		solution:
			"486579123531482769729361485254893617618725934397146258972658341843217596165934872",
		clues: 20,
		seed: 3595835239025595,
		source: "curated",
		generatedAt: "2026-06-11T02:31:57.099Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2564,
			attempts: 62,
		},
		id: "sdk-v1-expert-11d4kau",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000600000009000270030070900002000506801300000000000100070000008090010004000009000",
		solution:
			"527693841619845273438172965742981536861357429953426187175234698296718354384569712",
		clues: 20,
		seed: 1795596820495681,
		source: "curated",
		generatedAt: "2026-06-11T02:32:08.725Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 934,
			attempts: 65,
		},
		id: "sdk-v1-expert-0n8zish",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000300500041600000008040020500230000000004000000000050004006009020000703000090000",
		solution:
			"679382514241675938358149627587231496163954872492867351734526189925418763816793245",
		clues: 20,
		seed: 48431487222879,
		source: "curated",
		generatedAt: "2026-06-11T02:32:15.005Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 589,
			attempts: 68,
		},
		id: "sdk-v1-expert-1ky6hhi",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000003600090000100260000000005040080003000050100200900000020047081000000000008000",
		solution:
			"517493628394862175268157493925346781843719256176285934639521847781934562452678319",
		clues: 20,
		seed: 8034067378870817,
		source: "curated",
		generatedAt: "2026-06-11T02:32:15.838Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 817,
			attempts: 69,
		},
		id: "sdk-v1-expert-0v7pyo8",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000080060000001000400000030002070000005040070080010900700030004600200000000500008",
		solution:
			"573489261896321457421756839142973586965842173387615942759138624638294715214567398",
		clues: 20,
		seed: 8795438460722112,
		source: "curated",
		generatedAt: "2026-06-11T02:32:20.298Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2468,
			attempts: 71,
		},
		id: "sdk-v1-expert-1okzn5c",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"500000000900008020040060003000400000003200050000000600000300014080700030007009000",
		solution:
			"531924867976538421842167593168495372493276158725813649659382714284751936317649285",
		clues: 20,
		seed: 6121275581646082,
		source: "curated",
		generatedAt: "2026-06-11T02:32:21.923Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1623,
			attempts: 72,
		},
		id: "sdk-v1-expert-1oba92j",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"013000500000100000000000400950002000600900008000003070000080001120000009004007000",
		solution:
			"713498562462175893589326417958762134637941258241853976375289641126534789894617325",
		clues: 20,
		seed: 8678050011471399,
		source: "curated",
		generatedAt: "2026-06-11T02:32:49.955Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1303,
			attempts: 78,
		},
		id: "sdk-v1-expert-00pi9jb",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"001000200600000001003090000006320000000004000007000840000057090050000037200000000",
		solution:
			"741863259692745381583291764416328975835974126927516843368157492159482637274639518",
		clues: 20,
		seed: 7094895432187464,
		source: "curated",
		generatedAt: "2026-06-11T02:32:54.476Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2359,
			attempts: 80,
		},
		id: "sdk-v1-expert-1yo1pyi",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"700003805008900007090600000006000030004007000010000040900000001500040000000000020",
		solution:
			"762413895138925467495678213276184539354297186819536742947862351521349678683751924",
		clues: 20,
		seed: 7333363163409306,
		source: "curated",
		generatedAt: "2026-06-11T02:32:54.760Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 273,
			attempts: 81,
		},
		id: "sdk-v1-expert-1yu9tfu",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"670000000200500000000009008000630000081000007003000001002000409300000020500008000",
		solution:
			"679813542238547196154269378725631984481952637963784251812375469347196825596428713",
		clues: 20,
		seed: 2531574897085810,
		source: "curated",
		generatedAt: "2026-06-11T02:33:05.709Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1122,
			attempts: 83,
		},
		id: "sdk-v1-expert-0n06s4h",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"070000300003006090000050800000090005000000000002603000010000004400020000850009060",
		solution:
			"675918342183246597924357816368192475791584623542673189219865734436721958857439261",
		clues: 20,
		seed: 2588302611939947,
		source: "curated",
		generatedAt: "2026-06-11T02:33:17.219Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 725,
			attempts: 87,
		},
		id: "sdk-v1-expert-1xhjcnz",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000010000300870500090000600000200070800300000010000040002000837000100000050400",
		solution:
			"723586914496321875518497623651973248274865391389214567945132786837649152162758439",
		clues: 20,
		seed: 124176703255781,
		source: "curated",
		generatedAt: "2026-06-11T02:33:28.098Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 5708,
			attempts: 90,
		},
		id: "sdk-v1-expert-0mt37wu",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000072900000800050004000000600000300009000001000580000500000002010049070800006",
		solution:
			"813965472964271835257384961725638194348159627691427583436592718582716349179843256",
		clues: 20,
		seed: 6339103298467557,
		source: "curated",
		generatedAt: "2026-06-11T02:33:35.495Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1962,
			attempts: 93,
		},
		id: "sdk-v1-expert-1fwuvu9",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000010000809000700000020069100000000200003005000000020070600307080000004000509",
		solution:
			"846723915512849367793651824469138752178265493235497186921574638357986241684312579",
		clues: 20,
		seed: 8134831373053873,
		source: "curated",
		generatedAt: "2026-06-11T02:33:45.128Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3783,
			attempts: 96,
		},
		id: "sdk-v1-expert-1u20epu",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000096030100000000805000600029030060000000000000100070010000002006009000070008040",
		solution:
			"247896135163257984895341627529734861781962453634185279418673592356429718972518346",
		clues: 20,
		seed: 7587888132415434,
		source: "curated",
		generatedAt: "2026-06-11T02:34:03.544Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 496,
			attempts: 101,
		},
		id: "sdk-v1-expert-1w11zux",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"002000000040000620000300708000500000060000400005102003070040000103080000000000050",
		solution:
			"812476539347958621956321748738594216261837495495162873579643182123785964684219357",
		clues: 20,
		seed: 8391150827171147,
		source: "curated",
		generatedAt: "2026-06-11T02:34:07.633Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 466,
			attempts: 103,
		},
		id: "sdk-v1-expert-0t7l0nc",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000007000436000005002008001000050060003024000070000000000360000890000700000000090",
		solution:
			"189547623436291875752638941928153467613724589574986312247369158895412736361875294",
		clues: 20,
		seed: 956313805088436,
		source: "curated",
		generatedAt: "2026-06-11T02:34:24.122Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1131,
			attempts: 107,
		},
		id: "sdk-v1-expert-0qs49sj",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"300080000900700500000000010001970000000050007002000004000004039570000026000000000",
		solution:
			"345189672916723548287645913461972385893451267752836194128564739579318426634297851",
		clues: 20,
		seed: 3698797718940710,
		source: "curated",
		generatedAt: "2026-06-11T02:34:43.040Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2688,
			attempts: 112,
		},
		id: "sdk-v1-expert-1wgb5qa",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"060000004090002007082000000000050000003420000600000902004800500000000080000109000",
		solution:
			"567391824491582367382674195728953641913426758645718932234867519179235486856149273",
		clues: 20,
		seed: 8461339494425834,
		source: "curated",
		generatedAt: "2026-06-11T02:34:56.414Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1676,
			attempts: 116,
		},
		id: "sdk-v1-expert-0udw1eo",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000003400079000200000800000000020005002004000008000009501006000000000003040030090",
		solution:
			"285973416379461258164852937713629845692584371458317629531296784927148563846735192",
		clues: 19,
		seed: 8652065167522059,
		source: "curated",
		generatedAt: "2026-06-11T02:34:57.783Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1360,
			attempts: 117,
		},
		id: "sdk-v1-expert-0sygfvd",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"126079000500000000900000040000200950004000030000006000008017000000300002300000000",
		solution:
			"126479583547863129983125647731284956694751238852936471268517394415398762379642815",
		clues: 20,
		seed: 1233782133427708,
		source: "curated",
		generatedAt: "2026-06-11T02:35:30.862Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2372,
			attempts: 127,
		},
		id: "sdk-v1-expert-10s7vxc",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"008000062000060400300100000000070001500000009090002000002009000000003500006008300",
		solution:
			"478395162219867435365124978843976251527431689691582743732659814984713526156248397",
		clues: 20,
		seed: 4286163558779823,
		source: "curated",
		generatedAt: "2026-06-11T02:35:34.565Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1359,
			attempts: 129,
		},
		id: "sdk-v1-expert-0di8acr",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"004008000000000160000030002007050300000000580020400000003000000400100000200706010",
		solution:
			"564218739932574168871639452687951324149362587325487691713895246496123875258746913",
		clues: 20,
		seed: 902382531248530,
		source: "curated",
		generatedAt: "2026-06-11T02:35:38.178Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3609,
			attempts: 130,
		},
		id: "sdk-v1-expert-02z0y4y",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"010420060000000007000100080000000009460500000200003000000009005000000030800600410",
		solution:
			"918427563624358197573196284731842659469571328285963741346219875152784936897635412",
		clues: 20,
		seed: 6740275483059905,
		source: "curated",
		generatedAt: "2026-06-11T02:35:41.285Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3100,
			attempts: 131,
		},
		id: "sdk-v1-expert-0ivxdoi",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"002070008000000900700030500080009000100004000009200070040060010050000030008000000",
		solution:
			"412975368835126947796438521284719653173654289569283174947362815651897432328541796",
		clues: 20,
		seed: 3711421555951565,
		source: "curated",
		generatedAt: "2026-06-11T02:35:50.647Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 702,
			attempts: 134,
		},
		id: "sdk-v1-expert-1sf0xle",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"006000080000400009300002000600000005000104300094200000000000410080006000010000002",
		solution:
			"246591783158437629379682154631879245827154396594263871963725418482916537715348962",
		clues: 20,
		seed: 8686855510033688,
		source: "curated",
		generatedAt: "2026-06-11T02:36:29.723Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 907,
			attempts: 143,
		},
		id: "sdk-v1-expert-0jb19ac",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000410807000000004006002000628500000000000031005000000050040000700000003090008000",
		solution:
			"239415867581367294476982315628531749947826531315794628852143976764259183193678452",
		clues: 20,
		seed: 4847788055006179,
		source: "curated",
		generatedAt: "2026-06-11T02:36:31.029Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1303,
			attempts: 144,
		},
		id: "sdk-v1-expert-1vt6yas",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"050060000000300090600070001005020070074000010000009000000004602200000030000500000",
		solution:
			"458961327721345896693278451165423978974856213382719564537194682249687135816532749",
		clues: 20,
		seed: 7683866822452028,
		source: "curated",
		generatedAt: "2026-06-11T02:36:42.539Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 7373,
			attempts: 146,
		},
		id: "sdk-v1-expert-1tpho5a",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"107005000000010000008003007000060004081000060000090000000008900460200000020000100",
		solution:
			"147685239236719485598423617352167894981354762674892351713548926469231578825976143",
		clues: 20,
		seed: 5074583214855675,
		source: "curated",
		generatedAt: "2026-06-11T02:36:47.468Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2283,
			attempts: 148,
		},
		id: "sdk-v1-expert-189btha",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000003670000000000008000010450009000007008106000005020001070000802040000000000009",
		solution:
			"249153678615827493738694512456219387927438156183765924361972845892546731574381269",
		clues: 20,
		seed: 7075847237363270,
		source: "curated",
		generatedAt: "2026-06-11T02:37:03.748Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 870,
			attempts: 153,
		},
		id: "sdk-v1-expert-1mag3rl",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000002680009000500300004000000000200600070000050900803000806700130200000000000000",
		solution:
			"547392681269718534381564972913685247628473159754921863492836715136257498875149326",
		clues: 20,
		seed: 8453497713958982,
		source: "curated",
		generatedAt: "2026-06-11T02:37:04.659Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 908,
			attempts: 154,
		},
		id: "sdk-v1-expert-1lx9vfg",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"760000400400810000000020000095000700800004000002000630008030005000200000000000010",
		solution:
			"761953428423817596589426371395162784876394152142578639618739245957241863234685917",
		clues: 20,
		seed: 4766861108664878,
		source: "curated",
		generatedAt: "2026-06-11T02:37:14.385Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 431,
			attempts: 157,
		},
		id: "sdk-v1-expert-06slym1",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000001090086000300900005000005020030060900000000000040000650700000003002071000",
		solution:
			"826543791591786342374912865967435128235168974418297536143829657789654213652371489",
		clues: 20,
		seed: 4130697429418517,
		source: "curated",
		generatedAt: "2026-06-11T02:37:20.766Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 6378,
			attempts: 158,
		},
		id: "sdk-v1-expert-0o0puef",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000300046018009000000000700000001300067020000200000900000070000000003001400600050",
		solution:
			"925387146718469523634152798859741362367925814241836975182574639576293481493618257",
		clues: 20,
		seed: 5218844469336391,
		source: "curated",
		generatedAt: "2026-06-11T02:37:21.343Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 573,
			attempts: 159,
		},
		id: "sdk-v1-expert-11l1pyq",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000700000000001004008000020710009000000000580060020000004000350020600001090100000",
		solution:
			"231794865659281734478563129713859642942316587865427913184972356527638491396145278",
		clues: 20,
		seed: 1726654825358832,
		source: "curated",
		generatedAt: "2026-06-11T02:37:25.788Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2246,
			attempts: 161,
		},
		id: "sdk-v1-expert-1ncy0hd",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"003500000085700000000002004007000000010000006000049200000060030406305000000000100",
		solution:
			"643591728285734619791682354327856941914273586568149273152968437476315892839427165",
		clues: 20,
		seed: 8229339924597741,
		source: "curated",
		generatedAt: "2026-06-11T02:37:26.299Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 508,
			attempts: 162,
		},
		id: "sdk-v1-expert-1oxuwtz",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000100050000000000704006900000050600008000000021040000050000010900037006000600008",
		solution:
			"263189457195374862784526931379251684548763129621948375856492713912837546437615298",
		clues: 20,
		seed: 4897984599724079,
		source: "curated",
		generatedAt: "2026-06-11T02:37:41.632Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1369,
			attempts: 168,
		},
		id: "sdk-v1-expert-0qwlvg9",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"900000080000030000000700500070080210000000000506049000020400000054600700000000008",
		solution:
			"945162387167835924382794561473586219298371645516249873729458136854613792631927458",
		clues: 20,
		seed: 863304914431199,
		source: "curated",
		generatedAt: "2026-06-11T02:37:44.177Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2542,
			attempts: 169,
		},
		id: "sdk-v1-expert-0jnw7x2",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"008020005000500304060000000009600000000300000005007890040100000000060080037000000",
		solution:
			"478923165192586374563471928789615432624398517315247896846132759951764283237859641",
		clues: 20,
		seed: 8352533039602114,
		source: "curated",
		generatedAt: "2026-06-11T02:37:46.477Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2296,
			attempts: 170,
		},
		id: "sdk-v1-expert-08049bt",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"900000740000000090030060008086010000000700310050000000200900004000000000001050060",
		solution:
			"928135746614827593735469128386512479492786315157394682263971854579648231841253967",
		clues: 20,
		seed: 2013912826915287,
		source: "curated",
		generatedAt: "2026-06-11T02:38:07.256Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1151,
			attempts: 175,
		},
		id: "sdk-v1-expert-1jfll0a",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"810034000040000000000700509000000000059000000000300706602000900000060000000085010",
		solution:
			"815934267947526381263718549176892435359647128428351796682173954531469872794285613",
		clues: 20,
		seed: 5614676975859179,
		source: "curated",
		generatedAt: "2026-06-11T02:38:17.453Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1709,
			attempts: 179,
		},
		id: "sdk-v1-expert-048yhtk",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"030001090000005008900700000005020000700000400008000720000060009000300000300040100",
		solution:
			"534281697271695348986734251645827913723916485198453726457162839812379564369548172",
		clues: 20,
		seed: 8348399533496365,
		source: "curated",
		generatedAt: "2026-06-11T02:38:27.920Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1678,
			attempts: 183,
		},
		id: "sdk-v1-expert-0mzhfuv",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000000030070001000058007028006300607100000005000000809004000000620004000000000",
		solution:
			"782461593536279841941358267428796315697135428315842679869514732153627984274983156",
		clues: 20,
		seed: 710135098974394,
		source: "curated",
		generatedAt: "2026-06-11T02:38:34.733Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3132,
			attempts: 185,
		},
		id: "sdk-v1-expert-0mv6kse",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"430500600700600080900010000010000030008000000000007090000902500050000801000000000",
		solution:
			"431528679725639184986714352217895436698243715543167298174982563359476821862351947",
		clues: 20,
		seed: 4116449249654647,
		source: "curated",
		generatedAt: "2026-06-11T02:38:35.694Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 956,
			attempts: 186,
		},
		id: "sdk-v1-expert-01n67mp",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"020000000700000000000060108000001890000000200800035060030072000000600040100000005",
		solution:
			"621853974784129536593467128256741893347986251819235467438572619975618342162394785",
		clues: 20,
		seed: 2681453652605026,
		source: "curated",
		generatedAt: "2026-06-11T02:38:37.365Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1668,
			attempts: 187,
		},
		id: "sdk-v1-expert-19midx6",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"600010007000000000534000080000000901300700000000090670000600000091000040002050000",
		solution:
			"628914357917538264534276189276485931389761425145392678853649712791823546462157893",
		clues: 20,
		seed: 1903521032953868,
		source: "curated",
		generatedAt: "2026-06-11T02:38:40.323Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2947,
			attempts: 188,
		},
		id: "sdk-v1-expert-1lkv2o7",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"070000020200460080001000007000039000000000000600000045500008000000000106006003900",
		solution:
			"475981623239467581861325497154839762327546819698172345513698274982754136746213958",
		clues: 20,
		seed: 6360422809323929,
		source: "curated",
		generatedAt: "2026-06-11T02:39:02.850Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 487,
			attempts: 196,
		},
		id: "sdk-v1-expert-146g5i2",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"004030006000000009801040500090500000000007010040060000000000003250006007000000040",
		solution:
			"924835176635172489871649532197524368562387914348961725416798253253416897789253641",
		clues: 20,
		seed: 2318002512179448,
		source: "curated",
		generatedAt: "2026-06-11T02:39:06.552Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 713,
			attempts: 198,
		},
		id: "sdk-v1-expert-04hpidh",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000007800500000000013090400000000608007000100009650050000060002004000000800010",
		solution:
			"216948537839576124547213896495621783628357941173489652351792468982164375764835219",
		clues: 20,
		seed: 1547555167136089,
		source: "curated",
		generatedAt: "2026-06-11T02:39:10.497Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3942,
			attempts: 199,
		},
		id: "sdk-v1-expert-16zyz6n",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"800290000060500000400000900009000200000000801005930000000001057140000000000000006",
		solution:
			"871296543963584712452173968689417235734652891215938674396821457148765329527349186",
		clues: 20,
		seed: 8804038685955903,
		source: "curated",
		generatedAt: "2026-06-11T02:39:13.316Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2812,
			attempts: 200,
		},
		id: "sdk-v1-expert-0cbmhbw",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"300600000095000080000700000006070000000008000150000907000000000000012030080005240",
		solution:
			"321684579795123684864759312936271458472598163158346927213467895549812736687935241",
		clues: 20,
		seed: 6656525266810698,
		source: "curated",
		generatedAt: "2026-06-11T02:39:15.459Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2141,
			attempts: 201,
		},
		id: "sdk-v1-expert-1j28dbc",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"150000002460009000000000000039062000020000001000500000000070000000030068800000250",
		solution:
			"157683492468729513392451786739162845524398671681547329216875934975234168843916257",
		clues: 20,
		seed: 4208040941280600,
		source: "curated",
		generatedAt: "2026-06-11T02:39:23.562Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3037,
			attempts: 204,
		},
		id: "sdk-v1-expert-0tlcaby",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"040007050008006000000090700120000060030005000700300002000000000009000080300720000",
		solution:
			"942187653578436921613592748124879365836215479795364812487951236259643187361728594",
		clues: 20,
		seed: 2229088167326011,
		source: "curated",
		generatedAt: "2026-06-11T02:39:26.475Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2898,
			attempts: 205,
		},
		id: "sdk-v1-expert-1tbc9ks",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000800000092000100000400500000000000000125300907000060001070005000000008400610000",
		solution:
			"574831926892756143136492587213967854648125379957384261361278495729543618485619732",
		clues: 20,
		seed: 942690818489198,
		source: "curated",
		generatedAt: "2026-06-11T02:39:41.206Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2475,
			attempts: 210,
		},
		id: "sdk-v1-expert-1a5243e",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000002100003060700000045000092010047500000000000300000050007004006000018000000",
		solution:
			"469815732125473968783269145836792514947531826251648379392154687574386291618927453",
		clues: 20,
		seed: 6119276878469899,
		source: "curated",
		generatedAt: "2026-06-11T02:39:45.498Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 903,
			attempts: 212,
		},
		id: "sdk-v1-expert-120k74m",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"040050000002000001000063000530010000000000008000900047000800600600000050070004090",
		solution:
			"346157289752489361819263475534718926967542138281936547493875612628391754175624893",
		clues: 20,
		seed: 6358271300191620,
		source: "curated",
		generatedAt: "2026-06-11T02:40:08.871Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 459,
			attempts: 215,
		},
		id: "sdk-v1-expert-0ogm7lr",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"100000000000004900970200003000700002004905000000000001000076035000000000020081000",
		solution:
			"143697528582134976976258143658713492214965387739842651891476235367529814425381769",
		clues: 20,
		seed: 8763544192256821,
		source: "curated",
		generatedAt: "2026-06-11T02:40:24.532Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2306,
			attempts: 220,
		},
		id: "sdk-v1-expert-1pv9t7t",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000360009000081000005000070040000000000200006100000090890000003006002000000400012",
		solution:
			"781365429924781365635924871249613758578249136163857294892176543416532987357498612",
		clues: 20,
		seed: 2540201389860192,
		source: "curated",
		generatedAt: "2026-06-11T02:40:33.191Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3703,
			attempts: 222,
		},
		id: "sdk-v1-expert-1kuuzfk",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000030000486000005000000810060000400009060003000750040000800030000000002005007",
		solution:
			"984751236321486975675293481819567324457329168263148759546972813738614592192835647",
		clues: 20,
		seed: 5215845223286655,
		source: "curated",
		generatedAt: "2026-06-11T02:40:46.428Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3367,
			attempts: 226,
		},
		id: "sdk-v1-expert-1tfk4ey",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"200000000000604500008300060063000007000002900100005000090007006500000400000000080",
		solution:
			"246571893319684572758329164963148257485762931172935648894257316537816429621493785",
		clues: 20,
		seed: 1107604025384845,
		source: "curated",
		generatedAt: "2026-06-11T02:40:57.143Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1578,
			attempts: 230,
		},
		id: "sdk-v1-expert-0d0lnzw",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"009040000002000050000020010000002080160000000800030006207500000000009160000000400",
		solution:
			"519746238732918654486325719974652381163894527825137946247561893358479162691283475",
		clues: 20,
		seed: 297791349811938,
		source: "curated",
		generatedAt: "2026-06-11T02:40:57.814Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 667,
			attempts: 231,
		},
		id: "sdk-v1-expert-1xe94pd",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"006097000400200080001000000007000050000000200140073000000080400000020700800400000",
		solution:
			"286197543493256187751348926967812354538964271142573869629781435314625798875439612",
		clues: 20,
		seed: 2589084506747159,
		source: "curated",
		generatedAt: "2026-06-11T02:40:59.983Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2165,
			attempts: 232,
		},
		id: "sdk-v1-expert-1haa59t",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"050000080003100000000020000490005030000000060501040000006003002000600001000700400",
		solution:
			"152436789683179245974528613498265137237891564561347928746913852829654371315782496",
		clues: 20,
		seed: 8252139986205862,
		source: "curated",
		generatedAt: "2026-06-11T02:41:11.803Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2031,
			attempts: 237,
		},
		id: "sdk-v1-expert-1y5yz89",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"020800005000010604007003000800000050090060000070000001003040000000000930001070000",
		solution:
			"124896375539712684687453192816234759495167823372985461953648217748521936261379548",
		clues: 20,
		seed: 3785153364974622,
		source: "curated",
		generatedAt: "2026-06-11T02:41:12.206Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 397,
			attempts: 238,
		},
		id: "sdk-v1-expert-0k8xhs1",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000000060300080000042090000800000000601200700000500300000760900000000205030400",
		solution:
			"197568324462397185853142697624853971539671248718429536341985762976214853285736419",
		clues: 20,
		seed: 5112420269708742,
		source: "curated",
		generatedAt: "2026-06-11T02:41:21.752Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3676,
			attempts: 240,
		},
		id: "sdk-v1-expert-0pcnkbq",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000000005000009486021000000004080000006005000000200001000400007030007000080000920",
		solution:
			"948763215375129486621548379714986532296315748853274691169432857532897164487651923",
		clues: 20,
		seed: 8104279230652898,
		source: "curated",
		generatedAt: "2026-06-11T02:41:28.041Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 865,
			attempts: 243,
		},
		id: "sdk-v1-expert-1u8wx3t",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000006000070000002900000180000000004240300000300090000000001457000200000800730000",
		solution:
			"583126749176849532924573186798652314245317968361498275632981457417265893859734621",
		clues: 20,
		seed: 6594632242683424,
		source: "curated",
		generatedAt: "2026-06-11T02:41:45.908Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1021,
			attempts: 249,
		},
		id: "sdk-v1-expert-0zlvd95",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000001000007095002006000004000000050000380600090400030000000000430009000010700008",
		solution:
			"923841576147695382856273194384916257571382649692457831769528413438169725215734968",
		clues: 20,
		seed: 7626112018286216,
		source: "curated",
		generatedAt: "2026-06-11T02:41:50.132Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 866,
			attempts: 251,
		},
		id: "sdk-v1-expert-1c5mgbc",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"730008001000004000000060080310000000050090600000706000000100000000020509800000400",
		solution:
			"734958261682314795195267384316582947257491638948736152573149826461823579829675413",
		clues: 20,
		seed: 6197578737408253,
		source: "curated",
		generatedAt: "2026-06-11T02:41:53.424Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 3286,
			attempts: 252,
		},
		id: "sdk-v1-expert-0i5hq9r",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"890100003000040010060000008000000000004800020080906000700003906000000000000020001",
		solution:
			"897152463523648719461397258176234895934815627285976134712583946349761582658429371",
		clues: 20,
		seed: 5096821747008985,
		source: "curated",
		generatedAt: "2026-06-11T02:42:02.005Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2702,
			attempts: 255,
		},
		id: "sdk-v1-expert-1hu4jl5",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"050008090070000206000010030620000300000900057000004000300000040004000000700600000",
		solution:
			"256378491173495286948216735629857314431962857587134962362781549814529673795643128",
		clues: 20,
		seed: 2428923936387586,
		source: "curated",
		generatedAt: "2026-06-11T02:42:08.754Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 832,
			attempts: 258,
		},
		id: "sdk-v1-expert-05mkb0t",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"004090003050000200800500000000000094030008000046000000100700600000030000900400050",
		solution:
			"674192583351684279892573416218365794739248165546917832123759648465831927987426351",
		clues: 20,
		seed: 5642894309588591,
		source: "curated",
		generatedAt: "2026-06-11T02:42:13.945Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 2724,
			attempts: 260,
		},
		id: "sdk-v1-expert-1kua6nb",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000096040000080502005000000807000000120000600000004000000050800059020000004000300",
		solution:
			"278596143461387592935241768847632951123975684596814237612453879359728416784169325",
		clues: 20,
		seed: 6169694128639832,
		source: "curated",
		generatedAt: "2026-06-11T02:42:15.270Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1321,
			attempts: 261,
		},
		id: "sdk-v1-expert-0km22b5",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"500003000002000000000060900050042010000000060400000730009305002000000400001600000",
		solution:
			"596483127872951346134267958653742819917538264428196735749315682365829471281674593",
		clues: 20,
		seed: 3877371236186956,
		source: "curated",
		generatedAt: "2026-06-11T02:42:18.594Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 398,
			attempts: 263,
		},
		id: "sdk-v1-expert-1n6n7in",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000080003001000000007200009000400000003090000600000170040001300500006008000502000",
		solution:
			"264789513391654287857213469175468932423197856689325174946871325512936748738542691",
		clues: 20,
		seed: 7043187792207926,
		source: "curated",
		generatedAt: "2026-06-11T02:42:29.784Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 208,
			attempts: 267,
		},
		id: "sdk-v1-expert-1xpd77s",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000050010900403700050802000100500000009000008007000020030900600002000000000000400",
		solution:
			"378659214926413785451872369163528947249167538587394126734981652612745893895236471",
		clues: 20,
		seed: 5243128868902705,
		source: "curated",
		generatedAt: "2026-06-11T02:42:30.881Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 1094,
			attempts: 268,
		},
		id: "sdk-v1-expert-1bbh9tu",
	},
	{
		version: 1,
		difficulty: "expert",
		puzzle:
			"000700003000006000504100000000000800000090370100065000030001906070000400000000080",
		solution:
			"918752643723946518564138729349217865256894371187365294832471956671589432495623187",
		clues: 20,
		seed: 760822260210628,
		source: "curated",
		generatedAt: "2026-06-11T02:42:31.481Z",
		generator: {
			name: "curated-expert-generator",
			version: "0.1.0",
			runtime: "bun",
			durationMs: 596,
			attempts: 269,
		},
		id: "sdk-v1-expert-04tq8fn",
	},
] satisfies CompactSudokuGameDataV1[];

export const curatedExpertGames = compactCuratedExpertGames.map(
	expandGameDataV1,
) satisfies SudokuGameDataV1[];
