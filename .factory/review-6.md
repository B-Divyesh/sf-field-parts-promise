# Adversarial first-read review 6 — Parts Promise

Work order: `field-parts-promise-review-6`  
Reviewed: 2026-09-02 UTC  
Repository base: `6784f9d841321e3aba7506b13b5de52b90cd9916`  
Live build reported by the footer: `1dc52f56`

## Verdict

**FAIL — 1 blocking, 2 high, and 2 low findings remain.**

The cold landing page is clear, the sample is useful in one click, all 37
declared claim commands pass independently from a clean clone, and the main
route/accessibility checks pass. The review still fails because a live
workspace identifier can remain visible after the app enters Demo. One
authentication claim also exceeds its tagged test, and the landing pricing
heading says visitors can pay while the next sentence says checkout is not
available.

## Cold first read

Fresh Chromium contexts opened the live URL without scrolling at 390 × 844 and
1440 × 900.

- What it does: it assigns parts from a van, warehouse, or supplier record to a
  specific job before the firm agrees a visit date.
- For whom: small trade firms whose visit dates depend on having the required
  parts.
- What to click first: **Try it with sample data**. The adjacent result says,
  “Opens Riverside Dental with one missing pump.”

This gate passes at both widths. On the phone, the headline, audience, primary
action, action result, and all three facts are visible before scrolling. The
exact text that supplied the answers was “Promise dates from parts held for the
job,” “For small trade firms that need a parts check before agreeing a visit
date,” and “Try it with sample data.”

## Findings

### Blocking

#### F-6-1 — A live-workspace identifier remains visible after entering Demo

- Exact quote/location: after creating live job `R6-LIVE` and immediately
  selecting **Try it with sample data**, the live demo displayed the toast
  “R6-LIVE was added to this device.” underneath the persistent banner “Demo —
  sample data; nothing is saved to your local workspace.”
- Reproduction: fresh 390 × 844 context → `/jobs` → **Add a job** → save job
  `R6-LIVE` → wordmark → **Try it with sample data**. The resulting URL was
  `/?demo=1`, the H1 was “Riverside Dental parts,” and the live record's name
  remained in the demo DOM and viewport.
- Code evidence: `src/App.svelte:451` stores record-specific confirmation text
  in the shared `toast` state. `syncRoute` at `src/App.svelte:830-846` changes
  the storage mode and reloads the workspace but never clears that state. The
  unconditional toast at `src/App.svelte:2756-2761` therefore crosses the
  live/demo boundary.
- Why this fails: Demo is presented as an isolated sample workspace. A customer
  or job identifier from real work remains visible while the demo banner is
  shown. Storage writes stayed isolated, but the user-visible data boundary did
  not.
- Concrete fix: when `nextDemo !== demo`, clear `toast` and every other
  workspace-derived transient value before rendering the destination. Extend
  `@claim:demo-reset-isolated` to create a uniquely named live job, enter Demo,
  and assert that the unique token is absent from the entire demo DOM. Add the
  inverse assertion when leaving Demo.

### High

#### F-6-2 — The registered sign-in claim is broader than its exact claim test

- Exact quote/location: `.factory/claims.json`, `entra-sign-in`: “invalid or
  expired tokens are rejected.” README: “It validates Entra issuer, audience,
  tenant, signature, and token time.”
- Test evidence: the required command passed, but the sole tagged test at
  `e2e/claims.spec.ts:1074-1102` sends only one correctly signed, expired test
  token. It does not send a bad signature, issuer, audience, or tenant. The
  separate Rust unit suite checks issuer, audience, and tenant, but it is not
  the exact tagged claim test and it still does not test a bad signature.
- Why this fails: a visitor can rely on all five authentication checks stated
  in the README, while the registered sandbox test proves only expiry and the
  sign-in redirect. This leaves part of a security claim untested.
- Concrete fix: make the single `@claim:entra-sign-in` test assert 401 and
  `WWW-Authenticate: Bearer` for expired, wrong-signature, wrong-issuer,
  wrong-audience, and wrong-tenant tokens. Update the claim's `where` field to
  include the README.

#### F-6-3 — The pricing heading claims a payment action that is unavailable

- Exact quote/location: landing pricing H2, “Pay for the firm plan and active
  technicians.” The same section then says, “Checkout is not available yet. No
  charge will start.”
- Why this fails: the heading tells a first-time visitor that payment is an
  available task, while the release explicitly cannot start payment. “Pay for”
  is also an unlisted capability claim; `subscription-checkout` proves the
  opposite boundary.
- Concrete fix: change the heading to **Firm plan pricing**. Keep the exact
  price and unavailable-checkout sentences below it.

### Low

#### F-6-4 — “Critical bucket” is unexplained rate-limit jargon

- Exact quote/location: README, “Export uses the five-request critical bucket.”
- Why this fails: a reader cannot tell the time window or what happens after
  the fifth request without knowing an internal limiter name.
- Concrete fix: “Export allows five requests per minute, then tells the client
  how long to wait.” Keep the number and interval aligned with
  `response-policy`.

#### F-6-5 — “Optional override” has no named subject

- Exact quote/location: README, “No optional override is required to start.”
- Why this fails: a new operator cannot tell which setting is optional or what
  is being overridden.
- Concrete fix: “The server starts without extra environment settings.” This
  is already the behavior exercised by `container-runtime`.

## Demo and sandbox

The one-click demo otherwise passes:

- The landing action opens `/?demo=1` with H1 “Riverside Dental parts.” The
  first demo viewport already shows `RD-1042`, its visit date, “Date at risk,”
  and the missing condensate pump.
- The banner remains visible and says “Demo — sample data; nothing is saved to
  your local workspace.” It contains **Reset demo** and **Start for real**.
- Allocating the pump from Van 2 changes the status to **Parts in hand**.
  Confirming **Reset demo** restores **Date at risk**, zero held, and the
  one-unit shortage.
- A live job created before the demo remained in `parts-promise-live-v1` with
  the same job, requirement, and timestamps. Leaving Demo deleted
  `parts-promise-demo-v1`, opened `/jobs`, and restored the live job. F-6-1
  concerns transient display, not a storage mutation.
- The allocation/reset request log contained same-origin GET requests only.
  No account, sync, billing, camera, or cross-origin request occurred.
- After an online first load, an offline reload retained the sample and the
  allocation flow reached **Parts in hand**. The offline context contained only
  `parts-promise-demo-v1`.

## Claim audit

The clean clone was `/tmp/field-parts-promise-review6.fGD0eV/clone` at the
reviewed base. `npm ci` reported zero vulnerabilities. Every command below was
read from `.factory/claims.json` and run separately with a fresh Playwright
invocation.

| Claim ID | Exact command | Result |
| --- | --- | --- |
| `sample-fixture` | `npm run test:e2e -- --grep @claim:sample-fixture` | PASS |
| `promise-status-from-allocation` | `npm run test:e2e -- --grep @claim:promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | `npm run test:e2e -- --grep @claim:allocation-keeps-source` | PASS |
| `supplier-quantity-conserved` | `npm run test:e2e -- --grep @claim:supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | `npm run test:e2e -- --grep @claim:reorder-after-allocation` | PASS |
| `demo-reset-isolated` | `npm run test:e2e -- --grep @claim:demo-reset-isolated` | PASS |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `local-workspace-flow` | `npm run test:e2e -- --grep @claim:local-workspace-flow` | PASS |
| `demo-feature-boundaries` | `npm run test:e2e -- --grep @claim:demo-feature-boundaries` | PASS |
| `indexeddb-local-storage` | `npm run test:e2e -- --grep @claim:indexeddb-local-storage` | PASS |
| `demo-network-privacy` | `npm run test:e2e -- --grep @claim:demo-network-privacy` | PASS |
| `manual-barcode-allocation` | `npm run test:e2e -- --grep @claim:manual-barcode-allocation` | PASS |
| `camera-barcode-privacy` | `npm run test:e2e -- --grep @claim:camera-barcode-privacy` | PASS |
| `release-order-boundary` | `npm run test:e2e -- --grep @claim:release-order-boundary` | PASS |
| `clear-local-records` | `npm run test:e2e -- --grep @claim:clear-local-records` | PASS |
| `workspace-backup-roundtrip` | `npm run test:e2e -- --grep @claim:workspace-backup-roundtrip` | PASS |
| `csv-import-validation` | `npm run test:e2e -- --grep @claim:csv-import-validation` | PASS |
| `demo-transfer-isolated` | `npm run test:e2e -- --grep @claim:demo-transfer-isolated` | PASS |
| `csv-template-download` | `npm run test:e2e -- --grep @claim:csv-template-download` | PASS |
| `entra-sign-in` | `npm run test:e2e -- --grep @claim:entra-sign-in` | PASS, incomplete assertion; F-6-2 |
| `tenant-data-isolation` | `npm run test:e2e -- --grep @claim:tenant-data-isolation` | PASS |
| `two-device-sync` | `npm run test:e2e -- --grep @claim:two-device-sync` | PASS |
| `idempotent-sync` | `npm run test:e2e -- --grep @claim:idempotent-sync` | PASS |
| `offline-signed-in-sync` | `npm run test:e2e -- --grep @claim:offline-signed-in-sync` | PASS |
| `sync-conflict-resolution` | `npm run test:e2e -- --grep @claim:sync-conflict-resolution` | PASS |
| `invitation-email-activation` | `npm run test:e2e -- --grep @claim:invitation-email-activation` | PASS |
| `account-service-boundaries` | `npm run test:e2e -- --grep @claim:account-service-boundaries` | PASS |
| `sensitive-input-boundary` | `npm run test:e2e -- --grep @claim:sensitive-input-boundary` | PASS |
| `audit-log-recording` | `npm run test:e2e -- --grep @claim:audit-log-recording` | PASS |
| `firm-deletion-hold` | `npm run test:e2e -- --grep @claim:firm-deletion-hold` | PASS |
| `response-policy` | `npm run test:e2e -- --grep @claim:response-policy` | PASS |
| `subscription-checkout` | `npm run test:e2e -- --grep @claim:subscription-checkout` | PASS |
| `technician-seat-charge` | `npm run test:e2e -- --grep @claim:technician-seat-charge` | PASS |
| `expired-plan-keeps-export` | `npm run test:e2e -- --grep @claim:expired-plan-keeps-export` | PASS |
| `durable-runtime-storage` | `npm run test:e2e -- --grep @claim:durable-runtime-storage` | PASS |
| `visible-build-identity` | `npm run test:e2e -- --grep @claim:visible-build-identity` | PASS |
| `container-runtime` | `npm run test:e2e -- --grep @claim:container-runtime` | PASS |

No command failed. F-6-2 records the untested part of a claim despite the
command's zero exit status. F-6-3 records the landing page's unlisted payment
capability wording.

## Complete copy audit

Counts split on whitespace after standalone punctuation is removed. Hyphenated
terms, prices, paths, and build values count as one word. Code blocks contain
commands rather than sentences and are not counted. Headings, labels, actions,
route-announcement text, and meaningful image alternative text are included so
non-sentence interface copy is also checked.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| Parts Promise | 2 | Pass |
| Demo | 1 | Pass |
| Jobs | 1 | Pass |
| Privacy | 1 | Pass |
| Sign in | 2 | Pass |
| Use dark theme | 3 | Pass |
| Parts Promise — Allocate parts to each job | 7 | Pass |
| Allocate parts to a job | 5 | Pass |
| Promise dates from parts held for the job | 8 | Pass |
| For small trade firms that need a parts check before agreeing a visit date. | 14 | Pass |
| Try it with sample data | 5 | Pass |
| Opens Riverside Dental with one missing pump. | 7 | Pass |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| The firm plan is $39/month plus $8 per active technician. | 10 | Pass: `technician-seat-charge` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass |
| Sample job status | 3 | Pass |
| See why a visit date is at risk | 8 | Pass |
| RD-1042 needs one condensate pump. | 5 | Pass: `sample-fixture` |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass |
| RD-1042 · Riverside Dental | 3 | Pass |
| Date at risk | 3 | Pass |
| Condensate pump needs 1 each. | 5 | Pass |
| How it works | 3 | Pass |
| Check parts before agreeing a visit date | 7 | Pass |
| List required parts | 3 | Pass |
| Add each required part to the job. | 7 | Pass |
| Allocate each part | 3 | Pass |
| Allocate it from a van or warehouse source. | 8 | Pass |
| Review the visit date | 4 | Pass |
| Read the reason before you agree the visit date. | 9 | Pass |
| What this release does not do | 6 | Pass |
| It does not place supplier orders. | 6 | Pass: `release-order-boundary` |
| The sample stays separate from signed-in firm workspaces. | 8 | Pass |
| Read how local data works | 5 | Pass |
| Firm plan | 2 | Pass |
| Pay for the firm plan and active technicians | 8 | **Flag: F-6-3** |
| The firm plan costs $39 each month. | 7 | Pass: `technician-seat-charge` |
| Each active technician costs $8 each month. | 7 | Pass: `technician-seat-charge` |
| The owner is included in the $39 base price and does not use a technician seat. | 16 | Pass: `technician-seat-charge` |
| Checkout is not available yet. | 5 | Pass: `subscription-checkout` |
| No charge will start. | 4 | Pass: `subscription-checkout` |
| Set up your firm | 4 | Pass |
| Promise job dates from parts held for the job. | 9 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory (external site) | 6 | Pass |
| Build 1dc52f56 | 2 | Pass: `visible-build-identity` |

No landing unit exceeds 22 words or contains a banned marketing adjective. All
buttons use result-naming verbs. F-6-3 is the only landing copy flag.

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass |
| Parts Promise helps small trade firms allocate required parts before promising a visit date. | 14 | Pass |
| A solo user can work locally. | 6 | Pass |
| A signed-in firm can share one workspace across devices. | 9 | Pass |
| Try it with sample data | 5 | Pass |
| Open `/?demo=1`, or `http://127.0.0.1:4173/?demo=1` during development. | 6 | Pass |
| The sample opens Riverside Dental job `RD-1042` with one missing condensate pump. | 12 | Pass |
| Allocate the pump from Van 2. | 6 | Pass |
| The status changes from Date at risk to Parts in hand. | 11 | Pass |
| Van 2 then has no spare pumps. | 7 | Pass |
| The app suggests a reorder but never places one. | 9 | Pass |
| The demo uses a separate browser database. | 7 | Pass |
| It never signs in or contacts the account, sync, or billing API. | 12 | Pass |
| Reset demo restores the sample. | 5 | Pass |
| Start for real deletes demo changes and opens the unchanged local workspace. | 12 | Pass |
| Use Scan a part to match a required part by barcode. | 11 | Pass |
| Camera access begins only after Use camera. | 7 | Pass |
| Enter barcode instead completes the same allocation without camera access. | 10 | Pass |
| Camera frames stay on the device and are not sent. | 10 | Pass |
| Accounts, sync, and billing | 4 | Pass |
| Sign-in uses the Sociobot Microsoft Entra tenant. | 7 | Pass |
| A saved firm workspace appears on another signed-in device. | 9 | Pass |
| Repeated sync requests with the same operation ID apply once. | 10 | Pass |
| Offline signed-in edits stay in a browser database outbox. | 9 | Pass |
| They survive reload, retry after reconnect, and back off after a temporary failure. | 13 | Pass |
| Owners can record invitations by work email. | 7 | Pass |
| The invitation becomes active when that email signs in. | 9 | Pass |
| The firm plan costs $39 per month. | 7 | Pass |
| Each active technician costs $8 per month. | 7 | Pass |
| The owner is included in the base price without using a technician seat. | 13 | Pass |
| Checkout is not available yet. | 5 | Pass |
| No charge will start. | 4 | Pass |
| Existing cloud records and export remain available when a recorded plan is unpaid. | 13 | Pass |
| New cloud writes stop. | 4 | Pass |
| Run and verify | 3 | Pass |
| Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass |
| Run the complete local suite: | 5 | Pass |
| `npm run build` writes the web app to `dist/` and builds the release server. | 14 | Pass |
| Claim checks | 2 | Pass |
| See `.factory/claims.json` for registered claim checks and their clean test commands. | 11 | Pass |
| Data and API | 3 | Pass |
| Local and demo records use a browser database. | 8 | Pass |
| Export workspace downloads a versioned JSON backup. | 7 | Pass |
| Import workspace previews JSON or CSV and reports invalid rows before saving. | 12 | Pass |
| The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. | 12 | Pass |
| It validates Entra issuer, audience, tenant, signature, and token time. | 10 | **Flag: F-6-2** |
| Requests derive the firm from the signed-in user's stable Entra object ID. | 12 | Pass |
| Limited API responses include a positive `Retry-After` header. | 8 | Pass |
| Export uses the five-request critical bucket. | 6 | **Flag: F-6-4** |
| Developer architecture note | 3 | Pass |
| The browser databases use IndexedDB. | 5 | Pass: developer term |
| Local data uses `parts-promise-live-v1`. | 4 | Pass: exact developer name |
| Demo data uses `parts-promise-demo-v1`. | 4 | Pass: exact developer name |
| Offline shared edits use the `parts-promise-cloud-v1` outbox. | 7 | Pass: developer term |
| The deployment uses one replica and a durable `/data` directory. | 10 | Pass |
| The server stores SQLite data and its generated metrics token there. | 11 | Pass |
| Firm data remains available after a server restart. | 8 | Pass |
| Deployment configuration | 2 | Pass |
| The multi-stage image runs as a non-root user and listens on `PORT`, which defaults to `8080`. | 16 | Pass: deployment detail |
| Build identity comes from `BUILD_SHA`. | 5 | Pass: exact setting name |
| `deploy.json` sets `/data` as the durable data directory and sets one replica. | 12 | Pass |
| No optional override is required to start. | 7 | **Flag: F-6-5** |
| The factory deploys this container to `https://field-parts-promise.sociobot.in`. | 7 | Pass |
| Privacy and legal | 3 | Pass |
| The normal demo flow sends only same-origin GET requests. | 9 | Pass |
| It does not ask for camera access. | 7 | Pass |
| Camera access requires the separate Use camera action. | 8 | Pass |
| Account data is sent only to this product API and Microsoft during sign-in. | 13 | Pass |
| A user does not enter a password or payment-card number in Parts Promise. | 13 | Pass |
| See `/privacy` and `/terms` in the app. | 7 | Pass |
| License | 1 | Pass |
| MIT © 2026 Sociobot (Param Factory). | 6 | Pass |

No README unit exceeds 22 words or contains a banned marketing adjective.
Reader-facing storage terminology is consistent; exact IndexedDB names are
confined to the developer section.

## Earlier-finding regression audit

Every earlier review, polish report, and the previous handoff was read. The
following checks were repeated against both the live site and current code.

| Earlier ID | Live and code confirmation | Status |
| --- | --- | --- |
| F-1-1 | Forward navigation and Back focus `main h1`; `syncRoute` calls `focusPageHeading`. | Fixed |
| F-1-2 | Local use, firm onboarding, tenant isolation, invitations, two-device sync, and conflict handling are implemented; related claims passed. | Fixed |
| F-1-3 | Offline wording is limited to the sample flow; the registered offline claim passed. | Fixed |
| F-1-4 | Existing live records survive every tested demo exit and the exit copy says they reopen unchanged. | Fixed |
| F-1-5 | Each audited route had exactly one description, canonical, OG set, and Twitter set. | Fixed |
| F-1-6 | `/demo` returned “Demo — Parts Promise,” canonical `/demo`, and appears in `sitemap.xml`. | Fixed |
| F-1-7 | The mobile first screen states `$39/month plus $8 per active technician`. | Fixed |
| F-1-8 | The task label is “Allocate parts to a job.” | Fixed |
| F-1-9 | The hero caption names van, warehouse, and supplier records. | Fixed |
| F-1-10 | The section label is “Sample job status.” | Fixed |
| F-1-11 | The heading is “See why a visit date is at risk.” | Fixed |
| F-1-12 | The section label is “How it works.” | Fixed |
| F-1-13 | The heading is “Check parts before agreeing a visit date.” | Fixed |
| F-1-14 | The step is “List required parts.” | Fixed |
| F-1-15 | The task and controls consistently use “Allocate.” | Fixed |
| F-1-16 | The step is “Review the visit date.” | Fixed |
| F-1-17 | Theme controls say “Use dark theme” or “Use light theme.” | Fixed |
| F-1-18 | README heading is “Try it with sample data.” | Fixed |
| F-1-19 | Public explanation omits milestone IDs; internal claim names remain in the developer claim section. | Fixed |
| F-1-20 | Unknown paths return HTTP 404 with “Page not found,” recovery links, legal links, metadata, and build ID. | Fixed |
| F-1-21 | Demo labels say “Sample job” and “Required parts and their sources.” | Fixed |
| F-2-1 | Wordmark, browser Back, reset, and confirmed exit delete the demo database; re-entry restores the fixture. F-6-1 is a different transient-display leak on entry. | Fixed |
| F-2-2 | JSON backup/restore, CSV preview/import, template download, and namespace isolation claims passed. | Fixed |
| F-2-3 | Missing jobs and unknown paths use the 404 state and 404 metadata. | Fixed |
| F-2-4 | Work sheets expose expanded state, focus their headings, and restore trigger focus in the browser tests. | Fixed |
| F-3-1 | At 390 px and 1440 px, Back restored the exact prior scroll Y and focused the restored H1. | Fixed |
| F-3-2 | `sample-fixture` lists and tests Riverside Dental, RD-1042, the pump, zero held, and the shortage. | Fixed |
| F-3-3 | Backup and transfer tests compare complete records and keep the live namespace unchanged. | Fixed |
| F-3-4 | `csv-template-download` verifies filename, media type, header, rows, and preview. | Fixed |
| F-3-5 | The banner says nothing is saved to the local workspace. | Fixed |
| F-3-6 | Reader copy consistently says “browser database”; exact names appear only in developer documentation. | Fixed |
| F-5-1 | No payment-provider, merchant, or refund statement remains in public copy. | Fixed |
| F-5-2 | The sensitive-input wording is narrowed and `sensitive-input-boundary` passed. | Fixed |
| F-5-3 | The release-wide supplier-order boundary and both barcode paths are present and tested. | Fixed |
| F-5-4 | Runtime statements are registered under `durable-runtime-storage` and `container-runtime`; both passed. | Fixed |
| F-5-5 | README no longer says the registry covers every public statement. | Fixed |
| F-5-16 | No checkout request occurs before the explicit availability button; the tagged test passed. | Fixed |
| F-5-6 | No README sentence exceeds 22 words. | Fixed |
| F-5-7 | The long fallback sentence is gone. | Fixed |
| F-5-8 | Billing copy says checkout is unavailable and no charge starts. | Fixed |
| F-5-9 | “Workshop” is absent from reader copy; “firm plan” is used. | Fixed |
| F-5-10 | Pricing states that the owner is included and does not use a technician seat. | Fixed |
| F-5-11 | Home title, OG title, and Twitter title use “Allocate parts to each job.” | Fixed |
| F-5-12 | **Scan a part**, **Use camera**, and **Enter barcode instead** are implemented and tested. | Fixed |
| F-5-13 | Every audited route footer shows `Build 1dc52f56`. | Fixed |
| F-5-14 | Footer says “Built by Param Factory (external site).” | Fixed |
| F-5-15 | Claim-test terminology is confined to the README developer section. | Fixed |

Review 4 had no findings. The prior handoff's checkout limitation remains
truthfully disclosed; F-6-3 concerns the contradictory heading introduced
around that boundary, not a hidden checkout.

## Structure, links, accessibility, and visual identity

- `/`, `/demo`, `/jobs`, `/onboarding`, `/settings/team`,
  `/settings/billing`, `/settings/data`, `/privacy`, and `/terms` returned 200.
  An unknown route returned a designed HTTP 404.
- Every route had `lang="en"`, one H1, one main landmark, a route-specific
  title/description/canonical/OG/Twitter set, SVG favicon, and apple-touch icon.
  `robots.txt` and `sitemap.xml` exist; the sitemap lists all stable routes.
- Every discovered home/demo/jobs/account/legal/footer link returned 200. The
  only crawled 404 was the current-document skip link on the intentional 404
  page.
- Route changes announce and focus the destination H1. Back restored H1 focus
  and scroll exactly: mobile 2082 → 2082; desktop 1437 → 1437.
- Axe found zero serious or critical violations across all ten audited routes.
  Normal live loads produced no application console error. Chromium reports
  the expected failed-document message when the requested document itself is
  the intentional HTTP 404.
- Header and footer content is consistent, with Privacy and Terms present.
- The warm drafting-paper palette, condensed technical display face, ruled
  plates, safety-orange registration marks, and exploded-parts drawing create a
  distinct service-manual identity. It does not resemble a generic centered
  gradient/card SaaS template.

## Missed leverage

No additional AI step is justified. The core work is deterministic allocation
and evidence tracking, and a model would add uncertainty to the promise status.
The brief-implied high-value extensions already present are barcode entry and
camera scanning, JSON backup/restore, CSV import/template export, signed-in
multi-device sync, supplier-date evidence, conflict handling, and reorder
suggestions. No additional leverage finding is raised.

## Local quality gates

- `npm test`: PASS — 22 Vitest and 15 Rust tests.
- `npm run check`: PASS — 0 errors and 0 warnings.
- `npm run format:check`: PASS.
- `BUILD_SHA=6784f9d841321e3aba7506b13b5de52b90cd9916 npm run build`: PASS;
  `dist/` produced. Main JS was 39.63 kB gzip, deferred sign-in JS 62.19 kB
  gzip, and CSS 4.24 kB gzip.
- `BUILD_SHA=6784f9d841321e3aba7506b13b5de52b90cd9916 npm run test:e2e -- --retries=0`:
  PASS — 59 passed, 43 intentional project skips, 0 failed.

## What would make this perfect

Clear all workspace-derived transient UI when crossing the live/demo boundary,
and prove that unique live tokens never appear in the demo DOM. Expand the
tagged Entra claim test to cover every stated token check. Rename the pricing
heading so it describes pricing without promising unavailable payment, and
replace the two README jargon/vague phrases with the proposed plain wording.
Then rerun every claim command and this entire first-read checklist from fresh
contexts. With those five findings resolved and no regressions, nothing else
identified in this review would remain.
