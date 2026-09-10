import { execFileSync } from "node:child_process";
import {
	appendFileSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { latestRelease, planRelease, type ReleasePlan } from "./release";

const run = (command: string, args: string[]) =>
	execFileSync(command, args, { encoding: "utf8" }).trim();
const git = (...args: string[]) => run("git", args);
const [mode, metadataPath] = process.argv.slice(2);
if (!metadataPath || !["resolve", "publish"].includes(mode)) {
	throw new Error(
		"Usage: bun scripts/release-cli.ts <resolve|publish> <metadata-path>",
	);
}
const commit = git("rev-parse", "HEAD");
if (commit !== process.env.GITHUB_SHA) {
	throw new Error("Checkout must match the workflow's exact commit.");
}
git("fetch", "origin", "--tags");
const tags = git("tag", "--list", "v*")
	.split("\n")
	.filter(Boolean)
	.map((tag) => ({
		tag,
		commit: git("rev-parse", `${tag}^{commit}`),
	}));
const latest = latestRelease(tags);
if (latest) {
	// This also rejects unrelated histories and retries of older deployments.
	git("merge-base", "--is-ancestor", latest.commit, commit);
}
const saved: ReleasePlan | undefined = existsSync(metadataPath)
	? JSON.parse(readFileSync(metadataPath, "utf8"))
	: undefined;
const messages = git(
	"log",
	"--format=%B",
	latest ? `${latest.tag}..${commit}` : commit,
);
const plan = planRelease(commit, tags, messages, saved);

if (mode === "resolve") {
	writeFileSync(metadataPath, `${JSON.stringify(plan)}\n`);
	if (!process.env.GITHUB_ENV) throw new Error("GITHUB_ENV is required.");
	appendFileSync(
		process.env.GITHUB_ENV,
		`VITE_APP_VERSION=${plan.tag.slice(1)}\n`,
	);
	console.log(`Building ${plan.tag} at ${plan.commit}`);
} else {
	if (!saved)
		throw new Error("Resolve and persist release metadata before deploying.");
	if (!tags.some(({ tag }) => tag === plan.tag)) {
		git(
			"-c",
			"user.name=github-actions[bot]",
			"-c",
			"user.email=41898282+github-actions[bot]@users.noreply.github.com",
			"tag",
			"-a",
			plan.tag,
			plan.commit,
			"-m",
			plan.tag,
		);
		git("push", "origin", `refs/tags/${plan.tag}`);
	}
	const repository = process.env.GITHUB_REPOSITORY;
	if (!repository) throw new Error("GITHUB_REPOSITORY is required.");
	const releases = run("gh", [
		"api",
		"--paginate",
		`repos/${repository}/releases`,
		"--jq",
		".[].tag_name",
	]).split("\n");
	if (!releases.includes(plan.tag)) {
		run("gh", [
			"release",
			"create",
			plan.tag,
			"--verify-tag",
			"--title",
			plan.tag,
			"--generate-notes",
			...(plan.previousTag ? ["--notes-start-tag", plan.previousTag] : []),
		]);
	}
	console.log(`Published ${plan.tag} at ${plan.commit}`);
}
