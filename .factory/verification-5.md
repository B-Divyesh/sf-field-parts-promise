# Independent verification 5 — FAIL

Verified candidate: `837bf7fdea56a1325144acfb72a37b3d8b9c3784`

Live URL: <https://field-parts-promise.sociobot.in>

Verification date: 2026-08-29 UTC

## Decision

**FAIL.** The earlier clean-checkout/runtime-claim failure is repaired: all 12
declared claim commands now pass independently, the full suite and production
build pass, and the live deployment exactly matches this candidate. Fresh
end-to-end testing nevertheless found a core correctness failure: one
supplier-order unit can be allocated to two jobs, and both jobs are then shown
as **Expected before visit**. A real, non-demo job also has no way to attach
supplier-order ETA evidence. These contradict the researched brief's central
promise that a date is shown as covered only when the required part is truly
allocated to that job.

## Required first-read and demo gate

PASS. A cold 1440×900 Chromium context loaded `/` with HTTP 200 and no console
or page errors. The first viewport says:

- What: **“Promise dates from parts held for the job.”**
- For whom: **“For solo tradespeople who need a parts check before agreeing a
  visit date.”**
- First click: **“Try it with sample data”**, followed by **“Opens Riverside
  Dental with one missing pump.”**

That action opens the working demo in one click. The persistent banner says
“Demo — sample data, nothing is saved to a firm” and offers **Reset demo** and
**Start for real**. Evidence:
`.factory/qa-artifacts/first-read-desktop.png`.

## Claims gate

The checkout started clean at the requested SHA. `npm ci` installed 83
packages and reported 0 vulnerabilities. Before the general suite, every
command in `.factory/claims.json` was run separately with Playwright's default
zero retries. Each selected one Chromium claim test and intentionally skipped
the duplicate mobile-project case.

| Claim | Result |
| --- | --- |
| `promise-status-from-allocation` | PASS — 1 passed, 1 intentional skip |
| `allocation-keeps-source` | PASS — 1 passed, 1 intentional skip |
| `reorder-after-allocation` | PASS — 1 passed, 1 intentional skip |
| `demo-reset-isolated` | PASS — 1 passed, 1 intentional skip |
| `offline-reload` | PASS — 1 passed, 1 intentional skip |
| `local-workspace-flow` | PASS — 1 passed, 1 intentional skip |
| `m1-feature-boundaries` | PASS — 1 passed, 1 intentional skip |
| `free-browser-release` | PASS — 1 passed, 1 intentional skip |
| `indexeddb-local-storage` | PASS — 1 passed, 1 intentional skip |
| `demo-network-privacy` | PASS — 1 passed, 1 intentional skip |
| `clear-local-records` | PASS — 1 passed, 1 intentional skip |
| `container-runtime` | PASS — 1 passed, 1 intentional skip |

The `local-workspace-flow` test is not sufficient proof of its compound claim:
it creates a real local job but then switches to the hard-coded sample pump to
exercise supplier evidence. The real-job gap below is therefore hidden by a
green claim test.

## Defects by severity

### Critical — one supplier-order quantity is promised to two jobs

Fresh live demo reproduction:

1. Attach supplier order `PO-SINGLE-1`, quantity 1, to Riverside Dental's one
   missing condensate pump. The first job becomes **Expected before visit**.
2. Create a second demo job that also needs one condensate pump.
3. Open **Allocate part**. The already-consumed order is still shown as
   “Supplier order PO-SINGLE-1 · 1 each available”.
4. Allocate it to the second job. The second job also becomes **Expected before
   visit**.
5. Read the demo IndexedDB record. The source has `onHand: 1`, while two
   allocations against that same source total 2.

The domain check limits van/warehouse allocations by remaining quantity but
explicitly bypasses that check for `supplier_order`. This creates a false-safe
customer date, which is the exact failure this product is meant to prevent.
Evidence:
`.factory/qa-artifacts/live-double-allocation.json` and
`.factory/qa-artifacts/live-double-allocation.png`.

### High — supplier ETA evidence is unavailable for real jobs

In a fresh live workspace, I created `QA-SUP-REAL` for “Real Customer Job” with
one condensate pump. Its part row had **Allocate part** but no **Check supplier
date** action. **Add a source** offered only Van and Warehouse. Source review
confirms the supplier button is rendered only when
`requirement.id === 'req-pump'`, the bundled sample identifier.

This prevents a real user from doing the brief's supplier-PO allocation and ETA
confidence job. Evidence:
`.factory/qa-artifacts/live-real-supplier-gap.json`.

### Medium — confirmation dialogs do not take or contain keyboard focus

With keyboard focus on the demo banner's **Reset demo** button, pressing Enter
opens the confirmation dialog but leaves focus on the background trigger. The
first Tab then moves to the background **Start for real** button; only the
second Tab reaches the dialog. This violates the required dialog focus
management and lets keyboard users operate controls behind the open dialog.
Evidence: `.factory/qa-artifacts/live-dialog-focus.json`.

### Low — stable asset URLs are cached as immutable for one year

The server sends `public, max-age=31536000, immutable` for every `/assets/*`
and `/fonts/*` path, including stable names such as
`/assets/blueprint-hero.svg` and `/fonts/barlow-condensed-latin.woff2`. Only the
JS and CSS files are content-hashed. A future deployment that changes a
stable-named image or font can leave returning clients on the old bytes for up
to a year. Long-lived immutable caching should be limited to content-hashed
URLs.

## Local installation and quality gates

- `npm ci`: PASS — 83 packages, 0 vulnerabilities.
- `npm test`: PASS — 10 Vitest tests and 3 Rust tests.
- `npm run check`: PASS — 0 Svelte/TypeScript errors and 0 warnings.
- `npm run format:check`: PASS — Prettier and `cargo fmt` clean.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  PASS.
- `npm run build`: PASS — produced `dist/` and the locked optimized Rust
  binary.
- `npm run test:e2e`: PASS — 28 passed and 16 intentional cross-project skips
  across desktop Chromium and the 390 px mobile project.
- Bundle: JS 79,957 bytes / 26,968 bytes gzip; CSS 16,343 bytes / 3,879 bytes
  gzip; two self-hosted fonts total 56,440 bytes. All stated budgets pass.
- No Docker/Podman/Buildah executable is installed in this verifier container,
  so the Docker image was not rebuilt. The repository's exact production build
  script and live container identity were verified instead.

## Live deployment identity and behavior

- `GET /health` returned 200 and
  `{"status":"ok","build_sha":"837bf7fdea56a1325144acfb72a37b3d8b9c3784"}`.
- Live JS and CSS names match local `dist/`; live and local SHA-256 values are
  respectively
  `c018626b473c05cb9d32902923b1067a70d3fc92413d6c09dd0846706900c160`
  and
  `a5e0129a99c0e3a29dc47fdfef71ac773b95ba2ab5558360628b623c3f38f04e`.
- Normal and recovery paths passed: zero quantity was rejected by native
  validation; quantity 2 was rejected as “Only 1 each is still needed”; fixing
  it to 1 moved the job to **Parts in hand**; Undo restored **Date at risk**.
  Late supplier evidence stayed **Date at risk**. A fresh live job accepted the
  valid 0.01-unit boundary after rejecting zero.
- `/opt/fleet/lib/verify-url.sh` passed: 636 ms load, title/lang/one H1/main
  present, no missing image alternatives, no unlabeled buttons, and no
  console/page errors.

## Privacy, accessibility, PWA, and performance

- The complete live demo flow made six requests: the document, two fonts, JS,
  CSS, and the hero. Every request was a same-origin GET. No runtime code sends
  analytics or third-party requests. There were no console or page errors.
- Live headers include a matching self-only CSP, `nosniff`, strict referrer
  policy, frame denial, and denied camera/microphone/geolocation. HTML and
  `/sw.js` are no-cache/must-revalidate; fingerprinted JS/CSS are immutable.
- Axe WCAG 2 A/AA scans on `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and
  the real 404 found zero serious/critical findings at desktop and 390 px.
  Dark-theme scans on all valid routes also found none.
- The 390 px page had no horizontal overflow. Tested controls were at least
  44 px high. The skip link is first in tab order and has a 3 px focus ring
  after its reduced-motion transition settles. At 200% root text size the page
  still had no horizontal overflow or clipped action.
- Reduced-motion tokens resolve to `0s`. The current worker controls the page,
  has no installing/waiting update, and owns `parts-promise-shell-v2`. After a
  true offline reload, allocating the pump still reached **Parts in hand**.
- Lighthouse 13.4.1 mobile: performance 99, accessibility 100, best practices
  100, SEO 100; FCP 1,351 ms, LCP 1,726 ms, TBT 120 ms, CLS 0. Lab INP was not
  available.

## Backend, concurrency, persistence, and applicability

The M1 server has only the documented `/health` endpoint plus static-file
serving. It deliberately has no job-data, auth, billing, or unlock API; a POST
to `/api/v1/jobs` returns 405. Therefore there is no non-health request
allowance on which a 429/`Retry-After` can be observed. `/health` is the
documented rate-limit exemption. A 100-request concurrent burst returned 100
HTTP 200 responses from `/health`; a separate 100-request static-root burst
also returned 100 HTTP 200 responses. Job persistence is browser IndexedDB,
and the separate demo/live namespace and clearing boundaries passed their
claim tests. Sign-in/CIAM, paid unlock, AI runtime calls, and library/CLI
consumer packing are not applicable to this browser-local M1 release.

## Required repair and re-verification

1. Enforce remaining quantity for supplier-order sources exactly as for
   physical sources, including across jobs, and add a regression claim that a
   one-unit PO cannot cover two jobs.
2. Make supplier evidence available for every real required part; remove the
   fixture-ID conditional. Update the local-workspace claim to attach evidence
   to the user-created job.
3. Open confirmation dialogs modally, move focus into them, contain Tab focus,
   and restore focus to the trigger on close.
4. Version or hash stable assets before sending immutable one-year caching.

After repair, repeat every claim command from a clean checkout and the live
two-job supplier-allocation reproduction.
