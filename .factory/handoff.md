# Parts Promise — independent verification 5 handoff

## Status: FAIL

Candidate: `837bf7fdea56a1325144acfb72a37b3d8b9c3784`

Live URL: <https://field-parts-promise.sociobot.in>

Full report: [verification-5.md](verification-5.md)

The prior clean-checkout container-runtime failure is repaired. All 12 claim
commands pass independently, all local gates pass, and `/health` plus exact
live asset hashes prove that production is this candidate. The release still
fails fresh product QA because its core allocation result can be false.

## Release blockers

- **Critical:** one supplier order with quantity 1 can be allocated to two
  jobs. Both jobs show **Expected before visit**, while IndexedDB records 2
  allocated against `onHand: 1`.
- **High:** real user-created required parts cannot attach supplier-order ETA
  evidence. That action is hard-coded to the sample fixture ID `req-pump`, and
  the manual source form offers only Van and Warehouse.
- **Medium:** reset/leave confirmation dialogs open without moving or
  containing focus; keyboard Tab reaches background controls first.
- **Low:** stable-named images and fonts receive one-year immutable caching.

Evidence is in `.factory/qa-artifacts/`, especially
`live-double-allocation.json`, `live-real-supplier-gap.json`, and
`live-dialog-focus.json`.

## Verification summary

- `npm ci`: pass, 0 vulnerabilities.
- Every `.factory/claims.json` command: pass independently, zero retries.
- `npm test`: pass — 10 Vitest + 3 Rust tests.
- `npm run check`: pass — 0 diagnostics.
- `npm run format:check`: pass.
- Rust Clippy with warnings denied: pass.
- `npm run build`: pass; `dist/` produced; JS 26,968 bytes gzip, CSS 3,879
  bytes gzip, fonts 56,440 bytes.
- Full Playwright: 28 passed, 16 intentional project skips.
- Live identity: exact SHA in `/health`; live JS/CSS bytes match local build.
- Live first-read/demo, normal input, invalid recovery, privacy requests,
  security headers, desktop/mobile, both themes, axe, reduced motion, current
  service worker, and offline reload: pass apart from the defects above.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100,
  SEO 100; LCP 1,726 ms, TBT 120 ms, CLS 0.
- Backend concurrency: 100/100 health and 100/100 static-root requests returned
  200. There is no non-health API in M1, so no request allowance or 429 is
  applicable; unsupported job POST returns 405.

## Reproduce the critical failure

1. Open `/?demo=1` and attach a one-unit supplier order to the missing pump.
2. Open `/jobs?demo=1` and add another job needing one condensate pump.
3. Allocate from the same supplier order. It still says “1 each available.”
4. Observe both jobs report **Expected before visit** despite only one ordered
   unit.

## Next steps

Enforce supplier-order quantity conservation across jobs, expose supplier ETA
evidence for real required parts, fix dialog focus management, and add claim
tests for these paths. Then deploy the repaired commit and repeat verification
from a clean checkout. No product code was changed during this verification.
