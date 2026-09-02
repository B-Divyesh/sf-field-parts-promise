# Adversarial first-read review 7 — Parts Promise

Work order: `field-parts-promise-review-7`  
Reviewed: 2026-09-02 UTC  
Repository base: `b90b8e992ce2d25fb60a8bb35e252bee998a5205`  
Live build: `a0d9af536f7a981249123658846e74f2e8f9d28e`

The commits between the live build and the repository base contain only
verification documentation and evidence. Product source is identical.

## Verdict

**FAIL — 0 blocking, 0 high, 0 medium, and 2 minor findings remain.**

The product, demo sandbox, claim suite, routing, privacy behavior, and
accessibility checks pass. The only findings are two unexplained implementation
terms in the README. The required verdict is still FAIL because PASS requires
zero findings.

## Cold first read

Fresh Chromium contexts opened the live home page without scrolling at
390 × 844 and 1440 × 900.

- What it does: it allocates required parts to a job before a firm promises a
  visit date.
- For whom: small trade firms whose visit dates depend on having the required
  parts.
- What to click first: **Try it with sample data**. The adjacent result says,
  “Opens Riverside Dental with one missing pump.”

All three answers are visible before scrolling at both sizes. On the 390 px
screen, the headline, audience, primary action, action result, and all three
plain facts end at y=701 in an 844 px viewport. The page has no horizontal
overflow, console error, or page error.

## Findings

### Minor

#### F-7-1 — “Operation ID” exposes sync implementation jargon

- Exact quote/location: `README.md`, **Accounts, sync, and billing**:
  “Repeated sync requests with the same operation ID apply once.”
- Why this fails: a firm owner should not need to understand an internal
  request identifier to learn that retries are safe.
- Concrete rewrite: “Retrying the same saved change does not create a
  duplicate.”

#### F-7-2 — “Browser database outbox” is not plain user language

- Exact quote/location: `README.md`, **Accounts, sync, and billing**:
  “Offline signed-in edits stay in a browser database outbox.”
- Why this fails: “outbox” is an unexplained queue implementation term in a
  user-facing account section.
- Concrete rewrite: “Offline signed-in edits stay queued in this browser.”

## Complete copy audit

Counts split on whitespace after standalone punctuation is removed.
Hyphenated terms, prices, paths, and URLs count as one word. Shell blocks are
commands, not sentences. The landing table also includes headings, controls,
labels, and meaningful alternative text so unclear fragments are not hidden.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation destination |
| Jobs | 1 | Pass: navigation destination |
| Privacy | 1 | Pass: navigation destination |
| Sign in | 2 | Pass: result-naming action |
| Use dark theme | 3 | Pass: result-naming action |
| Parts Promise — Allocate parts to each job | 7 | Pass: title and route announcement |
| Allocate parts to a job | 5 | Pass: task label |
| Promise dates from parts held for the job | 8 | Pass: job-first H1 |
| For small trade firms that need a parts check before agreeing a visit date. | 14 | Pass: audience and outcome |
| Try it with sample data | 5 | Pass: primary action |
| Opens Riverside Dental with one missing pump. | 7 | Pass: exact action result |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| The firm plan is $39/month plus $8 per active technician. | 10 | Pass: `technician-seat-charge` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: useful image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: `allocation-keeps-source` |
| Sample job status | 3 | Pass: section label |
| See why a visit date is at risk | 8 | Pass: section heading |
| RD-1042 needs one condensate pump. | 5 | Pass: `sample-fixture` |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: result-naming action |
| RD-1042 · Riverside Dental | 3 | Pass: sample identity |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass: sample shortage |
| How it works | 3 | Pass: section name |
| Check parts before agreeing a visit date | 7 | Pass: process heading |
| List required parts | 3 | Pass: step heading |
| Add each required part to the job. | 7 | Pass: instruction |
| Allocate each part | 3 | Pass: step heading |
| Allocate it from a van or warehouse source. | 8 | Pass: instruction |
| Review the visit date | 4 | Pass: step heading |
| Read the reason before you agree the visit date. | 9 | Pass: instruction |
| What this release does not do | 6 | Pass: scope heading |
| It does not place supplier orders. | 6 | Pass: `release-order-boundary` |
| The sample stays separate from signed-in firm workspaces. | 8 | Pass: `demo-transfer-isolated` |
| Read how local data works | 5 | Pass: result-naming action |
| Firm plan | 2 | Pass: section label |
| Firm plan pricing | 3 | Pass: section heading |
| The firm plan costs $39 each month. | 7 | Pass: `technician-seat-charge` |
| Each active technician costs $8 each month. | 7 | Pass: `technician-seat-charge` |
| The owner is included in the $39 base price and does not use a technician seat. | 16 | Pass: `technician-seat-charge` |
| Checkout is not available yet. | 5 | Pass: `subscription-checkout` |
| No charge will start. | 4 | Pass: `subscription-checkout` |
| Set up your firm | 4 | Pass: result-naming action |
| Promise job dates from parts held for the job. | 9 | Pass: footer description |
| Terms | 1 | Pass: legal destination |
| Built by Param Factory (external site) | 6 | Pass: destination disclosed |
| Build [short source revision] | 2 | Pass: `visible-build-identity` |

No landing unit exceeds 22 words, uses a banned marketing adjective, changes a
canonical product term, or uses a metaphor or mood heading. Every landing
action names its result or is an unambiguous navigation destination.

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass |
| Parts Promise helps small trade firms allocate required parts before promising a visit date. | 14 | Pass |
| A solo user can work locally. | 6 | Pass |
| A signed-in firm can share one workspace across devices. | 9 | Pass |
| Try it with sample data | 5 | Pass: heading |
| Open `/?demo=1`, or `http://127.0.0.1:4173/?demo=1` during development. | 6 | Pass: instruction |
| The sample opens Riverside Dental job `RD-1042` with one missing condensate pump. | 12 | Pass |
| Allocate the pump from Van 2. | 6 | Pass: instruction |
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
| Accounts, sync, and billing | 4 | Pass: heading |
| Sign-in uses the Sociobot Microsoft Entra tenant. | 7 | Pass: necessary service identity |
| A saved firm workspace appears on another signed-in device. | 9 | Pass |
| Repeated sync requests with the same operation ID apply once. | 10 | **Flag: F-7-1** |
| Offline signed-in edits stay in a browser database outbox. | 9 | **Flag: F-7-2** |
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
| Run and verify | 3 | Pass: heading |
| Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass: developer requirement |
| Run the complete local suite: | 5 | Pass: instruction |
| `npm run build` writes the web app to `dist/` and builds the release server. | 14 | Pass |
| Claim checks | 2 | Pass: developer heading |
| See `.factory/claims.json` for registered claim checks and their clean test commands. | 11 | Pass: developer instruction |
| Data and API | 3 | Pass: developer heading |
| Local and demo records use a browser database. | 8 | Pass |
| Export workspace downloads a versioned JSON backup. | 7 | Pass |
| Import workspace previews JSON or CSV and reports invalid rows before saving. | 12 | Pass |
| The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. | 12 | Pass: developer detail |
| It validates Entra issuer, audience, tenant, signature, and token time. | 10 | Pass: developer security detail |
| Requests derive the firm from the signed-in user's stable Entra object ID. | 12 | Pass: developer security detail |
| Limited API responses include a positive `Retry-After` header. | 8 | Pass: HTTP contract |
| Export allows five requests per minute, then tells the client how long to wait. | 14 | Pass |
| Developer architecture note | 3 | Pass: heading |
| The browser databases use IndexedDB. | 5 | Pass: implementation detail |
| Local data uses `parts-promise-live-v1`. | 4 | Pass: exact developer name |
| Demo data uses `parts-promise-demo-v1`. | 4 | Pass: exact developer name |
| Offline shared edits use the `parts-promise-cloud-v1` outbox. | 7 | Pass: implementation detail under the developer heading |
| The deployment uses one replica and a durable `/data` directory. | 10 | Pass: deployment detail |
| The server stores SQLite data and its generated metrics token there. | 11 | Pass: deployment detail |
| Firm data remains available after a server restart. | 8 | Pass |
| Deployment configuration | 2 | Pass: heading |
| The multi-stage image runs as a non-root user and listens on `PORT`, which defaults to `8080`. | 16 | Pass: deployment detail |
| Build identity comes from `BUILD_SHA`. | 5 | Pass: exact setting name |
| `deploy.json` sets `/data` as the durable data directory and sets one replica. | 12 | Pass |
| The server starts without extra environment settings. | 7 | Pass |
| The factory deploys this container to `https://field-parts-promise.sociobot.in`. | 7 | Pass |
| Privacy and legal | 3 | Pass: heading |
| The normal demo flow sends only same-origin GET requests. | 9 | Pass |
| It does not ask for camera access. | 7 | Pass |
| Camera access requires the separate Use camera action. | 8 | Pass |
| Account data is sent only to this product API and Microsoft during sign-in. | 13 | Pass |
| A user does not enter a password or payment-card number in Parts Promise. | 13 | Pass |
| See `/privacy` and `/terms` in the app. | 7 | Pass |
| License | 1 | Pass: heading |
| MIT © 2026 Sociobot (Param Factory). | 6 | Pass |

No README unit exceeds 22 words or uses a banned marketing adjective. The two
flags above occur outside the clearly labelled developer sections. Technical
names inside **Data and API**, **Developer architecture note**, and
**Deployment configuration** are useful to the developer audience and are not
treated as unexplained product copy.

Canonical terms remain **firm workspace**, **browser database**, **job**,
**required part**, **allocation**, **source**, **supplier evidence**, **visit
date**, **promise status**, **technician**, and **firm plan**.

## Demo and sandbox verification

- The landing action opens `/?demo=1` in one click. At 390 px, the first demo
  screen already shows **Riverside Dental parts**, `RD-1042`, **Date at risk**,
  and the missing condensate pump.
- The persistent banner says “Demo — sample data; nothing is saved to your
  local workspace” and provides **Reset demo** and **Start for real**.
- Allocating one pump from Van 2 changes the status to **Parts in hand**.
  Confirming **Reset demo** restores **Date at risk** and the one-unit shortage.
- A before/after read of `parts-promise-live-v1` was byte-equivalent after the
  demo allocation, reset, and exit. The live workspace remained empty while
  the demo namespace was changed and discarded.
- The live demo allocation/reset flow made only same-origin GET requests and
  made no camera request. After an online first load, an offline reload still
  showed the sample and accepted the pump allocation.
- No demo action exposes sign-in, sync, supplier ordering, or checkout.

## Declared claim results

A clean clone at the required base was created under
`/tmp/parts-review7-claims.hkgmKa/repo`. After `npm ci`, every exact command
from `.factory/claims.json` ran separately.

| Claim ID | Result |
| --- | --- |
| `sample-fixture` | PASS |
| `promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | PASS |
| `supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `demo-feature-boundaries` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `manual-barcode-allocation` | PASS |
| `camera-barcode-privacy` | PASS |
| `release-order-boundary` | PASS |
| `clear-local-records` | PASS |
| `workspace-backup-roundtrip` | PASS |
| `csv-import-validation` | PASS |
| `demo-transfer-isolated` | PASS |
| `csv-template-download` | PASS |
| `entra-sign-in` | PASS |
| `tenant-data-isolation` | PASS |
| `two-device-sync` | PASS |
| `idempotent-sync` | PASS |
| `offline-signed-in-sync` | PASS |
| `sync-conflict-resolution` | PASS |
| `invitation-email-activation` | PASS |
| `account-service-boundaries` | PASS |
| `sensitive-input-boundary` | PASS |
| `audit-log-recording` | PASS |
| `firm-deletion-hold` | PASS |
| `response-policy` | PASS |
| `subscription-checkout` | PASS |
| `technician-seat-charge` | PASS |
| `expired-plan-keeps-export` | PASS |
| `durable-runtime-storage` | PASS |
| `visible-build-identity` | PASS |
| `container-runtime` | PASS |

Result: **37/37 exact claim commands pass.** The live landing page and README
were cross-checked against the registry. Every claim-like sentence is covered
by a listed claim; no claim is untested. F-7-1 and F-7-2 concern wording, not
missing tests.

## Earlier-finding regression audit

Every earlier review, polish report, and the current handoff was read. Public
behavior was checked on the live site, and implementation-specific behavior
was checked in current source and the clean-clone tests.

| Earlier ID | Current confirmation | Status |
| --- | --- | --- |
| F-1-1 | Forward and history navigation focus `main h1`; mobile Back restored y=2050 exactly. | Fixed |
| F-1-2 | Local use plus tenant-isolated firm onboarding, invitations, sync, and conflict handling exist; the related claims pass. | Fixed |
| F-1-3 | Offline copy is limited to the tested sample flow; all registered claims have one tagged test. | Fixed |
| F-1-4 | Exit copy says the local workspace reopens unchanged; live before/after data matched. | Fixed |
| F-1-5 | Every audited route had one route-correct description, canonical, OG title, and Twitter title. | Fixed |
| F-1-6 | `/demo` uses `Demo — Parts Promise`, canonical `/demo`, and is in the sitemap. | Fixed |
| F-1-7 | The first screen states `$39/month plus $8 per active technician`. | Fixed |
| F-1-8 | The task label is “Allocate parts to a job.” | Fixed |
| F-1-9 | The hero caption names actual van, warehouse, and supplier records. | Fixed |
| F-1-10 | The preview label is “Sample job status.” | Fixed |
| F-1-11 | The heading names the visit date and its risk. | Fixed |
| F-1-12 | The process section is “How it works.” | Fixed |
| F-1-13 | The heading says “Check parts before agreeing a visit date.” | Fixed |
| F-1-14 | The first step is “List required parts.” | Fixed |
| F-1-15 | Landing and task controls consistently use “Allocate.” | Fixed |
| F-1-16 | The third step is “Review the visit date.” | Fixed |
| F-1-17 | Theme controls name the resulting theme and meet the 44 px target check. | Fixed |
| F-1-18 | The README heading is “Try it with sample data.” | Fixed |
| F-1-19 | Public copy omits milestone lore and keeps claim IDs in the developer claim section. | Fixed |
| F-1-20 | Unknown paths return a designed HTTP 404 with plain recovery copy and links. | Fixed |
| F-1-21 | Demo labels say “Sample job” and “Required parts and their sources.” | Fixed |
| F-2-1 | Wordmark, Back, reset, and confirmed exit use the isolated demo cleanup path; the exact claim passes. | Fixed |
| F-2-2 | CSV import/template and versioned JSON backup/restore are present and namespace-isolated. | Fixed |
| F-2-3 | Missing job links render 404 title, H1, description, home canonical, and `noindex`. | Fixed |
| F-2-4 | Work sheets expose disclosure state, focus their heading, remain visible on mobile, and restore their trigger. | Fixed |
| F-3-1 | Back/Forward preserve reading position while moving focus to the destination H1. | Fixed |
| F-3-2 | `sample-fixture` checks Riverside Dental, RD-1042, the pump, zero held, and the shortage. | Fixed |
| F-3-3 | Backup and transfer tests compare complete records and preserve the opposite namespace. | Fixed |
| F-3-4 | `csv-template-download` checks filename, type, header, rows, and preview. | Fixed |
| F-3-5 | The banner names the real boundary: the local workspace. | Fixed |
| F-3-6 | Reader copy uses “browser database”; exact IndexedDB names are restricted to developer documentation. | Fixed |
| F-5-1 | Public copy contains no payment-provider, merchant, or refund promise. | Fixed |
| F-5-2 | Sensitive-input wording is narrow and the exact route/request test passes. | Fixed |
| F-5-3 | The release-wide supplier-order boundary and both barcode paths are present and tested. | Fixed |
| F-5-4 | Runtime storage statements are registered and their exact claims pass. | Fixed |
| F-5-5 | README points to registered checks without claiming the registry is complete. | Fixed |
| F-5-16 | Checkout makes no request before the named owner action; its claim passes. | Fixed |
| F-5-6 | No README sentence exceeds 22 words. | Fixed |
| F-5-7 | The long fallback sentence is absent. | Fixed |
| F-5-8 | Public copy says checkout is unavailable and no charge starts. | Fixed |
| F-5-9 | Reader copy consistently uses “firm plan”; “Workshop” is absent. | Fixed |
| F-5-10 | Pricing explains that the owner is included and uses no technician seat. | Fixed |
| F-5-11 | Home title and social titles use “Allocate parts to each job.” | Fixed |
| F-5-12 | Scan a part, explicit camera permission, and manual barcode entry are implemented and tested. | Fixed |
| F-5-13 | Every audited route footer shows the immutable short build identity. | Fixed |
| F-5-14 | Footer says “Built by Param Factory (external site).” | Fixed |
| F-5-15 | Claim-test terminology remains in the README's developer section. | Fixed |
| F-6-1 | Crossing storage modes clears transient state; unique live/demo tokens stay out of the opposite DOM. | Fixed |
| F-6-2 | The tagged sign-in claim rejects expired, wrong-signature, wrong-issuer, wrong-audience, and wrong-tenant tokens. | Fixed |
| F-6-3 | The pricing heading is the accurate “Firm plan pricing.” | Fixed |
| F-6-4 | README states the export limit and wait behavior without “critical bucket.” | Fixed |
| F-6-5 | README says the server starts without extra environment settings. | Fixed |
| F7-01 | Every visible link and button checked across six 390 px routes measured at least 44 × 44 px. | Fixed |
| Earlier unnumbered verification findings | Claim coverage, cache policy, Docker runtime, permission policy, designed 404, and touch targets all pass current checks. | Fixed |

Review 4 had no findings. No earlier numbered finding is unfixed, half-fixed,
or regressed. F-7-1 and F-7-2 are new, narrowly scoped README copy findings.

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/jobs`, `/onboarding`, `/settings/team`,
  `/settings/billing`, `/settings/data`, `/privacy`, and `/terms` return 200.
  An unknown route returns a designed HTTP 404. A missing local job renders the
  correct client-side 404 state and metadata.
- Each stable route has `lang="en"`, one H1, one main landmark, a route-specific
  title, one description, one canonical, route-correct Open Graph/Twitter
  titles, and the consistent header/footer. Privacy and Terms are in every
  footer.
- The SVG favicon, 180 px touch icon, 1200 × 630 OG image, `robots.txt`, and
  sitemap are present. The sitemap lists every stable route.
- Every discovered home, demo, app, account, legal, and external link returned
  200. The deliberate unknown URL alone returned 404.
- Route navigation focuses the new H1. Back restored both H1 focus and the
  prior mobile scroll position.
- The factory URL verifier passed home and demo with no console errors. Axe
  found zero serious or critical violations across nine routes in both light
  and dark themes. Six mobile routes had no visible link or button below
  44 × 44 px.
- The live CSP, HSTS, no-sniff, strict referrer, frame, and permissions headers
  are present. Fonts and scripts are self-hosted.
- The drafting-paper palette, condensed technical type, ruled plates,
  safety-orange marks, and exploded-parts drawing form a distinct service-
  manual identity rather than a generic SaaS template.

## Local verification

- `npm test`: PASS — 23 Vitest tests and 15 Rust/API tests.
- Every one of the 37 exact claim commands: PASS independently from a clean
  clone.
- `npm run check`: PASS — 0 errors and 0 warnings.
- `npm run format:check`: PASS.
- `BUILD_SHA=$(git rev-parse HEAD) npm run build`: PASS; `dist/` produced. Main
  JS is 39.88 KB gzip, deferred sign-in JS is 62.19 KB gzip, and CSS is
  4.24 KB gzip.
- Full Playwright: PASS — 59 passed, 43 intentional project skips, 0 failed.
- Live route/Axe sweep: 72/72 checks passed, followed by a separate 18-route,
  two-theme Axe sweep with zero serious or critical findings.

## Missed leverage and AI check

No additional AI step is justified. Allocation, quantity conservation, and
supplier evidence need deterministic behavior. The brief-implied useful
extensions are already present: barcode entry and camera scan, supplier-date
evidence, reorder suggestions, CSV import/template, JSON backup/restore,
multi-device sync, and explicit conflict handling. No provider key or
decorative AI feature is embedded.

## What would make this perfect

Apply the two exact README rewrites in F-7-1 and F-7-2, then rerun the copy
audit and the claim registry check. No other product, demo, claim, privacy,
route, accessibility, visual, or build change was identified.
