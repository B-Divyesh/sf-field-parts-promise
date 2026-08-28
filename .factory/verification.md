# Independent verification — FAIL

Verified candidate: `4d9c65f0b260cb9c81f47322b2cef7d84fe9be89`  
Live URL: <https://field-parts-promise.sociobot.in>  
Verification date: 2026-08-28 (UTC)

## Decision

**FAIL — release-blocking contract defects remain.** The deployed product is
the candidate and its M1 workflow works, but it does not meet the factory
claims, accessibility, caching, and Docker-image contracts described below.

## First read and demo

Cold-opening the live landing page clearly says what it does: “Promise dates
from parts held for the job”; for whom: “trade firms” checking parts before
agreeing a visit date; and what to do first: the visible one-click **Try it
with sample data** action, which says it opens Riverside Dental with one
missing pump. This requirement passes.

## Local clean-checkout evidence

`HEAD` was the requested commit. The initial pre-install claim invocation
could not load `@playwright/test`, as expected in an uninstalled clean clone.
After `npm ci` completed with zero vulnerabilities, every command declared in
`.factory/claims.json` passed against the shipped demo entry point:

| Claim ID | Command result |
| --- | --- |
| `promise-status-from-allocation` | pass (Chromium; Firefox project skipped) |
| `allocation-keeps-source` | pass (Chromium; Firefox project skipped) |
| `reorder-after-allocation` | pass (Chromium; Firefox project skipped) |
| `demo-reset-isolated` | pass (Chromium; Firefox project skipped) |
| `offline-reload` | pass (Chromium; Firefox project skipped) |

Other local gates passed:

- `npm test`: 7 Vitest and 1 Rust API test passed.
- `npm run test:e2e`: 12 passed, 6 configured Firefox skips.
- `npm run check`: 0 errors, 0 warnings.
- `npm run format:check`: passed.
- `npm run build`: passed and produced `dist/`; release Rust build passed.
- Built initial JS is 80,694 bytes / 27,333 bytes gzip; CSS is 16,311 bytes /
  3,900 bytes gzip; two self-hosted fonts total 56,440 bytes; hero SVG is
  2,321 bytes. These meet the stated bundle budgets.

The exact Docker image build could not be run because this verification
container has no `docker` executable (`docker: command not found`). The
Dockerfile has a separate release-blocking policy defect below.

## Live candidate, workflow, privacy, and PWA evidence

- `GET /health` returned `{"status":"ok","build_sha":"4d9c65f0b260cb9c81f47322b2cef7d84fe9be89"}`.
- Live JS, CSS, and `sw.js` SHA-256 values exactly match the locally built
  candidate artifacts. The live hashed JS/CSS names also match the local
  build.
- A fresh desktop run allocated the demo pump, changed **Date at risk** to
  **Parts in hand**, produced the no-order reorder suggestion, rejected a
  quantity of 2 with “Only 1 each is still needed for this job,” recovered by
  accepting 1, then removed the allocation and returned to at-risk. A supplier
  ETA after the visit correctly remained at risk. Reset and demo exit worked
  when awaited; a newly created live local job persisted through reload.
- Request logging over the complete demo flow found only same-origin requests;
  cold-load and exercised-flow console/page errors were empty. The live CSP
  has `connect-src 'self'`; fonts and assets are self-hosted.
- The live service worker controlled the page, had cache
  `parts-promise-shell-v2`, had no waiting/installing update, and completed an
  explicit `registration.update()`. After first visit, an offline reload of
  `/?demo=1` worked and allocated the pump to **Parts in hand**.
- `/health` is the only server endpoint. It is explicitly eligible for the
  backend contract's health-check exemption. A 100-request, 20-way live smoke
  returned 100 × 200. There is no non-health server API, no documented
  allowance, and therefore no applicable 429/`Retry-After` path in M1.

## Accessibility and responsive evidence

- Live axe scans of `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and an
  unknown route found zero serious/critical violations.
- Keyboard Tab reaches the skip link with a visible `rgb(107, 53, 195)` 3 px
  outline and 3 px offset. The built mobile keyboard/history e2e test passed.
- At 390 × 844 the demo has one `h1`, `lang="en"`, no horizontal overflow, and
  the task flow is usable. Reduced-motion e2e passed.

## Defects

### High — claims contract is incomplete

The public privacy copy makes claims not represented by a matching claim in
`.factory/claims.json`: “M1 has no account, telemetry, supplier connection,
checkout, or camera request. The demo makes no API or cross-origin request.”
See `src/App.svelte:934-938`. The existing `demo-reset-isolated` test happens
to record cross-origin traffic, but its listed claim is only demo/live storage
isolation; it does not list or prove the account, telemetry, supplier,
checkout, or camera assertions. The claims skill makes an unlisted claim a
release failure. Add distinct observable claims/tests or remove/narrow this
copy.

### High — mobile touch targets violate the 44 px requirement

On the live 390 px page, **Night sheet**, **Reset demo**, **Start for real**,
and each **Remove allocation** control measure 36 px high; the toast dismiss
button is styled to 32 px. Source rules at `src/app.css:163-167`, `188-190`,
`238-240`, and `715-720` set these sizes. This violates the attached
accessibility/design target minimum of 44 × 44 CSS px.

### High — immutable asset caching is absent in production

Live `HEAD` responses for the fingerprinted JS/CSS, fonts, hero SVG, and
`/sw.js` contain no `Cache-Control` header (only `Last-Modified`). The
performance contract requires long-lived immutable caching for hashed assets;
this wastes repeat loads and makes caching behavior weaker than the PWA
delivery contract. Configure production `Cache-Control` explicitly (with a
short/update-safe policy for `sw.js`).

### High — Dockerfile violates the required Rust base-image policy

`Dockerfile:11` uses `FROM rust:1.98-bookworm`. The backend service contract
requires `rust:1-slim` or `rust:1-alpine` and expressly forbids pinning a
minor Rust image. This is also unverified as an image build in this environment
because Docker is unavailable.

### Medium — deployed Permissions-Policy does not match declared config

`staticwebapp.config.json:10` declares `Permissions-Policy:
camera=(), microphone=(), geolocation=()`, but live responses omit that header.
The deployed container's header middleware supplies CSP, nosniff,
Referrer-Policy, and X-Frame-Options only. Align the deployed service headers
with the declared policy.

## Required next verification

Repair the four high findings, build the Docker image in an environment with
Docker/ACR-equivalent tooling, redeploy, then rerun every claim command,
mobile target measurement, asset-header check, and live health/build-SHA
comparison.
