# Parts Promise repair 8 handoff

Date: 2026-08-30 UTC
Work order: `field-parts-promise-repair-8`
Base verified source: `d19e4c8a4e1ffc99df3729651d4e8e1da435eadc`

## Repair status

The release-blocking repository test failure from independent verification 12
is repaired. The cross-route accessibility test still checks every public and
app route in both themes (11 routes × 2 themes = 22 axe analyses in each
Chromium project), but it now has a test-specific 120-second timeout. The
default 30-second Playwright timeout was shorter than a clean, throttled
browser run; no routes, themes, severity thresholds, or assertions were
removed.

The change is in `e2e/product.spec.ts`. The test remains the regression
coverage: it asserts no serious or critical axe findings for each route/theme
combination in desktop Chromium and at the 390 × 844 mobile viewport.

The reported source-provenance mismatch is addressed by this repair's pushed
commit and container deployment. The final deployed commit and `/health`
evidence are recorded below after deployment.

## Verification completed before deployment

- Clean install: `npm ci` — passed; 85 packages installed and `npm audit`
  reported 0 vulnerabilities.
- Unit and API: `npm test` — 16 Vitest tests and 11 Rust tests passed; the
  isolated-PostgreSQL round-trip remains intentionally ignored without a
  supplied test database.
- Types: `npm run check` — 0 errors and 0 warnings.
- Formatting: `npm run format:check` — passed.
- Rust lint: `cargo clippy --manifest-path server/Cargo.toml --locked
  --all-targets -- -D warnings` — passed.
- Production build: `npm run build` — passed. Main JavaScript is 38.24 KB
  gzip, lazy CIAM JavaScript is 62.19 KB gzip, and CSS is 4.19 KB gzip.
- Browser regression: `npm run test:e2e -- --grep 'public and app routes have
  no serious accessibility findings' --retries=0` — passed in both Chromium
  projects with the complete route/theme sweep.
- Complete browser suite: `npm run test:e2e -- --retries=0` — passed (88
  tests, no retries). This includes desktop and 390 px mobile flows,
  keyboard allocation, focus restoration, touch-target geometry, dialogs,
  reduced motion, privacy traffic, offline reload, service-worker update,
  response policy, signed-in sync boundaries, and CIAM request behavior.
- Local production runtime: the release server was started with only
  `PORT=4173`; `/health` returned `{"status":"ok","build_sha":"dev",
  "database":"sqlite","auth":"ready"}`. `verify-url.sh` passed at
  `http://127.0.0.1:4173` with title, `lang=en`, one H1, a main landmark, no
  missing image alt text, no unlabeled buttons, and no console/page errors.
  Evidence is in `.factory/repair-8-artifacts/local-verify/`.
- Accessibility uses the repository's `@axe-core/playwright` sweep above;
  it found no serious or critical issues. The local verifier also confirms the
  semantic baseline and console cleanliness.
- Local response policy: the hashed main script returned
  `Cache-Control: public, max-age=31536000, immutable`; `sw.js` returned
  `no-cache, max-age=0, must-revalidate`; both included the product CSP,
  HSTS, `nosniff`, strict referrer policy, frame denial, and camera/microphone/
  geolocation `Permissions-Policy`.

## Deployment and live evidence

Pending the commit and container deployment in this repair work order.

## Remaining external release dependency

The recurring Sociobot product is still not registered. Immediately before
this repair, both of these independent gateway requests returned HTTP 404 with
`{"error":"enabled factory product","status":404}`:

- `https://pilot-api.sociobot.in/api/v1/products/field-parts-promise/checkout`
- `https://api.sociobot.in/api/v1/products/field-parts-promise/checkout`

The pilot and production catalogues contain no `field-parts-promise` entry.
The supplied billing contract exposes a factory registration step but this
worker has neither that registration tool nor a documented recurring-seat
registration API. The application therefore keeps the existing honest 424
fallback: it neither charges a user nor invokes Dodo directly. This is the
only unresolved verification-12 blocker and requires the factory billing
operator to register the researched $39/month Workshop base plus $8/month per
active technician in pilot and production, then exercise checkout, seat
change, cancellation, failed renewal, and refund/revocation.

## How to run

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run build
npm run test:e2e -- --retries=0
```

For a production-like local server without configuration other than its port:

```sh
PORT=8080 server/target/release/parts-promise-api
```
