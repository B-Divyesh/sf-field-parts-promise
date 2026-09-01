# Parts Promise repair 13 handoff

Date: 2026-09-01 UTC

Work order: `field-parts-promise-repair-13`

Repair commit: `afda885a8ea9d40b28a1cca2e100ca68af3a37db`

Base verifier report: `.factory/verification-17.md` at
`a8451bb9eed66fa4d1b0c0f8dd0050ff6d218970`

## Result

The release-blocking cache-policy defect `FPP-17-01` is repaired. The server
now recognizes Vite's default eight-character URL-safe Base64 hashes, including
the `-` and `_` characters that may occur inside a fingerprint. A fingerprinted
asset receives `public, max-age=31536000, immutable`; documents, service worker,
and non-fingerprinted assets keep their existing policies.

The repair changes only `server/src/lib.rs`. SQLite durability remains unchanged:
`deploy.json` still declares `/data` and one replica, and runtime storage keeps
using `/data/parts-promise.sqlite3` when the fleet mount is present.

## Reproduction and regression

Before the source change, the live candidate build
`bb90e8c401eb069028f5f2d4bc82bd654206c668` reproduced the verifier's exact
failure:

```text
GET /assets/index-DsS9kk-o.js
200
Cache-Control: public, max-age=3600
```

`tests::vite_hashes_with_url_safe_hyphens_get_immutable_cache_policy` is the
new regression. It uses the exact filename `index-DsS9kk-o.js` and asserts both
fingerprint recognition and the immutable policy. A production-built Rust
server was then run with a temporary static directory containing that exact
filename and a temporary SQLite directory (not `/data`); its response was:

```text
GET /assets/index-DsS9kk-o.js
200
Cache-Control: public, max-age=31536000, immutable
```

The same release server returned the immutable policy for the generated primary
bundle `index-B5g413Yi.js`.

## Verification

All commands ran from this repaired checkout:

```text
npm ci                                                   PASS (85 packages, 0 vulnerabilities)
npm test                                                 PASS (22 Vitest, 15 Rust tests)
npm run check                                            PASS (0 errors, 0 warnings)
npm run format:check                                     PASS
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
                                                         PASS
BUILD_SHA=afda885a8ea9d40b28a1cca2e100ca68af3a37db npm run build
                                                         PASS; dist/ and release API produced
BUILD_SHA=repair-local npm run test:e2e -- --retries=0  PASS (59 passed, 43 intentional project skips)
```

The full browser suite covers the declared claim flows, desktop and 390 px
mobile layouts, keyboard operation, Axe checks, privacy request boundaries,
offline reload/update behavior, CIAM, durable runtime storage, and response
policy/rate-limit behavior. The local `verify-url.sh` pass recorded a 200 page
with title `Parts Promise — Allocate parts to each job`, `lang=en`, one H1, a
main landmark, no missing image alt text, no unnamed buttons, and no console or
page errors. Its screenshots and JSON are in
`.factory/repair-13-artifacts/verify-local/`.

## Deploy and live check

Push the handoff commit and deploy with:

```sh
/opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

The deploy uses the unchanged `deploy.data_dir` of `/data`; it adopts the
product's existing `sf-field-parts-promise-data` durable share and retains the
single-replica SQLite configuration. After deploy, verify the exact live build
identity and the cache policy:

```sh
EXPECTED_BUILD_SHA=<deployed-commit> npm run verify:live-identity
curl -I https://field-parts-promise.sociobot.in/assets/<generated-primary-bundle>.js
```

Expected cache value: `public, max-age=31536000, immutable`.

## Known gap / next step

Recurring checkout stays intentionally unavailable until the factory registers
the approved recurring firm and seat product in the Sociobot billing gateway.
The existing operator-gated API boundary and its regression coverage are
unchanged. No customer data, `/data` contents, infrastructure, DNS, or billing
configuration were modified during this repair.
