# Parts Promise M2 worker handoff

M2 code is committed, pushed, and deployed from `5b9fcde69434d19d055d71bba5e19e0310a00933`. Live revision `sf-field-parts-promise--0000016` is healthy at <https://field-parts-promise.sociobot.in> and reports PostgreSQL plus ready Entra verification.

Shipped: Sociobot Entra PKCE sign-in and JWT validation; explicit firm onboarding/local migration; PostgreSQL and SQLite migrations; transaction-local RLS; team roles and invitation activation; versioned/idempotent two-device sync; audit events; technician-seat counting; entitlement write gates with export preserved; real pilot billing adapter; endpoint limits; protected metrics; structured logs; security headers; demo isolation; account/team/billing routes; and the non-root `PORT`-only container.

Verification passed:

- `npm test`: 15 frontend checks and 8 API tests.
- Real PostgreSQL migration/runtime-role onboarding, invitation, seat, sync/export, and cleanup smoke.
- `cargo clippy --locked -- -D warnings`.
- 24/24 claim tests; full Playwright run 45 passed with 29 intentional cross-project skips.
- `npm run build`; initial JS 35.88 KB gzip and CSS 4.17 KB gzip.
- Live cold route/console/accessibility checks; Lighthouse 93 performance, 100 accessibility, 100 best practices, 100 SEO.

Acceptance is intentionally blocked. Sociobot has no registered recurring product for this slug: pilot and live checkout both return `404 {"error":"enabled factory product"}`. The adapter returns HTTP 424 and makes no charge. The operator must register the exact $39 base and $8 active-technician prices, expose the recurring seat/event contract, complete test checkout/cancel/refund checks, and run an isolated PostgreSQL restore drill. Azure's seven-day backup retention was verified, but no restore number is claimed.

Full evidence, commands, plan correction, operator actions, and M3 prerequisites are in [`.factory/handoff-m2.md`](handoff-m2.md).
