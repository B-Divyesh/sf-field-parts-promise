# Parts Promise M2 handoff

Work order: `venture-field-parts-promise-m2`  
Date: 2026-08-29  
Deployed source: `5b9fcde69434d19d055d71bba5e19e0310a00933`  
Image: `sociobotregistry.azurecr.io/sf-field-parts-promise:5b9fcde69434`  
Image digest: `sha256:e1ac22ba55ceec916da89fd9b0253eb66c3dd5764b5752ec2d116a5111d2b4b7`

## Status: deployed, M2 acceptance blocked

The account, persistence, tenant sync, team-role, rate-limit, and billing-adapter code is deployed on healthy revision `sf-field-parts-promise--0000016`. M2 cannot be called released because the Sociobot recurring product is not registered and an isolated database restore drill has not been run.

This is the stop condition already written into the plan. The product does not substitute the one-time license API, call Dodo directly, or show a fake paid state.

## What shipped

- Microsoft Entra External ID redirect sign-in through the shared Sociobot tenant. MSAL uses PKCE and `sessionStorage`. The API discovers issuer/JWKS, caches keys for one hour, accepts RS256 only, and validates audience, tenant, issuer, signature, `exp`, and `nbf`. Users are keyed by Entra `oid`.
- `/auth/callback`, `/onboarding`, `/settings/team`, and `/settings/billing`, with route-specific titles, descriptions, canonicals, focus restoration, signed-out states, and the existing blueprint design system.
- Explicit local-to-firm onboarding. The UI shows the exact record count and requires confirmation. The API recomputes the count and rejects the bundled demo ID, so demo data cannot migrate.
- Reversible PostgreSQL migrations for users, firms, memberships, the versioned workspace, idempotent sync operations, audit events, technician seats, billing accounts, and billing events. SQLite carries the same clean-clone application constraints.
- Transaction-local PostgreSQL RLS context. A validated user can discover only their membership; every tenant query then sets the firm ID inside that transaction. Runtime and migration database roles remain separate.
- Bootstrap/pull/push sync with expected versions, transactional compare-and-set, replayed idempotency keys, 256 KB payload limits, and audit entries. A second signed-in device reads the stored workspace. Viewer roles are read-only in both API and UI.
- Work-email invitations. The owner records the address and shares the site link; the invitation activates only when that verified Entra email signs in. A technician seat starts at activation, not invitation. The owner, coordinator, and viewer do not consume technician seats.
- Billing state enforcement for `pending`, `active`, `grace`, `unpaid`, `cancelled`, and `refunded`. Active/grace permit cloud writes. Other states preserve reads and export while blocking new cloud writes.
- A live adapter to `https://pilot-api.sociobot.in/api/v1/products/field-parts-promise/checkout`. The current `404 enabled factory product` response becomes a plain HTTP 424 explanation that confirms no charge occurred.
- Read, write, account, payment, and protected metrics limits keyed by the first `X-Forwarded-For` hop. Limits return 429 plus `Retry-After`. Health is exempt.
- Structured JSON request logs without query strings or payloads, request IDs, security headers, CORS allowlist, protected `/metrics`, graceful shutdown, and `/health` with build/database/auth state.
- One non-root, multi-stage container that serves both the hashed Vite app and axum API on `PORT`. With only `PORT` in production, managed identity reads the two database URLs from Key Vault. A clean clone falls back to SQLite without requiring a secret.
- The demo remains account-free and API-free. Its IndexedDB namespace, reset/exit behavior, offline flow, service-worker cache, and all prior claims still pass.

## Plan correction

The original architecture said Static Web Apps plus a separate API container. The work order and existing deployment are one Container App, and same-origin auth/API behavior is simpler and safer there. `.factory/plan.md` now records the unified non-root container and managed-identity database lookup. No DNS or billing infrastructure was changed.

## Verification evidence

- `npm test`: 15 Vitest checks passed; 8 Rust API tests passed; one PostgreSQL test is intentionally opt-in.
- Real PostgreSQL opt-in test: passed migration, onboarding, entitlement, sync, export, and cleanup.
- Distinct runtime-role smoke: onboarding 200, technician invitation 200, invitation activation 200; returned role `technician`, one active seat, and two active memberships. Smoke records were removed afterward with the migration role.
- `cargo clippy --manifest-path server/Cargo.toml --locked -- -D warnings`: passed.
- `npm run test:e2e`: 45 passed, 29 intentional cross-project skips. It covers desktop and 390 px behavior, serious/critical axe findings, routing, metadata, console errors, demo isolation, and all product flows.
- `npm run test:e2e -- --project=chromium --grep '@claim:'`: 24/24 registered claims passed.
- `npm run build`: passed. Initial JS is 35.88 KB gzip, lazy CIAM is 62.08 KB gzip, and CSS is 4.17 KB gzip.
- ACR build `ch17a`: passed and pushed digest `sha256:e1ac22ba55ceec916da89fd9b0253eb66c3dd5764b5752ec2d116a5111d2b4b7`.
- Cold live health: `{"status":"ok","build_sha":"5b9fcde69434d19d055d71bba5e19e0310a00933","database":"postgres","auth":"ready"}`.
- Live routes `/`, `/demo`, `/jobs`, `/auth/callback`, `/onboarding`, `/settings/team`, `/settings/billing`, `/privacy`, `/terms`, `/robots.txt`, and `/sitemap.xml` returned 200. An unknown route returned 404. An unauthenticated bootstrap returned 401 with `WWW-Authenticate: Bearer`.
- Live browser checks on home, demo, and onboarding found one H1, `lang=en`, a main landmark, no missing alt text, no unlabeled buttons, and no console/page errors. Cold browser loads were 611–621 ms in the worker.
- Mobile Lighthouse: performance 93, accessibility 100, best practices 100, SEO 100; LCP 1.96 s, CLS 0, TBT 266 ms.
- Entra production callback request reached the Microsoft sign-in page with HTTP 200 and no redirect-registration error.
- Azure PostgreSQL reports seven-day automated backup retention. No recovery number is claimed.

Screenshots, returned HTML, verifier JSON, and Lighthouse JSON are in `.factory/qa-artifacts/m2-live-*` and `.factory/qa-artifacts/m2-lighthouse.json`.

## Needs operator action before M2 acceptance

1. Register the test recurring **Workshop base — $39/month** and **Technician seat — $8/month** product in Sociobot. Both pilot and live checkout currently return `404 {"error":"enabled factory product"}`.
2. Publish or confirm the recurring contract for firm identity, exact active-seat quantity, checkout return, signed event replay, grace, cancellation, refund, and seat decrease.
3. Run the real test checkout with card `4242 4242 4242 4242`, verify both amounts, replay recorded signed events, and confirm server-authoritative entitlement changes.
4. Restore a production-like encrypted PostgreSQL backup into an isolated target and record elapsed RPO/RTO evidence. Automated retention alone is not a restore drill.

Until those are complete, newly created firms remain `pending`; their imported records remain readable/exportable, but further cloud writes are blocked. The public billing copy says checkout is waiting for registration.

## What M3 needs

Do not start M3 until the operator actions above are complete and the M2 review/polish loop passes. Then keep the same tenant/RLS/idempotency boundary while adding the planned scan/manual fallback, supplier evidence, offline outbox, and explicit conflict resolution. M3 must not weaken demo isolation, viewer read-only access, or unpaid export.
