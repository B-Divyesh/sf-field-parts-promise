# First-read review 5 — Parts Promise

Work order: `field-parts-promise-review-5`

Reviewed: 2026-09-01 UTC

Repository HEAD: `c03dff99017567d07abdccebc7d0c4b63b97d53d`

Live build from `/health`: `25ca773effc757331984d025c9b842d16c1a582a`

The commits after the live build contain verification documentation and
artifacts only. Product source is identical.

## Verdict

**FAIL — 1 blocking, 6 high, 7 medium, and 3 minor findings remain.**

The cold first screen is clear, the sample works in one click, all 31 declared
claim commands pass from a clean clone, and the core route and accessibility
checks pass. The review still fails. An earlier terminology finding has
returned, public payment and privacy statements are not represented in the
claim registry, several deployment statements have no exact registered claim,
two README sentences exceed 22 words, and several public labels are unclear.

## Cold first read

Fresh Chromium contexts opened the production home page without scrolling at
390 × 844 and 1440 × 900.

- What it does: it assigns required parts to a job before the firm agrees a
  visit date.
- For whom: small trade firms whose visit dates depend on parts.
- What to click first: **Try it with sample data**. The adjacent result says,
  “Opens Riverside Dental with one missing pump.”

All three answers are visible before scrolling at both sizes. The 390 px first
screen also shows the offline, sample-storage, and price facts. It has no
horizontal overflow, console error, or page error. Evidence:

- `qa-artifacts/review-5/first-read-mobile.png`
- `qa-artifacts/review-5/first-read-desktop.png`
- `qa-artifacts/review-5/first-read.json`

## Findings

### Blocking

#### F-3-6 — Browser-storage terminology has regressed

- Earlier finding: review 3 required one plain term for the browser store.
- Exact locations: README lines 11, 15, and 44; live `/privacy`.
- Exact quotes: “browser database,” “IndexedDB outbox,” “Local and demo records
  use IndexedDB,” and “stored in IndexedDB on this browser.”
- Confirmation: both the current README and live privacy page use the plain
  term and the implementation term for the same kind of browser storage.
- Why this fails: a reader must decide whether these are different stores or
  two names for one storage mechanism. The earlier finding is therefore
  regressed and is blocking under this review's history rule.
- Concrete fix: use **browser database** in reader-facing copy. Put exact
  database names and the IndexedDB implementation in one clearly labelled
  developer architecture note.

### High

#### F-5-1 — Payment-provider and refund statements are unlisted claims

- Exact locations and quotes:
  - landing, “Sociobot and Dodo handle payment.”
  - `/privacy`, “Sociobot and Dodo handle checkout.”
  - `/terms`, “Sociobot/Dodo is the merchant of record and handles refunds.”
- Confirmation: `.factory/claims.json` checks only the current pre-charge stop
  and explanatory response. It has no claim that confirms the active merchant,
  completed payment path, or refund handling. The passing checkout check ends
  with HTTP 424 before any checkout request.
- Why this fails: a visitor could rely on these statements when deciding who
  receives payment and handles a refund, but the clean claim run cannot confirm
  them.
- Concrete fix: remove these statements while checkout is unavailable. If they
  become true, add separate registered claims with recorded gateway fixtures
  for merchant identity, checkout completion, and refund routing.

#### F-5-2 — The privacy page makes an unlisted sensitive-data claim

- Exact location: `/privacy`; `src/App.svelte:2075`.
- Exact quote: “Parts Promise stores no password or payment-card number.”
- Confirmation: no `.factory/claims.json` entry checks browser storage, SQLite
  fields, request bodies, and logs for those two data classes.
- Why this fails: this is a privacy promise that a firm may rely on.
- Concrete fix: add a dedicated claim and inspect browser storage, the SQLite
  schema, request bodies, and application logs during sign-in and billing.
  Otherwise narrow the sentence to the behavior that is already confirmed.

#### F-5-3 — A release-wide feature boundary is covered only for demo mode

- Exact locations: landing “What this release does not do,”
  `src/App.svelte:1553-1556`; `/terms`, `src/App.svelte:2111-2112`.
- Exact quotes: “It does not scan barcodes or place supplier orders” and
  “Barcode scanning and supplier-order actions are not included yet.”
- Confirmation: `demo-feature-boundaries` checks these absences only at the
  demo entry point. Its registered claim is explicitly limited to the demo.
- Why this fails: the Terms sentence describes the whole release, which is
  broader than the registered check.
- Concrete fix: either add a release-wide route and action check, or rewrite it
  as “The demo does not scan barcodes or place supplier orders.”

#### F-5-4 — README deployment statements are outside the registered runtime claim

- Exact location: README lines 48, 52, and 54.
- Exact claims not stated in `container-runtime`:
  - all server state and the metrics token live in two named files under
    `/data`;
  - production has one replica and a durable mount;
  - SQLite uses one connection, `unix-none`, and a rollback journal for the
    stated Azure Files reason;
  - a machine without `/data` uses a directory beside the executable;
  - `deploy.json` sets the durable directory and replica count;
  - seven named environment variables are optional overrides.
- Confirmation: some facts have ordinary unit coverage, but the required exact
  commands in `.factory/claims.json` do not register these public README
  statements. The `container-runtime` entry names startup, build identity,
  compiled assets, rate limiting, and 404 behavior only.
- Why this fails: operators may rely on these storage and deployment details.
  Ordinary unregistered checks do not satisfy the public claim contract.
- Concrete fix: split the statements into one or more precise claim entries
  with tagged clean-environment checks, or move implementation detail to a
  clearly non-promissory developer note and retain only the registered runtime
  behavior.

#### F-5-5 — The README says the claim registry is complete when it is not

- Exact location: README line 40.
- Exact quote: “Each visitor-facing claim and its clean-sandbox command is
  listed in `.factory/claims.json`.”
- Confirmation: F-5-1 through F-5-4 identify public statements not named by the
  registry.
- Why this fails: the sentence tells reviewers and maintainers that no further
  cross-check is needed.
- Concrete fix: first register or remove every statement above. Until then,
  rewrite this as “Registered product claims and their commands are listed in
  `.factory/claims.json`.”

#### F-5-16 — The Terms page has an unlisted checkout-trigger claim

- Exact location: `/terms`; `src/App.svelte:2121`.
- Exact quote: “Checkout begins only after you press its button.”
- Confirmation: `subscription-checkout` calls the checkout endpoint directly.
  It does not check the signed-in billing page for automatic checkout requests
  before and after the button action.
- Why this fails: the sentence promises that checkout is always user-initiated,
  but the registered check confirms only the current HTTP 424 stop.
- Concrete fix: add a browser request-log claim that confirms no checkout call
  occurs before the explicit button action, or remove the sentence while
  checkout remains unavailable.

### Medium

#### F-5-6 — One README sentence exceeds the 22-word limit

- Exact location: README line 48.
- Exact quote, 23 words: “All server state, including the tenant workspace,
  rate-limit buckets, and generated metrics credential, is stored in
  `parts-promise.sqlite3` and a token file under `/data`.”
- Why this fails: the reader must hold the scope, three examples, two files,
  and one path in a single sentence.
- Concrete rewrite: “All server state is stored under `/data`. The SQLite file
  contains workspaces and rate-limit records. A separate token file protects
  metrics access.”

#### F-5-7 — A second README sentence exceeds the 22-word limit

- Exact location: README line 48.
- Exact quote, 27 words: “On a developer machine with no `/data` mount, the
  server falls back to a `data` directory beside its executable so it can still
  start with only `PORT`.”
- Why this fails: the condition, fallback location, and startup behavior are
  compressed into one long sentence.
- Concrete rewrite: “Without `/data`, the server uses a `data` directory beside
  its executable. It still starts when `PORT` is the only setting.”

#### F-5-8 — Billing availability uses internal release jargon

- Exact locations: landing pricing section and README line 19.
- Exact quotes: “Checkout stays off until a product operator verifies its
  recurring plan registration,” “Billing acceptance is explicitly
  operator-gated,” and the sentence that describes an “approved billing
  gateway” plus HTTP 424.
- Why this fails: a prospective customer needs to know whether checkout works,
  not the internal registration state or response code.
- Concrete rewrite for public copy: “Checkout is not available yet. No charge
  will start.” Keep HTTP 424 and setup details in an operator note.

#### F-5-9 — “Workshop” is an unexplained plan name

- Exact locations: first-screen price fact, landing pricing heading and body,
  README line 17, billing metadata, and Terms.
- Exact examples: “Workshop is $39/month…” and “Pay for the workshop and active
  technicians.”
- Why this fails: “Workshop” does not describe the plan and reads like a themed
  label. A first-time visitor must infer that it means the firm plan.
- Concrete rewrite: use **Firm plan** everywhere: “The firm plan costs $39 per
  month, plus $8 per active technician.”

#### F-5-10 — The Terms price sentence leaves the owner's billing role unclear

- Exact location: `/terms`; `src/App.svelte:2116-2117`.
- Exact quote: “The owner is included.”
- Why this fails: the sentence does not say whether the owner is included in
  the base price, included in the technician count, or included as a free seat.
- Concrete rewrite: “The owner is included in the $39 base price and does not
  count as a technician seat.”

#### F-5-11 — The page title changes the product's action term

- Exact locations: home title, route announcement, and Open Graph/Twitter title.
- Exact quote: “Parts Promise — Hold parts for each job.”
- Confirmation: the landing label and workflow use **allocate**; the title uses
  **hold** for the same action.
- Why this fails: the terminology rule requires one word for one action.
- Concrete rewrite: “Parts Promise — Allocate parts to each job.”

#### F-5-12 — The brief-implied barcode path is still absent from the paid firm offer

- Exact location: landing “What this release does not do” and `/terms`.
- Confirmation: the interface provides manual source entry but no barcode
  action. The brief's smallest useful product names scan or manual allocation.
- Why this matters: a technician handling labelled stock would reasonably
  expect to scan a part rather than type its details, especially in the paid
  multi-person plan now shown on the landing page.
- Concrete feature: add **Scan a part** beside manual source entry, ask for
  camera permission only after that action, keep **Enter barcode instead**, and
  register camera/privacy and allocation-result claims. This does not need AI.

### Minor

#### F-5-13 — The footer has no version or build identifier

- Exact location: every app route footer; `src/App.svelte:2521`.
- Exact quote: “Account workspace release.”
- Why this fails: it is a vague release label and does not satisfy the required
  version/build identifier.
- Concrete fix: show a short immutable build value, for example “Build
  25ca773,” and expose the full value from `/health` or build-time metadata.

#### F-5-14 — The external footer link is not announced as external

- Exact location: every app route footer; `src/App.svelte:2519`.
- Exact quote: “Built by Param Factory.”
- Confirmation: `rel="external"` is present, but it is not visible or included
  in the accessible name.
- Why this fails: a user is not told that the link leaves Parts Promise.
- Concrete rewrite: “Built by Param Factory (external site).”

#### F-5-15 — The public registry-completeness sentence uses internal jargon

- Exact location: README line 40.
- Exact quote: “Each visitor-facing claim and its clean-sandbox command is
  listed in `.factory/claims.json`.”
- Why this fails: “clean-sandbox command” is internal process language in the
  main product explanation.
- Concrete rewrite: put it under a developer-only **Claim checks** heading:
  “See `.factory/claims.json` for registered claim checks.”

## Complete copy audit

Counts split on whitespace and treat hyphenated terms, prices, paths, and URLs
as one word. Code blocks contain commands rather than sentences. Headings,
labels, actions, alternative text, and fragments are included so unclear copy
is not hidden outside punctuated prose.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass: destination-naming action |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation destination |
| Jobs | 1 | Pass: navigation destination |
| Team | 1 | Pass: signed-in navigation destination |
| Privacy | 1 | Pass: navigation destination |
| Sign in | 2 | Pass: result-naming action |
| Sign out [account name] | 4 | Pass: result-naming signed-in action |
| Checking sign-in… | 2 | Pass: transient status |
| Use dark theme | 3 | Pass: result-naming action |
| Use light theme | 3 | Pass: result-naming action |
| Parts Promise — Hold parts for each job | 7 | Flag: F-5-11 |
| Allocate parts to a job | 5 | Pass: task label |
| Promise dates from parts held for the job | 8 | Pass: job-first H1 |
| For small trade firms that need a parts check before agreeing a visit date. | 14 | Pass: audience and outcome |
| Try it with sample data | 5 | Pass: result-naming action |
| Opens Riverside Dental with one missing pump. | 7 | Pass: `sample-fixture` |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated`, `demo-network-privacy` |
| Workshop is $39/month plus $8 per active technician. | 8 | Flag: F-5-9 |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: useful image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: `allocation-keeps-source` |
| Sample job status | 3 | Pass: section name |
| See why a visit date is at risk | 9 | Pass: useful heading |
| RD-1042 needs one condensate pump. | 5 | Pass: `sample-fixture` |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: result-naming action |
| RD-1042 · Riverside Dental | 3 | Pass: sample identity |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass: `sample-fixture` |
| How it works | 3 | Pass: section name |
| Check parts before agreeing a visit date | 8 | Pass: process heading |
| List required parts | 3 | Pass: step heading |
| Add each required part to the job. | 7 | Pass: `local-workspace-flow` |
| Allocate each part | 3 | Pass: step heading |
| Allocate it from a van or warehouse source. | 8 | Pass: `local-workspace-flow` |
| Review the visit date | 4 | Pass: step heading |
| Read the reason before you agree the visit date. | 9 | Pass: `local-workspace-flow` |
| What this release does not do | 7 | Pass: section name |
| It does not scan barcodes or place supplier orders. | 9 | Flag: F-5-3 because the section describes the release, not only the demo |
| The sample stays separate from signed-in firm workspaces. | 8 | Pass: `demo-feature-boundaries`, `demo-transfer-isolated` |
| Read how local data works | 5 | Pass: result-naming action |
| Firm plan | 2 | Pass: section label |
| Pay for the workshop and active technicians | 7 | Flag: F-5-9 |
| Workshop costs $39 each month. | 5 | Flag: F-5-9 |
| Each active technician costs $8 each month. | 7 | Pass: `technician-seat-charge` |
| The owner does not use a technician seat. | 8 | Pass: `technician-seat-charge` |
| Sociobot and Dodo handle payment. | 5 | Flag: F-5-1 |
| Checkout stays off until a product operator verifies its recurring plan registration. | 12 | Flag: F-5-8; claim result passes |
| Set up your firm | 4 | Pass: result-naming action |
| Promise job dates from parts held for the job. | 8 | Pass: footer description |
| Privacy | 1 | Pass: footer destination |
| Terms | 1 | Pass: footer destination |
| Built by Param Factory | 4 | Flag: F-5-14 |
| Account workspace release | 3 | Flag: F-5-13 |

The 55 landing units average 5.5 words. No landing unit exceeds 22 words, and
no banned marketing adjective appears.

### README

| # | Copy | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Parts Promise | 2 | Pass: product name |
| 2 | Parts Promise helps small trade firms promise job dates from parts held for each job. | 15 | Pass: purpose and audience |
| 3 | A solo user can work locally. | 6 | Pass: `local-workspace-flow` |
| 4 | A signed-in firm can share one workspace across devices. | 9 | Pass: `two-device-sync` |
| 5 | Try it with sample data | 5 | Pass: useful heading |
| 6 | Open `/?demo=1`, or <http://127.0.0.1:4173/?demo=1> during development. | 6 | Pass: instruction |
| 7 | The sample opens Riverside Dental job `RD-1042` with one missing condensate pump. | 12 | Pass: `sample-fixture` |
| 8 | Allocate the pump from Van 2. | 6 | Pass: instruction |
| 9 | The status changes from Date at risk to Parts in hand. | 11 | Pass: `promise-status-from-allocation` |
| 10 | Van 2 then has no spare pumps, so the app suggests a reorder. | 13 | Pass: `reorder-after-allocation` |
| 11 | It never places an order. | 5 | Pass: `reorder-after-allocation` |
| 12 | The demo uses the separate `parts-promise-demo-v1` browser database. | 8 | Flag: F-3-6 terminology set |
| 13 | It never signs in or contacts the account, sync, or billing API. | 12 | Pass: demo request and feature claims |
| 14 | Reset demo restores the sample. | 5 | Pass: `demo-reset-isolated` |
| 15 | Start for real deletes demo changes and opens the unchanged local workspace. | 12 | Pass: `demo-reset-isolated` |
| 16 | Accounts, sync, and billing | 4 | Pass: section heading |
| 17 | Sign-in uses the Sociobot Microsoft Entra tenant. | 7 | Pass: `entra-sign-in` |
| 18 | A saved firm workspace appears on another signed-in device. | 9 | Pass: `two-device-sync` |
| 19 | Repeated sync requests with the same operation ID apply once. | 10 | Pass: `idempotent-sync` |
| 20 | Offline signed-in edits stay in the `parts-promise-cloud-v1` IndexedDB outbox. | 9 | Flag: F-3-6 |
| 21 | They retry after reconnect and back off after a temporary failure. | 11 | Pass: `offline-signed-in-sync` |
| 22 | Owners can record invitations by work email. | 7 | Pass: `invitation-email-activation` |
| 23 | The invitation becomes active when that email signs in. | 9 | Pass: `invitation-email-activation` |
| 24 | Technicians count as $8 monthly seats; the owner does not. | 10 | Pass: `technician-seat-charge` |
| 25 | The Workshop base is $39 per month. | 7 | Flag: F-5-9 |
| 26 | Billing acceptance is explicitly operator-gated. | 5 | Flag: F-5-8 |
| 27 | Until the recurring product is registered in the approved billing gateway, the billing screen returns HTTP 424 and never starts a charge. | 22 | Flag: F-5-8 |
| 28 | Existing cloud records and export remain available when a recorded plan is unpaid; new cloud writes stop. | 17 | Pass: `expired-plan-keeps-export` |
| 29 | Run and verify | 3 | Pass: heading |
| 30 | Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass: developer requirement |
| 31 | Run the complete local suite: | 5 | Pass: instruction |
| 32 | `npm run build` writes the web app to `dist/` and builds the release server. | 14 | Pass: confirmed build result |
| 33 | Each visitor-facing claim and its clean-sandbox command is listed in `.factory/claims.json`. | 11 | Flag: F-5-5, F-5-15 |
| 34 | Data and API | 3 | Pass: heading |
| 35 | Local and demo records use IndexedDB. | 6 | Flag: F-3-6 |
| 36 | Export workspace downloads a versioned JSON backup. | 7 | Pass: `workspace-backup-roundtrip` |
| 37 | Import workspace previews JSON or CSV and reports invalid rows before saving. | 12 | Pass: import claims |
| 38 | The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. | 12 | Pass: authentication and response-policy claims |
| 39 | It validates Entra issuer, audience, tenant, signature, and token time. | 10 | Pass: `entra-sign-in` |
| 40 | Requests derive the firm from the signed-in user's stable Entra object ID. | 12 | Pass: `tenant-data-isolation` |
| 41 | Read, write, account, and payment paths use a persisted rate-limit bucket and return a positive `Retry-After` header when exceeded. | 19 | Pass: `response-policy`, `container-runtime` |
| 42 | Export uses the five-request critical bucket. | 6 | Pass: `response-policy` |
| 43 | All server state, including the tenant workspace, rate-limit buckets, and generated metrics credential, is stored in `parts-promise.sqlite3` and a token file under `/data`. | 23 | Flags: F-5-4, F-5-6 |
| 44 | The deployed app has one replica and a durable `/data` mount. | 11 | Flag: F-5-4 |
| 45 | Its one-connection SQLite setup uses the `unix-none` VFS with the rollback journal because Azure Files does not provide SQLite's byte-range locks reliably. | 22 | Flag: F-5-4; technical detail needs an exact registered check |
| 46 | On a developer machine with no `/data` mount, the server falls back to a `data` directory beside its executable so it can still start with only `PORT`. | 27 | Flags: F-5-4, F-5-7 |
| 47 | Deployment configuration | 2 | Pass: heading |
| 48 | The multi-stage image runs as a non-root user and listens on `PORT` (default `8080`). | 14 | Pass: `container-runtime` checks both facts |
| 49 | Build identity comes from `BUILD_SHA`. | 5 | Pass: `container-runtime` |
| 50 | Its deployment contract is `deploy.json`: `/data` is the durable data directory and the replica count is one. | 17 | Flag: F-5-4 |
| 51 | Optional overrides are `ENTRA_TENANT_ID`, `ENTRA_TENANT_SUBDOMAIN`, `ENTRA_CLIENT_ID`, `METRICS_TOKEN`, `DATA_DIR`, `SOCIOBOT_BILLING_BASE_URL`, and `SOCIOBOT_BILLING_ACCEPTANCE`. | 11 | Flag: F-5-4 |
| 52 | No override is required to start. | 6 | Pass: `container-runtime` starts with only `PORT` |
| 53 | Privacy and legal | 3 | Pass: heading |
| 54 | The demo sends only same-origin GET requests and never asks for camera access. | 13 | Pass: `demo-network-privacy` |
| 55 | Account data is sent only to this product API and Microsoft during sign-in. | 13 | Pass: `account-service-boundaries` |
| 56 | See `/privacy` and `/terms` in the app. | 7 | Pass: verified routes |
| 57 | License | 1 | Pass: heading |
| 58 | MIT © 2026 Sociobot (Param Factory). | 6 | Pass: license reference |

The 58 README units average 9.7 words. F-5-6 and F-5-7 are the two hard-cap
failures.

The catalog description is 51 characters, begins with a verb, and uses plain
words: “Check required parts before promising a visit date.”

## Demo and sandbox confirmation

- Confirmed that one click from `/` opens `/?demo=1`.
- Confirmed that the first 390 px sample screen already shows Riverside Dental,
  `RD-1042`, the Sep 2 visit, **Date at risk**, three real-looking parts, and the
  missing condensate pump.
- Confirmed the banner says “Demo — sample data; nothing is saved to your local
  workspace,” with **Reset demo** and **Start for real**.
- Confirmed that allocating one pump from Van 2 changes the status to **Parts in
  hand** and shows a reorder suggestion without placing an order.
- Confirmed that Reset restores **Date at risk** and the one-unit shortage.
- Confirmed from fresh direct `/demo` and `/?demo=1` contexts that only
  `parts-promise-demo-v1` is created. The sample flow sends only same-origin
  GET/HEAD requests and does not request camera access.
- Confirmed through `demo-reset-isolated` and `demo-transfer-isolated` that
  populated live records remain unchanged across reset, import/export, wordmark
  exit, Back, and confirmed exit.

Evidence:

- `qa-artifacts/review-5/demo-first-screen-mobile.png`
- `qa-artifacts/review-5/demo-live.json`
- `qa-artifacts/review-5/demo-direct.json`

## Declared claim results

The repository was cloned without shared working files to
`/tmp/field-parts-promise-review-5-Wt5Q79`. After `npm ci`, every exact `test`
command in `.factory/claims.json` ran separately.

| Claim ID | Result | Confirmed outcome |
| --- | --- | --- |
| `sample-fixture` | PASS | Riverside Dental, RD-1042, the pump, zero held, and one missing unit are present. |
| `promise-status-from-allocation` | PASS | Date at risk changes to Parts in hand after allocation. |
| `allocation-keeps-source` | PASS | All six displayed allocation fields remain after reload. |
| `supplier-quantity-conserved` | PASS | One supplier unit cannot cover two jobs. |
| `reorder-after-allocation` | PASS | The last van unit creates only a reorder suggestion. |
| `demo-reset-isolated` | PASS | Reset and exits discard sample changes and preserve live records. |
| `offline-reload` | PASS | The cached sample reloads and accepts allocation offline. |
| `local-workspace-flow` | PASS | Create, source, allocate, undo, supplier evidence, and review work. |
| `demo-feature-boundaries` | PASS | The sample exposes no account, sync, scan, order, or payment action. |
| `indexeddb-local-storage` | PASS | Records appear in the named browser databases. |
| `demo-network-privacy` | PASS | Sample requests stay same-origin and camera is not requested. |
| `clear-local-records` | PASS | Browser data clearing removes the local job. |
| `workspace-backup-roundtrip` | PASS | JSON export and restore preserve all records and timestamps. |
| `csv-import-validation` | PASS | Valid rows import and an invalid quantity blocks saving with its row number. |
| `demo-transfer-isolated` | PASS | Sample transfers do not change the live workspace. |
| `csv-template-download` | PASS | The named CSV template has the expected type, header, records, and valid preview. |
| `entra-sign-in` | PASS | The configured tenant is used and invalid or expired tokens are rejected. |
| `tenant-data-isolation` | PASS | One firm cannot read another firm's workspace. |
| `two-device-sync` | PASS | A saved firm workspace appears in a second context. |
| `idempotent-sync` | PASS | Repeating one operation changes the shared version once. |
| `offline-signed-in-sync` | PASS | The device queue survives reload and retries after reconnect. |
| `sync-conflict-resolution` | PASS | A stale quantity opens a choice and cannot overwrite shared evidence. |
| `invitation-email-activation` | PASS | Only the matching verified email activates the invitation. |
| `account-service-boundaries` | PASS | Firm data uses this API and sign-in uses the configured Microsoft tenant. |
| `audit-log-recording` | PASS | Onboarding, invitation, and sync events appear in the firm export. |
| `firm-deletion-hold` | PASS | An owner can schedule and cancel the 14-day hold. |
| `response-policy` | PASS | The five-request export limit and named operations metrics are present. |
| `subscription-checkout` | PASS | Unavailable checkout returns HTTP 424 before a checkout request. |
| `technician-seat-charge` | PASS | Price copy matches one technician seat and excludes the owner from that count. |
| `expired-plan-keeps-export` | PASS | Existing data exports while unpaid cloud writes are blocked. |
| `container-runtime` | PASS | The compiled server starts with `PORT`, serves its identity/app, limits requests, and returns 404 for an unknown path. |

Result: **31/31 declared commands pass.** The claim gate still fails overall
because F-5-1 through F-5-5 and F-5-16 identify public statements outside the
manifest.

## Earlier finding confirmation

Every earlier review, all three polish reports, and the current handoff were
read. Each numbered finding was checked against the deployed site and current
source.

| Earlier ID | Current result | Live and source confirmation |
| --- | --- | --- |
| F-1-1 | Fixed | Forward, Back, and deep links focus the destination H1. |
| F-1-2 | Fixed | Team workspaces and two-device sync now serve the stated firm audience. |
| F-1-3 | Fixed | Offline copy remains limited to the checked sample flow. |
| F-1-4 | Fixed | Exit copy says live records reopen unchanged; the isolation claim passes with a populated live workspace. |
| F-1-5 | Fixed | Each checked route has one route-correct metadata set. |
| F-1-6 | Fixed | `/demo` has its own title/canonical and appears in the sitemap. |
| F-1-7 | Fixed | Exact base and technician prices are visible. |
| F-1-8 | Fixed | “Allocate parts to a job” remains useful. |
| F-1-9 | Fixed | The hero caption names source records. |
| F-1-10 | Fixed | “Sample job status” remains. |
| F-1-11 | Fixed | The heading names the visit date risk. |
| F-1-12 | Fixed | “How it works” remains. |
| F-1-13 | Fixed | The heading names checking parts before the visit date. |
| F-1-14 | Fixed | “List required parts” remains. |
| F-1-15 | Fixed at its reported location | The landing step still says “Allocate each part.” F-5-11 covers a separate title inconsistency. |
| F-1-16 | Fixed | “Review the visit date” remains. |
| F-1-17 | Fixed | Theme controls name the resulting theme. |
| F-1-18 | Fixed | README names the sample-data action. |
| F-1-19 | Fixed for its original wording | No public M1 label or claim ID appears. F-5-13 covers a new footer issue. |
| F-1-20 | Fixed | The live 404 uses plain copy and recovery links. |
| F-1-21 | Fixed | Demo headings name the sample job and part sources. |
| F-2-1 | Fixed | Wordmark, Back, reset, and confirmed exit clear sample changes. |
| F-2-2 | Fixed | CSV import and JSON backup/restore are available and mode-isolated. |
| F-2-3 | Fixed | Missing jobs receive 404 metadata and `noindex`. |
| F-2-4 | Fixed | Work sheets announce expansion, receive heading focus, and restore trigger focus. |
| F-3-1 | Fixed | Back restores scroll position and focuses the page H1. |
| F-3-2 | Fixed | The sample fixture has a registered exact check. |
| F-3-3 | Fixed | Backup restoration and sample/live separation are compared in full. |
| F-3-4 | Fixed | The CSV template download and preview are checked. |
| F-3-5 | Fixed | The banner names the local-workspace boundary. |
| F-3-6 | **Regressed — BLOCKING** | README and live privacy copy again alternate between “browser database” and “IndexedDB.” |
| F7-01 | Fixed | The full browser suite confirms 44 px phone targets and grouped spacing. |

The earlier unnumbered checks also remain fixed: the deployed build identity
matches the current product source, cache headers are appropriate, the app uses
its own SQLite deployment contract, and the mobile cards use their available
width.

## Structure, accessibility, privacy, and delivery

| Check | Result |
| --- | --- |
| Titles | PASS: home follows the product-plus-job pattern; Demo, Jobs, onboarding, settings, Privacy, Terms, and 404 use route titles under 60 characters. |
| One H1 and landmarks | PASS on all ten checked routes; `lang=en`, skip link, header, navigation, main, and footer are present. |
| Metadata | PASS: each route has one description, canonical, Open Graph title, and Twitter title; favicon, touch icon, and 1200 × 630 social image exist. |
| Routing | PASS: direct loads, reload, forward navigation, Back, H1 focus, route announcement, and scroll restoration work. |
| 404 | PASS: an unknown URL returns HTTP 404 with the designed product shell and jobs/home recovery. |
| Internal links | PASS: every same-origin link discovered on the checked pages returns its expected document status. |
| External link disclosure | FAIL: F-5-14. The outside destination was not contacted because the work order limits network scope. |
| Header/footer | FAIL: navigation is consistent, but F-5-13 identifies the missing version/build value. |
| Sitemap/robots | PASS: all stable public routes are listed and robots points to the sitemap. |
| Accessibility | PASS: the live Axe check found zero serious/critical issues on ten routes. The factory URL check found one H1, one main, complete image alternatives, named buttons, and no normal-route console errors. |
| Keyboard/mobile | PASS: the full suite confirms keyboard allocation, dialog focus, work-sheet focus, 44 px targets, 390 px layout, 200% text behavior, and reduced motion. |
| Demo privacy | PASS: direct demo contexts create only the demo database and issue same-origin read requests without camera access. |
| Public claim completeness | FAIL: F-5-1 through F-5-5 and F-5-16. |
| Visual identity | PASS: the exploded-parts drawing, condensed technical labels, ruled paper, source lines, and safety-orange marks are specific to this product. |
| Bundle/build | PASS: `dist/` builds. Main JS is 38.25 kB gzip, deferred account JS is 62.19 kB gzip, and CSS is 4.19 kB gzip. |

The unknown-route check produces Chromium's expected failed-resource entry for
the intentional HTTP 404. Normal routes have no console or page errors.

Evidence:

- `qa-artifacts/review-5/live-structure.json`
- `qa-artifacts/review-5/verify-home/verify.json`
- `qa-artifacts/review-5/verify-demo/verify.json`

## Local verification

- Confirmed `npm test`: 21 Vitest checks and 14 Rust checks passed.
- Confirmed every exact command in `.factory/claims.json`: 31 passed.
- Confirmed `npm run check`: 0 errors and 0 warnings.
- Confirmed `npm run format:check`: passed.
- Confirmed `npm run build`: `dist/` and the locked Rust release binary were
  produced.
- Confirmed `npm run test:e2e -- --retries=0`: 52 passed and 36 intentional
  project skips.
- Confirmed the factory URL check on `/` and `/demo`: both passed.
- Confirmed live Axe checks on ten route states: zero serious or critical
  findings.

## Missed leverage and AI check

CSV import, JSON backup/restore, team sync, offline queuing, and explicit
quantity-conflict handling are present. Barcode entry is the remaining obvious
brief-implied addition and is recorded as F-5-12.

Runtime AI is not warranted for the allocation decision. The decision depends
on auditable quantities and supplier evidence. No decorative AI control,
provider key, or model request appears in the product.

## What would make this perfect

Resolve every finding above: restore one plain storage term, register or remove
all public payment/privacy/deployment claims, shorten the two long README
sentences, replace internal billing jargon and the unexplained plan name, make
the owner-price sentence exact, unify the allocation verb, expose a build ID,
label the external footer destination, and add the brief's camera-gated barcode
path with a manual fallback. Then rerun all 31 claim commands, the complete
browser suite, and the live route/privacy checks from fresh state.
