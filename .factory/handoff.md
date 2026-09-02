# Parts Promise polish 6 handoff — PASS

Date: 2026-09-02 UTC

Work order: `field-parts-promise-polish-6`

Implementation commit: `54fe70e7d87134f88bb3780b6368c1bd3803cf88`

Live URL: <https://field-parts-promise.sociobot.in>

## Result

All findings from `.factory/review-6.md` and every earlier review were closed
or rechecked. The live revision reports the exact tested implementation SHA.

The mode switch now clears workspace-derived transient UI before rendering,
guards in-flight live requests, and prevents live sync state from appearing in
Demo. The claim test proves isolation in both directions with unique record
names. The Entra claim test now covers expiry, signature, issuer, audience, and
tenant rejection, including the required authentication header. Pricing and
README wording are plain and match the unavailable-checkout boundary.

`.factory/polish-6.md` maps every finding ID to its change and evidence.

## Verification

- Clean clone at `54fe70e7d87134f88bb3780b6368c1bd3803cf88`:
  all 37 commands from `.factory/claims.json` passed independently. See
  `.factory/evidence/polish-6/clean-claims/summary.json` and its per-claim logs.
- `npm test`: 23 Vitest and 15 Rust tests passed.
- `npm run check`, `npm run format:check`, and strict `cargo clippy`: passed.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `BUILD_SHA=54fe70e7d87134f88bb3780b6368c1bd3803cf88 npm run build`: passed and
  produced `dist/`. Initial JavaScript is 39.89 KB gzip and CSS is 4.24 KB gzip;
  the deferred sign-in chunk is 62.19 KB gzip.
- Full Playwright suite: 59 passed, 43 intentional project-specific skips.
- Exact-commit local audit: 72/72 checks passed. Factory URL verification found
  no console errors, one H1, a main landmark, `lang=en`, no missing alt text,
  and no unlabeled buttons.
- Live cold audit: 72/72 checks passed. It covers first-screen copy, one-click
  demo state, unique-token live/demo isolation both ways, banner/reset behavior,
  route titles, one H1 and main landmark per route, legal links, real 404,
  serious/critical Axe findings, console errors, SQLite health, and build SHA.
- Live factory URL verifier: HTTP 200 in 603 ms, no console errors, and all
  semantic smoke checks passed.
- Live malformed bearer token: HTTP 401 with `WWW-Authenticate: Bearer`.
- Live unknown route: HTTP 404 with the product's designed error page and
  security headers.
- Live Lighthouse: performance 99, accessibility 100, best practices 100, SEO
  100; LCP 1.8 s, CLS 0, total blocking time 50 ms.

Evidence is under `.factory/evidence/polish-6/`, including cold mobile,
demo-isolation, desktop, Lighthouse, factory-verifier, audit JSON, and all
clean-clone claim logs.

## Run and verify

```bash
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --all-targets -- -D warnings
npm audit --audit-level=high
BUILD_SHA=$(git rev-parse HEAD) npm run build
BUILD_SHA=$(git rev-parse HEAD) npm run test:e2e -- --retries=0
BASE_URL=http://127.0.0.1:4173 \
  EXPECTED_BUILD_SHA=$(git rev-parse HEAD) \
  EVIDENCE_DIR=.factory/evidence/polish-6/local \
  node scripts/audit-round6.mjs
```

The direct sample URL is
<https://field-parts-promise.sociobot.in/?demo=1>. Reset demo restores the
seeded Riverside Dental job. Start for real deletes the demo database and opens
the separate live workspace.

## Deployment

- Artifact class: containerized web application with Rust/Axum backend and
  built Svelte frontend.
- Image tag: `sf-field-parts-promise:54fe70e7d871`.
- Owned app: `sf-field-parts-promise`.
- Durable mount: fleet-managed `sf-field-parts-promise-data` at `/data`, one
  replica.
- Health: `status=ok`, `database=sqlite`, `auth=ready`, build SHA
  `54fe70e7d87134f88bb3780b6368c1bd3803cf88`.

## Remaining work

No review finding or repository defect is known. Checkout intentionally remains
unavailable and operator-gated; the UI makes no billing request until the owner
presses its named action, and the server returns the tested unavailable state.
Enabling it later requires the product registration supplied by the factory
operator. No direct payment-provider integration is present.
