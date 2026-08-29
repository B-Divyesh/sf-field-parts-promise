# Parts Promise — adversarial review 2 handoff

## Status: FAIL

Review report: `.factory/review-2.md`

Repository reviewed: `affd0d760eb47189f540223d6b420573b4d2f1ca`

Live build: `5b6b4dec17864f2c25761e532dacea383e483fc7`

## What was done

- Opened the live product cold in fresh 390 × 844 and 1440 × 900 Chromium
  contexts and recorded the first-screen interpretation.
- Audited every landing-page and README copy unit with word counts.
- Exercised the one-click sample, allocation, reset, explicit exit, privacy
  request log, offline behavior, live/demo storage separation, routing,
  metadata, history focus, links, 404, both themes, and accessibility.
- Ran all 13 exact claim commands separately after `npm ci` in the fresh clone
  `/tmp/parts-review-2-n91evP`.
- Rechecked every finding in review 1 against the live build and source.
- Made no product-code changes.

## Result

All declared tests pass, but manual adversarial navigation found one blocking
sandbox defect: leaving demo through the wordmark or browser Back preserves
demo changes even though the banner and Privacy page say leaving discards them.
The report also records missing import/export, incorrect metadata for a missing
job deep link, and missing focus/announcement when work forms open.

## Verification

```sh
npm ci
npm test
npm run build
npm run test:e2e -- --retries=0
```

- `npm test`: 12 Vitest and 3 Rust tests passed.
- `npm run build`: passed; `dist/` produced; 27.58 KB gzip JS.
- Full Playwright: 31 passed, 17 intentional skips.
- Exact claim commands from the fresh clone: 13/13 passed.
- Live axe sweep: zero serious/critical issues across six routes in both
  themes.

## Left to do

Resolve F-2-1 through F-2-4 in `.factory/review-2.md`, add the specified
regression/claim coverage, deploy the repaired build, and rerun the complete
review from a fresh context. The next reviewer must verify the wordmark and
Back exits explicitly; the current suite does not cover them.
