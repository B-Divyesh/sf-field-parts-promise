# Verification 18 — PASS

Date: 2026-09-01 UTC

Work order: `field-parts-promise-verify-18`

Candidate: `1dc52f562f69857388821b940a0e78e1b3a8ff3a`

Live URL: <https://field-parts-promise.sociobot.in>

## Verdict

**PASS — accept this candidate.** The clean candidate, live deployment, core
parts-allocation job, accessibility, privacy, offline behavior, backend
boundaries, rate limits, build identity, performance budgets, and repaired
immutable cache policy all passed.

No critical, high, medium, or low defects were found. No product code,
infrastructure, DNS, billing configuration, customer data, or `/data` contents
were changed.

## Mandatory first checks

### Claims manifest

`.factory/claims.json` exists and declares 37 claims. Before other QA, every
listed `test` command was run separately from the clean checkout. Result:
**37 passed, 0 failed**. Each invocation ran its matching desktop claim test
and reported one intentional alternate-project skip.

Passed IDs: `sample-fixture`, `promise-status-from-allocation`,
`allocation-keeps-source`, `supplier-quantity-conserved`,
`reorder-after-allocation`, `demo-reset-isolated`, `offline-reload`,
`local-workspace-flow`, `demo-feature-boundaries`, `indexeddb-local-storage`,
`demo-network-privacy`, `manual-barcode-allocation`,
`camera-barcode-privacy`, `release-order-boundary`, `clear-local-records`,
`workspace-backup-roundtrip`, `csv-import-validation`,
`demo-transfer-isolated`, `csv-template-download`, `entra-sign-in`,
`tenant-data-isolation`, `two-device-sync`, `idempotent-sync`,
`offline-signed-in-sync`, `sync-conflict-resolution`,
`invitation-email-activation`, `account-service-boundaries`,
`sensitive-input-boundary`, `audit-log-recording`, `firm-deletion-hold`,
`response-policy`, `subscription-checkout`, `technician-seat-charge`,
`expired-plan-keeps-export`, `durable-runtime-storage`,
`visible-build-identity`, and `container-runtime`.

### Cold first-read test

**PASS.** A fresh live browser showed without scrolling:

- What it does: **“Promise dates from parts held for the job.”**
- Who it is for: **“For small trade firms that need a parts check before
  agreeing a visit date.”**
- What to click: **“Try it with sample data.”**
- What happens next: **“Opens Riverside Dental with one missing pump.”**

At 390×844, the last required first-screen fact ended at 701 px. The sample
opened `Riverside Dental parts` and its persistent demo banner in one click.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Clean local verification

```text
npm ci                                                   PASS; 0 vulnerabilities
npm test                                                 PASS; 22 Vitest, 15 Rust
npm run check                                            PASS; 0 errors/warnings
npm run format:check                                     PASS
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
                                                         PASS
BUILD_SHA=1dc52f562f69857388821b940a0e78e1b3a8ff3a npm run build
                                                         PASS; dist/ + release API
BUILD_SHA=1dc52f562f69857388821b940a0e78e1b3a8ff3a npm run test:e2e -- --retries=0
                                                         PASS; 59 passed, 43 skipped
```

No Docker-compatible executable was installed. The exact repository production
build passed, and the `container-runtime` claim started the built server with
only `PORT`, checked health, static serving, 404 behavior, throttling, and the
Dockerfile contract. The live web deployment was byte-matched to that build.

## Deployment identity and parity

`npm run verify:live-identity` passed with the candidate SHA. `/health` returned:

```json
{"status":"ok","build_sha":"1dc52f562f69857388821b940a0e78e1b3a8ff3a","database":"sqlite","auth":"ready"}
```

The live HTML, primary and sign-in JavaScript, CSS, service worker, manifest,
fonts, favicon, and touch icon matched the local production build by SHA-256.
Stable routes returned 200; the designed unknown route returned 404. Route
footers showed build `1dc52f56` with the full SHA available.

## Product behavior and recovery

- Sample job `RD-1042` opened for Riverside Dental with one missing condensate
  pump and **Date at risk**.
- Quantity `2` produced **“Only 1 each is still needed for this job.”** The
  same form accepted `1` and changed status to **Parts in hand**.
- The source evidence retained Van 2, quantity, unit, updater, and check time.
  The reorder result stated **“No supplier order has been placed.”**
- Reset confirmation received focus and restored **Date at risk**.
- The complete suite also passed local creation, allocate/undo, supplier-date
  evidence, barcode/manual fallback, invalid CSV recovery, backup restore,
  two-device sync, retry, conflict handling, invitation activation, tenant
  isolation, audit export, deletion hold/cancel, and unpaid-plan export.

## Accessibility, keyboard, and mobile

- The factory URL verifier passed home and demo: title, `lang=en`, one H1,
  main landmark, alt text, labelled buttons, and no load errors.
- A live 11-route × 2-theme × 2-viewport matrix produced **44 Axe analyses,
  0 serious or critical findings**.
- Successful routes had no console/page errors, one H1, a main landmark, and
  no horizontal overflow. The only console messages were expected failed-main-
  document notices for the intentional 404.
- Keyboard input alone used the skip link, opened the sample, selected Van 2,
  submitted allocation, and reached **Parts in hand**. Focus used a 3 px ring
  with 3 px offset. Focus contrast was 6.31:1 light and 10.39:1 dark.
- At 200% text size on 390 px there was no overflow or clipped visible control.
  The full suite also enforced 44 px touch targets and target separation.
- Reduced-motion row and status tokens resolved to `0s`.

## Privacy, PWA, identity, and headers

- Landing → demo → invalid quantity → corrected allocation → reset made seven
  same-origin GET requests with no body, cookie, console error, or page error.
- **Scan a part** made zero camera calls. **Use camera** made one; matching
  `CP-19` stopped the track. Its six requests were same-origin GETs with no
  body, so no camera frame was sent.
- Sign-in reached `sociobotcustomers.ciamlogin.com`, tenant
  `35c6fe40-0ec0-46b6-98c6-213ad4de6650`, client
  `25c704f4-465a-47af-80ab-2c489466b697`, the correct production callback,
  authorization-code flow, and PKCE S256. Invalid tokens returned 401 with
  `WWW-Authenticate: Bearer`.
- The service worker controlled the app, had no installing/waiting worker, and
  owned only `parts-promise-shell-v6`. Offline reload and allocation reached
  **Parts in hand** without errors.
- Responses included CSP, HSTS, `nosniff`, frame denial, strict referrer policy,
  and camera-only-for-self permissions policy. HTML, health, and `sw.js` used
  `no-cache, max-age=0, must-revalidate`.

## Backend limits and persistence

Fresh concurrent live bursts observed:

| Bucket | Requests | Allowed | 429 | `Retry-After` |
| --- | ---: | ---: | ---: | ---: |
| Read (`/api/v1/bootstrap`) | 50 | 40 | 10 | 2 s |
| Write (`/api/v1/sync`) | 20 | 10 | 10 | 2 s |
| Critical (`/api/v1/export`) | 8 | 5 | 3 | 60 s |

Allowed requests returned expected 401s because deliberately invalid tokens
prevented data access. The suite also passed the 100-request smoke, shared
limiter, idempotency, tenant isolation, SQLite restart persistence, and
mount-safe journal checks. `deploy.json` remains `/data`, one replica.

## Cache repair and performance

The previous blocker is fixed live:

```text
/assets/index-WNthq3K4.js  public, max-age=31536000, immutable
/assets/index-3bHnSEED.css public, max-age=31536000, immutable
/assets/ciam-CsuEn5ou.js    public, max-age=31536000, immutable
```

The regression also passes for `index-DsS9kk-o.js`. Initial JS is 122,555 B
raw / 39,138 B gzip; lazy sign-in JS 245,789 B / 61,703 B gzip; CSS 18,871 B /
4,249 B gzip; fonts total 56,440 B; hero SVG is 2,321 B.

Fresh mobile Lighthouse: performance 99, accessibility 100, best practices
100, SEO 100; FCP 1.7 s, LCP 2.0 s, TBT 60 ms, CLS 0.

## Claim and scope cross-check

Landing, legal, demo, README, account, billing, and operations statements map
to the claims manifest; no unlisted capability claim was found. AI is correctly
absent because readiness must be auditable from allocation evidence.

Recurring checkout remains honestly unavailable until the factory registers a
supported recurring base-plus-seat product in the Sociobot gateway. The UI
never starts a charge, the boundary is disclosed and tested, and the product
does not bypass it with Dodo. This known operator dependency is unchanged and
is not a defect in the cache-repair candidate verified here.

## Evidence

Reports, headers, request logs, Lighthouse output, and screenshots are under
`.factory/verification-artifacts-18/`.
