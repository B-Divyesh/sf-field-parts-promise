# Adversarial first-read review 4 — Parts Promise

Work order: `field-parts-promise-review-4`

Reviewed: 2026-08-29 UTC

Repository HEAD: `b06568962d6855906cba3b98823f0ae5e985d2f9`

Live build from `/health`: `2def11baf4c5473469fa8ae02c50ebfc25e2040c`

The commits after the live build contain verification documentation and
artifacts only. Product source is identical.

## Verdict

**PASS — zero findings, zero untested claims.**

The cold first screen is clear at 390 px and desktop. The sample opens in one
click with realistic data already in use, remains isolated, resets correctly,
and works offline. All 18 declared claim commands pass independently from a
clean clone. Every earlier numbered finding remains fixed in the live build and
source. The route, metadata, link, accessibility, privacy, build, and product-
identity checks pass.

## Cold first read

Fresh Chromium contexts opened the production home page without scrolling at
390 × 844 and 1440 × 900.

- What it does: allocates required parts to a job so a visit date is promised
  only when those parts are held.
- For whom: solo tradespeople whose visit dates depend on required parts.
- What to click first: **Try it with sample data**. The adjacent result says,
  “Opens Riverside Dental with one missing pump.”

All three answers are present before scrolling at both widths. At 390 px, the
three facts also remain above the fold: the sample allocation works offline,
sample changes stay in the browser, and this one-browser release is free. The
page has no horizontal overflow, console error, or page error. The cold load
makes six same-origin GET requests.

Evidence:

- `qa-artifacts/review-4-first-read-mobile.png`
- `qa-artifacts/review-4-first-read-desktop.png`
- `qa-artifacts/review-4-live.json`

## Complete copy audit

Counts split on whitespace and treat hyphenated terms, route tokens, and URLs
as one word. Standalone punctuation is not a word. Shell code blocks are
commands, not sentences. The tables include headings, labels, actions, image
alternative text, and sentence fragments so the audit does not hide unclear
copy outside punctuated prose.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass: action names its destination |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation destination |
| Jobs | 1 | Pass: navigation destination |
| Privacy | 1 | Pass: navigation destination |
| Use dark theme | 3 | Pass: result-naming action |
| Parts Promise — Hold parts for each job | 7 | Pass: route announcement/title |
| Allocate parts to a job | 5 | Pass: task label |
| Promise dates from parts held for the job | 8 | Pass: job-first H1 |
| For solo tradespeople who need a parts check before agreeing a visit date. | 13 | Pass: audience and changed outcome |
| Try it with sample data | 5 | Pass: result-naming action |
| Opens Riverside Dental with one missing pump. | 7 | Pass: `sample-fixture` |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| Free for one browser in this release. | 8 | Pass: `free-browser-release` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: useful image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: `allocation-keeps-source`, `local-workspace-flow` |
| Sample job status | 3 | Pass: section name |
| See why a visit date is at risk | 9 | Pass: section heading |
| RD-1042 needs one condensate pump. | 5 | Pass: `sample-fixture` |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: result-naming action |
| RD-1042 · Riverside Dental | 3 | Pass: `sample-fixture` |
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
| What this first release does not do | 7 | Pass: section name |
| It does not sync between people, scan barcodes, place supplier orders, or take payment. | 14 | Pass: `m1-feature-boundaries` |
| It keeps one local workspace and a separate demo. | 9 | Pass: `demo-reset-isolated`, `indexeddb-local-storage` |
| Read how local data works | 5 | Pass: result-naming action |
| Promise job dates from parts held for the job. | 8 | Pass: product statement |
| Privacy | 1 | Pass: footer destination |
| Terms | 1 | Pass: footer destination |
| Built by Param Factory | 4 | Pass: attribution destination |
| Browser-only release | 2 | Pass: scope fact |

No landing unit exceeds 22 words. No unit contains a banned marketing term,
jargon substitution, metaphor heading, mood slogan, or inconsistent product
term. Every action either names its result or is an unambiguous navigation
destination.

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass: product name |
| Parts Promise helps a solo tradesperson check whether a required part is held before agreeing a visit date. | 18 | Pass: purpose and audience |
| This browser-only release keeps jobs in one browser. | 8 | Pass: `indexeddb-local-storage`, `m1-feature-boundaries` |
| Try the sample job | 4 | Pass: heading |
| Open `/?demo=1` (for example, `http://127.0.0.1:4173/?demo=1` while developing). | 7 | Pass: instruction |
| Riverside Dental job `RD-1042` opens with one missing condensate pump. | 10 | Pass: `sample-fixture` |
| Allocate the pump from Van 2 to change the job from Date at risk to Parts in hand. | 18 | Pass: `promise-status-from-allocation` |
| The app suggests a reorder when Van 2 reaches zero pumps. | 11 | Pass: `reorder-after-allocation` |
| It never places an order. | 5 | Pass: `reorder-after-allocation` |
| The sample uses a separate browser database named `parts-promise-demo-v1`. | 9 | Pass: `indexeddb-local-storage` |
| Reset demo restores the bundled sample. | 6 | Pass: `demo-reset-isolated` |
| Start for real discards sample changes and reopens the unchanged `parts-promise-live-v1` workspace. | 11 | Pass: `demo-reset-isolated` |
| Leaving through the wordmark or browser Back also deletes the demo workspace. | 12 | Pass: `demo-reset-isolated` |
| Reopening the demo always starts with the bundled sample. | 9 | Pass: `demo-reset-isolated` |
| The sample job and allocation flow work offline after the first visit. | 12 | Pass: `offline-reload` |
| This browser-only release is free. | 5 | Pass: `free-browser-release` |
| It has no sign-in, team sync, barcode scan, supplier-order action, or checkout. | 12 | Pass: `m1-feature-boundaries` |
| Run and verify | 3 | Pass: heading |
| Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass: developer requirement |
| Run the complete local suite before shipping: | 7 | Pass: instruction |
| `npm run build` writes `dist/`. | 5 | Pass: observed build result |
| Import, backup, and privacy | 4 | Pass: heading |
| Import workspace previews CSV jobs, required parts, and sources. | 9 | Pass: `csv-import-validation` |
| It reports each invalid row before saving. | 7 | Pass: `csv-import-validation` |
| Download the CSV template from the import sheet. | 8 | Pass: `csv-template-download` |
| Export workspace downloads a versioned JSON backup with every job, required part, source, allocation, and timestamp. | 16 | Pass: `workspace-backup-roundtrip` |
| Import that JSON file to restore the workspace after a preview. | 11 | Pass: `workspace-backup-roundtrip` |
| Imports and exports use only the browser database for the current mode. | 12 | Pass: `demo-transfer-isolated` |
| The demo makes only same-origin GET requests and never asks for camera access. | 13 | Pass: `demo-network-privacy` |
| Browser site-data controls remove local records. | 6 | Pass: `clear-local-records` |
| Deployment | 1 | Pass: heading |
| The Rust server starts with `PORT` only, defaults to `8080`, and serves `/health`. | 13 | Pass: `container-runtime` |
| Unknown paths return HTTP 404 with a designed recovery page. | 10 | Pass: `container-runtime` |
| The factory deploys the product to `https://field-parts-promise.sociobot.in`. | 7 | Pass: inspected production target |
| Claim tests | 2 | Pass: heading |
| Every visitor-facing claim has one sandbox test. | 7 | Pass: registry and copy cross-check |
| Run the commands recorded in `.factory/claims.json` after `npm ci`. | 9 | Pass: instruction |
| License | 1 | Pass: heading |
| MIT © 2026 Sociobot (Param Factory). | 6 | Pass: license attribution |

No README unit exceeds 22 words. No banned marketing term, unexplained jargon,
metaphor heading, mood slogan, or inconsistent product term appears. The
canonical terms remain **job**, **required part**, **allocation**, **source**,
**supplier order**, **visit date**, **promise status**, and **solo
tradesperson**.

## Demo and sandbox

- One click from `/` opens `/?demo=1`.
- The first 390 px screen already shows **Riverside Dental parts**, `RD-1042`,
  the visit date, **Date at risk**, and the missing condensate pump.
- The persistent banner says “Demo — sample data; nothing is saved to your
  local workspace” and provides **Reset demo** and **Start for real**.
- Allocating one pump from Van 2 changes the status to **Parts in hand**.
- Reset restores **Date at risk** and the one-unit shortage.
- The clean claim flow creates a distinct live job, changes the demo, and
  confirms wordmark exit, browser Back, reset, and confirmed exit remove or
  restore only `parts-promise-demo-v1`. The live workspace remains byte-for-
  byte unchanged.
- The request log contains only same-origin GET/HEAD requests. Camera access is
  never requested. The offline claim reloads the service-worker-controlled
  sample and completes allocation without a network.

Evidence: `qa-artifacts/review-4-demo-first-screen-mobile.png` and
`qa-artifacts/review-4-live.json`.

## Declared claim results

Repository HEAD was cloned to
`/tmp/field-parts-promise-review-4-hnLvp6`. After `npm ci`, every exact `test`
command in `.factory/claims.json` ran separately.

| Claim ID | Result | Observable evidence |
| --- | --- | --- |
| `sample-fixture` | PASS | The clean demo contains Riverside Dental, RD-1042, the condensate pump, zero held, and a one-unit shortage. |
| `promise-status-from-allocation` | PASS | Date at risk becomes Parts in hand only after the missing allocation. |
| `allocation-keeps-source` | PASS | Reload retains job, source, quantity, unit, updater, and checked time. |
| `supplier-quantity-conserved` | PASS | A consumed one-unit supplier order cannot cover a second job. |
| `reorder-after-allocation` | PASS | Van 2 reaches zero, a reorder is suggested, and no order or network write occurs. |
| `demo-reset-isolated` | PASS | Reset and all exit paths discard sample changes while preserving a populated live workspace. |
| `offline-reload` | PASS | The cached sample reloads and accepts allocation offline. |
| `local-workspace-flow` | PASS | A live job/source can be created, allocated, undone, given supplier evidence, and reviewed. |
| `m1-feature-boundaries` | PASS | No sign-in, sync, scan, order, buy, or checkout action is exposed. |
| `free-browser-release` | PASS | Free copy is visible and no payment action exists. |
| `indexeddb-local-storage` | PASS | Records appear only in the named demo and live browser databases. |
| `demo-network-privacy` | PASS | All requests are same-origin reads and camera access is never requested. |
| `clear-local-records` | PASS | Browser storage clearing removes the created live job. |
| `workspace-backup-roundtrip` | PASS | Export and restore deep-compare every record, field, and timestamp. |
| `csv-import-validation` | PASS | Valid rows import; an invalid quantity reports its row and disables saving. |
| `demo-transfer-isolated` | PASS | Demo export contains only sample data; demo import leaves live data byte-equivalent. |
| `csv-template-download` | PASS | Filename, `text/csv` type, exact header, example records, and re-import all pass. |
| `container-runtime` | PASS | The real server starts with `PORT`, serves health/build/app, exposes no job-data API, and returns HTTP 404 for an unknown path. |

Result: **18/18 exact commands pass.** The landing page, README, demo, privacy,
terms, and working interface were cross-checked against the registry. No
claim-like sentence is unlisted, and no listed claim lacks its exact tagged
test.

## Earlier finding verification

I read `.factory/review-1.md`, `.factory/review-2.md`,
`.factory/review-3.md`, all three polish reports, both handoffs, and the
verification history. Each prior finding was checked against the live site and
current code rather than its recorded closure status.

| Earlier ID | Current result | Live/code confirmation |
| --- | --- | --- |
| F-1-1 | Fixed | Forward, Back, and deep-link navigation focus `main h1`; `syncRoute()` awaits the workspace and `focusPageHeading()`. |
| F-1-2 | Fixed as specified | The first screen and README explicitly target a solo tradesperson using one browser; no team-sync readiness is implied. |
| F-1-3 | Fixed | Offline wording is limited to the sample allocation flow; `offline-reload` proves that scope. |
| F-1-4 | Fixed | Exit copy says the live workspace reopens unchanged; a populated live record survives. |
| F-1-5 | Fixed | Each checked route has exactly one description, canonical, OG, and Twitter value. |
| F-1-6 | Fixed | `/demo` uses `Demo — Parts Promise`, canonical `/demo`, and appears in the sitemap. |
| F-1-7 | Fixed | The first screen states “Free for one browser in this release”; its claim passes. |
| F-1-8 | Fixed | The landing label is “Allocate parts to a job.” |
| F-1-9 | Fixed | The hero caption names the van, warehouse, or supplier record. |
| F-1-10 | Fixed | The preview label is “Sample job status.” |
| F-1-11 | Fixed | The heading names a visit date at risk. |
| F-1-12 | Fixed | The section label is “How it works.” |
| F-1-13 | Fixed | The heading says “Check parts before agreeing a visit date.” |
| F-1-14 | Fixed | The first step is “List required parts.” |
| F-1-15 | Fixed | The second step is “Allocate each part.” |
| F-1-16 | Fixed | The third step is “Review the visit date.” |
| F-1-17 | Fixed | Theme controls say “Use dark theme” or “Use light theme.” |
| F-1-18 | Fixed | The README heading is “Try the sample job.” |
| F-1-19 | Fixed | Public copy says “browser-only release”; internal claim IDs remain in developer material. |
| F-1-20 | Fixed | The live HTTP 404 says “Page not found” and offers jobs/home recovery. |
| F-1-21 | Fixed | Demo labels say “Sample job” and “Required parts and their sources.” |
| F-2-1 | Fixed | Wordmark, Back, reset, and confirmed exit delete/reset demo data before live mode; re-entry starts clean. |
| F-2-2 | Fixed | CSV import plus versioned JSON backup/restore are present and isolated to the active mode. |
| F-2-3 | Fixed | A missing local job gets Page not found H1/title/OG, home canonical, and `noindex`. |
| F-2-4 | Fixed | Every work-sheet trigger exposes disclosure state; the sheet becomes visible, receives heading focus, and restores trigger focus. |
| F-3-1 | Fixed | Live mobile Back restores `scrollY=1642` and H1 focus; source persists coordinates with manual restoration. |
| F-3-2 | Fixed | `sample-fixture` now asserts the customer, job, part, held quantity, and shortage. |
| F-3-3 | Fixed | Backup deep-comparison and demo export/live byte-equivalence are asserted. |
| F-3-4 | Fixed | `csv-template-download` checks the actual download and imports it. |
| F-3-5 | Fixed | The banner names the real boundary: “your local workspace.” |
| F-3-6 | Fixed | README consistently calls the store a browser database. |
| F7-01 | Fixed | The full mobile route test measures visible links/buttons at 44 × 44 px with grouped spacing. |

The earlier unnumbered issues also remain fixed: immutable caching applies only
to hashed assets; HTML and `sw.js` revalidate; the Rust image/runtime contract
passes; Permissions-Policy blocks camera/microphone/geolocation; an unknown
document receives HTTP 404; the mobile steps use their full card width; and the
live health endpoint identifies the deployed build.

## Structure, accessibility, and delivery

| Check | Result |
| --- | --- |
| Titles | PASS: home follows “Product — what it does”; Demo, Jobs, Privacy, Terms, and 404 have route-specific titles, all under 60 characters. |
| One H1 and landmarks | PASS on home, demo, jobs, privacy, terms, and 404; `lang=en`, skip link, header/nav/main/footer are present. |
| Metadata | PASS: one route-correct description, canonical, OG, and Twitter set; favicon, 180 px touch icon, and 1200 × 630 OG image are present. |
| Routing | PASS: direct loads, reload, Back/Forward focus, and stored scroll position work. |
| 404 | PASS: unknown route returns HTTP 404 with the product style and jobs/home recovery. |
| Links | PASS: every actionable internal and external destination resolves; the 404 skip link correctly remains within the expected 404 document. |
| Header/footer | PASS: consistent wordmark/nav and Privacy/Terms/factory/build-scope footer are present on app routes. |
| Sitemap/robots | PASS: `/`, `/demo`, `/jobs`, `/privacy`, and `/terms` are listed; robots points to the sitemap. |
| Accessibility | PASS: live axe scan reports zero serious/critical issues on five stable routes; factory URL verification reports one H1, one main, no missing alt, and no unnamed button. |
| Keyboard/mobile | PASS: full keyboard demo flow, modal focus containment/restoration, disclosure focus, 44 px targets, 390 px layout, and reduced motion tests pass. |
| Privacy | PASS: no analytics, third-party script/font, provider key, cross-origin demo request, write request, or camera request appears. |
| Visual identity | PASS: the asymmetric exploded-parts drawing, technical type, ruled paper, leader lines, and safety-orange registration marks are product-specific, not a generic SaaS template. |
| Bundle/build | PASS: `dist/` builds; client JS is 93.16 kB raw / 31.39 kB gzip and CSS is 16.98 kB raw / 3.96 kB gzip. |

The live report's sole console entry is Chromium's expected failed-resource
message for the deliberately requested HTTP 404 document. Normal routes,
including the cold home and demo loads, produce no console or page error.

`/opt/fleet/lib/verify-url.sh` passed against `/` and `/?demo=1`. Evidence is
under `qa-artifacts/review-4-verify-home/` and
`qa-artifacts/review-4-verify-demo/`.

## Local verification

- `npm test` — PASS: 15 Vitest tests and 3 Rust tests.
- All 18 exact claim commands from the clean clone — PASS.
- `npm run build` — PASS: Svelte check reports 0 errors/warnings, `dist/` is
  produced, and the locked Rust release binary builds.
- `npm run test:e2e -- --retries=0` — PASS: 39 checks passed and 23
  cross-project checks were intentionally skipped.
- Live first-read/demo/request/route/link/history/axe sweep — PASS.

## Missed leverage and AI check

The spreadsheet migration and local-backup gap from review 2 is implemented as
validated CSV import and versioned JSON export/restore. The current offer
plainly targets one solo tradesperson in one browser and discloses no team sync,
barcode scan, ordering, or checkout before use. Within that honest boundary,
the brief does not imply another required capability that blocks the job.

Runtime AI is not warranted. Allocation and supplier evidence must remain
deterministic and auditable. No decorative AI feature, embedded provider key,
Azure endpoint, analytics endpoint, or payment-provider integration exists.

## What would make this perfect

Nothing remains in this review's scope. The first read, sample path, claim
contract, demo isolation, routing, copy, accessibility, privacy, visual
identity, and clean build all pass with no finding to fix.
