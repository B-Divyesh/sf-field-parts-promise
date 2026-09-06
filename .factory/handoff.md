# Parts Promise M3 handoff

Current milestone: **M3 implementation complete; awaiting independent
acceptance.**

Implementation and deployed SHA:
`b6a9c49dd239911807b4f7bcd22f63106244d3f3`. It adds only the planned M3
field scanning, supplier evidence, fitted/move actions, draft-only reorder
records, offline operation batching, and safe quantity conflict flows. It
preserves the accepted M1/M2 behavior and product SQLite storage.

Verification: 44/44 exact manifest claim commands passed separately; full
Playwright passed 68 checks with 50 intentional skips; 27 Vitest and 15 Rust
tests passed; build, format, Clippy, high-severity audit, live verifier, live
Axe matrix, phone/desktop sample flow, designed 404, and live 429 with
`Retry-After` passed. HTTPS `/health` reports this implementation SHA.

The deployment retained one replica and the
`sf-field-parts-promise-data` `/data` mount. The full M3 record, including
commands, live evidence, and honest boundaries, is in
`.factory/handoff-m3.md`.

External dependencies: recurring Sociobot billing registration for the public
$39/month Firm plan plus $8/month active technician remains unavailable.
Checkout stays disabled and starts no charge. Supplier evidence remains local;
no supplier order or availability guarantee is claimed. The M4 operations work
is still planned, not shipped.

## Previous handoffs

# Parts Promise review 9 handoff

## Strict review 9 — 2026-09-06 UTC

Verdict: **PASS — 0 findings and 0 untested public claims.** No product code or
deployment changed. The live service reports implementation
`0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`; the reviewed documentation
checkout is `05ed65a61535cb508ef19d8da9b603b6de1bf2b4`. Their difference is
report and evidence material only.

Fresh 1440×900 desktop and 390×844 phone contexts showed the parts-allocation
job, small-trade-firm audience, one-click sample action, outcome, and all three
facts before scrolling. The Riverside Dental sample moved from Date at risk to
Parts in hand after a one-unit Van 2 allocation, retained its full evidence,
reset to the shortage, and kept only the demo browser database. Rendered legal
and Jobs links retained `demo=1` in a fresh tab.

Verification from a fresh clone at `05ed65a…`:

- 37/37 exact claim commands passed separately with no retries.
- `npm test`, Svelte check, format check, Clippy with warnings denied, npm
  audit, release build, and full Playwright passed. Results were 24 Vitest, 15
  Rust, and 61 Playwright passes with 43 expected cross-project skips.
- Eleven live routes passed title, landmark, canonical, legal-link, HTTP status,
  and serious/critical Axe checks. The unknown route correctly returned 404.
- Factory verification passed `/` and `/demo`; normal routes had no console or
  page error and browser requests stayed same-origin GET/HEAD.
- Fresh Lighthouse mobile scored 98 performance and 100 in accessibility, best
  practices, and SEO; LCP was 1.4 s, CLS 0.022, and TBT 150 ms.
- Live read and export bursts returned 429 with positive Retry-After after their
  documented allowances. Clean claims passed tenant isolation, restart
  persistence, PORT-only startup, and SQLite `/data` behavior.

Detailed results and evidence are in `.factory/review-9.md` and
`.factory/review-artifacts-9/`.

Current controller milestone: **M2**. The separate operator dependency remains
recurring Sociobot billing registration for the $39/month firm plan plus $8 per
active technician and its entitlement event contract. Public checkout honestly
says it is unavailable and no charge starts. Planned supplier-watch and later
milestone capabilities were not treated as shipped promises.

## Earlier round 8 handoff

## Independent verification 22 — 2026-09-06 UTC

Verdict: **PASS** for the currently shipped product. The implementation
reviewed is `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`; the checkout used
`fc126c3617005146d0f57d4557f9df57f0df4880`, which differs only in
documentation/evidence. Live `/health` reports the implementation SHA.

Fresh desktop and phone checks established the job (allocate job-specific
parts before promising a visit date), audience (small trade firms), and first
action (Try it with sample data). The sample opens Riverside Dental with a
missing pump, retains the demo banner, preserves `demo=1` in new-tab internal
links, allocates to Parts in hand, resets, and reloads offline without creating
real workspace storage.

Verification from a fresh clone:

- 37/37 exact registered claim commands passed; no untested public claim.
- `npm test`, Svelte check, formatting, Clippy, high-severity npm audit,
  release build, and full E2E passed. The full run reports 61 passed and 43
  expected project-specific skips; `dist/` was produced.
- Live `verify-url.sh`, six-route Axe sweep, links/routes/legal/404/PWA checks,
  privacy/header checks, and live rate-limit checks passed.
- Lighthouse mobile: 95 performance, 100 accessibility, 100 best practices,
  and 100 SEO.

No product repair is needed for the reported deployment-wrapper failure: the
live service serves `0f05f4d…` and `/health` is healthy. Detailed evidence is
in `.factory/verification-22.md` and
`.factory/verification-artifacts-22/`.

Current milestone: M2. External dependency: recurring billing needs operator
registration of a Sociobot product supporting the $39/month firm plan plus
$8/month active-technician quantity and its event contract. The current public
copy accurately says checkout is unavailable and no charge starts. M3 and
later planned work are not presented as shipped capabilities.

How to verify: run `npm ci`, then every command in `.factory/claims.json`,
`npm test`, `npm run check`, `npm run format:check`,
`cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`,
`npm audit --audit-level=high`, `npm run build`, and
`npm run test:e2e -- --retries=0`. For the deployed page, run
`/opt/fleet/lib/verify-url.sh https://field-parts-promise.sociobot.in <output-dir>`.

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
