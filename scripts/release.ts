export type ReleaseTag = { tag: string; commit: string };
export type ReleasePlan = ReleaseTag & { previousTag?: string };

const tagPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function latestRelease(tags: ReleaseTag[]): ReleaseTag | undefined {
	return tags
		.filter(({ tag }) => tagPattern.test(tag))
		.sort((a, b) => {
			const left = a.tag.slice(1).split(".").map(Number);
			const right = b.tag.slice(1).split(".").map(Number);
			return right[0] - left[0] || right[1] - left[1] || right[2] - left[2];
		})[0];
}

export function planRelease(
	commit: string,
	tags: ReleaseTag[],
	messages: string,
	saved?: ReleasePlan,
): ReleasePlan {
	const latest = latestRelease(tags);
	if (saved) {
		if (saved.commit !== commit || !tagPattern.test(saved.tag)) {
			throw new Error("Saved release metadata does not match this deployment.");
		}
		const existing = tags.find(({ tag }) => tag === saved.tag);
		if (existing && existing.commit !== commit) {
			throw new Error(`Release tag ${saved.tag} belongs to another commit.`);
		}
		if (
			latest &&
			latest.tag !== saved.tag &&
			latestRelease([latest, saved]) === latest
		) {
			throw new Error(
				"A newer release already exists; refusing a stale deployment.",
			);
		}
		return saved;
	}
	if (latest?.commit === commit) return latest;
	if (!latest) return { commit, tag: "v1.0.0" };
	const version = latest.tag.slice(1).split(".").map(Number);
	const major =
		/\[release:major\]|^[a-z]+(?:\([^\r\n)]+\))?!:|^BREAKING[ -]CHANGE:/m.test(
			messages,
		);
	const minor = /\[release:minor\]|^feat(?:\([^\r\n)]+\))?:/m.test(messages);
	const next = major
		? [version[0] + 1, 0, 0]
		: minor
			? [version[0], version[1] + 1, 0]
			: [version[0], version[1], version[2] + 1];
	return { commit, tag: `v${next.join(".")}`, previousTag: latest.tag };
}
