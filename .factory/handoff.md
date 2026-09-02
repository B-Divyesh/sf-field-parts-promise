# Parts Promise review 6 handoff — FAIL

Date: 2026-09-02 UTC

Work order: `field-parts-promise-review-6`

Repository base: `6784f9d841321e3aba7506b13b5de52b90cd9916`

Live URL: <https://field-parts-promise.sociobot.in>

## Result

The adversarial review is complete in `.factory/review-6.md`. The verdict is
**FAIL** with one blocking, two high, and two low findings.

The blocker is a live/demo UI-boundary leak: a live job's confirmation toast
remains visible after the app switches into Demo. The other findings cover an
authentication claim whose tagged test proves only part of the stated token
validation, a pricing heading that implies unavailable payment, and two README
plain-language issues.

## Verification completed

- Cold first read at 390 × 844 and 1440 × 900.
- One-click live demo, allocation, reset, exit, IndexedDB namespace isolation,
  offline reload, and full request logging.
- All 37 exact `.factory/claims.json` commands, run independently from the clean
  clone `/tmp/field-parts-promise-review6.fGD0eV/clone`: all exited successfully.
- All earlier review and polish findings checked against the live site and code.
- All sitemap routes plus an unknown route checked for status, titles, one H1,
  main landmark, metadata, canonical/OG/Twitter tags, favicons, footer, and
  console output.
- Link crawl: all product and external navigational links passed; the unknown
  route correctly returned 404.
- Axe on ten live routes: zero serious or critical findings.
- Mobile and desktop route focus, Back, and scroll restoration: passed.
- `npm test`: passed, 22 Vitest and 15 Rust tests.
- `npm run check`: passed with no errors or warnings.
- `npm run format:check`: passed.
- `BUILD_SHA=6784f9d841321e3aba7506b13b5de52b90cd9916 npm run build`: passed and
  produced `dist/`.
- `BUILD_SHA=6784f9d841321e3aba7506b13b5de52b90cd9916 npm run test:e2e -- --retries=0`:
  passed, 59 tests passed and 43 project-specific tests skipped.

## Scope and remaining work

No product code, infrastructure, DNS, billing configuration, customer records,
or persistent deployment data was modified. Only this review and handoff were
written.

Resolve F-6-1 through F-6-5 in `.factory/review-6.md`, then repeat the full
claim and live-browser review. Checkout remains explicitly unavailable; no
payment provider integration was attempted.
