# Parts Promise verification 17 handoff

Date: 2026-09-01 UTC

Work order: `field-parts-promise-verify-17`

Candidate and live build: `bb90e8c401eb069028f5f2d4bc82bd654206c668`

Live URL: <https://field-parts-promise.sociobot.in>

## Result — FAIL

Do not accept this candidate yet. All 37 declared claims, local release gates,
core product flows, accessibility checks, privacy checks, offline behavior,
identity checks, and backend allowance checks passed. The primary hashed
JavaScript asset does not receive the required immutable cache policy.

## Release-blocking finding

`FPP-17-01` (low severity):
`/assets/index-DsS9kk-o.js` returns
`Cache-Control: public, max-age=3600`. A fingerprinted production asset must
return `public, max-age=31536000, immutable`.

The source check uses the text after the final hyphen as the fingerprint. That
reduces `DsS9kk-o` to `o` and sends this asset through the one-hour branch.
The current CSS and sign-in chunks receive the correct immutable policy.

## Verification summary

- 37 of 37 exact claim commands passed.
- `npm ci` passed with 0 reported vulnerabilities.
- `npm test` passed: 22 Vitest and 14 Rust tests.
- `npm run check`, `npm run format:check`, and strict Rust warning checks
  passed.
- The production build passed and produced `dist/` and the optimized server.
- Full Playwright run: 59 passed, 43 intentional skips, 0 failed.
- Live `/health` reports the exact candidate SHA, SQLite, and ready identity.
- The production web files match the deployed files byte for byte.
- The one-click sample completed on desktop and 390 px mobile.
- Live route/theme matrix: 44 axe analyses, 0 serious or critical findings.
- Live mobile Lighthouse: 94 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 2.0 s and CLS 0.
- Live API allowances: read 40/2 s, write 10/2 s, critical 5/60 s. Requests
  after each allowance returned 429 with a positive `Retry-After`.
- The service worker updated cleanly and the sample reloaded and allocated
  offline.

Full evidence and reproduction details are in
[`.factory/verification-17.md`](verification-17.md).

## How to verify

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
BUILD_SHA=bb90e8c401eb069028f5f2d4bc82bd654206c668 npm run build
BUILD_SHA=bb90e8c401eb069028f5f2d4bc82bd654206c668 npm run test:e2e -- --retries=0
EXPECTED_BUILD_SHA=bb90e8c401eb069028f5f2d4bc82bd654206c668 npm run verify:live-identity
curl -I https://field-parts-promise.sociobot.in/assets/index-DsS9kk-o.js
```

## Next step

Correct the hashed-asset filename check, add a regression test for a Vite hash
containing a hyphen, deploy, and rerun the cache-header and identity checks.

Checkout remains intentionally unavailable until the recurring firm and seat
product is registered in the approved Sociobot billing system. If the callback
is not already registered, the operator must register
`https://field-parts-promise.sociobot.in/auth/callback` on the shared SPA
application.
