import { readFile, writeFile } from "node:fs/promises";

const { chromium } = await import(
	process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.CALIBRATION_URL || "http://127.0.0.1:5173";
const directory = "scripts/output/calibration";
const workerMode = process.env.CALIBRATION_EXECUTION === "worker";
const captureName =
	process.env.CALIBRATION_CAPTURE_NAME ||
	(workerMode ? "browser-worker-baseline.json" : "browser-simulation.json");
const policy = JSON.parse(
	await readFile(`${directory}/proposed-policy.json`, "utf8"),
);
const perLevel = Number(process.env.CALIBRATION_REQUESTS || 100);
const browser = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
let report = {
	browser: await browser.version(),
	platform: process.platform,
	arch: process.arch,
	simulation: !workerMode,
	execution: workerMode
		? "actual-worker-baseline"
		: "generator-page-simulation",
	workerThrottlingSupported: false,
	policy,
	perLevel,
	runs: [],
	expert: null,
	phoneFeedback: "pending",
};
try {
	const saved = JSON.parse(
		await readFile(`${directory}/${captureName}`, "utf8"),
	);
	if (
		JSON.stringify(saved.policy) === JSON.stringify(policy) &&
		saved.perLevel === perLevel
	)
		report = { ...saved, resumed: true };
} catch {}
try {
	const page = await browser.newPage();
	await page.route("**/@vite/client", (route) => route.abort());
	await page.goto(`${base}/scripts/output/calibration/playtest.html`);
	const ratingVersion = await page.evaluate(
		async () => (await import("/src/difficultyRating.ts")).RATING_VERSION,
	);
	if (
		report.runs.some((run) =>
			Object.values(run.levels).some((samples) =>
				samples.some((s) => s.metrics.ratingVersion !== ratingVersion),
			),
		)
	) {
		report.runs = [];
		report.expert = null;
	}
	const cdp = await page.context().newCDPSession(page);
	if (workerMode)
		await page.evaluate(() => {
			window.calibrationWorker = new Worker("/src/calibrationWorker.ts", {
				type: "module",
			});
			window.askCalibration = (message) =>
				new Promise((resolve, reject) => {
					const timer = setTimeout(
						() => reject(Error("Worker did not respond")),
						20000,
					);
					window.calibrationWorker.onmessage = (e) => {
						clearTimeout(timer);
						resolve(e.data);
					};
					window.calibrationWorker.onerror = (e) => {
						clearTimeout(timer);
						reject(Error(e.message));
					};
					window.calibrationWorker.postMessage(message);
				});
		});
	for (const throttle of workerMode ? [1] : [1, 4, 6]) {
		await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
		const cpuProbe = await page.evaluate(() => {
			const measurements = [];
			for (let n = 0; n < 4; n++) {
				const start = performance.now();
				let sum = 0;
				for (let i = 0; i < 5000000; i++) sum += Math.sqrt(i);
				measurements.push({ durationMs: performance.now() - start, sum });
			}
			return measurements
				.slice(1)
				.map((m) => m.durationMs)
				.sort((a, b) => a - b)[1];
		});
		let run = report.runs.find((r) => r.throttle === throttle);
		if (!run) {
			run = { throttle, cpuProbe, levels: {} };
			report.runs.push(run);
		} else run.cpuProbe = cpuProbe;
		for (const difficulty of ["easy", "medium", "hard", "master"]) {
			const samples = run.levels[difficulty] ?? [];
			run.levels[difficulty] = samples;
			for (let n = samples.length; n < perLevel; n++) {
				const sample = await page.evaluate(
					async ({ difficulty, policy, seed, workerMode }) => {
						if (workerMode) {
							const { game, metrics } = await window.askCalibration({
								type: "generate",
								difficulty,
								policy,
								seed,
							});
							return { metrics, assessment: game?.assessment, id: game?.id };
						}
						const { generateRatedGame } = await import(
							"/src/puzzleGeneration.ts"
						);
						const { game, metrics } = generateRatedGame(difficulty, {
							policy,
							seed,
							runtime: "browser-simulation",
						});
						return { metrics, assessment: game?.assessment, id: game?.id };
					},
					{ difficulty, policy, seed: 200000 + n * 1000, workerMode },
				);
				samples.push(sample);
				if (n % 20 === 0) {
					console.log(
						JSON.stringify({ throttle, difficulty, requests: n + 1 }),
					);
					await writeFile(
						`${directory}/${captureName}`,
						JSON.stringify(report),
					);
				}
			}
			run.levels[difficulty] = samples;
			await writeFile(`${directory}/${captureName}`, JSON.stringify(report));
		}
	}
	await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
	report.expert = await page.evaluate(async () => {
		const start = performance.now();
		const { curatedExpertGames } = await import(
			"/src/generated/curatedExpert.v1.ts"
		);
		const loadedMs = performance.now() - start;
		const { assessEffort } = await import("/src/effortRating.ts");
		const ratingStart = performance.now();
		const profiles = curatedExpertGames.map(
			(g) => assessEffort(g.puzzle).assessment,
		);
		return {
			count: profiles.length,
			loadedMs,
			profileMs: performance.now() - ratingStart,
			logicalCompletions: profiles.filter((p) => p.status === "solved").length,
		};
	});
	report.cpuSlowdownRatios = report.runs.map(
		(r) => r.cpuProbe / report.runs[0].cpuProbe,
	);
	report.cpuThrottlingVerified = workerMode
		? null
		: report.cpuSlowdownRatios[1] >= 2 && report.cpuSlowdownRatios[2] >= 3;
	await writeFile(`${directory}/${captureName}`, JSON.stringify(report));
	console.log(
		JSON.stringify({
			cpuThrottlingVerified: report.cpuThrottlingVerified,
			cpuSlowdownRatios: report.cpuSlowdownRatios,
			expert: report.expert,
		}),
	);
} finally {
	await browser.close();
}
