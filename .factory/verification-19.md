# Verification 19 — PASS

Date: 2026-09-02 UTC

Work order: `field-parts-promise-verify-19`

Candidate: `a0d9af536f7a981249123658846e74f2e8f9d28e`

Live URL: <https://field-parts-promise.sociobot.in>

## Verdict

**PASS — accept this candidate.** The clean candidate and live deployment pass
the mandatory claims, first-read/demo gate, core parts-promise workflow,
supplier-date boundary, local and shared-data boundaries, accessibility,
privacy, offline/PWA behavior, backend limits, build identity, caching, and
performance budgets.

No product code, infrastructure, DNS, billing configuration, production
records, or durable `/data` contents were changed during verification.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Mandatory first checks

### Claims manifest

`.factory/claims.json` exists. Before other QA, all 37 declared test commands
were run separately from the clean candidate checkout through the product's
demo/test entry point. Result: **37 passed, 0 failed**.

| Claim | Result | Evidence |
| --- | --- | --- |
| `sample-fixture` | PASS | `verification-artifacts-19/claims/sample-fixture.log` |
| `promise-status-from-allocation` | PASS | `verification-artifacts-19/claims/promise-status-from-allocation.log` |
| `allocation-keeps-source` | PASS | `verification-artifacts-19/claims/allocation-keeps-source.log` |
| `supplier-quantity-conserved` | PASS | `verification-artifacts-19/claims/supplier-quantity-conserved.log` |
| `reorder-after-allocation` | PASS | `verification-artifacts-19/claims/reorder-after-allocation.log` |
| `demo-reset-isolated` | PASS | `verification-artifacts-19/claims/demo-reset-isolated.log` |
| `offline-reload` | PASS | `verification-artifacts-19/claims/offline-reload.log` |
| `local-workspace-flow` | PASS | `verification-artifacts-19/claims/local-workspace-flow.log` |
| `demo-feature-boundaries` | PASS | `verification-artifacts-19/claims/demo-feature-boundaries.log` |
| `indexeddb-local-storage` | PASS | `verification-artifacts-19/claims/indexeddb-local-storage.log` |
| `demo-network-privacy` | PASS | `verification-artifacts-19/claims/demo-network-privacy.log` |
| `manual-barcode-allocation` | PASS | `verification-artifacts-19/claims/manual-barcode-allocation.log` |
| `camera-barcode-privacy` | PASS | `verification-artifacts-19/claims/camera-barcode-privacy.log` |
| `release-order-boundary` | PASS | `verification-artifacts-19/claims/release-order-boundary.log` |
| `clear-local-records` | PASS | `verification-artifacts-19/claims/clear-local-records.log` |
| `workspace-backup-roundtrip` | PASS | `verification-artifacts-19/claims/workspace-backup-roundtrip.log` |
| `csv-import-validation` | PASS | `verification-artifacts-19/claims/csv-import-validation.log` |
| `demo-transfer-isolated` | PASS | `verification-artifacts-19/claims/demo-transfer-isolated.log` |
| `csv-template-download` | PASS | `verification-artifacts-19/claims/csv-template-download.log` |
| `entra-sign-in` | PASS | `verification-artifacts-19/claims/entra-sign-in.log` |
| `tenant-data-isolation` | PASS | `verification-artifacts-19/claims/tenant-data-isolation.log` |
| `two-device-sync` | PASS | `verification-artifacts-19/claims/two-device-sync.log` |
| `idempotent-sync` | PASS | `verification-artifacts-19/claims/idempotent-sync.log` |
| `offline-signed-in-sync` | PASS | `verification-artifacts-19/claims/offline-signed-in-sync.log` |
| `sync-conflict-resolution` | PASS | `verification-artifacts-19/claims/sync-conflict-resolution.log` |
| `invitation-email-activation` | PASS | `verification-artifacts-19/claims/invitation-email-activation.log` |
| `account-service-boundaries` | PASS | `verification-artifacts-19/claims/account-service-boundaries.log` |
| `sensitive-input-boundary` | PASS | `verification-artifacts-19/claims/sensitive-input-boundary.log` |
| `audit-log-recording` | PASS | `verification-artifacts-19/claims/audit-log-recording.log` |
| `firm-deletion-hold` | PASS | `verification-artifacts-19/claims/firm-deletion-hold.log` |
| `response-policy` | PASS | `verification-artifacts-19/claims/response-policy.log` |
| `subscription-checkout` | PASS | `verification-artifacts-19/claims/subscription-checkout.log` |
| `technician-seat-charge` | PASS | `verification-artifacts-19/claims/technician-seat-charge.log` |
| `expired-plan-keeps-export` | PASS | `verification-artifacts-19/claims/expired-plan-keeps-export.log` |
| `durable-runtime-storage` | PASS | `verification-artifacts-19/claims/durable-runtime-storage.log` |
| `visible-build-identity` | PASS | `verification-artifacts-19/claims/visible-build-identity.log` |
| `container-runtime` | PASS | `verification-artifacts-19/claims/container-runtime.log` |

The machine-readable roll-up is
`.factory/verification-artifacts-19/claims-summary.json`.

### Cold first-read and one-click demo

**PASS.** A fresh production browser showed, without scrolling on desktop and
within the first 390 px mobile screen content block:

- What it does: **“Promise dates from parts held for the job.”**
- Who it serves: **“For small trade firms that need a parts check before
  agreeing a visit date.”**
- What to click: **“Try it with sample data.”**
- What happens: **“Opens Riverside Dental with one missing pump.”**

The one-click action opened `/?demo=1`, then loaded `Riverside Dental parts`,
job `RD-1042`, the missing condensate pump, and the persistent demo banner.

## Clean local verification

The starting checkout was clean and exactly at the candidate SHA.

```text
npm ci
  PASS; 85 packages installed; 0 vulnerabilities
npm test
  PASS; 23 Vitest tests and 15 Rust tests
npm run check
  PASS; 0 errors and 0 warnings
npm run format:check
  PASS
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
  PASS
BUILD_SHA=a0d9af536f7a981249123658846e74f2e8f9d28e npm run build
  PASS; dist/ and optimized Rust server produced
BUILD_SHA=a0d9af536f7a981249123658846e74f2e8f9d28e npm run test:e2e -- --retries=0
  PASS; 59 passed, 43 intentional project-specific skips
```

Docker/Podman is not installed in the verifier container. The repository's
exact production build passed, and `@claim:container-runtime` started the real
compiled server with only `PORT`, then checked health, compiled assets, 404,
rate limiting, and the Dockerfile contract. The Dockerfile uses `rust:1-slim`,
a defaulted `BUILD_SHA`, a non-root distroless runtime, and no `.git` input.

## Deployment identity and parity

`npm run verify:live-identity` passed. Production `/health` returned:

```json
{"status":"ok","build_sha":"a0d9af536f7a981249123658846e74f2e8f9d28e","database":"sqlite","auth":"ready"}
```

After the test runner's own temporary build was restamped with the candidate
SHA, all 15 checked local/live artifacts matched byte-for-byte by SHA-256:
HTML, initial JS, CSS, service worker, manifest, fonts, icons, hero/social art,
404 fallback, robots, and sitemap. Route footers show `a0d9af53` with the full
SHA available. Stable routes return 200 and an unknown route returns the
designed HTTP 404.

## Product behavior and recovery

- The sample begins **Date at risk** with one missing condensate pump.
- Quantity `2` is rejected with “Only 1 each is still needed for this job.”
  Correcting it to `1` from Van 2 succeeds and changes the status to **Parts
  in hand**.
- The resulting reorder warning says Van 2 has zero pumps, minimum one, and
  **“No supplier order has been placed.”**
- Reset is a focused confirmation and restores the exact sample and **Date at
  risk**.
- Supplier evidence dated 2026-09-01 for the 2026-09-02 visit produces
  **Expected before visit**. Evidence dated 2026-09-03 stays **Date at risk**
  and explains that it misses the visit buffer.
- Claim tests additionally passed local job/source creation, allocate/undo,
  reload persistence, barcode manual/camera paths, supplier quantity
  conservation, JSON backup/restore, CSV preview/error recovery, two-device
  sync, idempotency, offline outbox retry, conflict handling, invitation
  activation, audit export, deletion hold/cancel, and unpaid-plan export.

## Accessibility, keyboard, and responsive checks

- The factory `verify-url.sh` passed: HTTP 200, title, `lang=en`, one H1, main
  landmark, alt text, labelled buttons, and no console errors.
- A fresh production matrix covered 9 routes × 2 themes × desktop/390 px: 36
  route checks, **0 serious or critical Axe findings**, one H1 and main per
  route, no horizontal overflow, no console/page errors, and no visible mobile
  link/button below 44×44 px.
- A keyboard-only 390 px flow used Tab, Enter, and Space to operate the skip
  link, open the sample, reach the missing pump, choose Van 2, and allocate it
  to **Parts in hand**. The focus ring is a 3 px purple outline with 3 px
  offset. Dialog focus containment/restoration also passed the complete suite.
- At 200% root text size on a 390 px viewport, the document remained 390 px
  wide with no tested text or control outside the viewport.
- Under `prefers-reduced-motion: reduce`, all three motion tokens resolve to
  `0s`.

## Privacy, identity, headers, and PWA

- Cold landing → demo → invalid quantity → correction → allocation → reset
  made seven requests. Every request was a same-origin GET with no body; there
  were no console or page errors. The camera privacy claim separately passed
  explicit-use timing, stopped tracks, and no frame/cross-origin transfer.
- Live sign-in requested only the shared Sociobot authority
  `sociobotcustomers.ciamlogin.com`, tenant
  `35c6fe40-0ec0-46b6-98c6-213ad4de6650`, client
  `25c704f4-465a-47af-80ab-2c489466b697`, production callback, authorization
  code, and PKCE S256. Invalid-token checks return 401 with
  `WWW-Authenticate: Bearer` when the request body reaches authentication.
- All product links returned 200. Every stable route had its route-specific
  title, canonical URL, description, and product social image. No page exposed
  a password or payment-card input.
- Responses include CSP, HSTS, `nosniff`, frame denial, strict referrer policy,
  and camera-self-only permissions policy. HTML, health, 404, and `sw.js` are
  no-cache; hashed JS/CSS are `public, max-age=31536000, immutable`.
- The service worker controlled the app, had no installing/waiting worker, and
  owned only `parts-promise-shell-v6`. An explicit update check succeeded.
  Offline reload then allocated the sample pump to **Parts in hand**.

## Backend limits and persistence

The claim suite passed the 100-request server smoke, tenant isolation,
idempotency, mount-safe SQLite mode, and restart persistence in a temporary
data directory. Production was not restarted and no production record was
written.

Fresh live requests from one client at a time observed:

| Bucket | Observed allowance | Excess response | `Retry-After` |
| --- | ---: | ---: | ---: |
| Critical export | 5 per 60 seconds | sixth request: 429 | 60 seconds |
| Read/bootstrap | 40 per 2 seconds | next 10 of 50: 429 | 2 seconds |
| Write/sync | 10 per 2 seconds | next 10 of 20: 429 | 2 seconds |
| Protected metrics | 40 per 2 seconds | next 10 of 50: 429 | 2 seconds |

All eleven implemented non-health endpoint/method combinations also returned
their expected `X-RateLimit-Limit` header (40 read, 10 write, or 5 critical).
`/health` is the documented exemption. An unknown `/api/v1/*` path remains a
plain 404; it is not an implemented endpoint.

## Performance and bundle budgets

Fresh mobile Lighthouse: performance **98**, accessibility **100**, best
practices **100**, SEO **100**; FCP 1.65 s, LCP 2.01 s, TBT 95 ms, CLS 0.

The exact build contains 123,510 B / 39,382 B gzip initial JS, 18,871 B /
4,249 B gzip CSS, 245,789 B / 61,703 B gzip deferred sign-in JS, 56,440 B of
self-hosted fonts, and a 2,321 B hero SVG. The initial path is within every
stated budget.

## Claims and scope cross-check

Landing, demo, README, privacy, terms, account, billing, and operations copy
map to the claims manifest; no unlisted capability claim was found. AI is
appropriately absent because job readiness must come from auditable allocation
and supplier evidence.

Recurring checkout remains intentionally unavailable and says so before any
request: no charge can start. The plan records that the Sociobot catalogue does
not yet expose the required recurring $39 base plus $8 technician-seat product.
This candidate correctly stops at that operator-owned adapter boundary and
does not bypass it with direct Dodo integration. It remains the next operator
step before commercial billing is enabled; this PASS does not claim that paid
signup is available.

## Evidence

Machine-readable reports, request/limit matrices, parity hashes, screenshots,
the Lighthouse report, factory URL verifier output, and all per-claim logs are
under `.factory/verification-artifacts-19/`.
