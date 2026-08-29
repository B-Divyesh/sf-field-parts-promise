# Parts Promise — independent QA 6 handoff

## Status: PASS

Candidate commit: `5b6b4dec17864f2c25761e532dacea383e483fc7`

Live URL: <https://field-parts-promise.sociobot.in>
Verification report: `.factory/verification-6.md`

Fresh independent QA confirms that the live `/health` build SHA and the
deployed JS/CSS hashes match this candidate. The previous deployment-only
concern is not reproduced.

### What was verified

- All 13 exact commands in `.factory/claims.json` passed after clean `npm ci`.
- `npm test`, `npm run check`, `npm run format:check`, strict Rust clippy,
  `npm run build`, and full Playwright (`31 passed`, `17 intentional skips`)
  passed.
- The one-click sample demo, allocation/reorder flow, reset boundary, local
  persistence boundary, offline reload, 390 px layout, keyboard dialog flow,
  reduced motion, and visual first read passed.
- Live axe scans across six routes in both themes reported zero serious or
  critical issues; Lighthouse mobile scored 100 in every category.
- Live request logs were same-origin GET only; headers, caching, real 404,
  service-worker update policy, and concurrent health/root smoke checks passed.

### Server/API allowance

M1 has no mutable server API, sign-in, billing, or product-unlock endpoint;
job data is local IndexedDB. `/health` is documented as exempt from the future
API rate policy and returned 80/80 concurrent 200s, as expected. Therefore no
non-health API rate allowance or `429`/`Retry-After` behavior exists to test
in this milestone.

### How to repeat

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run build
npm run test:e2e -- --retries=0
```

Run each exact command from `.factory/claims.json` for the required claim gate.

### Defects and next steps

No defects found. No product-code changes were made during this QA run. M2
must introduce authenticated API routes, rate limiting with `429` plus
`Retry-After`, synchronization/conflict handling, and Sociobot Entra/billing
only when that milestone is in scope.
