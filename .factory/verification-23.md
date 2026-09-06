# Verify parts before promising a visit date — verification 23

- Verification date: 2026-09-06 UTC
- Work order: `field-parts-promise-verify-23`
- Current milestone: M3
- Live URL: <https://field-parts-promise.sociobot.in>
- Implementation reviewed: `b6a9c49dd239911807b4f7bcd22f63106244d3f3`
- Documentation checkout: `40766071e5464eef46db29bf89eb69e818c86128`

## Verdict

**PASS — 0 findings at every severity and 0 untested public claims.**

The M3 job works on the live phone and desktop site. All 44 declared claim
commands passed independently from a clean checkout. The full local and live
checks passed. No product code or deployment was changed by this verification.

The live health endpoint reports documentation SHA `40766071…`, not the
implementation SHA named in the work order. This is not a product mismatch.
The only changes from `b6a9c49…` to `40766071…` are `.factory/handoff-m3.md`
and `.factory/handoff.md`. A fresh production build matched the live index,
app, and CIAM chunks byte for byte after normalizing only the build label and
its generated chunk reference. The implementation reviewed remains
`b6a9c49…`; the observed live image was rebuilt from the documentation-only
commit.

## First screen before scrolling

Fresh 1440 × 900 desktop and 390 × 844 phone browser contexts opened `/` at
scroll position zero.

- Job: **Promise dates from parts held for the job**.
- Audience: small trade firms that need a parts check before agreeing a visit
  date.
- First action: **Try it with sample data**.
- The adjacent outcome says it opens Riverside Dental with one missing pump.

All four items fit before scrolling in both viewports. The phone had no
horizontal overflow at its normal text size.

Evidence: `verification-artifacts-23/live-browser.json`,
`first-read-desktop.png`, and `first-read-mobile.png`.

## One-click sample and M3 job

One click opened the isolated Riverside Dental job `RD-1042`. The job showed
one unallocated condensate pump and **Date at risk**. The demo label remained
visible, and the only browser database was `parts-promise-demo-v1`.

The live flow then passed these checks:

- Manual barcode `CP-19` matched the condensate pump.
- Allocating one unit from Van 2 changed the status to **Parts in hand**.
- The reorder result said no supplier order had been placed.
- A supplier record expected after the visit kept the job **Date at risk** and
  appeared on the supplier-date screen.
- The generated supplier-order detail route returned 200 with title
  `Supplier order — Parts Promise` and one H1.
- Reset restored the original shortage and **Date at risk**.
- Reset left only the demo database. No live or cloud database was created.
- Demo Jobs, Privacy, and Terms links kept `demo=1`; a fresh legal-page tab
  retained the demo label and demo-only storage.

The exact claim tests also covered fitted and moved allocations, stale supplier
evidence, a dismissed reorder, a draft order line, batched offline writes, and
two-device allocation conflicts.

## Declared claims

The clean checkout was `/tmp/field-parts-promise-verify23.JdxLUM/repo` at
`40766071…`. It installed the documented prerequisites with `npm ci`. Every
exact `test` value in `.factory/claims.json` then ran as its own command with
no retry.

| # | Claim ID | Result |
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
| 12 | `manual-barcode-fallback` | PASS |
| 13 | `camera-frames-not-sent` | PASS |
| 14 | `scan-finds-local-part` | PASS |
| 15 | `supplier-eta-warns-date` | PASS |
| 16 | `stale-evidence-needs-check` | PASS |
| 17 | `offline-write-syncs-once` | PASS |
| 18 | `double-allocation-opens-conflict` | PASS |
| 19 | `field-quantity-actions` | PASS |
| 20 | `reorder-draft-boundary` | PASS |
| 21 | `release-order-boundary` | PASS |
| 22 | `clear-local-records` | PASS |
| 23 | `workspace-backup-roundtrip` | PASS |
| 24 | `csv-import-validation` | PASS |
| 25 | `demo-transfer-isolated` | PASS |
| 26 | `csv-template-download` | PASS |
| 27 | `entra-sign-in` | PASS |
| 28 | `tenant-data-isolation` | PASS |
| 29 | `two-device-sync` | PASS |
| 30 | `idempotent-sync` | PASS |
| 31 | `offline-signed-in-sync` | PASS |
| 32 | `sync-conflict-resolution` | PASS |
| 33 | `invitation-email-activation` | PASS |
| 34 | `account-service-boundaries` | PASS |
| 35 | `sensitive-input-boundary` | PASS |
| 36 | `audit-log-recording` | PASS |
| 37 | `firm-deletion-hold` | PASS |
| 38 | `response-policy` | PASS |
| 39 | `subscription-checkout` | PASS |
| 40 | `technician-seat-charge` | PASS |
| 41 | `expired-plan-keeps-export` | PASS |
| 42 | `durable-runtime-storage` | PASS |
| 43 | `visible-build-identity` | PASS |
| 44 | `container-runtime` | PASS |

The registry has 44 unique IDs and exactly one matching tagged test per ID.
The landing copy, application copy, legal pages, README, demo guide, and copy
audit were compared with the registry. No missing, false, incomplete, or
untested public claim was found.

Evidence: `verification-artifacts-23/claims-summary.json` and the 44 logs in
`verification-artifacts-23/claims/`.

## Normal, invalid, boundary, and recovery checks

- Normal: local job and source creation, allocation, undo, barcode matching,
  supplier evidence, move, fitted state, draft reorder, second-device sync,
  and export passed.
- Invalid: excess allocation quantity showed “Only 1 each is still needed”; an
  unknown barcode, invalid CSV row, wrong or expired tokens, unmatched invite,
  and unpaid cloud write were rejected with a clear next action.
- Boundary: one supplier unit covered only one job; no supplier-order action or
  endpoint exists; one owner used no technician seat; the export allowance
  stopped after five requests; and a later allocation could not spend the last
  shared quantity twice.
- Recovery: undo, reset, demo exit, JSON restore, browser-data clearing,
  offline reload, reconnect retry and backoff, conflict choice, deletion
  cancellation, and SQLite process restart passed.

## Mobile, keyboard, accessibility, privacy, and offline behavior

- The first Tab on live desktop and phone reached **Skip to main content**.
  Its live focus ring was a 3 px purple outline with a 3 px offset.
- A keyboard-only phone flow opened the sample, selected Van 2, allocated the
  pump, and reached **Parts in hand**. Reset-dialog focus stayed inside the
  dialog and returned safely after the action.
- The full suite checked 44 px phone targets and 8 px grouped spacing.
- Reduced-motion mode set all three motion tokens to `0s`.
- A 200% text rendering at 390 px kept every content and control box within the
  viewport. A decorative page edge extended the scroll area by 10 px, but no
  text or control was clipped or outside the viewport.
- Fourteen live route loads had the expected title, `lang=en`, one H1, one
  main landmark, one canonical, and zero serious or critical Axe findings.
  Local coverage repeated the route matrix in both themes on desktop and
  phone.
- The deliberate unknown route returned HTTP 404 with the designed page,
  recovery links, and `Page not found — Parts Promise` title. This is expected
  behavior, not a defect.
- Every same-origin link found on the landing page returned 200. Privacy and
  Terms loaded with their route titles.
- The normal live demo allocation and reset made nine same-origin GET/HEAD
  requests, no cross-origin request, no write request, and no camera request.
- The current service worker controlled the page, had no installing or waiting
  worker, and used `parts-promise-shell-v6`. A fresh offline reload completed
  the sample allocation to **Parts in hand**.
- The factory URL verifier passed `/` and `/demo` with no console errors,
  missing image alternatives, or unlabelled buttons.

## Backend and storage

- Live `/health` returned 200, SQLite readiness, auth readiness, and observed
  build `40766071…`.
- An invalid live bearer token returned 401 with `WWW-Authenticate: Bearer`.
- A 60-request live read burst returned 40 authentication responses followed
  by 20 HTTP 429 responses. Every 429 had `Retry-After: 2`.
- A seven-request live export burst returned five authentication responses and
  two HTTP 429 responses. Every 429 had `Retry-After: 60`.
- Clean tests proved tenant isolation, idempotent sync, second-device sync,
  unpaid export access, and safe quantity conflict handling.
- The runtime claim started the real server with only `PORT`, served the app
  and build identity, enforced 429 responses, and returned the designed 404.
- The restart claim created SQLite and the generated metrics token in a fresh
  data directory, restarted the server against it, and read the firm again.
- `deploy.json` still specifies one replica and `/data`. The verifier did not
  restart the live service or read another service's settings.

Evidence: `verification-artifacts-23/live-backend.json`, the relevant claim
logs, and `runtime-parity.txt`.

## Quality and performance gates

| Gate | Result |
| --- | --- |
| `npm test` | PASS — 27 Vitest and 15 Rust tests |
| `npm run check` | PASS — 0 errors and 0 warnings |
| `npm run format:check` | PASS |
| Clippy with `-D warnings` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` and release server produced |
| Full Playwright, no retries | PASS — 68 passed, 50 expected project skips |
| Live factory verifier | PASS on `/` and `/demo` |
| Lighthouse mobile | PASS — 96 performance, 100 accessibility, 100 best practices, 100 SEO |

Lighthouse measured LCP 1.4 seconds, CLS 0.022, total blocking time 230 ms,
and 118 KiB total transfer. The landing bundle is 6.92 kB JavaScript plus a
43.31 kB preload helper before the deferred application. Initial CSS is 8.18
kB. The two self-hosted fonts total 56.44 kB.

## Earlier finding disposition

All earlier review and verification reports were checked. Review 4 had no
findings. Every tracked item remains closed.

| Earlier items | Current proof | Disposition |
| --- | --- | --- |
| F-1-1 through F-1-21 | Live first read, metadata, focus, route, price, copy, claim, and 404 checks | Fixed |
| F-2-1 through F-2-4 | Demo cleanup, backup/import, missing-route, and work-sheet focus checks | Fixed |
| F-3-1 through F-3-6 | History, exact fixture, full backup comparison, CSV template, banner, and terminology checks | Fixed |
| F-5-1 through F-5-16 | Provider boundaries, barcode paths, storage claims, plain billing copy, build identity, and explicit checkout checks | Fixed |
| F-6-1 through F-6-5 | Mode clearing, invalid-token matrix, pricing, rate-limit wording, and PORT-only runtime | Fixed |
| F-7-1, F-7-2, and F7-01 | Retry/offline wording, outbox behavior, and phone target checks | Fixed |
| F-8-1 | Every demo Jobs/Privacy/Terms link keeps `demo=1`, including a fresh tab | Fixed |

Earlier verification failures also remain closed. The live service is SQLite,
the runtime matches the candidate code, hashed assets use immutable caching,
the Docker/runtime contract passes, Permissions Policy is restrictive, and
mobile Lighthouse is 96 with LCP 1.4 seconds. No earlier minor item regressed.

## Current milestone and external dependencies

M3 is accepted. It ships scanning with manual fallback, supplier-date evidence,
move/fitted actions, draft-only reorder records, offline batching, and safe
allocation conflicts. M1 and M2 behavior remains green.

Recurring billing remains an operator dependency. The public offer is $39 per
month plus $8 per active technician. Checkout truthfully says it is unavailable
and starts no charge. No direct payment-provider action exists.

Supplier integration is not connected. Parts Promise records evidence and
draft lines; it does not place orders or guarantee availability. Messaging and
the remaining operations work belong to later milestones and are not presented
as shipped.

## Findings

None.

- Finding count: **0**
- Untested public claim count: **0**
