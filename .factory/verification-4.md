# Independent verification 4 — FAIL

Verified candidate: `aeed6cb19226e02f102a3436229929cc596c9949`  
Live URL: <https://field-parts-promise.sociobot.in>  
Verification date: 2026-08-29 UTC

## Decision

**FAIL — the required claim gate is not reliably green from a clean installed
checkout.** The product itself is deployed at the requested SHA and the
functional, privacy, PWA, accessibility, and local build checks below pass.
The `container-runtime` claim fails its first clean execution by exceeding its
30-second Playwright timeout, then passes only on Playwright retry. The work
order makes any failing claim test release-blocking, including this flake.

## Required first-read and demo gate

A cold new Chromium context opened the live landing page at `/` with HTTP 200.
It plainly says:

- **What:** “Promise dates from parts held for the job.”
- **For whom:** “For solo tradespeople who need a parts check before agreeing a
  visit date.”
- **First action:** visible **Try it with sample data**, with the result
  “Opens Riverside Dental with one missing pump.”

This passes the first-read gate and provides the required one-click demo.

## Clean-checkout claim gate

The checkout started clean at the requested SHA. `npm ci` installed 83
packages and reported 0 vulnerabilities. Before the other QA checks, all 12
claim selectors in `.factory/claims.json` were executed against the shipped
demo entry point in a fresh Playwright run (`npm run test:e2e -- --grep
@claim:`). It ran 24 configured project cases: 11 Chromium passes, 12
intentional secondary-project skips, and the following flaky result:

| Claim ID | Result |
| --- | --- |
| `promise-status-from-allocation` | pass |
| `allocation-keeps-source` | pass |
| `reorder-after-allocation` | pass |
| `demo-reset-isolated` | pass |
| `offline-reload` | pass |
| `local-workspace-flow` | pass |
| `m1-feature-boundaries` | pass |
| `free-browser-release` | pass |
| `indexeddb-local-storage` | pass |
| `demo-network-privacy` | pass |
| `clear-local-records` | pass |
| `container-runtime` | **FAIL / flaky** — first attempt timed out at 30 seconds; retry passed |

The failed attempt is `[chromium] e2e/claims.spec.ts:407`, with trace at
`test-results/claims--claim-container-ru-342b3-serves-its-identity-and-app-chromium/trace.zip`.
The claim builds the Rust debug binary inside a default 30-second browser-test
timeout. It failed on the cold run before the debug build cache existed,
despite later passing once the cache was warm. A clean, isolated claim must
not depend on that warm cache.

## Local quality gates

- `npm test`: pass — 9 Vitest and 3 Rust tests.
- `npm run check`: pass — 0 Svelte/TypeScript errors and 0 warnings.
- `npm run format:check`: pass — Prettier and `cargo fmt`.
- `npm run build`: pass — `dist/` produced; locked Rust release build passed.
- Full `npm run test:e2e`: pass — 28 passed and 16 intentional
  cross-project skips after the cache was warm.
- Production output: JS 79,957 bytes (27,320 gzip); CSS 16,343 bytes (3,890
  gzip); self-hosted fonts total 56,440 bytes. These are within the stated
  budgets.
- The image build could not be repeated because this verifier image has no
  `docker`, `podman`, or `buildah` executable. Static Dockerfile review and
  the live container checks below are not a substitute for an image build.

## Live deployment, product, privacy, and PWA evidence

- `GET /health` returned 200 with
  `{"status":"ok","build_sha":"aeed6cb19226e02f102a3436229929cc596c9949"}`.
  Locally built `dist/index.html`, fingerprinted JS, and CSS matched the live
  bytes exactly (SHA-256 respectively
  `3d4b2b4865daad98bd46ffcd088371922cbdbb064398d55fb66ec569cc4444d4`,
  `c018626b473c05cb9d32902923b1067a70d3fc92413d6c09dd0846706900c160`, and
  `a5e0129a99c0e3a29dc47fdfef71ac773b95ba2ab5558360628b623c3f38f04e`).
- In a fresh live demo, allocating one condensate pump from Van 2 changed
  **Date at risk** to **Parts in hand**, and produced the reorder suggestion
  “Van 2 has 0 each … No supplier order has been placed.” Attempting quantity
  2 was rejected with “Only 1 each is still needed for this job”; entering 1
  recovered successfully. Undo returned the job to risk. Supplier evidence
  `QA-SUP-1`, marked Estimated and expected after the buffer, correctly kept
  the job **Date at risk**.
- A live demo request log contained only same-origin GET requests for the
  document, self-hosted fonts, JS, CSS, and hero asset. It produced no page
  errors and no console errors on valid routes. A `getUserMedia` sentinel was
  not invoked by the claim suite.
- The service worker controlled the live app with no waiting update. After the
  first online visit, an offline reload of `/?demo=1` still allocated the pump
  to **Parts in hand**.
- The 390 px mobile and desktop scans found no horizontal overflow. Keyboard
  navigation reached the skip link with its designed 3 px purple focus ring;
  the full mobile keyboard allocation/history test passed locally.
- Axe WCAG 2 A/AA scans on `/`, `/?demo=1`, `/jobs?demo=1`, `/privacy`,
  `/terms`, and the real 404 route found zero serious or critical violations
  at desktop and 390 px mobile. Valid routes had no console/page errors.
- Live response headers include `Content-Security-Policy` with
  `connect-src 'self'`, `X-Content-Type-Options: nosniff`, strict referrer
  policy, `X-Frame-Options: DENY`, and denied camera/microphone/geolocation.
  Fingerprinted assets return immutable one-year caching; HTML and `/sw.js`
  are no-cache/must-revalidate. The deliberate unknown route is a real HTTP
  404 (Chromium logs the expected failed-resource message for that response).
- The local server launched with an environment containing only `PORT`,
  served `/health` with build `dev`, returned 200 for `/`, 405 for a POST to
  `/api/v1/jobs`, and 404 for an unknown path. M1 has no non-health API,
  authentication, billing/unlock, or data endpoint; `/health` is the sole
  documented health-check rate-limit exemption, so no non-exempt allowance or
  `429`/`Retry-After` route exists to observe.

## Defects by severity

### High — `container-runtime` claim flakes from a clean checkout

The clean claim run timed out its first `container-runtime` attempt at
30 seconds. Retrying with a warmed Rust target cache passes, but this does not
meet the claims contract or the work order's “any failing claim test” rule.
Make the claim self-contained and deterministic (for example, build the
binary in setup before the timed test, or give the explicit build path an
appropriate timeout) and demonstrate a clean no-retry pass.

### Critical / Medium / Low

None found beyond the high-severity claim-gate failure.

## Required next verification

Repair the cold claim behavior, start from a fresh clone with no Rust target
cache, run every listed claim command without retries, then repeat the local
suite and live build identity/artifact checks. Repeat the container image
build in an environment with Docker or an ACR-equivalent builder.
