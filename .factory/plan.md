# Parts Promise venture plan

Status: M1 released; perfection-loop round 2 passed.

Product: `field-parts-promise` · artifact: offline-first PWA with a backend

Production URL: <https://field-parts-promise.sociobot.in>

This file is the delivery contract. A builder must read it, `.factory/design.md`, every prior milestone handoff, and the latest review notes before changing code. Keep the milestone status, claims, and decisions current.

## 1. Product requirements

### Customer and situation

Parts Promise is for solo-to-20-person electrical, HVAC, and repair firms. The owner or coordinator agrees a visit date; a field technician collects or fits the part. Today they combine a field-service calendar with calls, spreadsheets, paper notes, and supplier portals. “Three on order” does not answer “is one of those three held for the Riverside job?” The mistake repeats on every parts-dependent job: a part is assumed available, promised twice, or ordered twice.

### Product promise

**Promise a job date from parts held for that job.**

The product reports evidence, not certainty. It may say “Parts in hand,” “Expected before visit,” “Date at risk,” or “Needs a check.” It must never describe a supplier ETA or stock count as guaranteed.

### The three jobs to nail

1. **Decide whether to promise the date.** Create a job, list required quantities, allocate each quantity from a van, warehouse, or supplier purchase order, and see what blocks the proposed visit date. Each allocation must retain its source and last-check time.
2. **Update the truth where the work happens.** A technician scans a barcode or enters a part manually, moves or fits its allocated quantity, and can do so without signal. When two devices disagree, the app explains the conflict and never silently spends the same stock twice.
3. **Act before a promise breaks.** An owner sees late, weak, stale, and missing supplier evidence across jobs, receives a reorder suggestion when a source falls below its minimum, and updates the job or order without creating a duplicate purchase.

### Success measures

Pilot cohort: 5–10 firms for eight weeks.

- Reduce confirmed duplicate orders per 100 parts-dependent jobs by at least 25% versus each firm's four-week baseline.
- At least 90% of jobs containing a non-stock part have an attributable status: an allocation source or an explicit “not sourced” state with updater and time.
- Supporting health measures: 80% of active firms review a promise status weekly; fewer than 2% of sync operations require manual conflict resolution; no cross-organization data exposure.

Instrumentation is privacy-respecting. The server may count coarse product events (`job_created`, `allocation_recorded`, `promise_reviewed`, `conflict_resolved`) by organization and day. It must not send customer names, job notes, part descriptions, barcodes, or exact locations to analytics. No third-party analytics script is permitted.

### Pricing and entitlement

There is one named subscription with two transparent recurring price components:

- **Workshop base — $39/month per firm.** Includes the owner workspace, job cards, allocation, supplier evidence, offline use, export, and one owner/admin account.
- **Technician seat — $8/month per active technician.** Each invited non-owner who can update field records consumes one seat. Owners who also work in the field do not consume an extra seat.

The public sample-data demo is always free and requires no account. There is no promised free trial in this plan; add one only after pricing research and billing support. Accessible operation, safety warnings, privacy controls, and data export are never gated. Billing goes only through the Sociobot billing API, with Dodo as merchant of record; the repository never embeds Dodo credentials or SDKs. The recurring product and seat price must be registered in Sociobot test mode before M2. If the current Sociobot product endpoint cannot express recurring seat quantity, M2 stops at the adapter boundary and records the operator dependency rather than integrating Dodo directly or charging the wrong amount.

### Deliberately out of scope

- Payroll, time tracking, estimates, invoicing, tax calculation, dispatch optimization, route planning, CRM, and lead marketplaces.
- Full inventory valuation, accounting ledgers, serial-number compliance, automated purchasing, or supplier availability guarantees.
- Scraping supplier portals or using supplier catalog/availability data without written licensing.
- Predicting an ETA with AI. The truth must come from a person or cited supplier evidence.
- Native mobile apps in the first five milestones. Install the PWA first; use Capacitor later only if camera reliability demands it.

### Product language

Canonical terms are **job**, **required part**, **allocation**, **source**, **supplier order**, **visit date**, **promise status**, and **technician**. Do not substitute project, reservation, depot, PO commitment, appointment promise, operative, or AI confidence in user-facing copy. A supplier confidence value is one of “Confirmed by supplier,” “Estimated,” or “Needs a check.”

## 2. Evidence and wedge

| Signal | What it establishes | Product consequence |
| --- | --- | --- |
| [Solo carpenter on Jobber cost and bloat](https://hn.algolia.com/api/v1/items/47294092), 2026-03-08 | A small trade business reports paying $150+/month for a broad system when it needs only a few daily jobs. | Stay narrow, make the first useful flow work without migrating dispatch or invoicing, and keep the base price at $39/month. |
| [Ask HN on tools in trade and field-service firms](https://hn.algolia.com/api/v1/items/48681023), 2026-06-26 | Deployment in trades has workflow and coordination constraints, including electrical work and qualified-worker coordination. | Design phone-first, use plain language, and make adoption possible beside an existing scheduler. |
| [InvenTree issue #11226](https://github.com/inventree/InvenTree/issues/11226), 2026-01-30 | Aggregate “on order” quantities do not show whether a particular build/job is covered; users fall back to notes, PO checks, and memory and risk duplicate orders. | Make job-to-part attribution the core object, show the source on the job, and prevent a quantity being allocated twice. |

The evidence is directional, not yet a validated willingness-to-pay study. The wedge is not “simpler field service.” It is a job-level parts commitment layer that sits beside the firm's current calendar and accounting tools. A user switches from a spreadsheet because Parts Promise answers which job owns a quantity, why the date looks safe or risky, and who last checked it. A user need not replace Jobber, Tradify, ServiceTitan, or an ERP.

## 3. Architecture

### Stack decision

- **Web:** Svelte 5, Vite, strict TypeScript, and a small History API router. Svelte fits a stateful local-first application without React's runtime or ecosystem overhead. The app shell and current jobs live in IndexedDB through Dexie. A versioned service worker precaches only the shell and bundled demo fixtures.
- **API:** Rust 2021, axum, tokio, serde, sqlx, PostgreSQL, tracing, and tower-governor. Shared firms need transactional allocation, tenancy, and multi-device sync, so the API is not optional after M2.
- **Deployment shape:** hashed web assets in Static Web Apps and a non-root API container in Container Apps. The repository does not modify deployment, DNS, or billing infrastructure. The API container starts with only `PORT` (default `8080`); optional connection and identity settings have safe development defaults or generated persisted secrets as required by the backend contract.
- **Testing:** Vitest for deterministic domain rules, Rust unit/integration tests against an isolated database, and Playwright 1.58.2 for claim and accessibility flows. Each claim test starts from `?demo=1` unless identity or billing is the subject.

The web budgets are initial JS ≤200 KB gzip (landing ≤150 KB), CSS ≤50 KB, self-hosted fonts ≤120 KB, mobile hero ≤300 KB, LCP <2.5 s, INP <200 ms, and CLS <0.1 on a throttled mid-range phone. Target ES2022 and evergreen browsers.

### System boundaries

```text
Svelte PWA
  ├─ live IndexedDB: parts-promise-live-v1
  ├─ demo IndexedDB: parts-promise-demo-v1 (never syncs)
  ├─ outbox: idempotent operations + expected record versions
  └─ MSAL session cache: sessionStorage
          │ HTTPS /api/v1, bearer token
          ▼
axum API ── PostgreSQL (organization-owned truth + audit log)
  ├─ Entra discovery/JWKS cache
  ├─ Sociobot billing adapter ── api.sociobot.in ── Dodo
  ├─ structured logs /health /metrics
  └─ optional web-push delivery worker
```

Demo mode is selected by `?demo=1`. It loads bundled, deterministic fixtures into `parts-promise-demo-v1`, registers no account, never opens an API or billing request, and displays “Demo — sample data, nothing is saved” with **Reset demo** and **Start for real**. “Nothing is saved” means nothing enters a real firm: the demo database may persist on that browser until reset or exit. Exiting deletes the demo database; there is no implicit conversion into live data.

### Core state rules

- A required part is covered only when the sum of its active allocation quantities equals or exceeds the required quantity. Allocation is explicit; an aggregate stock count is never coverage.
- On-hand allocations yield **Parts in hand** only when all required quantities are allocated from van/warehouse stock and no unresolved conflict exists.
- A supplier-order allocation can yield **Expected before visit** only when it has a supplier order reference, an ETA checked time, ETA on/before `visit_date - organization.buffer_days`, and confidence “Confirmed by supplier” or “Estimated.” The UI names which evidence is estimated.
- Any shortage, ETA after the buffer, or rejected double-allocation yields **Date at risk**. Missing/stale evidence (default 72 hours, configurable 24–168) yields **Needs a check**.
- A reorder suggestion is deterministic: projected unallocated on-hand quantity after active allocations is below the source's minimum. It never creates an order. A person may dismiss it with a reason or create a draft supplier-order line.
- Quantities are decimal values with explicit unit codes. Conversions are prohibited unless a future conversion table is approved; “1 box” and “10 each” are not assumed equal.

Put these rules in a shared TypeScript domain module for immediate offline feedback and a Rust domain module as the authority. Maintain the same JSON fixture suite in both languages to prevent drift.

### Data model

All mutable rows have UUIDs, `organization_id`, `version`, `created_at`, `updated_at`, `created_by`, and `updated_by` unless noted. Server queries derive `organization_id` from the validated membership; they never accept it as authority from a request. PostgreSQL row-level security is defense in depth, and integration tests attempt cross-tenant IDs on every resource route.

| Entity | Important fields and rules |
| --- | --- |
| `users` | Entra `oid` as stable external key; display name/email are mutable profile data. Never key identity by email. |
| `organizations` | Name, locale, time zone, date format, default unit, ETA buffer days, evidence-stale hours. |
| `memberships` | User, organization, role (`owner`, `coordinator`, `technician`, `viewer`), status. Unique user/org. |
| `technician_seats` | Membership, billing status, active from/to. Owners are excluded from billable count. |
| `customers` | Name and optional site label/contact. Contact fields are encrypted at rest when platform support is available and omitted from analytics. |
| `jobs` | Human job number, customer/site, visit date, status, notes, derived promise status, version. Jobs archive rather than hard-delete during normal use. |
| `catalog_parts` | Firm-local SKU/barcode, plain name, unit, optional manufacturer; no unlicensed global catalog. Barcode unique per organization when present. |
| `part_requirements` | Job, optional catalog part, snapshotted description/SKU/unit, required quantity, fitted quantity. |
| `stock_sources` | Type (`van`, `warehouse`), name, active flag, minimum quantity per part held separately. Supplier orders are not stock sources. |
| `stock_positions` | Part/source, observed on-hand quantity, last checked time/person, version. This is evidence, not accounting valuation. |
| `allocations` | Requirement, kind (`on_hand`, `supplier_order`), source or supplier-order line, quantity, state, allocated by/at. A serializable transaction prevents the same available quantity being spent twice. |
| `suppliers` | Firm-local name and contact/reference fields; no scraped data. |
| `supplier_orders` / `supplier_order_lines` | Supplier, firm reference, ordered quantity, status, part, unit, expected date, confidence, last checked time, evidence note/source. A line may be split across jobs, never beyond its remaining quantity. |
| `scan_events` | Barcode string, action, device-generated time, result reference. Never stores camera frames. |
| `sync_operations` | Client UUID, monotonically increasing client sequence, idempotency key, entity, action, expected version, payload, server result/time. Unique idempotency key per organization. |
| `conflicts` | Operation, entity snapshots, reason (`version_changed`, `quantity_spent`, `deleted`), resolution and resolver. Preserve until audit retention expires. |
| `audit_events` | Actor, action, object type/id, redacted change summary, time. Append only; no customer free text in logs. |
| `billing_accounts` | Sociobot customer/subscription references, plan, seat quantity, state, period end, last webhook/event id. Never payment-card data. |
| `notification_preferences` | In-app/browser reminder choices; off until explicit opt-in. |
| `push_subscriptions` | Endpoint and encrypted keys; deletable. No marketing use. |
| `share_links` | M5 only: hashed token, job, expiry, revoked time, allowed fields. |

Migrations live in `server/migrations`, are forward and reversible where PostgreSQL permits, and are tested up/down on an empty and representative database. Store timestamps as UTC; render in the organization's IANA time zone.

### Sync and conflict handling

The client writes to IndexedDB first and appends an operation to its outbox. On reconnect it sends batches of at most 50 to `POST /api/v1/sync`. Each operation has an idempotency key and expected entity version. The server applies operations in a transaction, returns accepted versions plus any authoritative changes since the cursor, and retains a per-organization change cursor.

Allocation commands lock the relevant stock position or supplier-order line. A negative remainder or stale allocation is rejected as `quantity_spent`; the client marks the affected job **Date at risk** and opens `ConflictResolver`. Text/date edits with a stale version show both values and require a choice. Deletes are soft and win over edits only after the user confirms the server's deletion. No generic last-write-wins applies to quantities. The outbox survives reload; a failed batch backs off with jitter and does not block local reading.

### Authentication and authorization

M2 uses the shared Sociobot Microsoft Entra External ID tenant. Frontend: `@azure/msal-browser`, authorization-code PKCE, `loginRedirect`, silent token acquisition, scopes `openid profile email`, and `sessionStorage`. Authority comes from the documented tenant; production callback is `https://field-parts-promise.sociobot.in/auth/callback` and requires operator registration.

Backend startup fetches OIDC discovery and uses its issuer and JWKS URI; JWKS cache is one hour. It accepts RS256 only and validates `aud`, `tid`, issuer, expiry, and not-before. `oid` identifies the user. Invalid requests get 401 and `WWW-Authenticate: Bearer`. Roles are checked server-side per organization. Public landing, legal, health, and demo assets stay public.

Environment overrides are `ENTRA_TENANT_ID`, `ENTRA_TENANT_SUBDOMAIN`, and `ENTRA_CLIENT_ID`, with the values from the auth contract as defaults. No client secret is needed in the SPA.

### Billing

The UI hands checkout to `https://api.sociobot.in/api/v1/products/field-parts-promise/checkout` through a billing adapter; staging uses `https://pilot-api.sociobot.in`. Product/price configuration in Sociobot determines that checkout is recurring. Do not put prices or Dodo identifiers in a client request. The API associates billing only after an authenticated, nonce-bound return or verified webhook/event. Webhook/event processing is idempotent, rejects replays, and uses the Sociobot verification contract available at build time.

The server is the entitlement authority for firm/seat use; a client cache keeps already-synced field work readable offline. An expired or unpaid subscription blocks new cloud sync and new invitations after a grace period, not local export or safety warnings. It never deletes or hides existing user data. Seat reduction takes effect only after the owner selects which technician memberships become inactive.

Because the attached paid-unlock contract documents one-time license tokens rather than recurring seat subscriptions, M2's first integration test must confirm the registered recurring product, return payload, verification/webhook method, seat-quantity method, cancellation, and refund behavior in Sociobot test mode. This is an explicit API risk, not permission to call Dodo directly.

### API surface and rate limits

Version all application routes under `/api/v1`. Planned groups: `/bootstrap`, `/jobs`, `/parts`, `/sources`, `/supplier-orders`, `/sync`, `/conflicts`, `/members`, `/billing`, `/exports`, `/notifications`, and `/shares`. JSON errors use `{code, message, action, request_id}` and plain words. Validate sizes, units, dates, UUIDs, and permissions at the edge. Use parameterized SQL only.

`/health` is exempt. Every other server route is keyed by the first trusted `X-Forwarded-For` hop and, after auth, organization/user as well:

- Reads: 20 requests/second, burst 40.
- Writes and sync: 5 requests/second, burst 10; sync batch maximum 50 operations and 256 KB.
- Authentication, invitations, billing, export creation, and share creation: 5 requests/minute, burst 5.
- Public share reads: 30 requests/minute per IP, burst 10.

All exceeded limits return 429 with `Retry-After`. CORS allowlists the production origin and configured localhost development origins. Security headers include a CSP matching only self, Entra, and Sociobot connections actually used, plus HSTS in production, `X-Content-Type-Options: nosniff`, strict referrer policy, and restrictive permissions policy (camera allowed only to self).

### Background work, files, and messages

PostgreSQL is also the initial job queue using `FOR UPDATE SKIP LOCKED`; do not add Redis before measurements require it. Jobs include stale-evidence recalculation, in-app/browser reminder delivery, share expiry, export cleanup, and coarse daily success counters. Workers retry with capped exponential backoff and a dead-letter state visible to operations.

M1–M3 store no uploads. CSV exports are generated on request, encrypted in object storage only if too large for a streamed response, and deleted after 24 hours. Camera frames never leave the device. No marketing email. If transactional email is later added, it must be opt-in where appropriate, send only account/invitation/critical service messages, and use a factory-approved provider.

### Observability, recovery, privacy, and export

- `/health` returns status and build SHA. `/metrics` is authenticated at ingress and exposes request count/latency/status, sync conflicts, queue depth/age, and notification failures—never job or customer values.
- JSON logs carry timestamp, level, build SHA, request ID, route template, status, latency, and hashed organization/user correlation. Redact authorization, email, barcode, notes, and query strings.
- Initial service objectives: 99.9% monthly API availability excluding planned maintenance; p95 read <300 ms and write <600 ms; successful sync batches ≥99.5%; zero tenant-isolation incidents. Alert on 5xx >2% for 5 minutes, oldest job >10 minutes, or health failure.
- Production PostgreSQL needs encrypted daily backups and point-in-time recovery with a seven-day window. The operator owns platform configuration; M2 records a restore drill and recovery time. Target RPO 15 minutes and RTO 4 hours. Do not claim these publicly until verified.
- Owners can export the firm's jobs, requirements, sources, allocations, supplier evidence, and audit events as documented CSV/JSON. Account deletion uses a 14-day recoverable hold, then removes tenant rows, push subscriptions, and exports; billing records retain only what law/merchant reporting requires. Demo data is browser-local and resettable.

### AI decision

No runtime AI feature is planned. The core decision must be auditable from allocation and supplier evidence; a model-generated inference would weaken trust and create cost/privacy risk. The Sociobot AI gateway remains the only allowed route if a later validated job (for example, explicit extraction from a supplier document with review and undo) earns a place. Demo and tests would use recorded responses and never spend.

## 4. Design system

`.factory/design.md` is the visual source of truth and `src/lib/design/tokens.css` is its starter token contract. Direction: **exploded-parts blueprint**—an asymmetric service drawing in which required parts align to a job datum and visible leader lines show their source. It explains attribution instead of decorating a generic SaaS page.

### Component set

The canonical 20-component inventory, ownership, variants, states, and accessibility behavior is in `.factory/component-inventory.md`. Builders extend an existing component before inventing a near-duplicate. Every asynchronous component has loading, empty, error, offline, and stale treatment where applicable.

### Five key screens in words

1. **Landing / drawing cover.** A left-aligned, nine-word-or-shorter job headline shares the first screen with an original exploded assembly: job plate at left, required parts floating on ruled baselines, and source tags pulled into alignment. The primary action is **Try it with sample data**, followed by the exact result. Three facts name offline behavior, demo isolation, and price. Below it sits a live compact job preview, three verb-led steps, honest non-goals/privacy, pricing, and the standard footer.
2. **Jobs / promise board.** A dense but breathable phone-first list ordered by visit date and risk, not a dashboard of charts. Each row shows customer/site, date, one promise-status word plus symbol, and the single blocking fact. The desktop adds a narrow filter rail; mobile uses a bottom sheet. Empty state says “Jobs with required parts will appear here” and offers **Add a job**.
3. **Job card / exploded assembly.** The job and visit date form a fixed datum header. Each required-part row connects visually to its allocation source. Selecting a row expands inline rather than opening unrelated cards. A sticky promise plate says exactly why the date is ready, expected, risky, or unchecked. The primary action follows the current gap: **Allocate part**, **Check supplier date**, or **Review visit date**.
4. **Allocate / field sheet.** A full-height phone sheet lists eligible van/warehouse positions and supplier-order lines with quantity, unit, and last-check time. Quantity controls are large, numeric, and reversible. Scanning opens only on explicit press and always offers **Enter barcode instead**. Confirmation names job, part, source, and quantity before writing.
5. **Conflict / two drawings disagree.** The server and device versions appear as two aligned blueprint revisions, not a red modal wall. The shortage or changed field is highlighted by shape, label, and color. For quantities, valid remaining choices are calculated; the user can reduce, choose another source, or leave the job at risk. There is no “keep both” when it would double-spend stock.

### Responsive and accessibility rules

Design at 390 px first. At <720 px the filter rail becomes a sheet, tables become labelled rows, the job datum and primary action remain visible without covering content, and secondary evidence collapses behind a labelled disclosure. At 720–1099 px use a 12-column grid with 24 px gutters; at ≥1100 px cap task content at 1200 px and text at 70 characters. Respect safe-area insets. Nothing requires hover.

Every page has one `<h1>`, a real heading outline, header/nav/main/footer landmarks, a skip link, and a polite route-change announcer. Route changes focus the `<h1>`. Inputs have visible labels and announced errors. Touch targets are at least 44×44 px with 8 px separation. Status always combines wording, icon/shape, and color. Text contrast is ≥4.5:1, UI/focus ≥3:1, zoom to 200% does not lose work, and all flows work with keyboard alone. Motion follows `.factory/design.md` and becomes instant/opacity-only under `prefers-reduced-motion`.

### Route and title contract

| Route | Page title | H1 / purpose |
| --- | --- | --- |
| `/` | `Parts Promise — Hold parts for each job` | `Promise dates from parts held for the job` |
| `/?demo=1` | `Demo — Parts Promise` | Opens seeded job card after one action or directly on reload; demo banner persists. |
| `/jobs` | `Jobs — Parts Promise` | `Jobs and their parts status` |
| `/jobs/:jobId` | `<Job number> parts — Parts Promise` | Job site/name; only one H1. |
| `/suppliers` | `Supplier dates — Parts Promise` | `Supplier dates to check` |
| `/conflicts` | `Sync conflicts — Parts Promise` | `Records that need your choice` |
| `/settings/team` | `Team — Parts Promise` | `People who can update jobs` |
| `/settings/billing` | `Billing — Parts Promise` | `Plan and technician seats` |
| `/settings/data` | `Data controls — Parts Promise` | `Export or delete firm data` |
| `/privacy` | `Privacy — Parts Promise` | `How Parts Promise handles data` |
| `/terms` | `Terms — Parts Promise` | `Terms for using Parts Promise` |
| `/share/:token` | `Job parts update — Parts Promise` | `Current parts update` |
| unknown | `Page not found — Parts Promise` | `This page is not on the drawing` |

All routes support direct load, back/forward, restored scroll, and focus. M1 supplies canonical metadata, 1200×630 original OG art, SVG favicon, 180 px touch icon, `robots.txt`, `sitemap.xml`, and a valid Static Web Apps fallback/404/security-header configuration.

## 5. Milestones

Each milestone is one focused 3–4 hour builder session followed by an independent review and polish pass. “Done” always includes mobile 390 px, keyboard, empty/loading/error/offline states relevant to the work, no serious/critical axe findings, no console errors, claim tests, `npm test`, and `npm run build` producing `dist/`. A builder updates this plan's status and writes `.factory/handoff-mN.md`; the next milestone begins only after review PASS.

### M1 — Local promise check and one-click demo

Status: **released; perfection-loop round 2 passed**. Goal: a stranger can see the wedge and complete the core job locally without an account.

Routes/screens: `/`, `/?demo=1`, `/jobs`, `/jobs/:jobId`, `/privacy`, `/terms`, and designed 404. The landing page follows the mandated standard skeleton. The demo fixture is Riverside Dental job `RD-1042`, visit 2026-09-02, with a warehouse contactor allocation, four filters split between warehouse and van, and one unallocated condensate pump. Allocating the pump from Van 2 changes the job from **Date at risk** to **Parts in hand** and creates a reorder suggestion because the van falls below its minimum.

Scope:

- Implement the route shell, metadata, original blueprint assets, responsive components needed by these screens, both themes, and legal copy.
- Implement local IndexedDB repositories, strict domain types, deterministic promise-status/reorder rules, bundled demo fixture, separate demo database, reset/exit behavior, and live local namespace.
- Let a user add/edit a job and required parts, allocate/deallocate from seeded/manual van or warehouse sources, attach supplier-order ETA evidence, review the visit-date warning, and undo the last allocation.
- Add service-worker shell/fixture caching and a clear offline/stale indicator. Request no camera permission in M1.
- Write `.factory/demo.md` and `.factory/copy-audit.md`. No backend data, account, telemetry, checkout, or fake sync controls.

Claims (the authoritative M1 set is `.factory/claims.json`):

- `promise-status-from-allocation`: the promise status changes from **Date at risk** to **Parts in hand** only after every required quantity has an allocation.
- `allocation-keeps-source`: every allocation records its job, source, quantity, unit, updater, and checked time and restores them after reload.
- `reorder-after-allocation`: consuming Van 2's last spare produces a reviewable reorder suggestion and never places an order.
- `demo-reset-isolated`: demo changes reset to the bundled sample and never appear in the live local workspace.
- `offline-reload`: after one online demo visit, the sample job and allocation flow work through an offline reload.

Tests:

- Vitest shared fixture tests cover all four promise statuses, quantity/unit boundaries, stale evidence, reorder thresholds, and property tests that an allocation never produces negative availability.
- One Playwright test per claim, tagged exactly `@claim:<id>`, using a fresh context and `/?demo=1`; the offline test installs the service worker, goes offline, reloads, and performs an allocation.
- Playwright mobile and desktop smoke tests cover deep links, history/focus, reset, empty/error storage recovery, keyboard allocation, reduced motion, and no cross-origin demo requests.
- Playwright + axe checks all public/app routes; worker verifier checks title/lang/main/alt/console, links, CSP, 404, manifest, and service worker.

M1 DoD:

- All five observable claims pass; `claims.json` and visible copy match one-to-one.
- Initial JS/CSS/font/image budgets pass; Lighthouse mobile is ≥90 performance and ≥95 accessibility, LCP <2.5 s, CLS <0.1, and results are recorded.
- Demo banner, reset, and **Start for real** work; Start for real leaves demo after confirmation and opens an empty live workspace.
- README explains customer, current M1 capability, demo URL, run/test/build, architecture, and deployment. No landing copy implies cloud sync, accounts, scanning, integrations, or working payment.

### M2 — Accounts, team sync, and recurring billing

Status: planned. Goal: a firm can sign up, sync its local work safely, invite paid technicians, and subscribe through Sociobot.

Routes/screens added: `/auth/callback`, `/onboarding`, `/settings/team`, `/settings/billing`; authenticated behavior on `/jobs*`. Demo remains account-free and API-free.

Scope:

- Add Entra CIAM PKCE, API JWT validation, organization/onboarding/membership roles, PostgreSQL migrations/RLS, bootstrap/pull/push sync, idempotency, and audit events.
- Migrate an explicit live-local workspace into a new organization only after showing the item count and receiving confirmation; demo data can never migrate.
- Wire Sociobot test-mode recurring checkout for **Workshop base** plus the exact active technician-seat quantity, entitlement reconciliation, grace behavior, cancellation/refund handling, and billing settings. Verify the API contract first as described above.
- Apply endpoint validation, CORS/security headers, all rate limits, structured logs, `/health`, protected `/metrics`, daily backups, restore drill, and the non-root Docker image.

Claims to append when M2 starts: `entra-sign-in`, `tenant-data-isolation`, `two-device-sync`, `idempotent-sync`, `subscription-checkout`, `technician-seat-charge`, and `expired-plan-keeps-export`. Identity tests use a test-token issuer/harness plus one staging Entra smoke; billing uses Sociobot test mode and recorded webhook fixtures, never a mocked “paid” UI alone.

Tests: Rust route/domain/integration tests with two organizations; JWT audience/tenant/issuer/expiry failures; 100 rps load smoke; 429 + `Retry-After`; migration up/down; two-browser Playwright sync; checkout return and replay; seat increase/decrease; offline cached entitlement; IDOR fuzz cases.

M2 DoD: production callback is registered or listed under operator action; real test-mode checkout completes at the stated recurring prices; server is the entitlement authority; tenant tests pass; backup restore is timed; demo claims from M1 still pass; container boots with only `PORT` and health reports build SHA.

### M3 — Field scanning, supplier watch, and conflict resolution

Status: planned. Goal: complete jobs two and three without hiding uncertain or conflicting evidence.

Routes/screens added: `/scan`, `/suppliers`, `/supplier-orders/:orderId`, `/conflicts`; job card gains fitted/moved actions and conflict badges.

Scope:

- Add explicit camera permission, `BarcodeDetector` progressive enhancement, manual barcode fallback, organization-local part matching, quantity move/fit actions, and no frame retention.
- Add supplier orders/lines, split line-to-job allocations, evidence confidence and staleness, cross-job risk queue, deterministic reorder queue, dismissal reasons, and draft order lines (never auto-purchase).
- Implement full outbox batching/cursors and conflict UI for stale fields, deleted records, and double-spent stock. Preserve safe local reading during outage.

Claims to append: `manual-barcode-fallback`, `scan-finds-local-part`, `camera-frames-not-sent`, `supplier-eta-warns-date`, `stale-evidence-needs-check`, `offline-write-syncs-once`, and `double-allocation-opens-conflict`.

Tests: permission denied/unsupported/success; request log proving no frame upload; shared supplier line split bounds; clock-controlled stale rules; two offline browser contexts allocate the last item then reconnect; ensure one succeeds, one conflicts, no negative stock, and the affected job is at risk.

M3 DoD: jobs two and three work on a 390 px phone with manual fallback; every conflict has a safe next action; no silent last-write-wins for quantities; no automatic order or unsupported availability claim; M1/M2 claims remain green.

### M4 — Operate, export, notify, and erase

Status: planned. Goal: the product can run without routine developer intervention and firms control their data.

Routes/screens added: `/settings/data`, `/settings/notifications`, `/operations` (factory/operator role only). Existing team screen gains membership deactivation and seat reconciliation.

Scope:

- Stream organization export as CSV plus JSON manifest; add deletion request/cancel/execute flow and retention records.
- Add opt-in in-app/browser reminders for stale evidence and approaching risky visits, persisted VAPID secret generated on first boot when needed, quiet hours, retries, and unsubscribe. No marketing email.
- Add operator health view for aggregate queue/latency/error state, dead-letter retry with audit, build/version, and no tenant content; finish SLO alerts/runbook, backup automation evidence, and restore practice.

Claims to append: `complete-data-export`, `export-works-when-unpaid`, `deletion-hold-and-cancel`, `notifications-opt-in`, `quiet-hours`, and `operations-hides-tenant-content`.

Tests: export row counts/relations and formula-injection escaping; deletion clock and billing separation; push permission denial/retry/unsubscribe; role authorization; dead-letter retry idempotency; restore drill documentation and metrics redaction snapshot.

M4 DoD: owner can export without support, cancel deletion during the 14-day hold, and verify completion; notifications are off by default; an operator can detect and retry failures without seeing customer/job details; SLO/runbook and legal pages match behavior.

### M5 — Install, share, and import without replacing the scheduler

Status: planned. Goal: lower adoption friction around the narrow wedge without growing into a field-service suite.

Routes/screens added: `/import`, `/settings/integrations`, `/share/:token`; install guidance appears contextually, never as a blocking prompt.

Scope:

- Meet installable PWA criteria, supply offline icons/screenshots, update handling, and platform-specific install help.
- Extend the shipped neutral CSV import with field mapping, duplicate review, error download, and full rollback. Provide downloadable templates for Jobber/Tradify exports without claiming an official integration.
- Create revocable, expiring, read-only job update links. Default share fields are job number/site label, visit date, plain promise status, blocking part name, and last updated time; exclude customer contact, internal notes, quantities at other jobs, and source locations.
- Define a versioned inbound API/webhook contract only after pilot demand; no supplier scraping.

Claims to append: `pwa-installable`, `offline-update-safe`, `csv-import-preview-rollback`, `csv-duplicate-detection`, `share-link-expiry-revoke`, and `share-excludes-private-fields`.

Tests: browser installability audit; old/new service worker upgrade with queued writes; hostile/large CSV and rollback; deterministic duplicate imports; share token hash/expiry/revoke/rate limits; crawler validates all public links and metadata.

M5 DoD: the PWA installs and upgrades without losing queued work; a pilot can import a representative export and undo it; share links reveal only their documented allowlist and can be revoked; landing/catalog copy reflects only shipped capability; all prior claims pass.

## 6. Risks, unknowns, and retiring experiments

| Risk / unknown | Earliest experiment and pass condition | Owner / deadline |
| --- | --- | --- |
| The evidence indicates pain but not willingness to pay. | Before M2, run five 30-minute workflow interviews using an M1 job. Pass if ≥3 firms provide a recent duplicate/promise failure, complete the flow unprompted, and agree to a $39 + seats pilot. | Product, before M2 review. |
| “Expected before visit” could be read as a guarantee. | Test four status labels with five trade owners. Pass if all distinguish in-hand from supplier evidence and can name the blocking fact in under 10 seconds. Otherwise weaken wording. | Design, M1 polish. |
| Offline concurrency may double-spend the last part. | Model/property tests plus two-device Playwright race. Pass only if accepted allocations never exceed evidence and the rejected device gets an actionable conflict. | Engineering, M3. |
| IndexedDB/service-worker eviction can lose unsynced work. | Storage-pressure/upgrade test on Chromium and two real iOS/Android devices; request persistent storage after demonstrated use and always show sync state. Pass with no loss across app update and explicit recovery copy for eviction. | Engineering, M1/M3. |
| Camera/barcode APIs differ by device. | Test permission denied, no `BarcodeDetector`, poor light, and manual input on current iOS Safari/Android Chrome. Manual entry must complete the same job every time. | Engineering, M3. |
| Supplier catalog/ETA licensing blocks connectors. | Start with person-entered evidence and neutral CSV. No connector enters scope without a written license and API quota/error review. | Product/legal, before any connector. |
| Sociobot's documented paid-unlock flow is one-time while this product needs recurring base + seat quantities. | Register a test recurring product and complete create, return, verify/event, seat change, cancel, and refund before implementing M2 UI. Pass only when amounts and entitlement events are machine-verifiable. Never fall back to direct Dodo. | Operator + M2 builder, first M2 task. |
| Entra callback may not be registered. | Validate discovery and perform one staging redirect to the exact production callback. Record registration as operator action until confirmed. | Operator, before M2 acceptance. |
| Seat counting may surprise owner-technicians. | Prototype billing summary with five firms. It must show owner excluded, active technicians named, next invoice delta, and effective date before confirmation. | Product, M2 polish. |
| Cross-tenant IDOR or sensitive logs would be severe. | Automated two-tenant matrix for every route and redaction snapshot tests. Zero unauthorized 2xx and zero prohibited values in logs are release gates. | Security, every backend milestone. |
| Units and regional dates could cause wrong quantities/dates. | Test locale/date rendering and mixed-unit fixtures; forbid implicit conversion. Pilot firms must configure locale/time zone during onboarding. | Engineering, M2. |
| Reorder suggestions may create alert fatigue. | Instrument suggestion viewed/dismissed/acted with no item details. Pass if ≥30% are acted on and <40% repeatedly dismissed; otherwise adjust per-source minimums and cadence. | Product, M3 pilot. |
| Backup claims may exceed actual platform configuration. | Restore a production-like encrypted backup into an isolated environment and record measured RPO/RTO. Do not publish recovery numbers before the drill. | Operations, M2/M4. |

## 7. Planning decisions and operator actions

- No runtime AI. Manual/supplier evidence is the trustworthy product input.
- The design is original hand-authored vector work; no stock art or runtime font/image CDN.
- The M1 demo is fully local and isolated. It proves product claims without accounts, network, or paid services.
- Before M2 acceptance, the operator must register the Entra redirect URI and the Sociobot recurring product with the exact Workshop base and Technician seat prices, then provide/confirm the recurring seat contract exposed by Sociobot.
- Builders must not touch deployment, DNS, or billing infrastructure from this repository.
