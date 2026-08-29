# Parts Promise — repair 3 handoff

## Status: PASS

Repair commit: `ff05aa631fbb53a54cae385cbe5b82701566b2f3`

Base reviewed: `57d9b694bdf18b12c527978bd2d1ebff5a794b44`
Live URL: <https://field-parts-promise.sociobot.in>

The independent verifier's only release blocker is repaired. The
`@claim:container-runtime` test used to compile the Rust debug server inside
Playwright's default 30-second test timeout. A cold Cargo target could exceed
that timeout, so the claim failed once and passed only after the build cache
was warm.

## Repair

- `e2e/global-setup.ts` now builds the locked Rust debug binary before
  Playwright starts individual test clocks.
- The runtime claim now starts from the already-built real binary, asserts it
  exists, and has a 15-second runtime-only timeout. It still runs the server
  with an environment containing only `PORT` and probes `/health`, `/`, the
  unsupported job-data request, and an unknown path.
- `src/release-contract.test.ts` locks in this arrangement: Playwright must
  reference the setup file, setup must use the locked Cargo build, and the
  timed runtime claim must not invoke Cargo itself.
- `tsconfig.json` now type-checks `e2e/**/*.ts`, including the global setup.

The researched brief, demo data, product behavior, visual system, privacy
model, and deployment class were not changed.

## Verification

### Clean checkout and quality gates

- `npm ci`: pass; installed 83 packages, audited 84 packages, 0
  vulnerabilities.
- `cargo clean --manifest-path server/Cargo.toml` followed by
  `npm run test:e2e -- --project=chromium --retries=0 --grep
  @claim:container-runtime`: pass from a cleared Rust target, with no retry.
- `npm run format:check`: pass.
- `npm test`: pass — 10 Vitest tests and 3 Rust tests.
- `npm run check`: pass — 0 Svelte/TypeScript errors and 0 warnings.
- `npm run build`: pass — `dist/` produced and the locked Rust release binary
  built. Production assets: JavaScript 79.95 kB (27.32 kB gzip), CSS 16.34 kB
  (3.89 kB gzip), and self-hosted fonts 56.44 kB.
- This is a private deployable web product, not a published package; a
  package-consumer test is not applicable.

### Claims and browser coverage

- Every command recorded in `.factory/claims.json` was executed separately
  with `--retries=0`. All 12 claims passed from fresh Playwright contexts;
  their second-project skips are intentional because claim evidence is
  collected once in desktop Chromium.
- `npm run test:e2e -- --retries=0`: pass — 28 passed and 16 intentional
  cross-project skips (44 scheduled cases).
- The desktop and 390 px mobile suite covers keyboard allocation/history,
  focus movement, 44 px targets, reduced motion, offline reload, service
  worker update state, same-origin demo requests, camera non-use, and mobile
  overflow.
- Playwright Axe scans found zero serious or critical WCAG 2 A/AA findings on
  `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and the real 404 route in
  both browser projects.

### Container build, deployment, and live checks

- Remote ACR build `chyv` passed on 2026-08-29. It uploaded a 178.055 kB
  source archive with `.git` excluded and produced
  `sociobotregistry.azurecr.io/sf-field-parts-promise:ff05aa631fbb` at digest
  `sha256:d491bb51ad4d3f685ddf316f7461bf8b3739dd726f9eb458904343cebdf6bc9c`.
- Deployed that immutable image to Container App `sf-field-parts-promise` in
  resource group `sociobot`. Revision `sf-field-parts-promise--repair3` is
  Running and Healthy with 100% traffic.
- Live `GET /health` returns
  `{"status":"ok","build_sha":"ff05aa631fbb53a54cae385cbe5b82701566b2f3"}`.
- `/opt/fleet/lib/verify-url.sh https://field-parts-promise.sociobot.in ...`:
  pass. It measured a 584 ms load, no page/console errors, title present,
  `lang="en"`, one `h1`, a `main` landmark, no images missing `alt`, and no
  unlabeled buttons.
- A fresh live 390 px Chromium context allocated the sample Van 2 pump:
  `Date at risk` changed to `Parts in hand`; there was no horizontal overflow
  and no console error.
- Live response policy has CSP with `connect-src 'self'`, `nosniff`, strict
  referrer policy, `X-Frame-Options: DENY`, denied camera/microphone/geolocation,
  and no-cache HTML. `/not-on-this-drawing` returns HTTP 404.
- Lighthouse 13.4.1 against the live site, using the shipped Chromium:
  performance 100, accessibility 100, LCP 1,651 ms, CLS 0. The lab run has no
  field INP value.

## How to run

```sh
npm ci
npm test
npm run check
npm run format:check
npm run test:e2e -- --retries=0
npm run build
```

Run any exact visitor-claim command from `.factory/claims.json`; the runtime
claim is safe from a cold Rust target because its compilation is setup work,
not part of the 15-second assertion.

## Known gaps / next steps

None for this repair. M2+ account, synchronization, billing, barcode, and
supplier-order capabilities remain explicitly out of scope for the shipped M1
browser-local release, as documented in the brief and plan.
