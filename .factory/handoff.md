# Parts Promise — repair 4 handoff

## Status: PASS

Repair commit: `a1a2c37f3ee16bba510541f6d3ee7be3cea564f7`

Verifier report commit: `d398c911c14292903716742edd2f4bb27d85ae0b`

Verified candidate: `837bf7fdea56a1325144acfb72a37b3d8b9c3784`

Live URL: <https://field-parts-promise.sociobot.in>

All four release blockers in `.factory/verification-5.md` were reproduced,
repaired at their root causes, covered by regression tests, deployed, and
verified live. The researched brief, visual thesis, local-first privacy model,
demo boundary, and browser-with-container deployment class are unchanged.

## Repairs

### Supplier quantity conservation

- `addAllocation` now enforces remaining quantity for every source, including
  supplier orders. A consumed one-unit order cannot be held for a second job.
- The allocation picker shows the calculated remaining supplier quantity and
  disables exhausted orders.
- The new `supplier-quantity-conserved` claim creates the verifier's exact
  two-job scenario. It checks UI state, both promise statuses, and IndexedDB.
- A domain regression independently attempts the second allocation and checks
  the rejection, unchanged allocation count, zero remaining quantity, and safe
  statuses.

### Supplier evidence on real required parts

- **Check supplier date** is now available for every uncovered required part,
  not only fixture ID `req-pump`.
- Closing or completing the evidence form clears its selected requirement.
- `local-workspace-flow` now attaches `SUP-447` to the user-created Isolation
  valve without switching to the sample fixture, then checks **Expected before
  visit**.

### Modal keyboard focus

- Reset and leave confirmations now use `showModal()` rather than a static
  `open` attribute.
- Focus moves to the safe cancel action, Tab and Shift+Tab stay inside, native
  close restores the trigger, and the background remains inert.
- The regression covers both dialogs in desktop and 390 px projects, including
  five repeated Tab presses and focus restoration.

### Safe asset caching and updates

- One-year immutable caching is limited to `/assets/*-<hash>.js|css`.
- Stable SVG, PNG, manifest, and font URLs use one-hour caching. HTML and the
  worker remain no-cache/must-revalidate.
- Service-worker cache `parts-promise-shell-v3` precaches both fonts, removes
  old caches, uses network-first documents for updates, and retains an offline
  shell. URL-based cache matching avoids `Vary`-header misses offline.

## Regression coverage

- `.factory/claims.json` now has 13 unique claims and one exact test per claim.
- `src/lib/domain/rules.test.ts`: supplier-order quantity cannot go negative or
  cover two jobs.
- `e2e/claims.spec.ts`: two-job supplier conservation, real-workspace supplier
  evidence, and deterministic offline shell/font/asset coverage with zero
  request, console, or page errors.
- `e2e/product.spec.ts`: modal focus entry, containment, and restoration.
- `server/src/lib.rs`: fingerprinted versus stable response cache policy.
- `src/release-contract.test.ts`: claim uniqueness and the versioned,
  network-first service-worker update contract.

## Clean local verification

- `cargo clean --manifest-path server/Cargo.toml`: removed the prior 884.5 MiB
  target before final verification.
- `npm ci`: 83 packages installed, 84 audited, 0 vulnerabilities.
- `npm test`: PASS — 12 Vitest tests and 3 Rust tests.
- `npm run check`: PASS — 0 Svelte/TypeScript errors and 0 warnings.
- `npm run format:check`: PASS.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  PASS.
- `npm run build`: PASS; `dist/` and the locked optimized Rust binary produced.
- Production bundle: JS 80.62 kB / 27.58 kB gzip; CSS 16.34 kB / 3.89 kB
  gzip; two self-hosted fonts total 56.44 kB.
- `npm run test:e2e -- --retries=0`: PASS — 31 passed, 17 intentional
  cross-project claim skips, 48 scheduled across desktop and 390 px Chromium.
- All 13 registered claim cases pass in the clean full run. The new supplier
  claim, repaired local-workspace claim, and offline claim also passed as
  independent zero-retry commands; offline passed three consecutive runs.
- The production binary started with an environment containing only `PORT`.
  `/health`, `/`, cache policy, 404, and unsupported job-data 405 passed.
- Local load smoke: 100/100 `/health` and 100/100 static-root requests returned
  200. There is no job-data/auth/payment API in M1, so a non-health 429 contract
  is not applicable.
- This is a private deployable web product, not a published package. A package
  consumer test is not applicable.

## Deployment and live identity

- Factory ACR build `ch10t` passed in 2m13s.
- Image:
  `sociobotregistry.azurecr.io/sf-field-parts-promise:a1a2c37f3ee1`.
- Digest:
  `sha256:8ccb81c1cc4ce88e076afcfb262833d527ac7ee9a8cfae1c4959f30f008fdf0a`.
- Container App `sf-field-parts-promise`, revision
  `sf-field-parts-promise--0000007`, is Running/Ready with 100% traffic.
- Live `/health` returns build SHA
  `a1a2c37f3ee16bba510541f6d3ee7be3cea564f7`.
- Live/local SHA-256 matches:
  - JS: `cffdd955a51884423eae6a356228b844431da6bbedb20e261955cd103f246f92`.
  - CSS: `a5e0129a99c0e3a29dc47fdfef71ac773b95ba2ab5558360628b623c3f38f04e`.

## Live product QA

- Factory `verify-url.sh`: PASS in 620 ms with zero console/page errors;
  title, `lang`, one H1, main, image alternatives, and button names passed.
- Exact two-job reproduction: the used order shows **0 each available**, is
  disabled, the second job remains **Date at risk**, and IndexedDB reports
  `{onHand: 1, allocated: 1}`.
- Fresh real workspace: a user-created Isolation valve exposes one supplier
  action; `SUP-REAL-1` attaches and yields **Expected before visit**.
- Both confirmation dialogs kept focus inside for five Tab cycles and restored
  their triggers.
- Axe on `/`, demo, jobs, privacy, terms, and the real 404 in both light and
  dark themes: 0 serious/critical findings across 12 scans.
- 390 px: document width 390 px, visible buttons at least 44 px high. At 200%
  root text size, document width remained 390 px with no clipped action.
- Privacy: complete live flows made only same-origin GET/HEAD requests, with no
  console or page errors.
- Offline: `parts-promise-shell-v3` controlled the page; a true offline reload
  allocated the sample pump to **Parts in hand** with zero console errors.
- Response policy: self-only CSP, `nosniff`, strict referrer policy, frame
  denial, camera/microphone/geolocation denial, no-cache HTML/worker,
  one-hour stable assets, immutable fingerprinted JS/CSS, real 404, and 405 for
  unsupported job-data POST.
- Live load smoke: 100/100 health and 100/100 static-root requests returned
  200.
- Lighthouse 13.4.1 mobile: performance 100, accessibility 100, best practices
  100, SEO 100; FCP 1.4 s, LCP 1.7 s, TBT 0 ms, CLS 0.

Evidence is in `.factory/repair-4-artifacts/`: `live-qa.json`, desktop/mobile
screenshots, `verify-url/verify.json`, and `lighthouse-mobile.json`. The live QA
script is retained there for exact reproduction.

## How to verify

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run build
npm run test:e2e -- --retries=0
```

Run any exact visitor-claim command from `.factory/claims.json`. For live repair
evidence, run `node .factory/repair-4-artifacts/live-qa.mjs`.

## Known gaps and operator action

None for this repair. M2+ account, synchronization, billing, barcode, and
supplier-order placement remain explicitly outside this shipped M1 browser
release, as documented in the brief and plan. No operator action is required.
