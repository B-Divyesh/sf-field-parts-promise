# Independent verification 2 — FAIL

Verified candidate: `43e1840e8b8baa7a8aa7025c53ccfe3caaf02698`  
Live URL: <https://field-parts-promise.sociobot.in>  
Verification date: 2026-08-28 UTC

## Decision

**FAIL — two release-blocking contract defects remain.** The repaired product
is deployed and its M1 allocation flow, privacy behaviour, offline support,
accessibility, build, and caching checks pass. It still fails the explicit
claims and site-structure acceptance rules below.

## Mandatory first-read and claim gate

A cold, new-browser-context visit to the live landing page passed the
first-read gate. It says it promises dates from parts held for a job, names
trade firms as the audience, and provides the visible one-click **Try it with
sample data** action with the result (“Opens Riverside Dental with one missing
pump”). The cold load made only six same-origin requests and had no console or
page errors.

`HEAD` was the requested commit and the checkout was clean before QA. After
`npm ci` (83 packages; 0 vulnerabilities), every command listed in
`.factory/claims.json` was run separately against its shipped `/?demo=1`
entry point:

| Claim ID | Result |
| --- | --- |
| `promise-status-from-allocation` | pass (1 Chromium pass; configured secondary project skipped) |
| `allocation-keeps-source` | pass (1 Chromium pass; configured secondary project skipped) |
| `reorder-after-allocation` | pass (1 Chromium pass; configured secondary project skipped) |
| `demo-reset-isolated` | pass (1 Chromium pass; configured secondary project skipped) |
| `offline-reload` | pass (1 Chromium pass; configured secondary project skipped) |

## Local quality gates

- `npm test`: passed — 8 Vitest tests and 2 Rust tests.
- `npm run check`: passed with 0 errors and 0 warnings.
- `npm run format:check`: passed (Prettier and `cargo fmt`).
- `npm run build`: passed. `dist/` was produced and the Rust release build
  completed. Initial JS is 80.61 kB (27.66 kB gzip); CSS is 16.32 kB (3.89 kB
  gzip), both within budget.
- Browser suite coverage was run in its configured shards: all five claim
  tests above, `e2e/product.spec.ts --project=chromium` (4 pass, 2 intentional
  mobile skips), and `--project=mobile-chromium` (6 pass). This is 15 pass and
  7 intentional cross-project skips.
- Docker, Podman, and Buildah are unavailable in this verifier container, so
  an image build could not be independently repeated. The Dockerfile does use
  `rust:1-slim`, a default `ARG BUILD_SHA=dev`, a non-root distroless runtime,
  and no `.git` copy; the live build identity below supplies deployment
  evidence.

## Live deployment and product evidence

- `GET /health` returned `200` and
  `{"status":"ok","build_sha":"43e1840e8b8baa7a8aa7025c53ccfe3caaf02698"}`.
  SHA-256 of live JS, CSS, and `sw.js` exactly matched this local production
  build.
- A fresh demo flow started at **Date at risk**. Attempting to allocate 2 when
  only 1 was needed was rejected with “Only 1 each is still needed for this
  job.” Allocating 1 from Van 2 changed it to **Parts in hand**, recorded the
  no-order reorder suggestion, and removing it restored **Date at risk**. A
  supplier order expected after the visit remained **Date at risk**. These are
  the normal, boundary, invalid-input, and recovery cases required by the
  brief.
- The full exercised demo request log had no cross-origin request; console and
  page error logs were empty. CSP has `connect-src 'self'`; fonts and assets
  are self-hosted.
- Service worker `parts-promise-shell-v2` controlled the page, had the built
  JS cached, had no pending update after `registration.update()`, and an
  offline reload still allocated the pump to **Parts in hand**.
- Desktop and 390 x 844 mobile visual checks found no horizontal overflow.
  Keyboard-only allocation worked with Enter/Space. Tab focused the skip link
  with a visible `rgb(107, 53, 195)` 3 px outline and 3 px offset. Live axe
  scans on `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and an unknown route
  had zero serious or critical findings.
- Live JS/CSS/fonts/hero use `public, max-age=31536000, immutable`; HTML and
  `/sw.js` use `no-cache, max-age=0, must-revalidate`. Responses include CSP,
  nosniff, strict referrer policy, frame denial, and the restrictive camera,
  microphone, and geolocation permissions policy.
- `/health` is the only server endpoint and is explicitly eligible for the
  backend health-check rate-limit exemption. A fresh 100-request, 20-way
  concurrency smoke returned 100 x `200`; therefore no non-health allowance or
  `429`/`Retry-After` route is applicable in M1.

## Release blockers

### High — unlisted, untested public claims

The claims contract says every visitor-reliant claim on the live page and in
the README must have exactly one listed sandbox test; it expressly makes an
unlisted claim a review failure. The five entries only cover allocation status,
allocation persistence, reorder-without-ordering, demo isolation/same-origin
requests, and offline demo reload. They do **not** cover several public claims,
including:

- `src/App.svelte:671`, `718-720`, and `729-731`: no account/payment,
  no team sync/barcode scanning/supplier ordering, one local workspace, and
  future account/seat/checkout assertions.
- `src/App.svelte:925-927` and `940-941`: all records remain in IndexedDB and
  export/deletion timing assertions.
- `README.md:5`, `36-39`, and `45`: the detailed M1 feature list; absence of
  API requests for the live workspace; absence of analytics, supplier portal,
  payment provider, camera permission, and AI calls; and container-runtime
  promises.

Some may be true and some are deliberately M1 scope statements, but none is
represented by a one-to-one claim test. Remove/narrow these public assertions
or add observable, tagged tests and matching `claims.json` records. Do not
release with this discrepancy.

### High — unknown paths return HTTP 200, not a real 404

`https://field-parts-promise.sociobot.in/not-on-this-drawing` renders the
styled not-found screen but returns `200`. The container’s `ServeDir` fallback
serves `index.html` with success status. The site-structure acceptance contract
requires a real designed 404 route; this response makes broken URLs appear
valid to clients and crawlers. Return the designed 404 content with HTTP 404
from the deployed server while keeping valid SPA deep links working.

## Non-blocking scope notes

M1 correctly does not yet provide sign-in, billing, shared persistence,
barcode scanning, or server-side data APIs; the current plan assigns those to
later milestones. No CIAM, paid-unlock, package-consumer, or non-health API
rate-limit check is applicable to this M1 candidate.

## Required next verification

After repairing the two blockers, rerun every exact claim command from a clean
checkout, the local build/check suite, mobile touch and keyboard coverage, and
the live build SHA/artifact-hash/header/404 checks. Re-check every public
claim against `claims.json` and verify an unknown route returns 404.
