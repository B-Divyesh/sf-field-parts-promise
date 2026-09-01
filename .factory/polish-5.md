# Perfection-loop round 5 repair map

Date: 2026-09-01 UTC

Work order: `field-parts-promise-polish-5`
Implementation commit: `d08d6f05611a20f306552aa5378fb502b915c7c1`

This map covers every finding ID in reviews 1–5. Review 4 was a PASS with no finding IDs. All 37 registered claim commands passed separately from the clean clone `/tmp/field-parts-promise-clean.XGvdxQ` at the implementation commit.

| Finding | Change made or preserved | Evidence |
| --- | --- | --- |
| F-1-1 | Route changes and history navigation focus the destination H1 and announce it politely. | `forward and browser-history route changes focus the new heading`; `Back and Forward restore reading position while keeping the new heading focused` |
| F-1-2 | The real firm job now works end to end: identity, tenant isolation, sync, invitations, data controls, and billing state sit behind public local use. | `@claim:entra-sign-in`, `@claim:tenant-data-isolation`, `@claim:two-device-sync`, `@claim:invitation-email-activation` |
| F-1-3 | The registry now has 37 unique claims and exactly one tagged test per claim. | `public claims contract`; all 37 exact clean-clone commands passed |
| F-1-4 | Every demo exit deletes sample changes and preserves the live workspace. | `@claim:demo-reset-isolated` |
| F-1-5 | Each route updates one title, description, canonical, Open Graph, Twitter, and robots set. | `each route owns one correct metadata set` |
| F-1-6 | `/demo` has `Demo — Parts Promise`, its own canonical, and a sitemap entry. | metadata test; `public/sitemap.xml` |
| F-1-7 | The first screen states the firm and active-technician prices. | `@claim:technician-seat-charge`; `evidence/polish-5/home-mobile.png` |
| F-1-8 | The task label remains “Allocate parts to a job.” | `.factory/copy-audit.md`; home screenshots |
| F-1-9 | The hero caption names the actual source records. | `.factory/copy-audit.md`; home screenshots |
| F-1-10 | The preview is labelled “Sample job status.” | `.factory/copy-audit.md` |
| F-1-11 | The preview heading names the visit date and its risk. | `.factory/copy-audit.md` |
| F-1-12 | The process section remains “How it works.” | `.factory/copy-audit.md` |
| F-1-13 | The process heading says “Check parts before agreeing a visit date.” | `.factory/copy-audit.md` |
| F-1-14 | Step one remains “List required parts.” | `.factory/copy-audit.md` |
| F-1-15 | UI actions consistently use **allocate**. | `@claim:promise-status-from-allocation`; copy audit |
| F-1-16 | Step three remains “Review the visit date.” | `.factory/copy-audit.md` |
| F-1-17 | Theme actions name their result and keep 44 px targets. | `all phone links and verifier-reported controls provide separated 44px touch targets` |
| F-1-18 | README uses the complete heading “Try it with sample data.” | README inspection; copy scan |
| F-1-19 | Product explanation is plain; claim machinery is isolated under “Claim checks.” | README inspection; `.factory/copy-audit.md` |
| F-1-20 | SPA and static error pages say “Page not found,” include recovery and legal links, unique metadata, and a build ID. | `container-runtime`; `each route owns one correct metadata set`; `stamps build identity into both app and static 404 surfaces` |
| F-1-21 | Demo labels remain “Sample job” and “Required parts and their sources.” | `@claim:sample-fixture`; `evidence/polish-5/demo-mobile.png` |
| F-2-1 | Wordmark, Back, Reset demo, and Start for real share the isolated deletion behavior. | `@claim:demo-reset-isolated` |
| F-2-2 | JSON round-trip, CSV preview/validation, template download, and demo/live isolation remain complete. | `@claim:workspace-backup-roundtrip`, `@claim:csv-import-validation`, `@claim:csv-template-download`, `@claim:demo-transfer-isolated` |
| F-2-3 | Missing jobs and unknown paths render real noindex 404 state under 404 metadata. | metadata test; `container-runtime` |
| F-2-4 | Every work sheet, including Scan a part, receives focus, exposes state, stays visible on mobile, and restores its trigger. | `each work form expands, becomes visible, receives focus, and restores its trigger` |
| F-3-1 | Back and Forward preserve the prior reading position while moving focus to the new heading. | desktop/mobile history tests |
| F-3-2 | The exact Riverside Dental fixture remains registered and tested. | `@claim:sample-fixture` |
| F-3-3 | Backup and transfer claims compare complete records and preserve the live namespace. | `@claim:workspace-backup-roundtrip`; `@claim:demo-transfer-isolated` |
| F-3-4 | The downloadable CSV template has its own exact claim. | `@claim:csv-template-download` |
| F-3-5 | The banner says sample data is not saved to the local workspace. | `@claim:demo-reset-isolated`; `evidence/polish-5/demo-mobile.png` |
| F-3-6 | Reader copy uses **browser database** only; exact IndexedDB names are confined to the README developer note. | source terminology scan; `.factory/copy-audit.md` |
| F-5-1 | Removed unsupported payment-provider, merchant, and refund statements from all public copy and API success metadata. | source scan; `@claim:subscription-checkout` |
| F-5-2 | Narrowed privacy wording to the observed input boundary and registered its test. | `@claim:sensitive-input-boundary` checks every public/account/billing route and request body |
| F-5-3 | Added a release-wide order boundary. Barcode entry and scanning are now real features; supplier-order placement remains absent. | `@claim:release-order-boundary`, `@claim:manual-barcode-allocation`, `@claim:camera-barcode-privacy` |
| F-5-4 | Simplified README runtime wording and registered the remaining `/data`, one-replica, file, and restart statements. | `@claim:durable-runtime-storage`; `container release contract` |
| F-5-5 | Removed the completeness overclaim. The developer section now points only to registered checks. | README “Claim checks”; claim registry unit test |
| F-5-16 | Checkout makes no request on page load and sends exactly one POST only after the owner presses the named button. | `@claim:subscription-checkout` browser request log |
| F-5-6 | Split the first long storage sentence into short sentences. | automated README sentence scan: no sentence over 22 words |
| F-5-7 | Removed the long fallback sentence and unregistered fallback promise. | automated README sentence scan; README deployment section |
| F-5-8 | Public copy now says “Checkout is not available yet. No charge will start.” | `@claim:subscription-checkout`; home, billing, privacy, terms, README |
| F-5-9 | Replaced “Workshop” with **Firm plan** in user-facing copy and planning terminology. | source scan; `@claim:technician-seat-charge` |
| F-5-10 | Terms says the owner is included in the $39 base price and does not use a technician seat. | `@claim:technician-seat-charge` |
| F-5-11 | Home, Open Graph, and Twitter titles now say “Allocate parts to each job.” | metadata test; factory URL verifier |
| F-5-12 | Added Scan a part, explicit Use camera permission, BarcodeDetector matching, Enter barcode instead, and allocation continuation. | `@claim:manual-barcode-allocation`, `@claim:camera-barcode-privacy`; `evidence/polish-5/barcode-mobile.png` |
| F-5-13 | Every route footer shows the short immutable build and exposes the full value; static 404 is stamped too. | `@claim:visible-build-identity`; build-stamping unit test |
| F-5-14 | Footer link now reads “Built by Param Factory (external site).” | route/link browser tests; home screenshots |
| F-5-15 | Internal claim language is under the developer-only “Claim checks” heading. | README inspection; `.factory/copy-audit.md` |

## Verification before deployment

- Clean clone: `/tmp/field-parts-promise-clean.XGvdxQ`, detached at `d08d6f05611a20f306552aa5378fb502b915c7c1`.
- Every one of the 37 exact `.factory/claims.json` commands: 37 passed, with one intentional duplicate-project skip per command.
- `npm test`: 22 Vitest and 14 Rust/API tests passed.
- `npm run check`: 0 errors and 0 warnings.
- `npm run format:check`: passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`: passed.
- `BUILD_SHA=d08d6f0 npm run build`: passed; `dist/` produced. Main JS is 39.61 KB gzip, deferred CIAM JS is 62.19 KB gzip, and CSS is 4.24 KB gzip.
- `BUILD_SHA=d08d6f0 npm run test:e2e -- --retries=0`: 59 passed, 43 intentional project skips, 0 failures.
- Factory URL verifier against the local production server: title, `lang=en`, one H1, main, image alternatives, button labels, and zero console errors passed. Evidence: `evidence/polish-5/local-verify/verify.json`.
- Mobile Lighthouse: performance 95, accessibility 100, best practices 96, SEO 100; LCP 2.3 s, CLS 0, TBT 150 ms. Evidence: `evidence/polish-5/lighthouse-local.json`.

## Live verification

Deployed source commit `f3b33148f1b5d5e56da8a245ebb7affc73d154d6` through the configured container workflow. ACR run `ch1q5` succeeded. The existing `sf-field-parts-promise-data` mount was reused at `/data`, and the target stayed at one replica.

- `/health` returned HTTP 200 with the exact deployed SHA, `database: "sqlite"`, and `auth: "ready"`.
- `/opt/fleet/lib/verify-url.sh` passed on the cold live URL: correct title, `lang=en`, one H1, main landmark, image alternatives, button labels, and zero console errors. Evidence: `evidence/polish-5/live/verify.json`.
- The cold public/demo audit passed 29 checks with zero console or page errors. It covered the first screen at 390×844, all route titles/metadata, storage/payment wording, focus, one-click demo entry, barcode allocation, supplier-order absence, and reset. Evidence: `evidence/polish-5/live/public-demo-audit.json`.
- Camera, privacy, offline, 404, and accessibility audit passed 15 checks. All 10 route/theme Axe scans had zero serious or critical findings. Evidence: `evidence/polish-5/live/camera-offline-axe.json`.
- Live mobile Lighthouse scored performance 99, accessibility 100, best practices 100, and SEO 100. LCP was 1.8 s, CLS 0, and TBT 30 ms. Evidence: `evidence/polish-5/live/lighthouse.json`.
- A 100-request live burst produced 60 HTTP 429 responses with `Retry-After: 2`. Evidence: `evidence/polish-5/live/rate-limit.json`.
- Root and 404 responses include CSP, HSTS, `nosniff`, strict referrer policy, and `Permissions-Policy: camera=(self), microphone=(), geolocation=()`. Hashed JS is immutable for one year; `sw.js` is no-cache. Evidence: `evidence/polish-5/live/*-headers.txt`.
- Live screenshots: `evidence/polish-5/live/cold-mobile.png`, `demo-reset-mobile.png`, `camera-match-mobile.png`, `screenshot-desktop.png`, and `screenshot-mobile.png`.

Every review finding is resolved in the deployed product. Checkout unavailability is an explicit, tested release boundary; the public site makes no unsupported provider or refund promise.
