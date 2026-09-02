# Parts Promise independent verification 21 — PASS

Date: 2026-09-02 UTC

Candidate: `690fcb860a1eabc7e4c2485141059f0013c08b4c`

Live URL: <https://field-parts-promise.sociobot.in>

## Verdict

**PASS.** Fresh independent verification found no product defect at any
severity. The live server reports the exact candidate SHA. The previous mobile
LCP blocker is resolved: two new live mobile Lighthouse runs measured 1.352 s
and 1.350 s LCP.

The complete evidence and command results are in
`.factory/verification-21.md` and `.factory/evidence/verification-21/`.

## What was verified

- All 37 `.factory/claims.json` commands passed individually before other
  repository inspection.
- `npm ci`, `npm test`, `npm run check`, `npm run format:check`, strict Cargo
  clippy, `npm run build`, and `npm audit --audit-level=high` passed.
- A clean full Playwright rerun passed: 61 passed, 43 expected skips.
- Cold first read and one-click sample passed on desktop and 390×844 mobile.
- Live local, demo, supplier-evidence, invalid-input, reset, keyboard, and
  offline flows passed.
- Forty-four live Axe route/theme/viewport analyses found 0 serious/critical
  issues. There were no normal-route console or page errors.
- The demo request log contained only same-origin GET/HEAD requests.
- The service worker was current and supported a full offline reload/allocation.
- Live headers, immutable asset caching, no-cache HTML/service-worker behavior,
  bundle budgets, 200% text sizing, metadata, 404, links, and PWA files passed.
- CIAM used the required Sociobot tenant/client/callback and PKCE.
- 100 concurrent health requests all returned 200.
- Live export throttling allowed five requests per minute, then returned 429
  with `Retry-After: 60`.

## Key measurements

| Check | Result |
| --- | --- |
| Live build SHA | `690fcb860a1eabc7e4c2485141059f0013c08b4c` |
| Unit/API tests | 24 + 15 passed |
| Full browser suite | 61 passed, 43 expected skips |
| Live Axe | 44 analyses, 0 serious/critical |
| Lighthouse run 1 | 100 performance, 1.352 s LCP, 0.022 CLS |
| Lighthouse run 2 | 95 performance, 1.350 s LCP, 0.022 CLS |
| Initial JS | 19.90 KB gzip |
| CSS | 6.61 KB gzip total |
| Fonts | 56,440 bytes |
| API critical allowance | 5 requests/minute; sixth 429, `Retry-After: 60` |

## Runner note

One first full-suite attempt ended when Playwright Chromium itself segfaulted
before creating a new context. The affected claim had already passed alone. A
fresh complete run passed all 61 executed tests without retry. This was a
transient runner-process failure, not a product assertion failure.

## Defects and operator action

- Critical: none.
- High: none.
- Medium: none.
- Low: none.
- Operator action required for this candidate: none.

Checkout remains honestly labelled unavailable and cannot start a charge. The
recurring-billing registration remains the documented future operator boundary.

## Reproduce

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run build
npm run test:e2e -- --retries=0
EXPECTED_BUILD_SHA=690fcb860a1eabc7e4c2485141059f0013c08b4c npm run verify:live-identity
```
