// @vitest-environment node
import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const cli = resolve("scripts/release-cli.ts");
const directories: string[] = [];
afterEach(() => {
	for (const directory of directories.splice(0))
		rmSync(directory, { recursive: true, force: true });
});

function fixture() {
	const root = mkdtempSync(join(tmpdir(), "sudoku-release-"));
	directories.push(root);
	const cwd = join(root, "repo");
	const remote = join(root, "remote.git");
	mkdirSync(cwd);
	const git = (...args: string[]) =>
		execFileSync("git", args, {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
	git("init", "--bare", remote);
	git("init", "-b", "main");
	git("config", "user.name", "Release Test");
	git("config", "user.email", "release@example.test");
	git("remote", "add", "origin", remote);
	git("commit", "--allow-empty", "-m", "Initial commit");
	git("push", "origin", "main");
	const bin = join(root, "bin");
	mkdirSync(bin);
	// Simulate GitHub publication, including an interruption after the tag push.
	writeFileSync(
		join(bin, "gh"),
		`#!/bin/sh
if [ "$1" = api ]; then
  if [ -f "$TEST_RELEASE" ]; then cat "$TEST_RELEASE"; fi
elif [ "$1" = release ] && [ "$2" = create ]; then
  if [ "$TEST_FAIL_PUBLISH" = 1 ]; then exit 1; fi
  echo "$3" > "$TEST_RELEASE"
  echo created >> "$TEST_CALLS"
else
  exit 1
fi
`,
		{ mode: 0o755 },
	);
	const metadata = join(root, "release.json");
	const run = (mode: string, failPublish = false) =>
		execFileSync("bun", [cli, mode, metadata], {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				PATH: `${bin}:${process.env.PATH}`,
				GITHUB_SHA: git("rev-parse", "HEAD"),
				GITHUB_ENV: join(root, "env"),
				GITHUB_REPOSITORY: "test/sudoku",
				TEST_RELEASE: join(root, "published"),
				TEST_CALLS: join(root, "calls"),
				TEST_FAIL_PUBLISH: failPublish ? "1" : "0",
			},
		});
	return { root, git, run, metadata };
}

describe("release workflow commands", () => {
	it("resolves without publishing, recovers after a publication failure, and reruns idempotently", () => {
		const { root, git, run, metadata } = fixture();
		run("resolve");
		expect(git("tag", "--list")).toBe("");
		expect(readFileSync(join(root, "env"), "utf8")).toContain(
			"VITE_APP_VERSION=1.0.0",
		);
		const saved = readFileSync(metadata, "utf8");
		expect(() => run("publish", true)).toThrow();
		expect(git("ls-remote", "--tags", "origin")).toContain("refs/tags/v1.0.0");
		run("resolve");
		expect(readFileSync(metadata, "utf8")).toBe(saved);
		run("publish");
		run("publish");
		expect(readFileSync(join(root, "calls"), "utf8")).toBe("created\n");
		expect(git("rev-parse", "v1.0.0^{commit}")).toBe(git("rev-parse", "HEAD"));
	});
	it("releases a feature as minor and rejects an older deployment", () => {
		const { git, run, metadata } = fixture();
		run("resolve");
		run("publish");
		rmSync(metadata);
		git("commit", "--allow-empty", "-m", "feat(settings): add symbols");
		git("push", "origin", "main");
		run("resolve");
		expect(JSON.parse(readFileSync(metadata, "utf8")).tag).toBe("v1.1.0");
		run("publish");
		git("checkout", "v1.0.0");
		expect(() => run("resolve")).toThrow();
	});
});
