# Parts Promise review 8 handoff

- Date: 2026-09-02 UTC
- Work order: `field-parts-promise-review-8`
- Repository HEAD reviewed: `13759a6909a14547b621092e07621d4ccf90df6c`
- Live build reviewed: `690fcb860a1eabc7e4c2485141059f0013c08b4c`

## What was done

- Wrote `.factory/review-8.md` after a fresh mobile/desktop first-read review,
  complete landing/README copy audit, demo/storage/request inspection, claim
  sweep, history regression audit, route/link/metadata/accessibility review,
  and missed-leverage check.
- Did not modify product code, infrastructure, deployment, DNS, secrets, or
  service state.
- Verdict: **FAIL** with one blocking finding, `F-8-1`. Demo-mode Jobs,
  Privacy, and Terms links render real-mode `href` values. Opening one in a new
  tab drops the demo boundary and initializes live/cloud browser databases.

## Verification

From the clean clone `/tmp/field-parts-promise-review8.vHnDrV/repo`:

```sh
npm ci
npm test
npm run check
npm run format:check
BUILD_SHA=$(git rev-parse HEAD) npm run build
BUILD_SHA=$(git rev-parse HEAD) npm run test:e2e -- --retries=0
```

Results: 37/37 exact claim commands passed independently; 24 Vitest and 15
Rust tests passed; Svelte check and formatting passed; `dist/` was produced;
the full Playwright suite passed 61 tests with 43 expected skips.

Live checks included both required first-read viewports, one-click sample,
allocation/reset/offline behavior, request and browser-database logs, a
ten-route metadata/link crawl, Back focus/scroll restoration, real HTTP 404,
the factory URL verifier, and a nine-route Axe sweep. All passed except the
native demo-link behavior recorded as F-8-1.

## Known gap and next step

Make the actual demo-mode `href` values reactive and add a regression that
opens every internal demo link in a new tab. The test must confirm the banner
and `demo=1` persist and that neither `parts-promise-live-v1` nor
`parts-promise-cloud-v1` is created. Then rerun the complete review checklist.
