# Deployment

Sudoku is hosted as static assets on Cloudflare Workers with a custom subdomain.
The GitHub Actions workflow deploys after updates to `main`, including merged pull
requests. Pull requests run verification and the build without deploying. A manual
`workflow_dispatch` deploys only when run on `main`.

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
