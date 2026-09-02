# Adversarial first-read review 8 — Parts Promise

- Work order: `field-parts-promise-review-8`
- Reviewed: 2026-09-02 UTC
- Repository HEAD: `13759a6909a14547b621092e07621d4ccf90df6c`
- Live build: `690fcb860a1eabc7e4c2485141059f0013c08b4c`

The commits after the live build contain only verification documentation and
evidence. Product source, tests, claims, and README are identical.

## Verdict

**FAIL — 1 blocking finding remains.**

The cold first screen is clear, the normal one-click sample flow works, all 37
registered claim commands pass independently from a clean clone, and the
copy, metadata, accessibility, build, and normal navigation checks pass. The
review still fails because demo-mode links publish real-workspace URLs. Opening
**Jobs**, **Privacy**, or **Terms** in a new tab bypasses the click-handler
rewrite, drops the demo banner, and opens real browser-storage namespaces.

## Cold first read

Fresh Chromium contexts opened the production home page without scrolling at
390 × 844 and 1440 × 900.

- What it does: allocates required parts to a job before a firm promises a
  visit date.
- For whom: small trade firms whose visit dates depend on having the required
  parts.
- What to click first: **Try it with sample data**. The adjacent result says,
  “Opens Riverside Dental with one missing pump.”

All three answers are visible before scrolling at both sizes. On the phone,
the headline ends at y=355, the audience sentence at y=433, the action at
y=501, its result at y=555, and the last plain fact at y=701 in an 844 px
viewport. The page has no horizontal overflow. Seven first-load requests were
same-origin GETs. No console or page error occurred.

## Finding

### Blocking

#### F-8-1 — Demo navigation links publish real-workspace URLs

- Exact location: live `/demo`; header **Jobs** and **Privacy** links; footer
  **Privacy** and **Terms** links; `src/App.svelte`, `href()` and the link
  markup around the site header/footer.
- Exact rendered targets in demo mode: `Jobs href="/jobs"`, `Privacy
  href="/privacy"`, and `Terms href="/terms"`.
- Reproduction: open `/demo` in a fresh browser context. Only
  `parts-promise-demo-v1` exists. Ctrl-click **Jobs** (the phone equivalent is
  long-press → open in new tab). The new tab opens `/jobs`, has no demo banner,
  and creates `parts-promise-live-v1` plus `parts-promise-cloud-v1`.
- Code confirmation: normal clicks work only because the event handler calls
  `href('/jobs')` again after `demo` becomes true. The rendered `href={href(...)}`
  is not reactive to the later mode change. Modified clicks intentionally skip
  the handler and follow the stale real-mode target.
- Why this blocks acceptance: a link presented inside the sandbox can open the
  real local workspace and initialize real storage. The link target contradicts
  the persistent “Demo — sample data” boundary and fails real-URL/deep-link
  behavior. A visitor should not need to know that only an ordinary click keeps
  them in the sandbox.
- Concrete fix: derive each internal demo URL reactively, so the actual `href`
  is `/jobs?demo=1`, `/privacy?demo=1`, or `/terms?demo=1` whenever the banner
  is shown. Make the click handler follow the rendered target rather than
  recomputing a different one. Extend `@claim:demo-reset-isolated` or add a
  routing regression that checks every internal link's `href`, opens each in a
  new tab, confirms the banner persists, and confirms neither the live nor
  cloud database is created.

## Complete copy audit

Counts split on whitespace after standalone punctuation is removed.
Hyphenated terms, prices, paths, URLs, and build values count as one word.
Shell blocks are commands, not sentences. Headings, controls, labels, and
meaningful alternative text are included so unclear fragments are not hidden.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: destination |
| Jobs | 1 | Pass: destination |
| Privacy | 1 | Pass: destination |
| Sign in | 2 | Pass: action |
| Use dark theme | 3 | Pass: result-naming action |
| Parts Promise — Allocate parts to each job | 7 | Pass: title and route announcement |
| Allocate parts to a job | 5 | Pass: task label |
| Promise dates from parts held for the job | 8 | Pass: job-first H1 |
| For small trade firms that need a parts check before agreeing a visit date. | 14 | Pass: audience and result |
| Try it with sample data | 5 | Pass: primary action |
| Opens Riverside Dental with one missing pump. | 7 | Pass: `sample-fixture` |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| The firm plan is $39/month plus $8 per active technician. | 10 | Pass: `technician-seat-charge` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: useful caption |
| Sample job status | 3 | Pass: section label |
| See why a visit date is at risk | 9 | Pass: section heading |
| RD-1042 needs one condensate pump. | 5 | Pass: `sample-fixture` |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: action |
| RD-1042 · Riverside Dental | 3 | Pass: sample identity |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass: sample shortage |
| How it works | 3 | Pass: section name |
| Check parts before agreeing a visit date | 8 | Pass: section heading |
| List required parts | 3 | Pass: step heading |
| Add each required part to the job. | 7 | Pass: instruction |
| Allocate each part | 3 | Pass: step heading |
| Allocate it from a van or warehouse source. | 8 | Pass: instruction |
| Review the visit date | 4 | Pass: step heading |
| Read the reason before you agree the visit date. | 9 | Pass: instruction |
| What this release does not do | 6 | Pass: scope heading |
| It does not place supplier orders. | 6 | Pass: `release-order-boundary` |
| The sample stays separate from signed-in firm workspaces. | 8 | Pass: `demo-transfer-isolated` |
| Read how local data works | 5 | Pass: action |
| Firm plan | 2 | Pass: section label |
| Firm plan pricing | 3 | Pass: section heading |
| The firm plan costs $39 each month. | 7 | Pass: `technician-seat-charge` |
| Each active technician costs $8 each month. | 7 | Pass: `technician-seat-charge` |
| The owner is included in the $39 base price and does not use a technician seat. | 16 | Pass: `technician-seat-charge` |
| Checkout is not available yet. | 5 | Pass: `subscription-checkout` |
| No charge will start. | 4 | Pass: `subscription-checkout` |
| Set up your firm | 4 | Pass: action |
| Promise job dates from parts held for the job. | 9 | Pass: footer description |
| Terms | 1 | Pass: destination |
| Built by Param Factory (external site) | 6 | Pass: destination disclosed |
| Build 690fcb86 | 2 | Pass: `visible-build-identity` |

No landing unit exceeds 22 words, contains a banned marketing adjective, uses
an inconsistent task term, or relies on a metaphor or mood heading. Every
button names its result. F-8-1 concerns the targets behind otherwise clear
navigation labels.

### README

| # | Copy | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Parts Promise | 2 | Pass |
| 2 | Parts Promise helps small trade firms allocate required parts before promising a visit date. | 14 | Pass |
| 3 | A solo user can work locally. | 6 | Pass |
| 4 | A signed-in firm can share one workspace across devices. | 9 | Pass |
| 5 | Try it with sample data | 5 | Pass: heading |
| 6 | Open `/?demo=1`, or `http://127.0.0.1:4173/?demo=1` during development. | 6 | Pass: instruction |
| 7 | The sample opens Riverside Dental job `RD-1042` with one missing condensate pump. | 12 | Pass |
| 8 | Allocate the pump from Van 2. | 6 | Pass: instruction |
| 9 | The status changes from Date at risk to Parts in hand. | 11 | Pass |
| 10 | Van 2 then has no spare pumps. | 7 | Pass |
| 11 | The app suggests a reorder but never places one. | 9 | Pass |
| 12 | The demo uses a separate browser database. | 7 | Pass |
| 13 | It never signs in or contacts the account, sync, or billing API. | 12 | Pass |
| 14 | Reset demo restores the sample. | 5 | Pass |
| 15 | Start for real deletes demo changes and opens the unchanged local workspace. | 12 | Pass |
| 16 | Use Scan a part to match a required part by barcode. | 11 | Pass |
| 17 | Camera access begins only after Use camera. | 7 | Pass |
| 18 | Enter barcode instead completes the same allocation without camera access. | 10 | Pass |
| 19 | Camera frames stay on the device and are not sent. | 10 | Pass |
| 20 | Accounts, sync, and billing | 4 | Pass: heading |
| 21 | Sign-in uses the Sociobot Microsoft Entra tenant. | 7 | Pass |
| 22 | A saved firm workspace appears on another signed-in device. | 9 | Pass |
| 23 | Retrying the same saved change does not create a duplicate. | 10 | Pass: F-7-1 fixed |
| 24 | Offline signed-in edits stay queued in this browser. | 8 | Pass: F-7-2 fixed |
| 25 | They survive reload, retry after reconnect, and back off after a temporary failure. | 13 | Pass |
| 26 | Owners can record invitations by work email. | 7 | Pass |
| 27 | The invitation becomes active when that email signs in. | 9 | Pass |
| 28 | The firm plan costs $39 per month. | 7 | Pass |
| 29 | Each active technician costs $8 per month. | 7 | Pass |
| 30 | The owner is included in the base price without using a technician seat. | 13 | Pass |
| 31 | Checkout is not available yet. | 5 | Pass |
| 32 | No charge will start. | 4 | Pass |
| 33 | Existing cloud records and export remain available when a recorded plan is unpaid. | 13 | Pass |
| 34 | New cloud writes stop. | 4 | Pass |
| 35 | Run and verify | 3 | Pass: heading |
| 36 | Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass |
| 37 | Run the complete local suite: | 5 | Pass: instruction |
| 38 | `npm run build` writes the web app to `dist/` and builds the release server. | 14 | Pass |
| 39 | Claim checks | 2 | Pass: developer heading |
| 40 | See `.factory/claims.json` for registered claim checks and their clean test commands. | 11 | Pass |
| 41 | Data and API | 3 | Pass: developer heading |
| 42 | Local and demo records use a browser database. | 8 | Pass |
| 43 | Export workspace downloads a versioned JSON backup. | 7 | Pass |
| 44 | Import workspace previews JSON or CSV and reports invalid rows before saving. | 12 | Pass |
| 45 | The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. | 12 | Pass |
| 46 | It validates Entra issuer, audience, tenant, signature, and token time. | 10 | Pass |
| 47 | Requests derive the firm from the signed-in user's stable Entra object ID. | 12 | Pass |
| 48 | Limited API responses include a positive `Retry-After` header. | 8 | Pass |
| 49 | Export allows five requests per minute, then tells the client how long to wait. | 14 | Pass |
| 50 | Developer architecture note | 3 | Pass: developer heading |
| 51 | The browser databases use IndexedDB. | 5 | Pass: implementation detail |
| 52 | Local data uses `parts-promise-live-v1`. | 4 | Pass: implementation detail |
| 53 | Demo data uses `parts-promise-demo-v1`. | 4 | Pass: implementation detail |
| 54 | Offline shared edits use the `parts-promise-cloud-v1` outbox. | 7 | Pass: implementation detail |
| 55 | The deployment uses one replica and a durable `/data` directory. | 10 | Pass |
| 56 | The server stores SQLite data and its generated metrics token there. | 11 | Pass |
| 57 | Firm data remains available after a server restart. | 8 | Pass |
| 58 | Deployment configuration | 2 | Pass: heading |
| 59 | The multi-stage image runs as a non-root user and listens on `PORT`, which defaults to `8080`. | 16 | Pass |
| 60 | Build identity comes from `BUILD_SHA`. | 5 | Pass |
| 61 | `deploy.json` sets `/data` as the durable data directory and sets one replica. | 12 | Pass |
| 62 | The server starts without extra environment settings. | 7 | Pass |
| 63 | The factory deploys this container to `https://field-parts-promise.sociobot.in`. | 7 | Pass |
| 64 | Privacy and legal | 3 | Pass: heading |
| 65 | The normal demo flow sends only same-origin GET requests. | 9 | Pass |
| 66 | It does not ask for camera access. | 7 | Pass |
| 67 | Camera access requires the separate Use camera action. | 8 | Pass |
| 68 | Account data is sent only to this product API and Microsoft during sign-in. | 13 | Pass |
| 69 | A user does not enter a password or payment-card number in Parts Promise. | 13 | Pass |
| 70 | See `/privacy` and `/terms` in the app. | 7 | Pass |
| 71 | License | 1 | Pass: heading |
| 72 | MIT © 2026 Sociobot (Param Factory). | 6 | Pass |

No README unit exceeds 22 words or contains a banned marketing adjective. The
canonical reader terms remain **firm workspace**, **browser database**, **job**,
**required part**, **allocation**, **source**, **supplier evidence**, **visit
date**, **promise status**, **technician**, and **firm plan**. IndexedDB,
database names, routes, and HTTP values are confined to developer sections.

## Demo and sandbox verification

- One click from `/` opens `/?demo=1`. The first 390 px screen already shows
  **Riverside Dental parts**, `RD-1042`, the visit date, **Date at risk**, and
  the missing condensate pump.
- The persistent banner says “Demo — sample data; nothing is saved to your
  local workspace” and provides **Reset demo** and **Start for real**.
- Allocating the pump from Van 2 changes **Date at risk** to **Parts in hand**.
  Confirming Reset restores **Date at risk** and the one-unit shortage.
- A normal allocation/reset/offline flow creates only
  `parts-promise-demo-v1`. Its request log contains same-origin GETs only, no
  request body, no camera request, no console error, and no page error.
- After the online first load, an offline reload retains the sample and the
  allocation flow.
- A unique live job remained unchanged across normal demo entry, mutation,
  reset, and exit. Unique live/demo identifiers did not cross the normal-mode
  DOM boundary.
- F-8-1 is the exception: native or modified navigation follows stale live-mode
  link targets and initializes real namespaces.

## Declared claim results

A clean clone at `/tmp/field-parts-promise-review8.vHnDrV/repo` ran every exact
`test` command from `.factory/claims.json` independently. No command was
combined with another and no retry was used.

| Claim ID | Result | Confirmed outcome |
| --- | --- | --- |
| `sample-fixture` | PASS | Riverside Dental, RD-1042, pump, zero held, and shortage exist. |
| `promise-status-from-allocation` | PASS | Final allocation changes risk to parts in hand. |
| `allocation-keeps-source` | PASS | Six allocation fields survive reload. |
| `supplier-quantity-conserved` | PASS | One supplier unit cannot cover two jobs. |
| `reorder-after-allocation` | PASS | Last van unit suggests, but does not place, a reorder. |
| `demo-reset-isolated` | PASS | Tested normal exits/reset preserve live records and remove sample changes. |
| `offline-reload` | PASS | Cached sample reloads and allocates offline. |
| `local-workspace-flow` | PASS | Local create/source/allocate/undo/evidence/status flow works. |
| `demo-feature-boundaries` | PASS | Demo exposes no account, sync, order, or payment action. |
| `indexeddb-local-storage` | PASS | Named live and demo stores contain the expected records. |
| `demo-network-privacy` | PASS | Normal demo sends same-origin reads and requests no camera. |
| `manual-barcode-allocation` | PASS | CP-19 finds and allocates the condensate pump. |
| `camera-barcode-privacy` | PASS | Camera starts explicitly; frames are neither stored nor sent. |
| `release-order-boundary` | PASS | No release route or API places supplier orders. |
| `clear-local-records` | PASS | Browser data clearing removes local records. |
| `workspace-backup-roundtrip` | PASS | JSON restore preserves every record and timestamp. |
| `csv-import-validation` | PASS | Valid rows import and an invalid row blocks saving. |
| `demo-transfer-isolated` | PASS | Normal sample transfer does not change live data. |
| `csv-template-download` | PASS | Filename, type, header, rows, and preview match. |
| `entra-sign-in` | PASS | Tenant/callback and five invalid-token cases are checked. |
| `tenant-data-isolation` | PASS | One firm cannot read another firm's workspace. |
| `two-device-sync` | PASS | A saved workspace appears in a second context. |
| `idempotent-sync` | PASS | Retrying one saved change applies it once. |
| `offline-signed-in-sync` | PASS | Offline queue survives reload and retries with backoff. |
| `sync-conflict-resolution` | PASS | Stale quantity cannot overwrite shared evidence. |
| `invitation-email-activation` | PASS | Only the matching verified email activates an invitation. |
| `account-service-boundaries` | PASS | Account data uses this API; sign-in uses the configured tenant. |
| `sensitive-input-boundary` | PASS | Product routes and requests contain no password/card inputs. |
| `audit-log-recording` | PASS | Onboarding, invitation, and sync events export. |
| `firm-deletion-hold` | PASS | Owner can schedule and cancel the 14-day hold. |
| `response-policy` | PASS | Five exports succeed; the sixth returns 429 and Retry-After. |
| `subscription-checkout` | PASS | No request precedes the action; one request returns unavailable/no charge. |
| `technician-seat-charge` | PASS | $39 base, $8 technician, and owner inclusion match. |
| `expired-plan-keeps-export` | PASS | Unpaid records export while new cloud writes stop. |
| `durable-runtime-storage` | PASS | `/data` SQLite/token files and restart persistence match. |
| `visible-build-identity` | PASS | Stable routes show the server build identity. |
| `container-runtime` | PASS | PORT-only server, app, limits, identity, and 404 match. |

Result: **37/37 exact claim commands pass.** The landing page, README, demo,
privacy, terms, and interface copy were cross-checked against the registry. No
claim-like sentence is unlisted and no registered claim is untested. F-8-1 is
a newly exercised hyperlink/sandbox path outside the current claim assertion.

## Earlier-finding regression audit

Every `.factory/review-1.md` through `.factory/review-7.md`, every available
polish report, and the prior handoff were read. Each finding was checked on the
live build and in the identical current product source.

| Earlier ID | Current confirmation | Status |
| --- | --- | --- |
| F-1-1 | Forward/history navigation focuses `main h1`; Back restored mobile y=2050 exactly. | Fixed |
| F-1-2 | Tenant isolation, invitations, sync, and conflict handling serve firms; claims pass. | Fixed |
| F-1-3 | Offline wording matches the tested sample flow; claims registry is complete. | Fixed |
| F-1-4 | Normal exit copy is accurate and existing live records survive. | Fixed |
| F-1-5 | Audited routes each have one route-correct metadata set. | Fixed |
| F-1-6 | `/demo` has its own title/canonical and sitemap entry. | Fixed |
| F-1-7 | Exact base and technician prices appear on the first screen. | Fixed |
| F-1-8 | Task label is “Allocate parts to a job.” | Fixed |
| F-1-9 | Hero caption names the actual source records. | Fixed |
| F-1-10 | Preview label is “Sample job status.” | Fixed |
| F-1-11 | Preview heading names the at-risk visit date. | Fixed |
| F-1-12 | Process section is “How it works.” | Fixed |
| F-1-13 | Process heading names the parts check and visit date. | Fixed |
| F-1-14 | First step is “List required parts.” | Fixed |
| F-1-15 | Task copy and controls consistently use “Allocate.” | Fixed |
| F-1-16 | Third step is “Review the visit date.” | Fixed |
| F-1-17 | Theme controls name the resulting theme and retain 44 px targets. | Fixed |
| F-1-18 | README heading is “Try it with sample data.” | Fixed |
| F-1-19 | Milestone lore is absent; claim mechanics remain in developer material. | Fixed |
| F-1-20 | Unknown routes return designed HTTP 404 with plain recovery. | Fixed |
| F-1-21 | Demo labels name the sample job and part sources. | Fixed |
| F-2-1 | Wordmark, Back, Reset, and confirmed normal exit discard demo changes. | Fixed for reported paths; F-8-1 is a distinct native-link path. |
| F-2-2 | CSV import/template and JSON backup/restore are present and isolated. | Fixed |
| F-2-3 | Missing jobs receive 404 title, metadata, canonical, and noindex. | Fixed |
| F-2-4 | Work sheets expose state, focus headings, remain visible, and restore triggers. | Fixed |
| F-3-1 | Back/Forward restore scroll while focusing the destination H1. | Fixed |
| F-3-2 | Riverside Dental fixture has field-level claim coverage. | Fixed |
| F-3-3 | Backup/transfer tests compare complete records and timestamps. | Fixed |
| F-3-4 | CSV template has an exact download/import test. | Fixed |
| F-3-5 | Banner names the local-workspace boundary. | Fixed |
| F-3-6 | Reader copy uses browser-database language; implementation terms are developer-only. | Fixed |
| F-5-1 | No payment-provider, merchant, or refund promise remains. | Fixed |
| F-5-2 | Sensitive-input wording is narrow and its route/request test passes. | Fixed |
| F-5-3 | Barcode paths exist; the supplier-order boundary is release-wide. | Fixed |
| F-5-4 | Runtime storage statements match registered tests. | Fixed |
| F-5-5 | README points to registered checks without claiming completeness. | Fixed |
| F-5-6 | No README sentence exceeds 22 words. | Fixed |
| F-5-7 | The long fallback sentence is absent. | Fixed |
| F-5-8 | Billing copy says checkout is unavailable and no charge starts. | Fixed |
| F-5-9 | Reader copy consistently uses “firm plan.” | Fixed |
| F-5-10 | Pricing explains owner inclusion and technician-seat treatment. | Fixed |
| F-5-11 | Home and social titles use “Allocate parts to each job.” | Fixed |
| F-5-12 | Camera-gated and manual barcode paths work. | Fixed |
| F-5-13 | Every audited route footer shows the immutable build. | Fixed |
| F-5-14 | Footer discloses the external factory destination. | Fixed |
| F-5-15 | Claim terminology is under the developer-only heading. | Fixed |
| F-5-16 | Checkout waits for the named owner action. | Fixed |
| F-6-1 | Normal mode changes clear derived UI and reject stale responses. | Fixed |
| F-6-2 | Tagged sign-in test rejects all five stated invalid-token cases. | Fixed |
| F-6-3 | Pricing heading is “Firm plan pricing.” | Fixed |
| F-6-4 | README states the export limit and wait behavior plainly. | Fixed |
| F-6-5 | README says the server starts without extra environment settings. | Fixed |
| F-7-1 | README now says retrying a saved change creates no duplicate. | Fixed |
| F-7-2 | README now says offline edits stay queued in the browser. | Fixed |
| F7-01 | Full browser suite confirms 44 × 44 px phone targets. | Fixed |

Review 4 had no findings. Earlier unnumbered cache, Docker, permissions-policy,
mobile geometry, claim-coverage, and build-identity checks also pass.

## Structure, accessibility, privacy, and visual identity

- `/`, `/demo`, `/jobs`, `/auth/callback`, `/onboarding`, `/settings/team`,
  `/settings/billing`, `/settings/data`, `/privacy`, and `/terms` return 200.
  An unknown path returns a designed HTTP 404.
- Each route has `lang="en"`, one H1, one main, a route-specific title, one
  description, one canonical, route-correct Open Graph/Twitter metadata,
  favicon, touch icon, consistent header/footer, Privacy, Terms, and build ID.
- Every discovered link endpoint returns 200. F-8-1 is a semantic destination
  failure in demo mode rather than a dead endpoint.
- Route focus and history scroll restoration pass. The sitemap, robots file,
  manifest, favicon, apple-touch icon, and 1200 × 630 social image resolve.
- The factory URL verifier passes home and demo with no console errors. The
  live nine-route Axe sweep reports zero serious or critical violations. The
  complete local browser suite passes 61 tests with 43 expected project skips.
- Security headers include CSP, HSTS, no-sniff, strict referrer, frame, and
  permissions policies. Fonts, scripts, and normal demo requests are
  same-origin.
- The initial landing load is about 19.9 KB gzip of JavaScript; account code is
  deferred. This is below the 150 KB first-load limit.
- The drafting-paper palette, condensed technical type, ruled plates,
  safety-orange marks, and exploded-parts drawing form a distinct service-
  manual identity rather than a generic SaaS template.

## Missed leverage and AI check

No additional feature finding is raised. Barcode entry/camera scanning,
supplier evidence, reorder suggestions, CSV import/template, JSON
backup/restore, multi-device sync, offline queuing, and explicit conflict
handling cover the obvious brief-implied leverage. The allocation decision is
deterministic and auditable; a model would add uncertainty without a clear user
benefit. No AI provider key, model request, analytics script, remote font, or
direct payment-provider integration appears.

## Local verification summary

- Every exact `.factory/claims.json` command: PASS, 37/37 independently.
- `npm test`: PASS — 24 Vitest and 15 Rust tests.
- `npm run check`: PASS — 0 errors and 0 warnings.
- `npm run format:check`: PASS.
- `BUILD_SHA=$(git rev-parse HEAD) npm run build`: PASS; `dist/` produced.
- `BUILD_SHA=$(git rev-parse HEAD) npm run test:e2e -- --retries=0`: PASS —
  61 passed and 43 expected skips.
- Live cold mobile/desktop, normal demo, offline demo, storage, metadata,
  link-endpoint, focus/scroll, 404, and nine-route Axe checks: PASS except
  F-8-1's native demo-link destination.

## What would make this perfect

Make every internal link rendered under the demo banner carry the demo query
in its real `href`, not only in its ordinary-click handler. Add native,
modified-click, copied-link, and new-tab regression coverage that proves those
routes retain the banner and never create live/cloud browser databases. Rerun
all 37 claims and the full first-read checklist. With F-8-1 closed and no
regression, nothing else identified in this review would remain.
