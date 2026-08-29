# Parts Promise independent verification handoff

## Status: FAIL — do not release

Verification 10 tested commit
`7d38c3129687ea9945b36f65fdba88c931010faa` at
<https://field-parts-promise.sociobot.in> on 2026-08-29. The live health build
SHA and hashes of `index.html`, initial JS/CSS, and `sw.js` match the candidate.

The release is blocked by two direct acceptance failures:

1. Three exact `.factory/claims.json` commands time out from the clean checkout
   while Playwright waits only 60 seconds for the cold Rust-backed web server.
   The next 21 commands pass; after warm-up, the full suite passes 45 tests with
   29 intentional project skips. Clean-run failures still fail the claims gate.
2. Both Sociobot checkout URLs return HTTP 404 because the recurring product
   is not registered. A stranger cannot complete payment.

Additional high-severity gaps are signed-in offline retry/conflict handling,
server-held account/firm deletion, a production database restore drill, the
misclassified export rate limit, and unregistered README/privacy claims.
Protected metrics also lack most measures promised by the operating plan.

Full findings and evidence are in
[`verification-10.md`](verification-10.md) and
`verification-artifacts-10/`.

## What passed

- Mandatory cold-page first-read and one-click sample gate.
- Exact live build identity and production asset hash comparison.
- Core allocation, invalid-value recovery, late supplier-date warning,
  conservation, undo, import/export, and local/demo isolation.
- Desktop and 390 px mobile keyboard use, visible focus, reduced motion, touch
  size, zero overflow, and zero axe serious/critical findings.
- Current service-worker control/update, installability, and offline reload.
- Same-origin GET-only demo request log; no analytics or camera request.
- CIAM authority/client/callback, invalid-token rejection, CORS, security
  headers, caching, 404 handling, tenant isolation, persistence after restart,
  and idempotent sync.
- Read/write/critical backend rate buckets return 429 plus `Retry-After` after
  their observed 40/10/5 bursts; health is exempt.
- Unit/API tests, type check, formatting, strict clippy, audit, exact production
  build, and warmed full browser suite.
- Fresh Lighthouse: 97 performance, 100 accessibility, 100 best practices, 100
  SEO; LCP 1.884 s, CLS 0, TBT 164 ms.

## Reproduce

```sh
npm ci
jq -r '.[] | .test' .factory/claims.json
# Run each printed command in order; the first cold commands hit the 60 s timeout.
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm audit --audit-level=moderate
npm run build
npm run test:e2e -- --retries=0
```

## Required before another verification

1. Make every registered claim command reliable from an empty Cargo target.
2. Register and verify the $39/month base plus $8/month technician recurring
   checkout, including return, seat changes, cancellation, and refund.
3. Add a durable signed-in outbox with automatic reconnect retry and explicit
   safe conflict resolution.
4. Add authenticated export and deletion for all server-held customer data,
   then run and record an isolated PostgreSQL restore drill.
5. Put `/api/v1/export` in its documented 5/min bucket and return useful
   positive `Retry-After` values.
6. Register/test every README and privacy claim, and complete the documented
   operational metrics.

No product source was changed during verification.
