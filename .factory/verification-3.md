# Independent verification 3 — PASS

Verified candidate: `3ed9c6a37148e55d87735f30e9cffb61cfb9125d`  
Live URL: <https://field-parts-promise.sociobot.in>  
Verification date: 2026-08-28 UTC

## Decision

**PASS.** This candidate meets the M1 local-first promise-check contract. It is
the deployed revision: `GET /health` returned 200 with the exact candidate SHA.
The live JavaScript, CSS, and service-worker SHA-256 values matched the clean
local production build.

## Mandatory first-read and claim gate

A cold, new-browser-context visit to the live landing page answered all three
required questions in plain words:

- **What:** “Promise dates from parts held for the job.”
- **For whom:** “For trade firms that need a clear parts check before agreeing
  a visit date.”
- **First action:** the visible first-screen link **Try it with sample data**,
  with the immediate outcome “Opens Riverside Dental with one missing pump.”

The cold landing made six requests, all same-origin GETs, and emitted no
console or page errors. The required `.factory/claims.json` is present with
11 entries. After `npm ci` in the clean checkout (83 packages, 0
vulnerabilities), every listed command was run separately against the shipped
demo entry point. Each passed; the configured second browser project is an
intentional skip for desktop-only claim evidence.

| Claim ID | Result |
| --- | --- |
| `promise-status-from-allocation` | pass |
| `allocation-keeps-source` | pass |
| `reorder-after-allocation` | pass |
| `demo-reset-isolated` | pass |
| `offline-reload` | pass |
| `local-workspace-flow` | pass |
| `m1-feature-boundaries` | pass |
| `indexeddb-local-storage` | pass |
| `demo-network-privacy` | pass |
| `clear-local-records` | pass |
| `container-runtime` | pass |

`npm run test:e2e` was also run across both configured projects; the complete
38-case suite completed with its intentional cross-project skips and no test
failure.

## Local build and test evidence

- `npm test` — pass: 9 Vitest tests and 3 Rust tests.
- `npm run check` — pass: 0 Svelte/TypeScript errors and 0 warnings.
- `npm run format:check` — pass: Prettier and `cargo fmt`.
- `npm run build` — pass: Vite production build and locked Rust release build;
  `dist/` produced.
- Production payload: JS 80,025 bytes / 27,420 gzip; CSS 16,343 bytes /
  3,890 gzip; the initial JS/CSS are below the applicable budgets. Self-hosted
  fonts total 56,440 bytes.

No Docker-compatible builder is installed in this verifier environment, so an
image build was not repeated. The exact product production build above passed,
the Dockerfile satisfies the declared non-root/build-arg contract on review,
and the live container supplied the exact candidate build identity.

## Product, accessibility, and PWA evidence

- Live desktop and 390 × 844 mobile were exercised. Mobile had no horizontal
  overflow (390 px scroll width/client width); the tested primary and demo
  controls were at least 44 px high.
- Keyboard-only allocation worked with Enter/Space: the sample changed from
  **Date at risk** to **Parts in hand**. The skip link received a visible
  `rgb(107, 53, 195)` solid 3 px outline with 3 px offset and moved focus to
  the main H1.
- Axe scans of `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and the designed
  unknown route found zero serious or critical violations. The normal public
  routes emitted no console or page errors. (A browser understandably logs a
  failed-resource console message when deliberately loading the real HTTP 404.)
- Invalid/recovery flow: holding 2 pumps for a one-pump requirement showed
  “Only 1 each is still needed for this job.” Holding 1 succeeded; undo
  restored **Date at risk**. Attaching `SUP-NEAR`, estimated for 2026-09-01,
  displayed **Expected before visit**.
- Demo request logging across allocation/reset recorded only same-origin
  GETs; a `getUserMedia` sentinel was never invoked. Demo and live data are
  tested in distinct IndexedDB workspaces.
- The live service worker controlled the page, had cache
  `parts-promise-shell-v2`, and had no waiting/installing update after
  `registration.update()`. After the first online demo visit, an offline
  reload still allocated the pump and showed **Parts in hand**.

## Deployment, headers, caching, and backend evidence

- `GET /health`: 200, `{"status":"ok","build_sha":"3ed9c6a37148e55d87735f30e9cffb61cfb9125d"}`.
- Local/live hashes matched: JS
  `da2351a538456b0f8e8ee911a54ada5a8ca92de543edc874d8405089e9c76f59`, CSS
  `a5e0129a99c0e3a29dc47fdfef71ac773b95ba2ab5558360628b623c3f38f04e`, and
  service worker
  `20b094a62028697b578fb9c9be69d60a0393b5814ea57f9ca11d31d7588e1391`.
- Hashed assets/fonts return `public, max-age=31536000, immutable`; HTML,
  `/sw.js`, and the real designed unknown path return
  `no-cache, max-age=0, must-revalidate`. The unknown path returns HTTP 404.
- Live responses include CSP with `connect-src 'self'`, `nosniff`, strict
  referrer policy, frame denial, and a camera/microphone/geolocation-denying
  Permissions-Policy.
- A 100-request concurrent `/health` smoke completed as 100 × 200 in 974 ms
  and always returned the candidate identity.
- There is no product data API, auth endpoint, billing/unlock call, or other
  server-side customer endpoint in M1. `/health` is the sole endpoint and is
  the documented health-check rate-limit exemption; consequently there is no
  non-exempt allowance/429 route to observe. This is appropriate to the
  current local-first M1 scope, not evidence of an untested data API.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Scope notes

This is the honest M1 local-first release. Sign-in, shared/team persistence,
barcode scanning, automatic supplier ordering, checkout, and user-data API
routes are explicitly not shipped and are not implied by the live copy. They
remain later-milestone work, not defects in this candidate.
