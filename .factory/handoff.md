# Parts Promise perfection-loop round 5 handoff

Date: 2026-09-01 UTC

Work order: `field-parts-promise-polish-5`

Live URL: <https://field-parts-promise.sociobot.in>
Implementation commit: `d08d6f05611a20f306552aa5378fb502b915c7c1`

## Result

The round-5 source repair is complete. Every review-5 finding and every earlier finding ID is mapped in [`.factory/polish-5.md`](polish-5.md). Deployment and cold live evidence will be appended after the committed release is serving.

## What changed

- Added a real barcode path to each job: **Scan a part**, explicit **Use camera**, manual **Enter barcode instead**, local matching, and continuation into allocation. Camera tracks stop after a match or exit; frames are not stored or sent.
- Restored one reader-facing storage term, **browser database**. IndexedDB and exact namespace names now appear only in a labelled developer note.
- Removed unsupported provider, merchant, and refund statements. Checkout copy now states the tested release behavior: it is unavailable and no charge starts.
- Registered and tested barcode privacy, manual barcode allocation, release-wide supplier-order absence, sensitive-input behavior, durable runtime files/restart, visible build identity, and explicit checkout initiation.
- Rewrote the long README sentences, replaced “Workshop” with **Firm plan**, clarified owner pricing, and separated product explanation from claim-check instructions.
- Standardized the home title on **allocate**, completed 404 metadata/legal links, labelled the external footer destination, and exposed the server build on every route and the static 404.
- Updated the service-worker cache version, self-camera Permissions Policy, catalog description, demo guide, copy audit, and plan status.

## Verification

Fresh clone: `/tmp/field-parts-promise-clean.XGvdxQ`, detached at the implementation commit.

- All 37 exact commands in `.factory/claims.json`: passed individually; each had one expected duplicate-project skip.
- `npm test`: 22 Vitest and 14 Rust/API tests passed.
- `npm run check`: 0 errors and 0 warnings.
- `npm run format:check`: passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`: passed.
- `BUILD_SHA=d08d6f0 npm run build`: passed and produced `dist/` plus the release server.
- Bundle: main JS 39.61 KB gzip; deferred sign-in JS 62.19 KB gzip; CSS 4.24 KB gzip.
- `BUILD_SHA=d08d6f0 npm run test:e2e -- --retries=0`: 59 passed, 43 intentional project skips, 0 failures.
- The browser suite includes 44 route/theme/viewport Axe scans, keyboard and focus checks, 390×844 geometry, 200% text, reduced motion, privacy request recording, offline reload, service-worker update, and real container behavior.
- `/opt/fleet/lib/verify-url.sh` against the local production server passed with zero console errors. Evidence: [verify.json](evidence/polish-5/local-verify/verify.json).
- Mobile Lighthouse: performance 95, accessibility 100, best practices 96, SEO 100; LCP 2.3 s, CLS 0, TBT 150 ms. Evidence: [lighthouse-local.json](evidence/polish-5/lighthouse-local.json).
- Visual evidence: [mobile home](evidence/polish-5/home-mobile.png), [desktop home](evidence/polish-5/home-desktop.png), [mobile demo](evidence/polish-5/demo-mobile.png), and [mobile barcode sheet](evidence/polish-5/barcode-mobile.png).

## Run locally

```sh
npm ci
npm test
npm run check
npm run format:check
npm run build
npm run test:e2e -- --retries=0
```

Open `http://127.0.0.1:4173/?demo=1` for the isolated sample.

## Deployment contract

The container starts with only `PORT`, defaults to 8080, runs as non-root, and reports build identity at `/health`. SQLite and the generated metrics token use `/data`; `deploy.json` pins one replica. No raw model, payment-provider, or application secret is shipped.

## Known gaps and operator action

Checkout intentionally remains unavailable because no verified recurring firm-plus-seat contract is active. The UI and API stop before a charge, and the product makes no provider or refund promise. Enabling checkout later requires a separate verified billing registration and new claim evidence.

If the production Entra callback is not already registered, the operator must register `https://field-parts-promise.sociobot.in/auth/callback` on the shared SPA application. The local and demo workflows do not depend on that registration.
