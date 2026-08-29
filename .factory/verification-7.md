# Independent verification 7 — Parts Promise

## Verdict: FAIL

Verified on 2026-08-29 against candidate commit
`ce0e270de5d87b5cb142053836cc89ffbb824cbc` and
<https://field-parts-promise.sociobot.in>.

The candidate is functional, deployed at the exact requested build, and passes
all 16 registered claim tests. It nevertheless fails the acceptance contract:
multiple links at the required 390 px phone viewport have touch targets smaller
than 44 × 44 CSS px. The attached accessibility baseline calls this a
non-negotiable requirement.

## Release-blocking finding

### F7-01 — Medium: mobile link touch targets are smaller than 44 × 44 px

At 390 × 844, a fresh live-page geometry audit measured these representative
link boxes:

| Route / link | Measured box |
| --- | ---: |
| Header `Jobs` | 36 × 44 px |
| Header `Demo` | 43 × 44 px |
| Wordmark `Parts Promise` | 127.69 × 29 px |
| Landing `Open the sample job` | 147 × 21 px |
| Footer `Privacy` | 43 × 18 px |
| Footer `Terms` | 39 × 18 px |
| 404 recovery `Go to home` | 83 × 21 px |

The same result occurs in light and dark themes. The footer and header appear
on every route. Buttons in the working flow do meet 44 × 44 px.

Reproduction:

1. Open the live site at a 390 × 844 viewport.
2. Read `getBoundingClientRect()` for visible `a[href]` elements.
3. Observe the dimensions above on `/`, `/?demo=1`, `/jobs`, `/privacy`,
   `/terms`, and the designed 404.

Cause/coverage evidence: `src/app.css` gives buttons a 44 px minimum height and
header links a 44 px minimum height, but does not give links a 44 px minimum
width or the footer/inline links a 44 px hit area. The existing Playwright test
named `all verifier-reported phone controls provide 44px touch targets` checks
selected buttons only, so the full suite remains green.

Required correction: give persistent navigation, inline action, recovery, and
footer links at least a 44 × 44 px clickable area without reducing the required
8 px separation, then extend the mobile geometry test to anchors.

## First-read gate

**PASS.** On a cold desktop and 390 px mobile load, the first screen says:

- What it does: promises job dates from parts held for that job.
- For whom: solo tradespeople checking parts before agreeing a visit date.
- What to click: **Try it with sample data**.

The adjacent text says the click opens Riverside Dental with one missing pump.
The action enters the realistic demo in one click. The three first-screen facts
cover offline use, browser-local sample changes, and price.

Evidence: `qa-artifacts/verification-7/first-read.json` and the two first-read
screenshots.

## Mandatory claims gate

`.factory/claims.json` exists and contains 16 unique claims. After `npm ci`, I
ran every exact `test` value separately from the candidate checkout. Every
command exited 0:

| Claim | Result |
| --- | --- |
| `promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | PASS |
| `supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `m1-feature-boundaries` | PASS |
| `free-browser-release` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `clear-local-records` | PASS |
| `workspace-backup-roundtrip` | PASS |
| `csv-import-validation` | PASS |
| `demo-transfer-isolated` | PASS |
| `container-runtime` | PASS |

Each command scheduled the desktop claim once and intentionally skipped its
duplicate mobile project. Logs are in
`qa-artifacts/verification-7/claims/`. I also cross-checked the landing page,
privacy/terms pages, demo guide, and README against the registry and found no
unlisted visitor-facing claim.

## Clean local gates

The checkout started at the exact requested SHA. `npm ci` installed 83 locked
packages and reported zero vulnerabilities. Results:

- `npm test`: PASS — 15 Vitest tests and 3 Rust tests.
- `npm run check`: PASS — zero errors and zero warnings.
- `npm run format:check`: PASS.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`: PASS.
- `npm audit --audit-level=moderate`: PASS — zero vulnerabilities.
- `npm run build`: PASS — produced `dist/` and the release Rust binary.
- `npm run test:e2e -- --retries=0`: PASS — 35 passed and 21 intentional
  project-specific skips.
- Factory `verify-url.sh`: PASS — HTTPS 200, title, `lang=en`, one H1, main,
  image/button labels, and no landing-page console errors.

Built assets are 92.33 KB raw / 31.12 KB gzip JS, 16.90 KB raw / 3.96 KB gzip
CSS, and 56.44 KB of self-hosted fonts. The 2.32 KB hero SVG is below its image
budget.

## Product behavior

The smallest useful local workflow works in the candidate and live deployment:

- Normal case: the sample begins **Date at risk**; holding one pump from Van 2
  changes it to **Parts in hand**.
- Boundary case: the last Van 2 pump leaves zero against a minimum of one and
  shows a reorder suggestion without placing an order.
- Conservation boundary: one supplier-order unit cannot cover two jobs.
- Invalid input and recovery: holding two pumps when only one is needed leaves
  the job unchanged and announces “Only 1 each is still needed for this job.”
  Correcting the value to one succeeds without reopening the sheet.
- Persistence: source, quantity, unit, updater, and checked time survive reload.
- Recovery: reset restores the sample; demo exit preserves the separate live
  workspace. Invalid CSV rows show their row number and cannot be saved.
- Transfer: versioned JSON backup restores all record types and timestamps;
  CSV import previews before saving; demo transfer does not alter live records.

The release truthfully identifies its M1 boundaries: no account, team sync,
barcode scan, supplier-order action, checkout, or payment. AI would not improve
the core deterministic allocation check; import/export is already present.

## Live deployment and backend

- `/health` returned
  `{"status":"ok","build_sha":"ce0e270de5d87b5cb142053836cc89ffbb824cbc"}`.
- Local and live SHA-256 values match byte-for-byte for `index.html`, JS, CSS,
  both fonts, hero SVG, service worker, and manifest.
- A locally built release binary started with an environment containing only
  `PORT`; `/health` was 200, `/` was 200, and unknown/API paths were 404.
- Live `GET /api/jobs` is 404 and `POST /api/jobs` is 405. Job records never
  cross a server persistence boundary.
- 100 concurrent live requests returned 100/100 HTTP 200 for both `/` and
  `/health`.
- There is no non-health server API, unlock call, auth route, or payment route
  in this M1. `/health` is the only API route and is explicitly rate-limit
  exempt, so no request allowance or applicable 429/`Retry-After` path exists.
- Sign-in/CIAM verification is not applicable because the release has no
  sign-in and the claim test verifies that boundary.

## Privacy, security, PWA, and caching

- A full live demo flow made 12 requests, all same-origin GETs. There were no
  mutation, analytics, third-party, or camera requests.
- Successful routes and flows produced no console or page errors. A direct
  designed-404 navigation produces Chromium's expected failed-resource message
  because the document correctly has HTTP 404; no application exception occurs.
- Responses include a self-only CSP with header-delivered `frame-ancestors`,
  `nosniff`, strict referrer policy, frame denial, and disabled camera,
  microphone, and geolocation.
- HTML and `sw.js` are no-cache; fingerprinted JS/CSS are one-year immutable;
  stable fonts/SVG/manifest are cacheable for one hour.
- `parts-promise-shell-v3` controls the live app with no installing or waiting
  worker. Offline reload renders the demo and permits the allocation flow.

## Accessibility and performance

- Axe WCAG 2 A/AA: zero serious/critical findings across six routes, two
  themes, and desktop/mobile viewports (24 scans).
- Every tested route has `lang=en`, one H1, and one main landmark with no
  horizontal overflow.
- Keyboard allocation works. Route and browser-history navigation focus the
  new H1. Dialogs contain focus, close with Escape, and restore trigger focus.
- Focus uses a visible 3 px purple ring. Form errors use `role=alert`.
- At a 200% root text size, all five primary routes reflow at 390 px without
  horizontal overflow or clipped main content.
- Reduced motion sets the row motion token to `0s`.
- Lighthouse 13 mobile: Performance 92, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.5 s, LCP 1.8 s, TBT 300 ms, CLS 0.007.
- The mobile link-target defect in F7-01 remains release-blocking despite these
  otherwise passing results.

## Evidence

Artifacts are under `.factory/qa-artifacts/verification-7/`, including claim
logs, full-suite and build logs, first-read screenshots/JSON, live desktop and
mobile screenshots, 24-scan axe data, accessibility supplement, request and
backend logs, parity/cache hashes, Lighthouse JSON, and factory verifier output.

Product code was not modified.
