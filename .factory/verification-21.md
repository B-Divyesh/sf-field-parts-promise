# Independent verification 21 — PASS

Verified candidate: `690fcb860a1eabc7e4c2485141059f0013c08b4c`

Live URL: <https://field-parts-promise.sociobot.in>

Verification date: 2026-09-02 UTC

## Decision

**PASS.** The candidate satisfies the researched brief and the factory release
contract. The live deployment identifies itself as the exact candidate. Every
registered claim passed from the clean checkout, the full local gates and
production build passed, and fresh live measurements meet the accessibility,
privacy, PWA, backend, caching, and performance requirements.

No critical, high, medium, or low product defect was found.

## First read

A new browser context opened the live page with no prior storage.

- **What it does:** “Promise dates from parts held for the job.”
- **Who it is for:** “For small trade firms that need a parts check before
  agreeing a visit date.”
- **What to click first:** **Try it with sample data**, immediately followed by
  “Opens Riverside Dental with one missing pump.”

The action is visible on the first desktop and 390×844 screens. One keyboard
activation opens the ready-to-use Riverside Dental `RD-1042` sample. The demo
then displays a persistent “Demo — sample data; nothing is saved to your local
workspace” banner with **Reset demo** and **Start for real**. The first-read and
one-click demo gates pass.

Evidence:

- [`first-read-desktop.png`](evidence/verification-21/first-read-desktop.png)
- [`first-read-mobile.png`](evidence/verification-21/first-read-mobile.png)
- [`demo-live-banner.png`](evidence/verification-21/demo-live-banner.png)

## Candidate and deployment identity

- Clean checkout HEAD before verification:
  `690fcb860a1eabc7e4c2485141059f0013c08b4c`.
- `GET /health` returned HTTP 200 with `status: ok`, `database: sqlite`,
  `auth: ready`, and full `build_sha`
  `690fcb860a1eabc7e4c2485141059f0013c08b4c`.
- Every tested live route showed footer build `690fcb86`.
- `EXPECTED_BUILD_SHA=690fcb... npm run verify:live-identity` passed.

The live deployment therefore matches the candidate.

## Registered claims

`.factory/claims.json` contains 37 claims. Before inspecting other product
files, the verifier invoked every listed `test` command separately against the
repository's demo entry point. Every command exited 0 with its tagged claim
passing; the mobile-project duplicate was skipped where the claim deliberately
runs once.

| # | Claim ID | Result | # | Claim ID | Result |
| ---: | --- | --- | ---: | --- | --- |
| 1 | `sample-fixture` | PASS | 20 | `entra-sign-in` | PASS |
| 2 | `promise-status-from-allocation` | PASS | 21 | `tenant-data-isolation` | PASS |
| 3 | `allocation-keeps-source` | PASS | 22 | `two-device-sync` | PASS |
| 4 | `supplier-quantity-conserved` | PASS | 23 | `idempotent-sync` | PASS |
| 5 | `reorder-after-allocation` | PASS | 24 | `offline-signed-in-sync` | PASS |
| 6 | `demo-reset-isolated` | PASS | 25 | `sync-conflict-resolution` | PASS |
| 7 | `offline-reload` | PASS | 26 | `invitation-email-activation` | PASS |
| 8 | `local-workspace-flow` | PASS | 27 | `account-service-boundaries` | PASS |
| 9 | `demo-feature-boundaries` | PASS | 28 | `sensitive-input-boundary` | PASS |
| 10 | `indexeddb-local-storage` | PASS | 29 | `audit-log-recording` | PASS |
| 11 | `demo-network-privacy` | PASS | 30 | `firm-deletion-hold` | PASS |
| 12 | `manual-barcode-allocation` | PASS | 31 | `response-policy` | PASS |
| 13 | `camera-barcode-privacy` | PASS | 32 | `subscription-checkout` | PASS |
| 14 | `release-order-boundary` | PASS | 33 | `technician-seat-charge` | PASS |
| 15 | `clear-local-records` | PASS | 34 | `expired-plan-keeps-export` | PASS |
| 16 | `workspace-backup-roundtrip` | PASS | 35 | `durable-runtime-storage` | PASS |
| 17 | `csv-import-validation` | PASS | 36 | `visible-build-identity` | PASS |
| 18 | `demo-transfer-isolated` | PASS | 37 | `container-runtime` | PASS |
| 19 | `csv-template-download` | PASS |  |  |  |

The landing, legal pages, README, and demo guide were cross-checked against the
manifest. Their observable statements map to registered claims; no unlisted
marketing or privacy promise was found.

## Clean-checkout gates

Commands and results:

- `npm ci`: passed; 85 packages installed from the lockfile, 0 vulnerabilities.
- `npm test`: passed; 24 Vitest tests and 15 Rust/API tests.
- `npm run check`: passed; 0 Svelte/TypeScript errors and 0 warnings.
- `npm run format:check`: passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  passed with no warnings.
- `npm run build`: passed; produced `dist/` and the optimized Rust server.
- `npm audit --audit-level=high`: passed; 0 vulnerabilities.
- `npm run test:e2e -- --retries=0`: clean rerun passed with **61 passed and
  43 expected project-specific skips**.

One earlier full-suite attempt ended with 60 passed, 43 skipped, and one failed
because the Playwright Chromium process received `SIGSEGV` before
`browser.newContext`. The affected `account-service-boundaries` claim had
already passed in its required isolated run. A fresh full-suite run passed all
61 executed tests with no retry. This was runner-process instability, not a
product assertion failure.

## Independent end-to-end product QA

### Normal, boundary, invalid, and recovery paths

- Live demo began with `RD-1042` **Date at risk** and one missing condensate
  pump. Keyboard-only allocation of one pump from Van 2 changed the status to
  **Parts in hand** and produced the reorder suggestion without placing an
  order. Reset restored **Date at risk**.
- Quantity `0` failed native validation with “Value must be greater than or
  equal to 0.01.” Quantity `2` was rejected with “Only 1 each is still needed
  for this job.” Correcting it to `1` completed the allocation.
- In a disposable live local workspace, the verifier created job `QA-2107` for
  Westgate Heat Pump, added Service van 4, allocated and undid one isolation
  valve, then attached confirmed supplier evidence `SUP-QA-447`. The status
  sequence was **Date at risk → Parts in hand → Date at risk → Expected before
  visit**. No network write or cross-origin request occurred.

Evidence:

- [`demo-allocated-desktop.png`](evidence/verification-21/demo-allocated-desktop.png)
- [`demo-mobile-viewport.png`](evidence/verification-21/demo-mobile-viewport.png)
- [`live-local-supplier-flow.png`](evidence/verification-21/live-local-supplier-flow.png)

### Mobile, keyboard, zoom, and accessibility

- Desktop and 390×844 layouts were usable with no horizontal overflow.
- All required first-screen copy ended at 701.5 px on the 844 px-tall viewport.
- Keyboard-only activation completed the demo allocation. The focused primary
  action used a designed solid 3 px purple outline.
- All visible links, buttons, and inputs in the tested mobile task state were
  at least 44×44 CSS px.
- At 200% root text size, the landing and allocation sheet retained the H1,
  primary action, quantity input, and submit action without horizontal
  overflow.
- Reduced-motion emulation set `--motion-row` to `0s`.
- 44 live Axe analyses covered 11 routes × two themes × desktop and mobile:
  **0 serious or critical findings**.
- The factory URL verifier reported title, `lang=en`, exactly one H1, main
  landmark, complete image alternatives, labelled buttons, and zero console
  or page errors. Normal routes produced no console or page errors. The
  designed unknown route correctly returned HTTP 404.

Evidence:

- [`live-qa.mjs`](evidence/verification-21/live-qa.mjs)
- [`verify-live/verify.json`](evidence/verification-21/verify-live/verify.json)
- [`mobile-text-200.png`](evidence/verification-21/mobile-text-200.png)

### Privacy and network boundaries

- The complete normal demo allocate/reset request log contained 12 requests,
  all same-origin `GET`/`HEAD`. There were no writes, analytics, trackers,
  account calls, billing calls, or camera requests.
- The independent local job/supplier flow also made no write request and no
  cross-origin request; its records stayed in the disposable browser profile.
- Live response headers include a restrictive CSP, HSTS with subdomains,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict-origin
  referrer policy, and a Permissions Policy allowing camera only to self while
  disabling microphone and geolocation.
- Fonts, scripts, styles, images, and icons are self-hosted. No third-party
  runtime font, script, or analytics request was observed.

### PWA and offline behavior

- The current service worker controlled the live app.
- `registration.update()` left no installing or waiting worker.
- The active cache was `parts-promise-shell-v6`.
- After the browser was set offline, `/?demo=1` reloaded and the pump could
  still be allocated to **Parts in hand**.
- `/manifest.webmanifest`, `robots.txt`, and `sitemap.xml` returned valid
  product-specific content. `/demo` returned 200, title `Demo — Parts Promise`,
  the sample H1, and the persistent demo banner.

### Backend, authentication, and rate limiting

- One hundred concurrent `GET /health` requests completed with HTTP 200.
- Local API tests proved tenant isolation, idempotency, conflict handling,
  persisted SQLite state across restart, the `/data` and single-replica
  contract, minimal `PORT` startup, and all authentication rejection cases.
- Live sign-in used only
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650`,
  client `25c704f4-465a-47af-80ab-2c489466b697`, callback
  `https://field-parts-promise.sociobot.in/auth/callback`, authorization code
  flow, PKCE `S256`, and scopes `openid profile email offline_access`.
- With one fresh forwarded client address, the first five live
  `GET /api/v1/export` requests received 401 plus decreasing
  `X-RateLimit-Remaining`. The sixth received **429** with
  **`Retry-After: 60`** and `X-RateLimit-Limit: 5`. The observed documented
  critical allowance is five requests per minute.

## Performance and caching

The exact production build emitted:

- Initial landing JavaScript: **19.90 KB gzip** (3.01 + 16.89 KB).
- Deferred workspace JavaScript: 23.47 KB gzip.
- Deferred CIAM JavaScript: 62.19 KB gzip.
- CSS: 6.61 KB gzip total (2.37 + 4.24 KB).
- Self-hosted fonts: 56,440 bytes total.
- Hero SVG: 2,321 bytes.

All bundle budgets pass. Hashed live JS/CSS returned
`Cache-Control: public, max-age=31536000, immutable`; HTML and `sw.js` returned
`no-cache, max-age=0, must-revalidate`.

Two fresh live Lighthouse mobile runs:

| Run | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 100 | 100 | 100 | 1.352 s | 0.022 | 90 ms | 122.4 KB |
| 2 | 95 | 100 | 100 | 100 | 1.350 s | 0.022 | 244 ms | 122.0 KB |

Both LCP results are below the required 2.5 seconds, resolving the only blocker
from independent verification 20.

Evidence:

- [`lighthouse-live-mobile-1.json`](evidence/verification-21/lighthouse-live-mobile-1.json)
- [`lighthouse-live-mobile-2.json`](evidence/verification-21/lighthouse-live-mobile-2.json)

## Links, metadata, and documentation

- All discovered same-origin links across the stable public/account routes
  returned HTTP 200. The only external link is plainly labelled “Built by
  Param Factory (external site)” and was not followed because it is outside
  this work order's product boundary.
- Each route has its own tested title, canonical metadata, one H1, and real
  navigation URL. The designed unknown route returns HTTP 404 with recovery
  links.
- `README.md`, MIT `LICENSE`, `.factory/design.md`, `.factory/demo.md`, privacy,
  and terms are present and consistent with the tested behavior.
- The explicit no-runtime-AI decision is appropriate: promise status must be
  auditable from allocation and supplier evidence. Import/export and sync are
  already present, so no obvious AI or integration leverage is missing from
  this milestone.

## Defects by severity

- **Critical:** none.
- **High:** none.
- **Medium:** none.
- **Low:** none.

Checkout remains explicitly unavailable and makes no charge. This is the
documented recurring-billing operator boundary, not an unreported or unsafe
stub; it does not block the accepted local/demo/core allocation job.
