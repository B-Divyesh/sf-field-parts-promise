# Parts Promise adversarial review 1 handoff

- Work order: `field-parts-promise-review-1`
- Role: reviewer
- Base: `e9627c3adc448e7da07a73855e93a288d4985947`
- Live build: `3ed9c6a37148e55d87735f30e9cffb61cfb9125d`
- Verdict: **FAIL**

## What was done

Completed a cold mobile and desktop first-read review, exhaustive landing and
README copy audit, one-click demo and isolation exercise, all declared claim
tests, prior-finding verification, route/metadata/link/focus crawl,
accessibility scan, response-header check, and local test/build gates. The full
report is `.factory/review-1.md`.

No product code was modified. This handoff replaces the prior current handoff;
the earlier repair evidence remains available in Git history and in
`.factory/verification-3.md`.

## How it was verified

- Fresh live Chromium contexts at 390 × 844 and 1440 × 900.
- Every command in `.factory/claims.json` run independently: all 11 passed.
- `npm test`: 9 Vitest and 3 Rust tests passed.
- `npm run test:e2e`: 23 passed, 15 intentional project skips.
- `npm run build`: passed and produced `dist/` plus the release Rust binary.
- Live axe scan: no serious or critical violations on the checked routes.
- `/opt/fleet/lib/verify-url.sh`: passed on the landing page.
- Live request logging: same-origin GETs only; no camera call.
- Live headers: immutable hashed assets, fresh service worker, CSP,
  Permissions-Policy, referrer policy, frame denial, and `nosniff` confirmed.
- Live unknown route: designed response with HTTP 404 confirmed.

## What remains

The report records 21 findings. Blocking items are broken focus after SPA route
changes, the one-browser implementation's mismatch with the brief's
multi-person firm audience, and incomplete one-to-one claim coverage. Other
findings cover false empty-workspace messaging after demo, duplicate route
metadata, `/demo` title/sitemap handling, absent pricing clarity, and
plain-words violations.

The repair owner should address every `F-1-*` item and rerun the complete review
from scratch. Do not treat the green automated suite as sufficient: its
“history focus” case currently does not assert focus.
