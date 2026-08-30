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

The provenance rollout also exposed a server startup failure: the factory's
shared PostgreSQL database already contains the complete Parts Promise schema,
but its shared `_sqlx_migrations` history does not contain this product's
bootstrap migration. A new replica therefore attempted `CREATE TABLE
fpp_users` and stopped. `server/src/db.rs` now verifies all nine required
tables, all eight RLS policies, and all ten organization columns. An empty
database still runs the reversible product migrations; a complete schema is
used without replaying bootstrap DDL; and a partial schema fails closed with a
clear recovery error. Unit tests cover all three states.

The reported source-provenance mismatch is addressed by the pushed repair
commit and its container deployment. The deployed commit and `/health` evidence
are recorded below.

## Verification completed before deployment

- Clean install: `npm ci` — passed; 85 packages installed and `npm audit`
  reported 0 vulnerabilities.
- Unit and API: `npm test` — 16 Vitest tests and 13 Rust tests passed; the
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
- Production-schema startup regression: with the factory runtime and migration
  database URLs supplied only to the local smoke command, the server started
  against the existing PostgreSQL schema, logged “using the verified existing
  product schema”, and returned
  `{"status":"ok","build_sha":"dev","database":"postgres","auth":"ready"}`.
  It performed only schema metadata reads before the health request; evidence
  is `.factory/repair-8-artifacts/production-schema-smoke.json`.

## Deployment and live evidence

The initial accessibility repair `6c3afa6a1aafdc9397dc6783bd821b951115ae42`
was built and deployed as Container App revision
`sf-field-parts-promise--0000023`. Its live checks exposed the shared-schema
startup condition described above on the subsequent `--0000024` deployment;
traffic stayed on `--0000023` while the schema guard was prepared.

The complete repair `b78264509ea8ee01b2a1e358c0231b3ac8764a77` is pushed to
`origin/main`, built in ACR as
`sociobotregistry.azurecr.io/sf-field-parts-promise:b78264509ea8`, and
deployed through the work-order container configuration as revision
`sf-field-parts-promise--0000025` with 100% latest-revision ingress traffic.
The revision log records both “Parts Promise is using the verified existing
product schema” and a listener on port 8080 with that exact build SHA.

After deployment, `https://field-parts-promise.sociobot.in/health` returned
HTTP 200 with:

```json
{
  "status": "ok",
  "build_sha": "b78264509ea8ee01b2a1e358c0231b3ac8764a77",
  "database": "postgres",
  "auth": "ready"
}
```

The live `verify-url.sh` check passed in 615 ms with no browser console or page
errors, the correct title and language, one H1, a main landmark, no missing
image alt text, and no unlabeled buttons. It captured both desktop and 390 px
mobile screenshots in `.factory/repair-8-artifacts/live-verify/`.

An independent live Playwright smoke check opened the sample demo at desktop
and 390 × 844. Both started and reloaded offline as “Riverside Dental parts”,
were service-worker controlled, had no console/page errors, made no
out-of-origin requests, and had zero serious or critical axe violations. A
separate live 390 px keyboard flow used Enter and Space to allocate Van 2's
pump; it changed the promise to “Parts in hand” without errors. Evidence is in
`.factory/repair-8-artifacts/live-browser.json` and
`.factory/repair-8-artifacts/live-keyboard-mobile.json`.

Live response-policy checks confirmed immutable caching for the hashed main
script, `no-cache` for `sw.js`, the deployed CSP, HSTS, `nosniff`, strict
referrer policy, frame denial, and camera/microphone/geolocation denial. A
live invalid bearer token was rejected with HTTP 401 and
`WWW-Authenticate: Bearer`.

The final live `verify-url.sh` check passed in 622 ms with no console or page
errors, the correct title and language, one H1, a main landmark, no missing
image alt text, and no unlabeled buttons. A fresh 390 × 844 browser context
then used the keyboard to enter the demo, allocate the pump to Van 2, and make
the job “Parts in hand”; it had no console/page errors, no out-of-origin
requests, and zero serious or critical axe findings. In a separate fresh
context, the service worker controlled the demo and it reloaded while offline.
The live malformed-bearer check still returned 401 with
`WWW-Authenticate: Bearer` and the response security policy headers.

This documentation-only commit was made after the deployed source repair to
record the final evidence; no production code changed after
`b78264509ea8ee01b2a1e358c0231b3ac8764a77`.

## Remaining external release dependency

The recurring Sociobot product is still not registered. Before this repair,
both gateways returned HTTP 404 with `{"error":"enabled factory
product","status":404}`. During post-deploy verification, the pilot endpoint
continued to return that 404 while the production gateway returned HTTP 503 on
two fresh GETs, so production checkout is unavailable as well:

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
