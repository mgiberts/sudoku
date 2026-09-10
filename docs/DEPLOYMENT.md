# Deployment

Sudoku is hosted as static assets on Cloudflare Workers with a custom subdomain.
The GitHub Actions workflow deploys after updates to `main`, including merged pull
requests. Pull requests run verification and the build without deploying. A manual
`workflow_dispatch` deploys only when run on `main`.

## Versions and GitHub releases

Every successful deployment of a new commit on `main` creates a `vX.Y.Z` Git tag
on that exact commit and publishes a GitHub Release with generated notes. The
first release is **v1.0.0**. Direct pushes follow the same rules as merged PRs.
The settings footer shows the version embedded in the deployed build.

Tags are the source of truth for release versions. `package.json` stays at the
initial `1.0.0` baseline; CI does not push version-bump commits. Local and PR
builds display `v1.0.0-dev`. CI supplies `VITE_APP_VERSION` without the `v` prefix
to build the production version.

Subsequent releases inspect commit messages since the previous release:

| Message | Bump | Example from v1.2.3 |
| --- | --- | --- |
| `feat: ...` or `feat(settings): ...` | Minor | v1.3.0 |
| `feat!: ...`, `fix(storage)!: ...`, or a `BREAKING CHANGE:` / `BREAKING-CHANGE:` line | Major | v2.0.0 |
| `[release:minor]` / `[release:major]` anywhere in the message | Minor / major | v1.3.0 / v2.0.0 |
| Everything else, including `fix:`, `ci:`, `docs:`, or ordinary text | Patch | v1.2.4 |

The highest detected bump wins. Put the prefix in the PR title and preserve it
in the merge or squash commit message. Individual commits count when their
history is retained; text discarded by squash merging does not count. No PR
label lookup or Conventional Commits enforcement is required.

Production workflows queue without canceling an active deployment. Verification
must pass before the version is resolved and the release build is deployed. Only
after Wrangler succeeds are the tag and release published. The production job
uses the built-in GitHub token with `contents: write` and `actions: read`; PR
verification retains read-only access. Repository rules must permit this workflow
to create `v*` tags.

The resolved commit, version, and previous tag are saved as a workflow artifact
before deployment (retained for 90 days). Rerunning a failed workflow restores
that metadata, reuses matching tags/releases, and can finish an interrupted
publication. A failed verification or deployment publishes nothing. If GitHub
publication fails after deployment, the site already runs the resolved version;
rerun the failed job to finish publishing it. Conflicting tags and deployments
older than the latest release fail instead of overwriting releases or rolling
the site back. A manual run on an already released commit redeploys the same
version; an unreleased commit gets the next version.

## GitHub configuration

Configure these under repository Settings → Secrets and variables → Actions:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Account containing the domain and Sudoku Worker |
| Secret | `SUDOKU_HOSTNAME` | Full Sudoku subdomain, without a scheme or path |
| Secret | `CLOUDFLARE_API_TOKEN` | Dedicated deployment API token |

Scope the token to the deployment account and domain. It needs Account → Workers
Scripts → Edit, Account → Account Settings → Read, Zone → Zone → Read, and Zone →
Workers Routes → Edit. Store it directly in GitHub; do not commit it or reuse an
interactive OAuth login as the CI credential.

The workflow checks formatting, TypeScript, and tests, builds `dist/`, then generates
an explicit Wrangler configuration in the runner's temporary directory. Only
`dist/` is uploaded. Secrets let GitHub mask the account ID and hostname from the
start of each step, including environment output. Default Workers and preview URLs
are disabled. Wrangler is pinned to
avoid unreviewed CLI behavior changes.

The real hostname and account ID belong in GitHub configuration or a private local
configuration outside the checkout. Keep them out of source files, README links,
screenshots, commit messages, and public deployment metadata. GitHub variable access
and log masking are not a guarantee of anonymity. Use secrets for private deployment
values; ordinary Actions variables can appear in logs before explicit masking runs.

## Local verification

```sh
bun install --frozen-lockfile
bun run pr:check
bun run build
```

CI uses Node 22. If a newer local Node exposes an unavailable native `localStorage`,
run checks with `env NODE_OPTIONS=--no-experimental-webstorage bun run pr:check`.

For a manual release, use an explicit private Wrangler configuration with the
intended account, custom domain, and absolute path to this checkout's `dist/`:

```sh
bunx wrangler@4.131.0 deploy --config /path/outside/checkout/wrangler.json --dry-run
bunx wrangler@4.131.0 deploy --config /path/outside/checkout/wrangler.json
```

Do not rely on automatic project detection or run creation commands from a generic
temporary directory: Wrangler may discover unrelated assets.

After deployment, verify HTTPS, asset loading, starting a game, and Settings. Saved
games and settings use browser local storage and remain on the old origin when the
hostname changes; there is no automatic cross-origin migration.

The GitHub Pages workflow is replaced. Removing it does not unpublish the old site;
retiring that deployment also requires changing the repository's Pages settings.

- [Static assets](https://developers.cloudflare.com/workers/static-assets/)
- [Custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
