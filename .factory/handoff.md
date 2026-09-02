# Parts Promise round 8 handoff

- Date: 2026-09-02 UTC
- Work order: `field-parts-promise-polish-8`
- Base review: `ca4e368d72ecbe1a5c22e792aeffda54264b1dea`
- Repaired source/deployed build:
  `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`
- Live URL: <https://field-parts-promise.sociobot.in>

## What changed

- Fixed F-8-1 at the URL boundary. Every demo-mode Jobs, Privacy, and Terms
  anchor now renders a real `?demo=1` target, including both footer links.
- Changed internal navigation to follow the anchor's rendered URL. Modified
  clicks remain native, so opening a demo link in a new tab cannot silently
  switch to real mode.
- Extended the single `@claim:demo-reset-isolated` test to inspect every demo
  href, open all affected links in native new tabs, require the persistent demo
  banner, and prove that neither `parts-promise-live-v1` nor
  `parts-promise-cloud-v1` is created.
- Updated the registered claim, README demo guidance, `.factory/demo.md`, and
  the copy audit to state the verified new-tab behavior.
- Replaced the catalog line with the verb-first 57-character sentence:
  “Allocate parts to each job before promising a visit date.”
- Preserved the blueprint/service-drawing visual system and the existing
  Svelte + Rust/SQLite container architecture.
- Added `.factory/polish-8.md` with a finding-by-finding map for every review
  ID from rounds 1–8.

## Clean-clone verification

Fresh clone: `/tmp/field-parts-promise-polish8.D3OOx4/repo` at the repaired
source commit. `npm ci` completed with zero vulnerabilities.

Every exact command in `.factory/claims.json` ran separately from that clone:
**37 declared, 37 passed, 0 failed**. The compact result is in
`.factory/evidence/polish-8/clean-claims/summary.json`.

The same clone also passed:

```sh
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm audit --audit-level=high
BUILD_SHA=$(git rev-parse HEAD) npm run build
BUILD_SHA=$(git rev-parse HEAD) npm run test:e2e -- --retries=0
```

Results: 24 Vitest tests, 15 Rust tests, and 61 Playwright tests passed. The
browser run reported 43 expected cross-project skips and no failure. Svelte
reported zero errors and warnings. The release build produced `dist/`.

Build output remained inside the performance budgets:

- initial route JavaScript: 3.05 kB gzip
- preload helper: 16.89 kB gzip
- app entry: 23.49 kB gzip
- deferred CIAM bundle: 62.19 kB gzip
- initial CSS: 2.37 kB gzip; app CSS: 4.24 kB gzip

## Live verification

Deployment command:

```sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

The fleet built image tag `sf-field-parts-promise:0f05f4d44b88`, updated only
`sf-field-parts-promise`, retained the product's durable
`sf-field-parts-promise-data` mount at `/data`, kept one replica, and completed
with HTTP 200. `/health` reports:

```json
{"status":"ok","build_sha":"0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb","database":"sqlite","auth":"ready"}
```

Cold production checks then passed:

- `/demo` created only `parts-promise-demo-v1`.
- The rendered demo links were `/jobs?demo=1`, `/privacy?demo=1`, and
  `/terms?demo=1`.
- Native new tabs from header Jobs, header Privacy, footer Privacy, and footer
  Terms all retained the banner and still exposed only the demo database.
- `/demo`, `/jobs?demo=1`, `/privacy?demo=1`, and `/terms?demo=1` contained no
  real-mode internal href except the intentional wordmark exit.
- An offline reload retained the sample, banner, and isolated database.
- Ten routes had the expected title, one H1, one main, canonical, legal links,
  and zero serious or critical Axe findings. The unknown route returned 404.
- All observed browser requests were same-origin GET/HEAD requests. No
  unexpected console error or page error occurred.
- The factory verifier passed `/` and `/demo` with title, `lang=en`, one H1,
  one main, image alternatives, labelled buttons, and zero console errors.
- Lighthouse mobile scored 97 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.4 s, CLS 0.022, and TBT 190 ms.
- Security headers include CSP, HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`. Hashed assets
  use immutable caching while HTML revalidates.

Evidence is under `.factory/evidence/polish-8/live/`, especially
`audit.json`, `demo-new-tab.png`, `demo-offline.png`, both `verify-*` reports,
and `lighthouse-mobile.json`.

## Known gaps and next steps

No round 1–8 review finding remains. No code or deployment follow-up is needed
for this repair.

The existing product-plan boundary remains explicit: recurring Sociobot
billing registration is unavailable, so checkout stays visibly disabled and
starts no charge. This is covered by `@claim:subscription-checkout`; no direct
payment-provider integration was added.
