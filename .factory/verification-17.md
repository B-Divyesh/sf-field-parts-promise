# Verification 17 — FAIL

Date: 2026-09-01 UTC

Work order: `field-parts-promise-verify-17`

Candidate commit: `bb90e8c401eb069028f5f2d4bc82bd654206c668`

Live URL: <https://field-parts-promise.sociobot.in>

## Verdict

**FAIL — do not accept this candidate yet.** The product, accessibility,
privacy, offline, identity, backend, and build checks passed. One mandatory
caching check failed: the primary hashed JavaScript asset is cached for one
hour rather than with the required one-year immutable policy.

No critical, high, or medium defects were found. One low-severity defect is
release-blocking because long-lived immutable caching for hashed assets is an
explicit acceptance requirement.

No infrastructure was changed. Checks used only the repository, the permitted
public product URL, and the configured Microsoft sign-in page.

## Mandatory first checks

### Claims manifest

`.factory/claims.json` exists and declares 37 claims. Every listed command was
run separately from the clean candidate checkout. Result: **37 passed, 0
failed**. Each invocation also reported one intentional duplicate-project skip.

| Claim | Result |
| --- | --- |
| `sample-fixture` | PASS |
| `promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | PASS |
| `supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `demo-feature-boundaries` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `manual-barcode-allocation` | PASS |
| `camera-barcode-privacy` | PASS |
| `release-order-boundary` | PASS |
| `clear-local-records` | PASS |
| `workspace-backup-roundtrip` | PASS |
| `csv-import-validation` | PASS |
| `demo-transfer-isolated` | PASS |
| `csv-template-download` | PASS |
| `entra-sign-in` | PASS |
| `tenant-data-isolation` | PASS |
| `two-device-sync` | PASS |
| `idempotent-sync` | PASS |
| `offline-signed-in-sync` | PASS |
| `sync-conflict-resolution` | PASS |
| `invitation-email-activation` | PASS |
| `account-service-boundaries` | PASS |
| `sensitive-input-boundary` | PASS |
| `audit-log-recording` | PASS |
| `firm-deletion-hold` | PASS |
| `response-policy` | PASS |
| `subscription-checkout` | PASS |
| `technician-seat-charge` | PASS |
| `expired-plan-keeps-export` | PASS |
| `durable-runtime-storage` | PASS |
| `visible-build-identity` | PASS |
| `container-runtime` | PASS |

### Cold first-read test

**PASS.** A fresh 1440×900 live browser showed, without scrolling:

- What it does: **“Promise dates from parts held for the job.”**
- Who it is for: **“For small trade firms that need a parts check before
  agreeing a visit date.”**
- What to click first: **“Try it with sample data.”**
- What happens next: **“Opens Riverside Dental with one missing pump.”**

The action opened `/?demo=1` in one click on desktop and 390×844 mobile. The
result was the `Riverside Dental parts` job and the persistent banner **“Demo —
sample data; nothing is saved to your local workspace.”**

## Defects by severity

### Critical

None.

### High

None.

### Medium

None.

### Low — release-blocking acceptance mismatch

#### FPP-17-01: The primary hashed JavaScript asset is not immutable

Expected: every fingerprinted asset returns a long-lived immutable cache
policy.

Observed on the candidate deployment:

```text
GET /assets/index-DsS9kk-o.js
200
Cache-Control: public, max-age=3600
```

Comparison responses:

```text
GET /assets/index-3bHnSEED.css
Cache-Control: public, max-age=31536000, immutable

GET /assets/ciam-CsuEn5ou.js
Cache-Control: public, max-age=31536000, immutable
```

The primary file is content-fingerprinted and byte-identical to the candidate,
but receives only a one-hour policy. The candidate function
`is_fingerprinted_asset` reads only the text after the final hyphen. For
`index-DsS9kk-o.js`, that is `o`, so the check returns false even though the
Vite fingerprint is `DsS9kk-o`.

Impact: repeat visits do not receive the required immutable caching for the
122,555-byte primary script. The product remains usable and Lighthouse remains
above target, so severity is low. The explicit caching acceptance check still
requires a FAIL verdict.

## Clean local verification

- `npm ci`: passed; 85 packages installed, 0 reported vulnerabilities.
- `npm test`: passed; 22 Vitest tests and 14 Rust tests.
- `npm run check`: passed with 0 errors and 0 warnings.
- `npm run format:check`: passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  passed.
- `BUILD_SHA=bb90e8c401eb069028f5f2d4bc82bd654206c668 npm run build`:
  passed and produced `dist/` plus the optimized Rust server.
- `BUILD_SHA=bb90e8c401eb069028f5f2d4bc82bd654206c668 npm run test:e2e -- --retries=0`:
  59 passed, 43 intentional project-specific skips, 0 failed.
- No Docker-compatible command was installed in the worker. The compiled
  server's only-`PORT` startup, build identity, 404 behavior, rate limits, and
  Dockerfile contract passed the `container-runtime` claim.

Production bundle measurements:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| Primary JavaScript | 122.55 KB | 39.63 KB |
| Sign-in JavaScript | 245.78 KB | 62.19 KB |
| CSS | 18.87 KB | 4.24 KB |
| Two fonts | 56.44 KB | — |
| Hero SVG | 2.32 KB | — |

Total first-load JavaScript is 101.82 KB gzip, within the plan's 200 KB gzip
budget. CSS, fonts, and hero art are also within their budgets.

## Live deployment identity

`GET /health` returned 200 with:

```json
{"status":"ok","build_sha":"bb90e8c401eb069028f5f2d4bc82bd654206c668","database":"sqlite","auth":"ready"}
```

`EXPECTED_BUILD_SHA=bb90e8c401eb069028f5f2d4bc82bd654206c668 npm run verify:live-identity`
passed. After restoring the normal production web build following browser test
setup, the live root document, primary JavaScript, CSS, service worker,
manifest, fonts, favicon, and touch icon matched the local candidate byte for
byte. Every stable route and the designed 404 displayed the full candidate
identity in its footer.

## Product behavior and recovery

- The sample opened as job `RD-1042` for Riverside Dental with one missing
  condensate pump and **Date at risk**.
- Quantity 2 produced **“Only 1 each is still needed for this job.”** The same
  form accepted corrected quantity 1 and changed the status to **Parts in
  hand**.
- Reset restored the original **Date at risk** sample.
- The complete suite also confirmed local job and source creation, allocation
  undo, supplier-date evidence, one-unit conservation, valid and invalid CSV
  previews, JSON backup restoration, second-device sync, retry, explicit
  conflict handling, invitation activation, audit export, deletion scheduling,
  and unpaid-plan export.
- The sample boundary showed no account, payment, or supplier-order action.

## Accessibility, keyboard, and responsive behavior

- The URL verifier passed title, `lang=en`, one H1, main landmark, image text
  alternatives, labelled buttons, and a normal load with no console errors.
- A live matrix covered 11 routes, two themes, desktop, and 390 px mobile: **44
  axe analyses, 0 serious or critical findings**.
- All successful routes had 0 page errors and 0 console errors. The designed
  404 produced only Chromium's expected failed-document message.
- All 44 route/theme/viewport combinations had one H1, a main landmark, and no
  horizontal overflow.
- Keyboard order began with **Skip to main content** and reached **Try it with
  sample data**. The core mobile allocation and reset confirmation were
  operable with keyboard input, and dialog focus remained inside the dialog.
- The focus ring was 3 px. Measured contrast was 6.31:1 in light mode and
  10.39:1 in dark mode.
- The local browser suite confirmed 44 px touch targets, separated controls,
  route focus, and browser-history focus behavior.
- At 200% text size, home, demo, privacy, and terms had no horizontal overflow
  or clipped interactive control at 390 px.
- Reduced-motion mode resolved all three motion tokens to zero.

## Privacy, PWA, routing, and headers

- The live landing, allocation, invalid-input recovery, and reset flow issued
  only same-origin GET requests. It set no cookie and made no camera request.
- In the explicit live camera check, calls were 0 after **Scan a part**, 1 after
  **Use camera**, and the track stop count was 1 after matching `CP-19`. All six
  recorded requests were same-origin GET requests with no body.
- The service worker controlled the app, had no installing or waiting worker,
  and owned only cache `parts-promise-shell-v6`. The demo reloaded offline and
  still completed the allocation to **Parts in hand** with no browser errors.
- Internal links across the checked routes returned 200. The intentionally
  missing route returned 404 with its designed page.
- Root responses included CSP, HSTS, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, strict referrer policy, and
  `Permissions-Policy: camera=(self), microphone=(), geolocation=()`.
- HTML and `sw.js` returned `no-cache, max-age=0, must-revalidate`. The manifest,
  fonts, and non-fingerprinted art returned one-hour caching. The primary
  JavaScript exception is FPP-17-01.

## Performance

Fresh live mobile Lighthouse results:

- Performance: 94
- Accessibility: 100
- Best practices: 100
- SEO: 100
- FCP: 1.7 s
- LCP: 2.0 s
- TBT: 240 ms
- CLS: 0

## API, identity, concurrency, and persistence

- Sign-in redirected to `sociobotcustomers.ciamlogin.com`, tenant
  `35c6fe40-0ec0-46b6-98c6-213ad4de6650`, client
  `25c704f4-465a-47af-80ab-2c489466b697`, and callback
  `https://field-parts-promise.sociobot.in/auth/callback` using authorization
  code flow and PKCE S256.
- An invalid token returned 401, JSON recovery guidance, and
  `WWW-Authenticate: Bearer`.
- Live concurrent checks confirmed these allowances:
  - Read: 40 requests per 2 seconds; requests 41–50 returned 429 with
    `Retry-After: 2`.
  - Write: 10 requests per 2 seconds; requests 11–20 returned 429 with
    `Retry-After: 2`.
  - Critical: 5 requests per 60 seconds; requests 6–8 returned 429 with
    `Retry-After: 60`.
- `/health` is intentionally exempt.
- Rust tests confirmed the rate bucket is shared across server instances,
  tenant separation, idempotent operations, SQLite restart persistence, and
  file-backed SQLite's mount-safe journal mode.
- `deploy.json` specifies `/data` and one replica. The runtime claim confirmed
  the SQLite database and generated metrics token persist in the selected data
  directory across restart.

## Claim and scope cross-check

The landing page, privacy page, demo guide, README, and current feature copy
map to entries in `.factory/claims.json`. No unlisted user-facing capability
claim was found. AI is intentionally absent because the core decision must be
auditable from allocation and supplier evidence. Import, export, sync, offline
work, and manual barcode entry cover the expected adjacent workflow needs.

## Required next step

Update the fingerprint recognition so Vite hashes containing a hyphen receive
the immutable policy, add a regression check using a filename such as
`index-DsS9kk-o.js`, deploy the corrected candidate, and confirm the live
primary JavaScript returns:

```text
Cache-Control: public, max-age=31536000, immutable
```

Recurring checkout remains intentionally unavailable pending approved billing
registration. That boundary is clearly disclosed and claim-tested; it is not
an additional defect in this verification.
