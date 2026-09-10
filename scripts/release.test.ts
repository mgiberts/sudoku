import { describe, expect, it } from "vitest";
import { latestRelease, planRelease } from "./release";

const tags = [{ tag: "v1.2.3", commit: "previous" }];

describe("release versioning", () => {
	it("starts at v1.0.0 even for breaking changes", () => {
		expect(planRelease("first", [], "feat!: new game").tag).toBe("v1.0.0");
	});
	it.each([
		"fix: bug",
		"ci: deploy",
		"docs: help",
		"Refine settings",
		"",
	])("defaults to patch for %s", (message) => {
		expect(planRelease("next", tags, message).tag).toBe("v1.2.4");
	});
	it.each([
		"feat: game",
		"feat(settings): symbols",
		"Merge pull request #5\n\nfeat: game",
		"update [release:minor]",
	])("bumps minor for %s", (message) => {
		expect(planRelease("next", tags, message).tag).toBe("v1.3.0");
	});
	it.each([
		"feat!: game",
		"fix(storage)!: reset",
		"fix: data\n\nBREAKING CHANGE: reset",
		"BREAKING-CHANGE: reset",
		"update [release:major]",
		"feat: game\nfix!: reset\n[release:minor]",
	])("bumps major for %s", (message) => {
		expect(planRelease("next", tags, message).tag).toBe("v2.0.0");
	});
	it("sorts stable version tags numerically and ignores unrelated tags", () => {
		expect(
			latestRelease([
				{ tag: "v1.9.9", commit: "a" },
				{ tag: "v1.10.0", commit: "b" },
				{ tag: "v2.0.0-beta", commit: "c" },
				{ tag: "other", commit: "d" },
			])?.tag,
		).toBe("v1.10.0");
	});
	it("reuses a released commit without incrementing", () => {
		expect(planRelease("previous", tags, "feat!: game")).toEqual(tags[0]);
	});
	it("preserves the version and notes baseline on retry before or after tagging", () => {
		const saved = planRelease("next", tags, "feat: game");
		expect(planRelease("next", tags, "", saved)).toEqual(saved);
		expect(planRelease("next", [...tags, saved], "", saved)).toEqual(saved);
	});
	it("rejects a tag collision", () => {
		expect(() =>
			planRelease("next", tags, "", { commit: "next", tag: "v1.2.3" }),
		).toThrow("another commit");
	});
	it("rejects metadata from another commit or with an invalid version", () => {
		expect(() =>
			planRelease("next", tags, "", { commit: "wrong", tag: "v1.2.4" }),
		).toThrow("metadata");
		expect(() =>
			planRelease("next", tags, "", { commit: "next", tag: "invalid" }),
		).toThrow("metadata");
	});
	it("rejects saved versions superseded by a later release", () => {
		expect(() =>
			planRelease("next", tags, "", { commit: "next", tag: "v1.2.2" }),
		).toThrow("newer release");
	});
});
