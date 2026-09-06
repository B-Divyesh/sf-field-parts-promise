# Verify parts allocation before promising a visit date — review 9

- Review date: 2026-09-06 UTC
- Work order: `field-parts-promise-review-9`
- Live URL: <https://field-parts-promise.sociobot.in>
- Implementation reviewed: `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`
- Documentation checkout: `05ed65a61535cb508ef19d8da9b603b6de1bf2b4`

## Verdict

**PASS — 0 findings at every severity and 0 untested public claims.**

The live product matches the implementation candidate, the one-click sample is
isolated and realistic, all 37 declared claim commands pass independently from
a clean checkout, and the full local and live review gates pass. The deliberate
HTTP 404 is a correct not-found response, not a defect. The earlier failed
deployment wrapper does not require repair because the live service is healthy
and serves the reviewed implementation.

## Job, audience, and first action

I opened `/` without scrolling in fresh 1440×900 desktop and 390×844 phone
browser contexts.

- **Job:** decide whether a visit date is safe from parts allocated to that job.
- **Audience:** small electrical, HVAC, and repair firms.
- **First action:** **Try it with sample data**. The adjacent text says it opens
  Riverside Dental with one missing pump.

Both first screens also showed the offline, browser-storage, and exact-price
facts. The phone's final fact ended at y=701 inside the 844 px viewport. Neither
viewport had horizontal overflow. The title is **Parts Promise — Allocate parts
to each job**, and the H1 is **Promise dates from parts held for the job**.

Evidence: `review-artifacts-9/first-read-desktop.png`,
`first-read-mobile.png`, and `live-review.json`.

## Candidate and live identity

| Item | Result |
| --- | --- |
| Last product implementation | `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb` |
| Current documentation commit | `05ed65a61535cb508ef19d8da9b603b6de1bf2b4` |
| Source comparison | `git diff 0f05f4d..05ed65a` contains only reports, handoff material, and evidence; no product source, test, claim, or README change. |
| Live `/health` | HTTP 200; `status: ok`, `database: sqlite`, `auth: ready`, build `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`. |

The live runtime therefore matches the last implementation candidate. Later
report-only commits do not require a new image.

## Current milestone and external dependency

The controller stage is **building-m2**. M2 currently ships accounts, firm
isolation, team invitations, multi-device sync, durable offline retry, explicit
conflict handling, data export/deletion controls, rate limits, metrics, and the
honest unavailable-checkout boundary. The implemented manual and camera barcode
path is also present. Planned supplier watch, notifications, richer import,
sharing, and later milestone work were not treated as current promises.

The separate external dependency is recurring Sociobot billing registration for
the $39/month firm plan plus $8/month per active technician and its entitlement
event contract. The public product correctly says checkout is unavailable and
no charge starts. That operator dependency is not a defect in the current
shipped behavior.

## One-click sample and data boundary

- One click opened Riverside Dental job `RD-1042` with the visit date, three
  required parts, and one missing condensate pump already populated.
- The persistent label said **Demo — sample data; nothing is saved to your local
  workspace** and kept **Reset demo** and **Start for real** visible.
- The initial status was **Date at risk** because the pump needed one unit.
- Allocating one unit from Van 2 changed the status to **Parts in hand**. The
  output retained job `RD-1042`, source `Van 2`, quantity `1 each`, updater
  `Field demo`, and the checked time. It also showed the zero-stock reorder
  suggestion and stated that no supplier order was placed.
- Reset returned the job to **Date at risk** with `0 each held of 1 each`.
- The only browser database present throughout was
  `parts-promise-demo-v1`; no live or cloud workspace database was created.
- Every rendered Jobs, Privacy, and Terms link included `demo=1`. A fresh
  `/jobs?demo=1` tab retained the label and only the demo database. This proves
  the review-8 regression remains fixed.
- A separate fresh context reloaded the sample offline after its first online
  visit.

Evidence: `review-artifacts-9/demo-allocated-desktop.png`, `demo-mobile.png`,
and `live-review.json`.

## Declared public claims

A fresh clone at documentation commit `05ed65a…` installed the documented
Node 22/npm 10 and stable Rust prerequisites with `npm ci`. Every exact `test`
command from `.factory/claims.json` then ran separately with no retry. No claim
failed or remained untested.

| # | Claim | Result |
| ---: | --- | --- |
| 1 | `sample-fixture` | PASS |
| 2 | `promise-status-from-allocation` | PASS |
| 3 | `allocation-keeps-source` | PASS |
| 4 | `supplier-quantity-conserved` | PASS |
| 5 | `reorder-after-allocation` | PASS |
| 6 | `demo-reset-isolated` | PASS |
| 7 | `offline-reload` | PASS |
| 8 | `local-workspace-flow` | PASS |
| 9 | `demo-feature-boundaries` | PASS |
| 10 | `indexeddb-local-storage` | PASS |
| 11 | `demo-network-privacy` | PASS |
| 12 | `manual-barcode-allocation` | PASS |
| 13 | `camera-barcode-privacy` | PASS |
| 14 | `release-order-boundary` | PASS |
| 15 | `clear-local-records` | PASS |
| 16 | `workspace-backup-roundtrip` | PASS |
| 17 | `csv-import-validation` | PASS |
| 18 | `demo-transfer-isolated` | PASS |
| 19 | `csv-template-download` | PASS |
| 20 | `entra-sign-in` | PASS |
| 21 | `tenant-data-isolation` | PASS |
| 22 | `two-device-sync` | PASS |
| 23 | `idempotent-sync` | PASS |
| 24 | `offline-signed-in-sync` | PASS |
| 25 | `sync-conflict-resolution` | PASS |
| 26 | `invitation-email-activation` | PASS |
| 27 | `account-service-boundaries` | PASS |
| 28 | `sensitive-input-boundary` | PASS |
| 29 | `audit-log-recording` | PASS |
| 30 | `firm-deletion-hold` | PASS |
| 31 | `response-policy` | PASS |
| 32 | `subscription-checkout` | PASS |
| 33 | `technician-seat-charge` | PASS |
| 34 | `expired-plan-keeps-export` | PASS |
| 35 | `durable-runtime-storage` | PASS |
| 36 | `visible-build-identity` | PASS |
| 37 | `container-runtime` | PASS |

The registry has 37 unique IDs and the source contract test confirms exactly
one matching tagged test for each ID. The landing page, app routes, legal copy,
demo guide, and README were compared with the registry and copy audit. No
missing, false, incomplete, or untested public claim was found.

Evidence: `review-artifacts-9/claims-summary.json` and one command log per claim
under `review-artifacts-9/claims/`.

## Normal, invalid, boundary, and recovery paths

- **Normal:** create a local job and source, allocate and undo a quantity, add
  supplier-date evidence, scan or enter `CP-19`, sync to a second device, and
  export a workspace all passed.
- **Invalid:** CSV row validation, invalid/expired/wrong-signature/wrong-issuer/
  wrong-audience/wrong-tenant tokens, unmatched invitation email, and unpaid
  cloud writes were rejected with their tested recovery paths.
- **Boundary:** one supplier-order unit could cover only one job; the owner used
  no technician seat; the export allowance stopped after five requests; and a
  stale quantity revision could not overwrite shared evidence.
- **Recovery:** undo, demo reset and exit, JSON backup restore, browser-data
  clearing, offline reload, durable outbox reload/reconnect/backoff, deletion
  cancellation, explicit sync conflict, and SQLite process restart all passed.

The tests used isolated temporary databases and test identities. No production
firm record was created, read, changed, or deleted.

## Accessibility, routes, privacy, offline, and performance

- Eleven live routes had `lang=en`, one H1, one main, one canonical, route-
  specific titles, legal links, and zero serious or critical Axe findings.
- The unknown route deliberately returned HTTP 404 with the designed product
  page, recovery links, legal links, and the correct title.
- The first Tab reached the skip link with a visible focus outline; Enter moved
  focus to main. The full suite also passed keyboard allocation, dialog focus
  containment/restoration, history focus and scroll restoration, 44 px phone
  targets, 200% text reflow, both themes, and reduced-motion checks.
- All eight discovered same-origin landing links returned HTTP 200. Privacy and
  Terms were live, titled correctly, and accessible.
- The normal sample flow made only same-origin GET/HEAD requests. It made no
  API write, analytics, remote-font, payment, or camera request. Camera use is
  covered separately and begins only after **Use camera**.
- The service worker's offline reload passed, and the full browser suite passed
  its current-worker/no-pending-update check.
- Factory URL verification passed `/` and `/demo` with no console errors.
- Fresh mobile Lighthouse scored **98 performance, 100 accessibility, 100 best
  practices, and 100 SEO**. LCP was **1.4 s**, CLS **0.022**, and TBT **150 ms**.
- The production build's first-load JS is below 200 KB. Account code remains a
  deferred chunk. The two fonts total about 56 KB.
- Live HTML and `sw.js` revalidate. The current fingerprinted primary script
  returns `public, max-age=31536000, immutable`. CSP, HSTS, `nosniff`, strict
  referrer policy, frame denial, and camera-only permissions policy are live.

Evidence: `review-artifacts-9/live-review.json`, both `verify-*` directories,
`lighthouse-mobile.json`, and the full E2E log.

## Backend and installed runtime

- Live `/health` returned the implementation SHA and SQLite/auth readiness.
- Invalid bearer input returned 401 and `WWW-Authenticate: Bearer`.
- A concurrent 60-request read burst from one reserved test address produced
  40 responses at the authentication boundary, then 20 HTTP 429 responses.
  Every 429 had `Retry-After: 2`.
- A concurrent seven-request export burst produced five authentication
  responses, then two HTTP 429 responses with `Retry-After: 60`.
- Clean tests proved firm A cannot read firm B, repeated sync is idempotent, a
  second signed-in device receives saved data, and unpaid firms keep export.
- The compiled server started with only `PORT`, served the built app and build
  identity, enforced rate limits, and returned HTTP 404 for unknown paths.
- `deploy.json` specifies `/data` and one replica. The restart claim created
  SQLite and the generated metrics token in a temporary data directory,
  restarted the real server against that directory, and read the firm again.
  A production restart was unnecessary and was not performed.

Evidence: `review-artifacts-9/live-backend.json`, the `tenant-data-isolation`,
`idempotent-sync`, `two-device-sync`, `expired-plan-keeps-export`,
`durable-runtime-storage`, and `container-runtime` claim logs.

## Earlier finding disposition

All review reports 1–8, polish reports, handoff history, and verification
reports were inspected. Review 4 had no findings. The 56 previously tracked
review items, including minor items and legacy `F7-01`, remain fixed:

| Earlier group | Current proof | Disposition |
| --- | --- | --- |
| F-1-1 through F-1-21 | Live first read/routes/404; metadata, copy, focus/history, accessibility, price, team, and claims tests. | Fixed |
| F-2-1 through F-2-4 | Demo cleanup/isolation, transfer/backup, missing-job 404, and work-sheet focus tests. | Fixed |
| F-3-1 through F-3-6 | Scroll restoration, exact sample fixture, full backup comparison, CSV template, banner wording, and terminology audit. | Fixed |
| F-5-1 through F-5-16 | Complete claim coverage, barcode paths, runtime claims, plain billing copy, source/title terms, footer build, and explicit checkout action. | Fixed |
| F-6-1 through F-6-5 | Mode-state clearing, five invalid-token cases, accurate pricing heading, plain rate-limit copy, and PORT-only runtime. | Fixed |
| F-7-1, F-7-2, and F7-01 | Plain retry/offline wording plus full 44 px phone-target test. | Fixed |
| F-8-1 | Every rendered demo Jobs/Privacy/Terms href has `demo=1`; fresh-tab storage remained demo-only. | Fixed |

Earlier verification failures also remain closed:

- Claims completeness, touch targets, immutable caching, Docker base/build
  contract, Permissions Policy, and real HTTP 404 all passed current checks.
- The former cold `container-runtime` timeout did not recur in any exact claim
  command or the full no-retry run.
- Supplier ETA evidence and modal focus paths passed.
- Earlier deployment mismatches are superseded by the live implementation SHA;
  current later commits are demonstrably report-only.
- The hyphenated Vite asset now receives immutable caching.
- The former mobile LCP failure is closed by the fresh 1.4 s result.

No earlier minor finding remains open, and this review found no new issue.

## Quality gates

| Gate | Result |
| --- | --- |
| 37 exact claim commands | PASS — 37 passed, 0 failed, 0 untested |
| `npm test` | PASS — 24 Vitest and 15 Rust tests |
| `npm run check` | PASS — 0 errors and 0 warnings |
| `npm run format:check` | PASS |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| release build | PASS — `dist/` and optimized Rust server produced |
| full Playwright, no retries | PASS — 61 passed, 43 expected project-specific skips |
| live factory verifier | PASS on `/` and `/demo` |
| live Lighthouse mobile | PASS — 98/100/100/100; LCP 1.4 s |

## Findings

None. Finding count: **0**. Untested public claim count: **0**.
