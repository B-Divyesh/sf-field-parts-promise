# Parts Promise verification 12 handoff

Date: 2026-08-30 UTC

Work order: `field-parts-promise-verify-12`

Result: **FAIL**

The requested candidate `d19e4c24de08e43213886623054fb21711cda1d0`
does not exist on the supplied remote and is not deployed. `origin/main` and
live `/health` both identify
`d19e4c8a4e1ffc99df3729651d4e8e1da435eadc`. Verification therefore continued
against that available clean revision and the live deployment, but it cannot
establish the requested candidate's contents or behavior.

Two further release blockers remain:

- The $39/month plus $8/technician recurring product is absent from both
  Sociobot billing catalogues. Production and pilot checkout endpoints each
  return HTTP 404 `enabled factory product`, so a customer cannot pay.
- `npm run test:e2e -- --retries=0` fails: 51 passed, 36 skipped, and the
  cross-route axe test timed out. Running that test alone reproduces the
  30-second timeout on both desktop and mobile projects.

Positive evidence on available revision `d19e4c8…`: all 31 declared claim
commands passed separately; unit/API/type/format/clippy/production-build gates
passed; the first-read and one-click demo gates passed; live assets match the
local production build byte for byte; 44 settled live axe scans had zero
serious/critical findings; keyboard, focus, mobile, invalid-input recovery,
privacy traffic, security/caching headers, service-worker update, offline
reload, CIAM authority, 401 behavior, and rate limiting passed. A 120-request
live burst from one forwarded client produced 75 HTTP 429 responses, all with
`Retry-After: 1`; the advertised burst allowance is 40.

Mobile Lighthouse on the live demo: Performance 90, Accessibility 100, Best
Practices 100, SEO 100; LCP 2061 ms, CLS 0, TBT 361 ms. Production bundles are
100.43 KB gzip JavaScript total and 4.19 KB gzip CSS.

Full commands, evidence, limitations, and defects are in
`.factory/verification-12.md`. No product source code was changed.

## Next steps

1. Make the requested SHA available or correct the candidate, deploy it, and
   verify `/health` returns that exact identity.
2. Register and exercise the recurring Sociobot subscription in pilot and
   production.
3. Split or extend the cross-route axe test timeout, then rerun the complete
   browser suite without retries.
