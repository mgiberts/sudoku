import { readFile, writeFile } from "node:fs/promises";
import {
	calibrationConfig,
	type DifficultyPolicy,
	difficultyPolicy,
} from "../src/difficultyPolicy";
import { RATING_VERSION } from "../src/difficultyRating";
import { effortRejection } from "../src/effortRating";
import type { CalibrationRecord } from "./calibrate-difficulty";

const directory = "scripts/output/calibration";
const corpus = JSON.parse(
	await readFile(`${directory}/corpus.json`, "utf8"),
) as { records: CalibrationRecord[]; attempts: number; version: number };
if (
	corpus.version !== difficultyPolicy.version ||
	corpus.records.some((r) => r.assessment.ratingVersion !== RATING_VERSION)
)
	throw new Error(
		"Regenerate the corpus for the current policy and solver versions",
	);
const quantile = (values: number[], q: number) =>
	[...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * q)];
const categories = ["singles", "hard", "master", "expert"] as const;
for (const c of categories)
	if (
		corpus.records.filter((r) => r.assessment.repertoire === c).length <
		calibrationConfig.perRepertoire
	)
		throw new Error(`Incomplete ${c} corpus`);
const singles = corpus.records.filter(
	(r) => r.assessment.repertoire === "singles",
);
const split = quantile(
	singles.map((r) => r.assessment.profile.singlesScore),
	0.5,
);
const policy: DifficultyPolicy = structuredClone(difficultyPolicy);
const samples: {
	sample: number;
	proposedLevel: string;
	record: CalibrationRecord;
}[] = [];
const summary: Record<string, unknown> = {};
for (const level of ["easy", "medium", "hard", "master", "expert"] as const) {
	const pool = corpus.records.filter(
		(r) =>
			r.assessment.repertoire === policy.levels[level].repertoire &&
			(level === "easy"
				? r.assessment.profile.singlesScore < split
				: level === "medium"
					? r.assessment.profile.singlesScore >= split
					: true),
	);
	const score = (r: CalibrationRecord) =>
		level === "easy" || level === "medium"
			? r.assessment.profile.singlesScore
			: r.assessment.profile.episodes.length;
	pool.sort(
		(a, b) =>
			score(a) - score(b) ||
			a.assessment.profile.progressBands - b.assessment.profile.progressBands ||
			a.id.localeCompare(b.id),
	);
	if (pool.length < calibrationConfig.playtestPerLevel)
		throw new Error(`Too few ${level} examples after split`);
	const scores = pool.map(score);
	policy.levels[level].effort =
		level === "easy" || level === "medium"
			? {
					minScore: level === "easy" ? 0 : split,
					maxScore:
						level === "easy"
							? split
							: calibrationConfig.scarcityWeight +
								calibrationConfig.hiddenEpisodeWeight +
								0.000001,
					minEpisodes: 0,
					minProgressBands: 0,
				}
			: {
					minScore: 0,
					maxScore: Number.MAX_SAFE_INTEGER,
					minEpisodes: Math.max(2, quantile(scores, 0.25)),
					minProgressBands: level === "expert" ? 2 : 1,
				};
	summary[level] = {
		count: pool.length,
		scoreQuartiles: [0.25, 0.5, 0.75].map((q) => quantile(scores, q)),
		clueRange: [
			Math.min(...pool.map((r) => r.clues)),
			Math.max(...pool.map((r) => r.clues)),
		],
		provisional: policy.levels[level].effort,
	};
	const selected = Array.from(
		{ length: calibrationConfig.playtestPerLevel },
		(_, i) =>
			pool[
				Math.round(
					(i * (pool.length - 1)) / (calibrationConfig.playtestPerLevel - 1),
				)
			],
	);
	const qualified = pool.filter(
		(r) => !effortRejection(level, r.assessment, policy),
	);
	if (qualified.length < 3)
		throw new Error(`Need more qualifying ${level} samples for review`);
	// Preserve low/high contrasts, but always include examples that meet the
	// provisional sustained policy; quantiles alone can miss rare distributed episodes.
	for (const candidate of qualified) {
		if (
			selected.filter((r) => !effortRejection(level, r.assessment, policy))
				.length >= 3
		)
			break;
		if (selected.includes(candidate)) continue;
		const index = selected
			.map((r, i) =>
				i > 0 &&
				i < selected.length - 1 &&
				effortRejection(level, r.assessment, policy)
					? i
					: -1,
			)
			.reduce((a, b) => Math.max(a, b), -1);
		if (index >= 0) selected[index] = candidate;
	}
	summary[level] = {
		...(summary[level] as object),
		qualifyingCount: qualified.length,
	};
	for (const record of selected)
		samples.push({ sample: samples.length + 1, proposedLevel: level, record });
}
await writeFile(
	`${directory}/proposed-policy.json`,
	JSON.stringify(policy, null, 2),
);
await writeFile(
	`${directory}/review.json`,
	JSON.stringify(
		{
			status: "awaiting human playtest and phone feedback",
			attempts: corpus.attempts,
			summary,
			samples,
		},
		null,
		2,
	),
);
const data = JSON.stringify(
	samples.map((s) => ({
		sample: s.sample,
		id: s.record.id,
		puzzle: s.record.puzzle,
	})),
).replaceAll("<", "\\u003c");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sudoku playtest</title><style>body{font:16px system-ui;max-width:650px;margin:24px auto;padding:12px;background:#f5f7fa;color:#192333}button,select,input,textarea{font:inherit}#board{display:grid;grid-template-columns:repeat(9,1fr);border:2px solid #192333;max-width:450px;margin:20px 0}#board input{box-sizing:border-box;width:100%;aspect-ratio:1;text-align:center;font-size:24px;border:1px solid #ccd1d8;border-radius:0;background:white;color:#1755ad}#board input:disabled{color:#192333;background:#edf0f4;font-weight:bold}#board input:nth-child(3n){border-right:2px solid #192333}#board input:nth-child(n+19):nth-child(-n+27),#board input:nth-child(n+46):nth-child(-n+54){border-bottom:2px solid #192333}label{display:block;margin:12px 0}textarea{display:block;width:95%}button{margin:6px;padding:8px}small{display:block}</style><h1>Sudoku playtest</h1><p>Play without hints or a solver. Record where the puzzle feels demanding. Technique summaries and proposed levels are in the separate reviewer report.</p><label>Sample <select id="sample"></select></label><div id="board" aria-label="Sudoku board"></div><p id="timer"></p><button id="pause">Pause / resume</button><label>Felt difficulty <select id="difficulty"><option value="">Choose</option><option>Very easy</option><option>Easy</option><option>Moderate</option><option>Hard</option><option>Very hard</option></select></label><label>Challenge pattern <select id="pattern"><option value="">Choose</option><option>Mostly straightforward</option><option>One breakthrough</option><option>Intermittent challenge</option><option>Repeated demanding reasoning</option></select></label><label>Did you feel you needed to guess? <select id="guess"><option value="">Choose</option><option>No</option><option>Yes</option><option>Stopped before finishing</option></select></label><label>Notes<textarea id="notes" rows="3"></textarea></label><button id="export">Export progress and feedback</button><small>Progress stays in this browser. Export before clearing browser storage. The timer measures active time in this page; proposed labels and solutions are hidden.</small><script>
const samples=${data},key='sudoku.calibration.playtest.v2';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}let current=0,paused=false,last=Date.now();
const el=id=>document.getElementById(id);const persist=()=>{try{localStorage.setItem(key,JSON.stringify(saved))}catch{}};
const state=()=>saved[samples[current].id]??={values:samples[current].puzzle.split('').map(x=>x==='0'?'':x),seconds:0,difficulty:'',pattern:'',guess:'',notes:''};
function render(){const s=state();el('board').replaceChildren();samples[current].puzzle.split('').forEach((v,i)=>{const input=document.createElement('input');input.inputMode='numeric';input.maxLength=1;input.disabled=v!=='0';input.value=s.values[i];input.setAttribute('aria-label','Row '+(Math.floor(i/9)+1)+', column '+(i%9+1));input.oninput=()=>{input.value=input.value.replace(/[^1-9]/g,'').slice(-1);s.values[i]=input.value;persist()};el('board').append(input)});for(const id of ['difficulty','pattern','guess','notes'])el(id).value=s[id];last=Date.now()}
samples.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent='Sample '+s.sample;el('sample').append(o)});el('sample').onchange=()=>{current=Number(el('sample').value);render()};for(const id of ['difficulty','pattern','guess','notes'])el(id).oninput=()=>{state()[id]=el(id).value;persist()};el('pause').onclick=()=>{paused=!paused;last=Date.now()};setInterval(()=>{const now=Date.now();if(!paused&&!document.hidden)state().seconds+=(now-last)/1000;last=now;el('timer').textContent=(paused?'Paused · ':'Active time · ')+Math.floor(state().seconds)+' seconds';persist()},1000);el('export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({policyVersion:2,userAgent:navigator.userAgent,feedback:saved},null,2)],{type:'application/json'}));a.download='sudoku-playtest-feedback.json';a.click();URL.revokeObjectURL(a.href)};render();
</script></html>`;
await writeFile(`${directory}/playtest.html`, html);
const rows = samples
	.map((s) => {
		const p = s.record.assessment.profile;
		return `<tr><td>${s.sample}</td><td>${s.proposedLevel}</td><td>${effortRejection(s.proposedLevel as keyof typeof policy.levels, s.record.assessment, policy) ?? "qualifies"}</td><td>${s.record.clues}</td><td>${s.record.strongestTechnique}</td><td>${p.episodes.length}</td><td>${p.progressBands}</td><td>${p.singlesScore.toFixed(3)}</td><td>${p.episodes.map((e) => Math.round(e.progress * 100) + "%").join(", ")}</td></tr>`;
	})
	.join("");
await writeFile(
	`${directory}/reviewer.html`,
	`<!doctype html><html lang="en"><meta charset="utf-8"><title>Calibration review</title><style>body{font:16px system-ui;margin:30px}td,th{padding:10px;border-bottom:1px solid #ccc;text-align:left}table{border-collapse:collapse}</style><h1>Provisional difficulty review</h1><p>Keep this separate from play. These labels and thresholds are proposals, not player-validated ratings.</p><table><tr><th>Sample</th><th>Proposed level</th><th>Preview admission</th><th>Clues</th><th>Strongest technique</th><th>Episodes</th><th>Progress bands</th><th>Singles effort</th><th>Episode positions</th></tr>${rows}</table></html>`,
);
console.log(JSON.stringify(summary, null, 2));
