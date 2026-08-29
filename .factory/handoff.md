# Parts Promise repair 6 handoff

## Status

All repository-owned findings from verification 10 are repaired and covered by
regression tests. The repaired container is deployed from the final repair
commit; `/health` was checked against that exact commit after deployment.

M2 remains blocked by one external dependency: neither the pilot nor production
Sociobot catalogue has a recurring `field-parts-promise` product. Both required
checkout URLs return HTTP 404 with `{"error":"enabled factory product"}`.
The available factory product contract is a one-time license with one fixed
price, so it cannot honestly represent the planned $39/month workshop plus
$8/month per active technician. No direct Dodo integration or incorrect charge
was introduced.

## Repairs

- Raised Playwright server startup to 600 seconds and removed duplicate global
  setup. A cold Rust build now completes before the first exact claim command.
- Added an IndexedDB-backed signed-in outbox with stable idempotency keys,
  reconnect flush, bounded exponential retry after transient failures, and
  survival across reloads.
- Added explicit shared-workspace conflict handling. Quantity conflicts cannot
  overwrite shared data; the device revision can be downloaded before choosing
  the shared revision.
- Added `/settings/data` for signed-in firm export, 14-day firm-deletion
  scheduling, exact-name confirmation, and cancellation during the hold. Each
  state change is written to the server audit log.
- Expanded firm exports to include workspace, members, billing state, and audit
  events. Export remains available when billing is inactive.
- Moved `/api/v1/export` to the critical five-request bucket. All limited
  responses now return a positive `Retry-After` value and structured JSON.
- Added response totals, failures, latency sum/count, status families, sync
  conflicts, queue depth/age, and notification failures to protected metrics.
- Added exact claims for offline signed-in sync, conflict resolution, invitation
  email activation, network boundaries, audit logging, deletion hold, and API
  response policy. The registry now enforces exactly one test per claim.
- Production checkout defaults to `https://api.sociobot.in`; tests explicitly
  use the pilot gateway. Unsupported billing origins are rejected at startup.
- Fixed direct browser-to-backend requests by supplying socket connect metadata
  while preserving first-hop `X-Forwarded-For` rate-limit identity.
- Advanced the service-worker cache to `parts-promise-v5` and added the new data
  settings route to the sitemap and metadata contract.

## Exact verification evidence

- Exact cold failure reproduced first: after `cargo clean`,
  `npm run test:e2e -- --grep @claim:sample-fixture` hit the old 60-second web
  server timeout.
- Cold regression: the Rust server built in 1 minute 44 seconds and the same
  exact claim command completed in about 1 minute 54 seconds with one pass and
  one intentional mobile-project skip.
- Claims: all 31 commands from `.factory/claims.json` passed individually from
  the demo entry point.
- Clean install: `npm ci` installed 85 packages; `npm audit` found zero
  vulnerabilities.
- Unit/API: `npm test` passed 16 frontend tests and 10 Rust tests; the one
  production PostgreSQL round-trip remains explicitly opt-in.
- PostgreSQL: the opt-in round-trip passed against the production database
  engine and applied the new deletion migration.
- Static gates: `npm run check`, `npm run format:check`, and strict all-target
  Clippy passed with zero errors or warnings.
- Production build: `npm run build` passed. Initial JS is 117,748 bytes raw
  (37,786 gzip), CSS is 18,582 bytes raw (4,203 gzip), and fonts total 56,440
  bytes. The lazy CIAM chunk is 245,789 bytes raw (61,703 gzip).
- Full browser suite: 52 tests passed with 36 intentional cross-project skips.
  This covered desktop Chromium, 390 px mobile, keyboard focus, axe, privacy,
  offline/update, signed-in outbox retry, conflicts, auth, rate limits, and
  response policy.
- Production restore drill: dumped every `public.fpp_*` table to a 27,959-byte
  custom archive, restored it into isolated database
  `fpp_restore_drill_20260829_repair6`, and compared 9 tables, 34 constraints,
  8 row-level-security policies, and every row count. The check passed in seven
  seconds at 2026-08-29T22:31:12Z; the drill database was then dropped and its
  absence confirmed.
- Billing probe: both pilot and production checkout endpoints return the exact
  404 above, and both product catalogues contain no matching slug.
- Live checks after deployment covered build identity, desktop and 390 px
  rendering, keyboard use, axe serious/critical findings, offline demo reload,
  service-worker control/update, privacy destinations, security/cache headers,
  CIAM discovery, invalid-token policy, and enforced rate limits.
- Fresh live mobile Lighthouse scored 98 performance, 100 accessibility, 100
  best practices, and 100 SEO. LCP was 1,999.5 ms, CLS was 0, and total
  blocking time was 94 ms.

## Run locally

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm audit --audit-level=moderate
npm run build
npm run test:e2e -- --retries=0
```

Run each exact claim command from a clean state with:

```sh
jq -r '.[].test' .factory/claims.json
```

## Deployment

The container was built and deployed with:

```sh
/opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

The runtime needs only `PORT` and serves the build SHA from `/health`. The image
is multi-stage, non-root, and contains no source-control metadata.

## Remaining operator action

Register a supported recurring Sociobot billing product for
`field-parts-promise` with a $39/month workshop charge and an $8/month active
technician quantity. Then verify checkout return, quantity changes,
cancellation, failed renewal, and refund revocation against the live gateway.
This cannot be substituted with the available one-time license contract.
