import { copyFile, mkdir } from "node:fs/promises";

const output = "docs/workflow/difficulty-calibration";
await mkdir(output, { recursive: true });
for (const name of [
	"corpus.json",
	"proposed-policy.json",
	"review.json",
	"playtest.html",
	"reviewer.html",
	"phone.html",
])
	await copyFile(`scripts/output/calibration/${name}`, `${output}/${name}`);
console.log(`Prepared ${output}`);
