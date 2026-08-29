# Independent verification 6 — Parts Promise

## Verdict: PASS

Verified on 2026-08-29 against commit
`5b6b4dec17864f2c25761e532dacea383e483fc7` and
<https://field-parts-promise.sociobot.in>. This is fresh evidence: live
`/health` returned that exact build SHA, and the deployed JS/CSS filenames and
SHA-256 values matched the local production build.

## First read

Cold, uncached landing page: **Parts Promise lets solo tradespeople check that
required parts are held for a job before they agree a visit date.** The first
screen names the audience, says the outcome, and gives one clear first action:
**Try it with sample data**. Its adjacent copy says it opens Riverside Dental
with one missing pump. The demo link works in one click. This passes the
plain-words and demo-sandbox gate.

## Mandatory claims gate

`.factory/claims.json` exists and contains 13 unique claim IDs. After a clean
`npm ci` (83 packages, 0 vulnerabilities), I executed every exact listed
command independently through the Playwright demo entry point. All exited 0:

| Claim ID | Result |
| --- | --- |
| `promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | PASS |
| `supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `m1-feature-boundaries` | PASS |
| `free-browser-release` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `clear-local-records` | PASS |
| `container-runtime` | PASS |

Each command scheduled one Chromium pass and one intentional skipped project;
there were no failures. The full independent browser suite also passed with
31 passed / 17 intentional skips.

## Local build and runtime

- `npm test`: PASS — 12 Vitest and 3 Rust tests.
- `npm run check`: PASS — 0 errors and 0 warnings.
- `npm run format:check`: PASS.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`: PASS.
- `npm run build`: PASS. `dist/` produced; JS 80.62 kB (27.58 kB gzip), CSS
  16.34 kB (3.89 kB gzip), self-hosted fonts 56.44 kB total.
- `npm run test:e2e -- --retries=0`: PASS — 31 passed / 17 intentional skips.
- The release binary started with only `PORT=18999`; `/health` returned
  `{status:"ok",build_sha:"dev"}` and an unknown path returned HTTP 404.

## Live product evidence

- `GET /health` returned build SHA
  `5b6b4dec17864f2c25761e532dacea383e483fc7`.
- The live asset names were `index-DQ0jjJLN.js` and `index-CkWDLRHA.css`.
  Their local SHA-256 values were respectively
  `cffdd955a51884423eae6a356228b844431da6bbedb20e261955cd103f246f92` and
  `a5e0129a99c0e3a29dc47fdfef71ac773b95ba2ab5558360628b623c3f38f04e`.
- Fresh demo flow: an over-quantity attempt remained in the allocation sheet;
  correcting it to one pump made the status **Parts in hand** and showed the
  Van 2 reorder suggestion. The normal, boundary, persistence, reset, and
  source-conservation paths are also covered by the independently rerun
  claims above.
- At 390 px, document `scrollWidth` equalled 390 and every visible button was
  at least 44 px in both dimensions. Keyboard Enter operated allocation;
  the reset dialog opened with focus on its safe action, remained contained
  after five Tabs, and closed with Escape.
- The service worker `parts-promise-shell-v3` controlled the live page. With
  `prefers-reduced-motion: reduce`, the app used near-zero transition and
  animation durations. After initial online load, an offline demo reload
  rendered the job and the Offline notice without console/page errors.
- Axe WCAG 2 A/AA scans for `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`,
  and the real 404 in both light and dark themes found **0 serious/critical**
  violations (0 violations total). No console or page errors were observed.
- Lighthouse 13 mobile on the live demo: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.7 s, TBT 0 ms, CLS 0.007.

## Privacy, security, and operations

- A complete fresh demo session requested only same-origin GET resources:
  HTML, the two self-hosted fonts, JS, CSS, and hand-authored SVG. It made no
  third-party request, mutation, camera request, console error, or page error.
- Responses carried self-only CSP (including `frame-ancestors 'none'`),
  `nosniff`, strict referrer policy, `X-Frame-Options: DENY`, and a restrictive
  permissions policy. HTML and `sw.js` are no-cache; hashed JS/CSS are one-year
  immutable; stable SVG/font assets are one-hour cacheable.
- Direct routes returned 200 and the unknown route returned a real 404. A
  100-request concurrent smoke returned 100/100 200 for both `/health` and
  `/`.
- This M1 release has no mutable server API, auth, checkout, or product-unlock
  call; all job data remains browser IndexedDB. `/health` is explicitly exempt
  from the planned API rate-limit policy. I sent 80 concurrent health requests
  and observed its expected exemption (80/80 200); there is no non-health API
  allowance or 429 path to verify in this browser-only milestone.

## Defects

None. No release-blocking, high, medium, or low defects were found.

## Evidence retained during this run

Temporary QA artifacts were recorded outside the product tree at
`/tmp/field-parts-*.{png,json,html}` (desktop/mobile screenshots, Lighthouse
JSON, health response, and local runtime log). Product code was not modified.
