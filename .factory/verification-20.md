# Independent verification 20 — FAIL

Verified candidate: `6f0e3b0852fa89bdbe627e89bea831457fd192af`

Live URL: <https://field-parts-promise.sociobot.in>
Verification date: 2026-09-02 UTC

## Decision

**FAIL — one release-blocking performance budget remains unmet.** All product
flows, claims, privacy, accessibility, PWA, authentication, backend, build,
and deployment-identity checks below passed. Two independent mobile Lighthouse
runs measured LCP above the required `< 2.5 s` budget, so this candidate does
not meet the factory performance contract.

## First read

Cold-opening the live page answered all required questions in plain words:

- **What:** “Promise dates from parts held for the job.”
- **For whom:** “For small trade firms that need a parts check before agreeing
  a visit date.”
- **First click:** the visible **Try it with sample data** action, explicitly
  saying it opens Riverside Dental with one missing pump.

The direct demo route works at `/?demo=1`. The first screen and sample action
therefore pass the plain-words and one-click demo requirements.

## Clean-checkout gates

The checkout was clean at the requested SHA before verification. `npm ci`
completed with 0 reported vulnerabilities.

- Every one of the 37 commands in `.factory/claims.json` was invoked
  separately via `npm run test:e2e -- --grep @claim:<id>` from the shipped demo
  entry point. Each passed; Playwright's final run record is `passed` with no
  failed tests.
- `npm test` passed: 24 Vitest tests and 15 Rust/API tests.
- `npm run check` passed with 0 errors and 0 warnings.
- `npm run format:check` passed.
- `npm run build` passed, producing `dist/` and the Rust release binary.
- `npm audit --audit-level=high` reported 0 vulnerabilities.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`
  passed.

### Claim command results

All entries below are **PASS** (each has its own exact registered command):

| # | Claim ID | # | Claim ID |
| --- | --- | --- | --- |
| 1 | `sample-fixture` | 20 | `entra-sign-in` |
| 2 | `promise-status-from-allocation` | 21 | `tenant-data-isolation` |
| 3 | `allocation-keeps-source` | 22 | `two-device-sync` |
| 4 | `supplier-quantity-conserved` | 23 | `idempotent-sync` |
| 5 | `reorder-after-allocation` | 24 | `offline-signed-in-sync` |
| 6 | `demo-reset-isolated` | 25 | `sync-conflict-resolution` |
| 7 | `offline-reload` | 26 | `invitation-email-activation` |
| 8 | `local-workspace-flow` | 27 | `account-service-boundaries` |
| 9 | `demo-feature-boundaries` | 28 | `sensitive-input-boundary` |
| 10 | `indexeddb-local-storage` | 29 | `audit-log-recording` |
| 11 | `demo-network-privacy` | 30 | `firm-deletion-hold` |
| 12 | `manual-barcode-allocation` | 31 | `response-policy` |
| 13 | `camera-barcode-privacy` | 32 | `subscription-checkout` |
| 14 | `release-order-boundary` | 33 | `technician-seat-charge` |
| 15 | `clear-local-records` | 34 | `expired-plan-keeps-export` |
| 16 | `workspace-backup-roundtrip` | 35 | `durable-runtime-storage` |
| 17 | `csv-import-validation` | 36 | `visible-build-identity` |
| 18 | `demo-transfer-isolated` | 37 | `container-runtime` |
| 19 | `csv-template-download` |  |  |

## Live deployment and product QA

- `GET /health` returned HTTP 200 with
  `build_sha: 6f0e3b0852fa89bdbe627e89bea831457fd192af`, `database: sqlite`,
  and `auth: ready`; this proves the live deployment is the candidate.
- The factory URL verifier passed: correct title, `lang=en`, one H1, main
  landmark, image alternatives, labelled buttons, and no console errors.
  Evidence: `qa-artifacts/verification-20/verify-url/verify.json`.
- On the live demo, the Riverside Dental pump began **Date at risk**. A quantity
  of 2 was rejected with the quantity error; recovery with 1 from Van 2 made it
  **Parts in hand**. The reorder notice correctly said Van 2 has 0 pumps,
  minimum 1, and **no supplier order has been placed**. No page or console
  errors occurred. Screenshot:
  `qa-artifacts/verification-20/live-demo-desktop.png`.
- Full demo-flow request capture contained only same-origin `GET` requests to
  the document, self-hosted JS/CSS/fonts, and hero SVG. It made no write,
  cross-origin, telemetry, account, supplier, billing, or camera request.
- The live service worker was controlling the app, had no waiting/installing
  update after `registration.update()`, and an offline reload of the demo
  still allocated the pump to **Parts in hand**.
- At 390 × 844 there was no horizontal overflow. The cold mobile first screen
  visibly retained the job, user, demo action, and three facts. The first Tab
  focused the skip link with a designed `rgb(107, 53, 195)` 3 px outline and
  3 px offset. Screenshot:
  `qa-artifacts/verification-20/live-cold-mobile-390.png`.
- Independent Axe scans of live demo desktop and landing mobile found zero
  serious or critical findings. Under `prefers-reduced-motion: reduce`, the
  product set `--motion-row: 0s`.
- Live headers include HSTS, `nosniff`, `DENY` framing, strict-origin referrer
  policy, a working CSP, and the camera/microphone/geolocation Permissions
  Policy. Hashed JS/CSS use `public, max-age=31536000, immutable`; the HTML and
  service worker correctly use no-cache update-safe policies.
- The sign-in flow redirected only to the required
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650`
  tenant, using client `25c704f4-465a-47af-80ab-2c489466b697` and callback
  `https://field-parts-promise.sociobot.in/auth/callback`.
- Rate limiting was observed live without authentication or data mutation:
  five `GET /api/v1/export` requests from one forwarded client received 401
  with `X-RateLimit-Limit: 5`; the sixth received HTTP 429 with
  `Retry-After: 60` and the same limit. The documented allowance is therefore
  enforced.

## Performance and bundle evidence

The production build's initial main JS is 39.85 KB gzip and CSS is 4.24 KB
gzip; both are within the static product budgets. CIAM JS is deferred (62.19
KB gzip), so it is not in the first load.

Fresh live mobile Lighthouse runs (Performance preset) produced:

| Run | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 90 | 100 | 100 | 100 | **2.8 s** | 0 | 110 ms |
| 2 | 90 | 100 | 100 | 100 | **3.2 s** | 0 | 20 ms |

Evidence: `qa-artifacts/verification-20/lighthouse-mobile.json` and
`qa-artifacts/verification-20/lighthouse-mobile-repeat.json`.

## Defects

### High — mobile LCP exceeds the required performance budget

The performance contract requires LCP below 2.5 seconds. Two clean Lighthouse
mobile measurements were 2.8 s and 3.2 s. This is a release blocker even
though the score remains 90 and other category scores are 100. Improve the
first-paint/LCP path and rerun mobile Lighthouse until LCP is below 2.5 s.

## Required next verification

After the LCP repair is deployed, rerun the two mobile Lighthouse checks,
`npm run build`, every registered claim command from a clean checkout, and
the live health SHA comparison. No other defect was found in this candidate.
