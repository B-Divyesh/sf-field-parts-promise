# Verify parts allocation before promising a visit date — PASS

Verification date: 2026-09-06 UTC  
Live URL: <https://field-parts-promise.sociobot.in>

## Verdict

**PASS.** There are **0 findings** at every severity and **0 untested public
claims** for the currently shipped product. The failed deployment wrapper is
not a product defect: the live service is healthy and identifies the deployed
implementation below.

## Job, audience, and first action

- **Job:** decide whether a job visit date is safe from parts allocated to that
  job.
- **Audience:** small electrical, HVAC, and repair firms.
- **First action:** **Try it with sample data**. It opens Riverside Dental with
  one missing condensate pump.

Fresh desktop and 390×844 phone contexts showed that job, audience, action,
action result, and the three plain facts without scrolling. The first screen
has the required one H1, title, main landmark, skip link, and visible focus.

## Candidate and live identity

| Item | Value |
| --- | --- |
| Implementation reviewed | `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb` |
| Documentation checkout | `fc126c3617005146d0f57d4557f9df57f0df4880` |
| Difference | The later commit adds only verification/polish evidence and handoff material; it changes no product source. |
| Live `/health` | HTTP 200; `status: ok`, `database: sqlite`, `auth: ready`, and build SHA `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`. |

The live build therefore matches the implementation candidate. No repair is
requested for the failed wrapper because the product deployment is already
serving the correct build.

## Sample sandbox and core paths

- A fresh `/?demo=1` session created only `parts-promise-demo-v1`.
- The persistent label says the sample is demo data and nothing is saved to the
  local workspace. **Reset demo** and **Start for real** remain present.
- Demo Jobs, Privacy, and Terms links render `?demo=1`; a fresh new-tab
  `/jobs?demo=1` session retained the label and only the demo database.
- The realistic `RD-1042` Riverside Dental job began **Date at risk** with one
  missing pump. Allocating one pump from Van 2 changed it to **Parts in hand**
  and retained the source, quantity, updater, and checked time. Reset restored
  the shortage.
- A separately fresh demo context reloaded offline after its first online load
  and retained the sample, banner, and risk status.
- The declared invalid/boundary/recovery paths are covered by the fresh claim
  commands: invalid CSV preview, quantity/source conservation, undo,
  reset/exit isolation, offline retry/backoff, explicit quantity conflict,
  unpaid export boundary, and durable restart persistence all passed.

Evidence: `verification-artifacts-22/live/browser-qa.json`,
`first-read-desktop.png`, `first-read-mobile-390.png`,
`demo-allocated-desktop.png`, and `demo-mobile-390.png`.

## Claims and clean-checkout gates

A new clone at `fc126c3` installed its documented Node and Rust prerequisites.
Every exact command in `.factory/claims.json` was run separately. All 37
commands passed; none failed, skipped as a claim result, or remained untested.
The exact command/result table is
`verification-artifacts-22/claims-summary.tsv`, with one log per claim in
`verification-artifacts-22/claims/`.

| Gate | Result |
| --- | --- |
| `npm test` | PASS — 24 Vitest and 15 Rust tests |
| `npm run check` | PASS — 0 errors and 0 warnings |
| `npm run format:check` | PASS |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `BUILD_SHA=<clean checkout> npm run build` | PASS — created `dist/` and the release server |
| `BUILD_SHA=<clean checkout> npm run test:e2e -- --retries=0` | PASS — 61 passed, 43 expected project-specific skips |

## Live structure, accessibility, privacy, and performance

- Factory `verify-url.sh` passed on the live root: 628 ms load, valid title and
  `lang=en`, one H1, main landmark, complete image alternatives, labelled
  controls, and no normal-route console errors.
- Fresh Axe checks on `/`, `/demo`, `/jobs?demo=1`, `/privacy?demo=1`,
  `/terms?demo=1`, and the designed unknown route found 0 serious and 0
  critical issues. The unknown route deliberately returned HTTP 404 with the
  product's recovery page; that expected response is not a defect.
- Phone layout had no horizontal overflow, all first-screen copy was visible,
  and reduced-motion emulation was active. Desktop keyboard focus was visibly
  designed. The complete browser suite covers the full route/theme and
  keyboard/zoom matrix.
- Normal demo requests stayed same-origin. The app uses self-hosted fonts,
  scripts, images, and styles; the response CSP, HSTS, nosniff, frame denial,
  referrer policy, and camera-only permissions policy are live.
- All eight discovered same-origin landing links returned HTTP 200. `/privacy`,
  `/terms`, `/demo`, sitemap, robots, manifest, service worker, route titles,
  and designed 404 are present.
- Live Lighthouse mobile: **95 performance, 100 accessibility, 100 best
  practices, 100 SEO**.

`browser-qa.json` records one browser resource warning only while deliberately
opening the HTTP 404 route. A separate fresh root check and `verify-url.sh`
record zero console errors on normal routes.

## Backend checks

- `/health` is live and reports the reviewed build.
- Invalid bearer input to `/api/v1/bootstrap` returned `401` and
  `WWW-Authenticate: Bearer`.
- A 50-request unauthenticated read burst from one test forwarding address
  produced 40 `401` responses followed by 10 `429` responses with
  `Retry-After: 2`.
- The stricter export allowance produced five `401` responses followed by
  `429` with `Retry-After: 60`.
- Tenant isolation, idempotent sync, two-device sync, durable restart storage,
  and rate-limit policy each passed their independently executed claim command.
  No production restart or real tenant write was needed.

Evidence: `verification-artifacts-22/live/health.json`,
`api-rate-limits.json`, and `api-read-burst.json`.

## Earlier findings

I read the earlier reviews, verification reports, and the complete round-8
finding map. Current clean claims plus the live checks above confirm every
prior ID remains fixed:

| Earlier IDs | Current disposition | Current evidence |
| --- | --- | --- |
| F-1-1 through F-1-21 | Fixed | Full E2E, route/title/Axe checks, first-read screenshots, link crawl, and claim commands. |
| F-2-1 through F-2-6 | Fixed | Demo isolation/new-tab evidence, JSON/CSV claim commands, and designed 404 check. |
| F-3-1 through F-3-5 | Fixed | Full E2E focus/history coverage, fixture/backup/CSV claims, and persistent banner inspection. |
| F-5-1 through F-5-16 | Fixed | Public-claim command coverage, barcode/privacy claims, billing boundary claim, source/header inspection, and build identity checks. |
| F-6-1 through F-6-5 | Fixed | Demo exit, token validation, pricing/billing, response-policy, and runtime claims. |
| F-7-1 through F-7-2 | Fixed | Independently rerun idempotent-sync and offline-signed-in-sync claims. |
| F-8-1 | Fixed | Rendered demo links retain `?demo=1`; a fresh new-tab demo route retained the banner and only the demo database. |

That covers all 56 prior numbered findings. There are no unresolved minor
findings and no new finding.

## Current milestone and external dependencies

Current controller milestone: **M2 — Accounts, team sync, and recurring
billing**. The implementation and public promises that are shipped are
verified. M3 supplier-watch work and later milestones are planned work, not
acceptance requirements for this verification.

External dependency, separate from this PASS: M2 recurring-billing acceptance
still needs the operator to register a Sociobot recurring product that supports
the public $39/month firm plan and $8/month technician quantity, plus its
machine-verifiable entitlement/event contract. The product honestly says
checkout is unavailable and starts no charge; the verified current behavior is
therefore not a defect or an untested public claim. Entra callback discovery
and redirect smoke had already passed in the plan's risk record.

## Evidence index

- `verification-artifacts-22/claims-summary.tsv`
- `verification-artifacts-22/gates/summary.tsv`
- `verification-artifacts-22/gates/e2e-full.log`
- `verification-artifacts-22/verify-url/verify.json`
- `verification-artifacts-22/live/browser-qa.json`
- `verification-artifacts-22/live/lighthouse-mobile.json`
- `verification-artifacts-22/live/link-crawl.json`
- `verification-artifacts-22/live/api-rate-limits.json`
