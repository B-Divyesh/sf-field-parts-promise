# Verification 16 — PASS

Date: 2026-09-01 UTC

Work order: `field-parts-promise-verify-16`

Candidate commit: `25ca773effc757331984d025c9b842d16c1a582a`

Live URL: <https://field-parts-promise.sociobot.in>

## Verdict

**PASS — accept this candidate.** The local candidate passes every declared
claim and quality gate. The permitted live product reports the exact candidate
SHA, serves byte-identical production web assets, and completes the core parts
allocation job on desktop, at 390 px, and offline.

No critical, high, medium, or low product defects were found in this
verification. The recurring subscription remains intentionally operator-gated:
the product explains this, returns 424 before any charge, and has claim
coverage for that boundary.

No forbidden service, database, app setting, secret, or infrastructure
resource was read, connected to, changed, or restarted. Deployed checks used
only the permitted public product URL and its configured Microsoft sign-in
page.

## Mandatory first checks

### Claims manifest

`.factory/claims.json` exists and declares 31 claims. Every listed command was
run separately from the clean candidate checkout through the product's demo
entry point. Result: **31 passed, 0 failed**. Each invocation also reported one
intentional skip for the non-evidence Playwright project.

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
| `audit-log-recording` | PASS |
| `firm-deletion-hold` | PASS |
| `response-policy` | PASS |
| `subscription-checkout` | PASS |
| `technician-seat-charge` | PASS |
| `expired-plan-keeps-export` | PASS |
| `container-runtime` | PASS |

### Cold first-read test

**PASS.** In a fresh 1440×900 browser context, the first screen says:

- What it does: **“Promise dates from parts held for the job.”**
- Who it is for: **“For small trade firms that need a parts check before
  agreeing a visit date.”**
- What to click first: **“Try it with sample data.”**
- What happens next: **“Opens Riverside Dental with one missing pump.”**

The action is visible without scrolling and opens the working sample in one
click. The cold load returned 200 with no console or page errors. Evidence:
[`qa-live/screenshot-desktop.png`](qa-live/screenshot-desktop.png) and
[`qa-live/screenshot-mobile.png`](qa-live/screenshot-mobile.png).

## Clean local verification

- `npm ci` passed: 85 packages installed and 0 vulnerabilities reported.
- `npm test` passed: 21 Vitest tests and 14 Rust API tests.
- `npm run check` passed with 0 errors and 0 warnings.
- `npm run format:check` passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`
  passed.
- `npm run build` passed and produced `dist/` plus the optimized Rust server.
- Production gzip sizes: main JS 38.25 KB, CIAM JS 62.19 KB, CSS 4.19 KB.
  The two fonts total 56,440 bytes and the hero SVG is 2,321 bytes.
- `npm run test:e2e -- --retries=0` passed all 52 runnable cases with 36
  intentional project-specific skips and 0 failures.
- The Rust suite independently covered a 100-request concurrent response-policy
  check, a rate bucket shared across app instances, SQLite persistence across
  restart, tenant boundaries, idempotency, and billing states.
- No Docker-compatible executable is installed in this worker, so an OCI image
  build was not repeated. The compiled server's only-`PORT` startup and the
  Dockerfile contract passed the `container-runtime` claim.

## Live deployment identity

`GET /health` returned 200:

```json
{"status":"ok","build_sha":"25ca773effc757331984d025c9b842d16c1a582a","database":"sqlite","auth":"ready"}
```

`EXPECTED_BUILD_SHA=25ca773effc757331984d025c9b842d16c1a582a npm run verify:live-identity`
passed. The live `index.html`, main JavaScript, CSS, service worker, and web
manifest each matched the locally built candidate byte for byte by SHA-256.

## Product and recovery checks

- The one-click demo opened Riverside Dental job `RD-1042` with the condensate
  pump short by one and promise status **Date at risk**.
- Entering quantity 2 was rejected with **“Only 1 each is still needed for this
  job.”** The same form accepted the corrected quantity 1.
- Allocating the pump from Van 2 changed the status to **Parts in hand** and
  displayed a reorder suggestion stating that no supplier order was placed.
- Reset demo restored the original **Date at risk** sample after its explicit
  confirmation.
- The full claim suite additionally exercised job/source creation, allocation
  undo, supplier-date evidence, one-unit conservation, valid and invalid CSV,
  backup restore, two-device sync, retry, and explicit quantity-conflict
  recovery.
- The 390 px keyboard-only allocation path completed successfully with no
  horizontal overflow. Every visible link, button, input, and select measured
  at least 44×44 CSS px. Evidence:
  [`qa-live/demo-after-allocation-mobile.png`](qa-live/demo-after-allocation-mobile.png).

## Accessibility and responsive behavior

- The repository URL verifier passed: title, `lang=en`, one H1, main landmark,
  image alternatives, button labels, and zero errors on the normal load.
- A live axe matrix covered 11 routes, light and dark themes, and desktop and
  390 px viewports: **44 analyses, 0 serious or critical findings**.
- Successful routes had no console or page errors. The deliberate 404 route
  returned the designed 404 page and produced only the browser's expected
  failed-document console message.
- Keyboard Tab order begins with **Skip to main content** and reaches the
  one-click demo action. Focus uses a 3 px visible ring. Its measured contrast
  is 6.31:1 in light mode and 10.39:1 in dark mode.
- Dialog focus stays inside the reset confirmation and returns to its trigger.
- At simulated 200% text size, `/`, demo, privacy, and terms retained all text
  and controls with `scrollWidth == clientWidth` at 390 px. Evidence:
  [`qa-live/demo-mobile-text-200.png`](qa-live/demo-mobile-text-200.png).
- With reduced motion requested, all three motion tokens resolve to `0s` in
  both themes.

## Privacy, PWA, headers, and performance

- The entire live demo interaction issued only same-origin GET requests. It
  made no API write, third-party, analytics, or camera request; the camera
  sentinel remained at zero. No cookie was set.
- Root responses include CSP, HSTS, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, strict referrer policy, and a permissions policy
  denying camera, microphone, and geolocation.
- HTML and `sw.js` use `no-cache, max-age=0, must-revalidate`; hashed JS and CSS
  use `public, max-age=31536000, immutable`; the manifest caches for one hour.
- The service worker was active and controlling the page, with no installing or
  waiting update and cache `parts-promise-shell-v5`. After switching the fresh
  context offline, the demo reloaded with HTTP 200 and the pump allocation
  still reached **Parts in hand** with no errors.
- Mobile Lighthouse: performance 94, accessibility 100, best practices 100,
  SEO 100; LCP 2.0 s, CLS 0, FCP 1.7 s, and TBT 240 ms. The measured allocation
  action rendered its status change in 69 ms.

## API and identity checks

- The live Microsoft authorization request used authority
  `sociobotcustomers.ciamlogin.com`, tenant
  `35c6fe40-0ec0-46b6-98c6-213ad4de6650`, client
  `25c704f4-465a-47af-80ab-2c489466b697`, the production callback, authorization
  code flow, and PKCE `S256`. The sign-in page returned 200.
- An invalid bearer token returned 401 plus `WWW-Authenticate: Bearer` and a
  plain recovery action.
- The documented critical allowance is enforced per client: requests 1–5 to
  `GET /api/v1/export` returned 401 with remaining counts 4 through 0; requests
  6 and 7 returned 429 with `Retry-After: 60`. Observed allowance: **5 requests
  per 60 seconds**. `/health` is intentionally exempt.
- `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and the manifest return
  200. Unknown page and API routes return 404. All real internal links found by
  the crawl return 200.

## Remaining operator action

The recurring Workshop and technician-seat product still needs operator
registration in the approved Sociobot billing system before checkout can be
enabled. Until then, the tested 424 response prevents a charge and the UI says
what must happen. This is an explicit, tested release boundary; no direct
payment provider is present.
