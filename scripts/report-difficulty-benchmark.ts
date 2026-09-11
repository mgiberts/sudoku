import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { calibrationConfig } from "../src/difficultyPolicy";
import { assessEffort, effortRejection } from "../src/effortRating";
import { curatedExpertGames } from "../src/generated/curatedExpert.v1";
import type { GenerationSample } from "../src/generationMetrics";
import {
	type PoolRequest,
	type PoolSample,
	replayPools,
} from "../src/poolSizing";
import type { CalibrationRecord } from "./calibrate-difficulty";

const root = "scripts/output/calibration";
const output = "docs/workflow/difficulty-calibration";
await mkdir(output, { recursive: true });
const benchmark = JSON.parse(
	await readFile(`${root}/browser-simulation.json`, "utf8"),
);
if (
	benchmark.runs.length !== 3 ||
	benchmark.runs.some(
		(r: { levels: Record<string, unknown[]> }) =>
			Object.keys(r.levels).length !== 4,
	) ||
	!benchmark.expert
)
	throw new Error("Benchmark incomplete");
if (!benchmark.cpuThrottlingVerified)
	throw new Error("CPU simulation did not pass slowdown verification");
const corpus = JSON.parse(await readFile(`${root}/corpus.json`, "utf8"))
	.records as CalibrationRecord[];
const levels = ["easy", "medium", "hard", "master"] as const;
const summaries: unknown[] = [];
const replays: unknown[] = [];
for (const run of benchmark.runs) {
	const samples: Record<string, PoolSample[]> = {};
	for (const d of levels) {
		const metrics = run.levels[d].map(
			(s: { metrics: GenerationSample }) => s.metrics,
		) as GenerationSample[];
		samples[d] = metrics.map((m) => ({
			durationMs: m.durationMs,
			accepted: m.accepted,
		}));
		const times = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
		const accepted = metrics.filter((m) => m.accepted).length;
		const rejections: Record<string, number> = {};
		for (const m of metrics)
			for (const [reason, n] of Object.entries(m.rejections))
				rejections[reason] = (rejections[reason] ?? 0) + n;
		summaries.push({
			throttle: run.throttle,
			difficulty: d,
			requests: metrics.length,
			accepted,
			acceptanceRate: accepted / metrics.length,
			costPerAcceptedMs: accepted
				? times.reduce((a, b) => a + b, 0) / accepted
				: null,
			p50Ms: times[Math.ceil(times.length * 0.5) - 1],
			p95Ms: times[Math.ceil(times.length * 0.95) - 1],
			ratingMs: metrics.reduce((s, m) => s + m.ratingMs, 0),
			rejections,
		});
	}
	for (const [scenario, spacing] of Object.entries({
		coldSwitching: 2000,
		normalPlay: 45000,
		warmReload: 45000,
		rapidRestarts: 500,
	})) {
		const requests: PoolRequest[] = Array.from({ length: 100 }, (_, i) => ({
			atMs: i * spacing,
			difficulty: levels[i % 4],
		}));
		for (const starters of calibrationConfig.starterSizes)
			for (const capacity of calibrationConfig.cacheSizes) {
				const payload = JSON.stringify(
					levels.flatMap((d) =>
						corpus
							.filter(
								(r) => !effortRejection(d, r.assessment, benchmark.policy),
							)
							.slice(0, starters),
					),
				);
				replays.push({
					throttle: run.throttle,
					scenario,
					starters,
					capacity,
					estimatedCatalogJsonBytes: Buffer.byteLength(payload),
					estimatedCatalogGzipBytes: gzipSync(payload).length,
					...replayPools(
						samples,
						requests,
						starters,
						capacity,
						scenario === "warmReload",
					),
				});
			}
	}
}
const workerBaseline = JSON.parse(
	await readFile(`${root}/browser-worker-baseline.json`, "utf8"),
);
const actualWorkerBaseline = Object.fromEntries(
	Object.entries(
		workerBaseline.runs.find((r: { throttle: number }) => r.throttle === 1)
			.levels,
	).map(([d, values]) => {
		const samples = values as { metrics: GenerationSample }[];
		const accepted = samples.filter((s) => s.metrics.accepted).length;
		return [
			d,
			{
				requests: samples.length,
				accepted,
				costPerAcceptedMs: accepted
					? samples.reduce((sum, s) => sum + s.metrics.durationMs, 0) / accepted
					: null,
			},
		];
	}),
);
const report = {
	actualWorkerBaseline,
	status: "awaiting real-phone feedback; no sizing decision applied",
	browser: benchmark.browser,
	execution: benchmark.execution,
	cpuThrottlingVerified: benchmark.cpuThrottlingVerified,
	cpuSlowdownRatios: benchmark.cpuSlowdownRatios,
	workerThrottlingSupported: false,
	assumptions: [
		"Generator timings measured in a throttled page because Chrome cannot throttle workers; replay models one shared FIFO worker",
		"Measured samples repeat cyclically; each scenario starts with empty caches except warmReload, which restores full current caches",
		"Published starters always available, so cache misses cause fallback rather than blocking waits",
		"Repeated starter means previously selected within the last ten fallback selections for that level",
		"Seeded starter selection avoids the last two game IDs, including generated games, matching production selection policy",
		"Size estimate serializes representative calibration records, not a production bundle delta",
	],
	summaries,
	replays,
	expert: {
		...benchmark.expert,
		previewQualifying: curatedExpertGames.filter(
			(g) =>
				!effortRejection(
					"expert",
					assessEffort(g.puzzle).assessment,
					benchmark.policy,
				),
		).length,
	},
};
await writeFile(
	`${output}/benchmark-summary.json`,
	JSON.stringify(report, null, 2),
);
const rows = (
	replays as {
		throttle: number;
		scenario: string;
		starters: number;
		capacity: number;
		cacheHits: number;
		starterFallbacks: number;
		repeatedStarters: number;
		generationMs: number;
		estimatedCatalogGzipBytes: number;
	}[]
)
	.map(
		(r) =>
			`<tr data-rate="${r.throttle}" data-scenario="${r.scenario}"><td>${r.starters}</td><td>${r.capacity}</td><td>${r.cacheHits}</td><td>${r.starterFallbacks}</td><td>${r.repeatedStarters}</td><td>${Math.round(r.generationMs)}</td><td>${r.estimatedCatalogGzipBytes}</td></tr>`,
	)
	.join("");
await writeFile(
	`${output}/pool-comparison.html`,
	`<!doctype html><html lang="en"><meta charset="utf-8"><title>Pool sizing comparison</title><style>body{font:16px system-ui;margin:30px}td,th{padding:12px;border-bottom:1px solid #ccc}select{font:inherit;margin:10px}</style><h1>Pool sizing simulation</h1><p>Provisional policy. Timings come from a throttled-page generator simulation; Chrome cannot throttle workers. Real-phone review pending. Every scenario has 100 game requests across the four browser-generated levels.</p><label>CPU throttle<select id="rate"><option>1</option><option>4</option><option>6</option></select></label><label>Scenario<select id="scenario"><option>coldSwitching</option><option>normalPlay</option><option>warmReload</option><option>rapidRestarts</option></select></label><table><tr><th>Starters / level</th><th>Cache / level</th><th>Cache hits</th><th>Fallbacks</th><th>Repeated starters</th><th>Generation ms</th><th>Estimated gzip bytes</th></tr>${rows}</table><p>Fallbacks use verified shipped puzzles and do not block play. Byte counts are representative calibration-record estimates. Read benchmark-summary.json for model assumptions.</p><script>function filter(){document.querySelectorAll('tr[data-rate]').forEach(r=>r.hidden=r.dataset.rate!==document.getElementById('rate').value||r.dataset.scenario!==document.getElementById('scenario').value)}document.querySelectorAll('select').forEach(e=>e.onchange=filter);filter();</script></html>`,
);
console.log(JSON.stringify(summaries, null, 2));
