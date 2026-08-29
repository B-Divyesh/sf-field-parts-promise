# Adversarial first-read review 3 — Parts Promise

Work order: `field-parts-promise-review-3`

Reviewed: 2026-08-29 UTC

Repository base: `5552f40b97dc8cbe66553232f2656c4cb9eab006`

Live build from `/health`: `92a940321eb16b2fcea57063a70c19e147942358`

## Verdict

**FAIL — 1 blocking, 2 high, 1 medium, and 2 low findings remain.**

The first screen is clear, the one-click demo is realistic and isolated, all 16
declared claim commands pass from a clean checkout, and every earlier numbered
review finding remains fixed. The review still fails because Back does not
restore the visitor's prior scroll position, some public sample and CSV
statements are absent from the claims registry, and two registered transfer
claims are broader than their assertions.

## Cold first read

Fresh Chromium contexts opened the live URL without scrolling at 390 × 844 and
1440 × 900. Screenshots are
`qa-artifacts/review-3-first-read-mobile.png` and
`qa-artifacts/review-3-first-read-desktop.png`.

- What it does: it lets a solo tradesperson allocate required parts to a job
  before promising the visit date.
- For whom: solo tradespeople whose visit dates depend on having the required
  parts.
- What to click first: **Try it with sample data**. The adjacent text says,
  “Opens Riverside Dental with one missing pump.”

This gate passes on both viewports. At 390 px the headline, audience sentence,
primary action, action outcome, and all three facts appear before scrolling.
The cold load produced no console or page error and no horizontal overflow.

## Findings

### Blocking

#### F-3-1 — Back and Forward discard the prior scroll position

- Exact location: live `/` → footer **Privacy** → browser Back;
  `src/App.svelte`, `syncRoute()`, `navigate()`, and `focusPageHeading()`.
- Evidence: after scrolling the landing page to its maximum position, mobile
  started at `scrollY=1642` and desktop at `scrollY=1068`. After visiting
  Privacy and pressing Back, both returned to `scrollY=0`. Focus correctly
  moved to the landing H1, but the previous reading position was lost.
- Why this fails: the supplied site-structure contract requires back/forward
  navigation to restore scroll and focus. A visitor following a footer link is
  returned to the start of a long page instead of where they left it. This is
  broken routing, which the work order classifies as blocking.
- Concrete fix: store `{scrollX, scrollY}` in the current history entry before
  each push, create the new entry at the top, and restore the stored coordinates
  on `popstate` after rendering. Focus the destination H1 with
  `{preventScroll: true}` before applying the stored position. Add phone and
  desktop tests for Back and Forward that assert both H1 focus and the previous
  coordinates within a small tolerance.

### High

#### F-3-2 — The advertised sample contents are unlisted claims

- Exact quotes: landing, “Opens Riverside Dental with one missing pump” and
  “RD-1042 needs one condensate pump”; README, “Riverside Dental job `RD-1042`
  opens with one missing condensate pump.”
- Evidence: `.factory/claims.json` has no sample-fixture claim. The closest
  entry, `promise-status-from-allocation`, asserts only the status before and
  after allocation. Its test does not assert the customer, job number, part
  description, or displayed shortage.
- Why this fails: these concrete statements are what the visitor relies on to
  decide whether the demo is worth opening. A changed or incomplete fixture can
  leave every registered claim command green while making this copy false.
- Concrete fix: add one `sample-fixture` claim and one tagged test that enters
  `/demo` from a clean context and asserts **Riverside Dental**, `RD-1042`,
  **Condensate pump**, and the one-unit shortage. Map all three public sentences
  to that entry.

#### F-3-3 — Passing transfer tests do not prove the full registered claims

- Exact locations: `.factory/claims.json` entries
  `workspace-backup-roundtrip` and `demo-transfer-isolated`; README, “Export
  workspace downloads a versioned JSON backup with every job, required part,
  source, allocation, and timestamp” and “Imports and exports use only the
  current live or demo IndexedDB database.”
- Evidence: `workspace-backup-roundtrip` checks that four arrays exist, that
  allocations are non-empty, that preview counts match, and that the restored
  status is at risk. It never compares every exported/restored record or any
  timestamp. `demo-transfer-isolated` exercises only import; it never performs
  the export named by its claim.
- Why this fails: a backup could omit or alter fields and timestamps, or an
  export could cross the demo/live boundary, while both claim commands still
  pass. The claims contract requires the promised observable result, not a
  nearby result.
- Concrete fix: deep-compare all jobs, requirements, sources, allocations, and
  timestamps before export and after restore. In the isolation test, seed a
  distinct live workspace, export in demo, inspect the downloaded sample, then
  reopen live and assert byte-for-byte-equivalent live records. Keep one tagged
  test for each claim.

### Medium

#### F-3-4 — The downloadable CSV template is an unlisted claim

- Exact quote/location: README, “Download the CSV template from the import
  sheet”; `/jobs` import sheet, **Download CSV template**.
- Evidence: no `.factory/claims.json` entry names the template. The
  `csv-import-validation` test uploads constructed CSV strings and never clicks
  the download control or inspects its result.
- Why this fails: the README tells a user that a starting template is
  available, but the required claim suite cannot detect a missing, empty, or
  incompatible download.
- Concrete fix: add a `csv-template-download` claim and tagged test that checks
  the filename, CSV media type, exact header, and one valid job/required-part/
  source example that can be imported without an error. Alternatively, remove
  the public sentence and control.

### Low

#### F-3-5 — The demo banner names a firm that the product does not have

- Exact quote/location: live demo banner at 390 px, “Demo — sample data,
  nothing is saved to a firm.”
- Why this fails: the release has no firm account or firm workspace; it has a
  live local browser workspace. “A firm” is inconsistent with both the solo
  audience and the rest of the storage copy.
- Concrete rewrite: “Demo — sample data; nothing is saved to your local
  workspace.”

#### F-3-6 — README uses two technical names for the same browser store

- Exact quotes: “The sample uses the separate `parts-promise-demo-v1`
  IndexedDB workspace” and “Imports and exports use only the current live or
  demo IndexedDB database.”
- Why this fails: “IndexedDB” is browser implementation jargon, and alternating
  between “workspace” and “database” makes the boundary harder to scan.
- Concrete rewrite: “The sample uses a separate browser database named
  `parts-promise-demo-v1`.” Then: “Imports and exports use only the browser
  database for the current mode.” Keep the implementation name in the privacy
  or developer section once.

## Complete copy audit

Counts split on whitespace and treat hyphenated terms, route tokens, and
commands as one word. Code blocks are commands rather than sentences. No unit
exceeds 22 words. No banned marketing adjective appears.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation |
| Jobs | 1 | Pass: navigation |
| Privacy | 1 | Pass: navigation |
| Use dark theme | 3 | Pass: result-naming action |
| Parts Promise — Hold parts for each job | 7 | Pass: route announcement/title |
| Allocate parts to a job | 5 | Pass |
| Promise dates from parts held for the job | 8 | Pass: job-first H1 |
| For solo tradespeople who need a parts check before agreeing a visit date. | 13 | Pass |
| Try it with sample data | 5 | Pass: result-naming action |
| Opens Riverside Dental with one missing pump. | 7 | Flag: F-3-2, unlisted sample claim |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| Free for one browser in this release. | 8 | Pass: `free-browser-release` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: useful image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: `allocation-keeps-source` and `local-workspace-flow` |
| Sample job status | 3 | Pass: section name |
| See why a visit date is at risk | 9 | Pass: section heading |
| RD-1042 needs one condensate pump. | 5 | Flag: F-3-2, unlisted sample claim |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: result-naming action |
| RD-1042 · Riverside Dental | 3 | Pass: sample label; covered by F-3-2 fix |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass: sample status; covered by F-3-2 fix |
| How it works | 3 | Pass: section name |
| Check parts before agreeing a visit date | 8 | Pass: section heading |
| List required parts | 3 | Pass |
| Add each required part to the job. | 7 | Pass: `local-workspace-flow` |
| Allocate each part | 3 | Pass |
| Allocate it from a van or warehouse source. | 8 | Pass: `local-workspace-flow` |
| Review the visit date | 4 | Pass |
| Read the reason before you agree the visit date. | 9 | Pass: `local-workspace-flow` |
| What this first release does not do | 7 | Pass: section heading |
| It does not sync between people, scan barcodes, place supplier orders, or take payment. | 14 | Pass: `m1-feature-boundaries` |
| It keeps one local workspace and a separate demo. | 9 | Pass: `demo-reset-isolated` and `indexeddb-local-storage` |
| Read how local data works | 5 | Pass: result-naming action |
| Promise job dates from parts held for the job. | 8 | Pass: footer statement |
| Terms | 1 | Pass: navigation |
| Built by Param Factory | 4 | Pass: attribution link |
| Browser-only release | 2 | Pass: scope fact |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass |
| Parts Promise helps a solo tradesperson check whether a required part is held before agreeing a visit date. | 18 | Pass |
| This browser-only release keeps jobs in one browser. | 8 | Pass: `indexeddb-local-storage` |
| Try the sample job | 4 | Pass: heading |
| Open `/?demo=1` (for example, `http://127.0.0.1:4173/?demo=1` while developing). | 7 | Pass: instruction |
| Riverside Dental job `RD-1042` opens with one missing condensate pump. | 10 | Flag: F-3-2, unlisted sample claim |
| Allocate the pump from Van 2 to change the job from Date at risk to Parts in hand. | 18 | Pass: `promise-status-from-allocation` |
| The app suggests a reorder when Van 2 reaches zero pumps. | 11 | Pass: `reorder-after-allocation` |
| It never places an order. | 5 | Pass: `reorder-after-allocation` |
| The sample uses the separate `parts-promise-demo-v1` IndexedDB workspace. | 8 | Flag: F-3-6, jargon and inconsistent term |
| Reset demo restores the bundled sample. | 6 | Pass: `demo-reset-isolated` |
| Start for real discards sample changes and reopens the unchanged `parts-promise-live-v1` workspace. | 12 | Pass: `demo-reset-isolated` |
| Leaving through the wordmark or browser Back also deletes the demo workspace. | 12 | Pass: `demo-reset-isolated` |
| Reopening the demo always starts with the bundled sample. | 9 | Pass: `demo-reset-isolated` |
| The sample job and allocation flow work offline after the first visit. | 12 | Pass: `offline-reload` |
| This browser-only release is free. | 5 | Pass: `free-browser-release` |
| It has no sign-in, team sync, barcode scan, supplier-order action, or checkout. | 12 | Pass: `m1-feature-boundaries` |
| Run and verify | 3 | Pass: heading |
| Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass: developer context |
| Run the complete local suite before shipping: | 7 | Pass: instruction |
| `npm run build` writes `dist/`. | 5 | Pass: observed build result |
| Import, backup, and privacy | 4 | Pass: heading |
| Import workspace previews CSV jobs, required parts, and sources. | 9 | Pass: `csv-import-validation` |
| It reports each invalid row before saving. | 7 | Pass: `csv-import-validation` |
| Download the CSV template from the import sheet. | 8 | Flag: F-3-4, unlisted claim |
| Export workspace downloads a versioned JSON backup with every job, required part, source, allocation, and timestamp. | 16 | Flag: F-3-3, test does not assert every record/timestamp |
| Import that JSON file to restore the workspace after a preview. | 11 | Pass in part; exact-data coverage belongs in F-3-3 |
| Imports and exports use only the current live or demo IndexedDB database. | 12 | Flags: F-3-3 and F-3-6 |
| The demo makes only same-origin GET requests and never asks for camera access. | 13 | Pass: `demo-network-privacy` |
| Browser site-data controls remove local records. | 6 | Pass: `clear-local-records` |
| Deployment | 1 | Pass: heading |
| The Rust server starts with `PORT` only, defaults to `8080`, and serves `/health`. | 13 | Pass: `container-runtime` |
| Unknown paths return HTTP 404 with a designed recovery page. | 10 | Pass: `container-runtime` and live check |
| The factory deploys the product to `https://field-parts-promise.sociobot.in`. | 7 | Pass: deployment instruction and reviewed target |
| Claim tests | 2 | Pass: heading |
| Every visitor-facing claim has one sandbox test. | 7 | Flag: contradicted by F-3-2 through F-3-4 |
| Run the commands recorded in `.factory/claims.json` after `npm ci`. | 9 | Pass: instruction |
| License | 1 | Pass: heading |
| MIT © 2026 Sociobot (Param Factory). | 6 | Pass |

### Terminology check

The product consistently uses **job**, **required part**, **allocation**,
**source**, **supplier order**, **visit date**, **promise status**, and **solo
tradesperson**. F-3-5 covers the lone “firm” mismatch. F-3-6 covers the README's
storage implementation terminology.

## Demo and sandbox verification

- One click from `/` opened `/?demo=1` at 390 px. The first resolved screen
  already showed **Riverside Dental parts**, `RD-1042`, the visit date, **Date
  at risk**, and “Condensate pump needs 1 each.” Screenshot:
  `qa-artifacts/review-3-demo-first-screen-mobile.png`.
- The persistent banner showed **Demo — sample data**, **Reset demo**, and
  **Start for real**.
- Allocating one pump from Van 2 changed the status to **Parts in hand**.
- Reset restored **Date at risk** and the one-unit pump shortage.
- A live job named “Review Three Live” was created before demo entry. Leaving
  through **Start for real** removed `parts-promise-demo-v1`, retained only
  `parts-promise-live-v1`, and showed the live job unchanged.
- The exercised live flow made 12 requests. Every request was a same-origin
  GET/HEAD. No camera call, console error, or page error occurred.
- The clean `offline-reload` claim reloaded the service-worker-controlled demo
  offline and completed the allocation.

Result: the demo itself passes. Findings F-3-2 through F-3-4 concern the claim
contract, not a failed sample interaction.

## Declared claim results

The repository was cloned to
`/tmp/field-parts-promise-review3-clean-BThYX1`, followed by `npm ci`. Each
exact `test` command from `.factory/claims.json` was run separately.

| Claim ID | Result | Observable evidence |
| --- | --- | --- |
| `promise-status-from-allocation` | PASS | Date at risk became Parts in hand after the final pump allocation. |
| `allocation-keeps-source` | PASS | Job, Van 2, quantity, unit, updater, and checked time survived reload. |
| `supplier-quantity-conserved` | PASS | A consumed one-unit supplier order was unavailable to a second job. |
| `reorder-after-allocation` | PASS | Van 2 reached zero, suggested review, and created no order request. |
| `demo-reset-isolated` | PASS | Wordmark, Back, Reset, and confirmed exit removed/reset demo while preserving a live job. |
| `offline-reload` | PASS | The cached demo reloaded and accepted allocation offline. |
| `local-workspace-flow` | PASS | Create, source, allocate, undo, supplier evidence, and status review completed. |
| `m1-feature-boundaries` | PASS | No sign-in, sync, scan, order, buy, or checkout action was exposed. |
| `free-browser-release` | PASS | Free copy appeared and no payment action existed. |
| `indexeddb-local-storage` | PASS | Named demo and live databases were observed; Van 2 allocation was stored. |
| `demo-network-privacy` | PASS | All requests were same-origin GET/HEAD; camera was not requested. |
| `clear-local-records` | PASS | Browser storage clearing removed the created live job. |
| `workspace-backup-roundtrip` | PASS command; incomplete assertion | The command restored counts/status but did not compare every record/timestamp; F-3-3. |
| `csv-import-validation` | PASS | Valid rows imported and an invalid row number blocked saving. |
| `demo-transfer-isolated` | PASS command; incomplete assertion | Demo import preserved live data, but export isolation was not exercised; F-3-3. |
| `container-runtime` | PASS | The server started with `PORT`, served health/app, rejected job data, and returned 404. |

Result: **16/16 commands exit successfully.** This does not close the unlisted
and under-asserted claims in F-3-2 through F-3-4.

## Earlier finding verification

I read `.factory/review-1.md`, `.factory/review-2.md`,
`.factory/polish-1.md`, `.factory/polish-2.md`, `.factory/handoff-m1.md`, and
the current `.factory/handoff.md`. Each earlier numbered finding was checked
against the live site and current source.

| Earlier finding | Current result | Evidence |
| --- | --- | --- |
| F-1-1 route-change H1 focus | Fixed | Forward and Back focus `main h1`; full browser test passes. F-3-1 is the separate required scroll-restoration behavior. |
| F-1-2 firm audience mismatch | Fixed as specified | Landing and README say solo tradesperson/one browser and disclose no team sync. |
| F-1-3 overbroad offline/legal claims | Fixed | Copy limits offline behavior to the sample allocation; the exact claim passes. |
| F-1-4 false empty-workspace exit copy | Fixed | Exit copy says the local workspace reopens unchanged; populated live record survived. |
| F-1-5 duplicate route metadata | Fixed | Each checked route has one route-correct description, canonical, OG, and Twitter set. |
| F-1-6 `/demo` title and sitemap | Fixed | Live title is `Demo — Parts Promise`; `/demo` is canonical and in the sitemap. |
| F-1-7 missing current price | Fixed | First screen says “Free for one browser in this release”; claim passes. |
| F-1-8 revision lore | Fixed | Landing label is “Allocate parts to a job.” |
| F-1-9 leader jargon | Fixed | Caption names van, warehouse, and supplier records. |
| F-1-10 sample preview label | Fixed | Label is “Sample job status.” |
| F-1-11 ambiguous date heading | Fixed | Heading is “See why a visit date is at risk.” |
| F-1-12 mood section label | Fixed | Label is “How it works.” |
| F-1-13 abstract promise heading | Fixed | Heading names checking parts before a visit date. |
| F-1-14 vague List step | Fixed | “List required parts.” |
| F-1-15 vague Hold step | Fixed | Landing step is “Allocate each part.” |
| F-1-16 vague Review step | Fixed | “Review the visit date.” |
| F-1-17 theme jargon | Fixed | “Use dark theme” / “Use light theme.” |
| F-1-18 README Try heading | Fixed | “Try the sample job.” |
| F-1-19 public M1/raw claim IDs | Fixed | Public explanation says browser-only release; claim IDs remain in developer material. |
| F-1-20 metaphor-only 404 | Fixed | Live 404 says “Page not found” and offers jobs/home recovery. |
| F-1-21 technical demo labels | Fixed | “Sample job” and “Required parts and their sources.” |
| F-2-1 demo edits survived ordinary exits | Fixed | Wordmark and Back delete demo data; clean re-entry is Date at risk. |
| F-2-2 no import/export | Fixed in product | CSV import, JSON backup/restore, and active-workspace isolation exist. F-3-3/F-3-4 concern claim coverage. |
| F-2-3 missing-job metadata | Fixed | Missing local job shows noindex 404 metadata and home canonical. |
| F-2-4 unannounced mobile forms | Fixed | Triggers expose disclosure state; forms scroll into view, receive focus, and restore it on close. |
| F7-01 handoff: mobile link targets | Fixed | Every visible live link/button on six routes in both themes measured at least 44 × 44 px. |

The earlier unnumbered checks also remain fixed: hashed assets are immutable,
`sw.js`/HTML are not cached immutably, the Rust image/runtime policy is intact,
Permissions-Policy is present, unknown routes return HTTP 404, the mobile steps
use full card width, and live `/health` identifies the deployed code candidate.
No earlier finding is reissued under its old ID.

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/jobs`, `/privacy`, `/terms`, the server 404, and a missing
  local job each have one H1, route-correct title/description/canonical/OG
  metadata, favicon/touch icon, header, footer, Privacy, and Terms.
- The server returns HTTP 404 for an unknown document route. The page has plain
  recovery copy and working **Open jobs** / **Go to home** actions.
- All discovered actionable links resolve. The skip link on an HTTP 404 keeps
  that document's expected 404 status; it is an in-document target, not a dead
  destination.
- H1 focus works on forward and history navigation. F-3-1 records the missing
  scroll restoration.
- Live axe scans found zero serious/critical violations on six routes in light
  and dark themes. All visible phone links and buttons measured at least 44 ×
  44 px. The full keyboard/dialog/reduced-motion suite passes.
- The asymmetric exploded-parts drawing, condensed technical type, ruled
  paper, source leaders, and safety-orange marks are specific to this product.
  The site does not resemble a generic centered gradient/card template.
- Production JavaScript is 92.33 KB raw / 31.12 KB gzip; CSS is 16.99 KB raw /
  3.97 KB gzip.

## Missed leverage and AI check

The import/export gap identified in review 2 is now implemented. Team sync and
barcode scanning remain absent, but the product now explicitly targets one
solo tradesperson in one browser and discloses both boundaries before use.
Within that narrowed release, no additional feature is so obviously required
that it creates a new missed-leverage finding.

The allocation decision is deterministic and must remain auditable from stock
and supplier evidence. Runtime AI would add cost and privacy exposure without
improving that decision. No AI endpoint, provider key, analytics, third-party
script, remote font, or payment provider appears in source or live requests.

## Verification summary

- `npm test` — PASS: 15 Vitest tests and 3 Rust tests.
- All 16 exact claim commands from a clean checkout — PASS commands.
- `npm run test:e2e -- --retries=0` — PASS: 35 passed and 21 intentional
  project skips.
- `npm run build` — PASS: Svelte check reported 0 errors/warnings, `dist/` was
  produced, and the locked Rust release build completed.
- Live metadata/link crawl — PASS except the separate scroll-restoration
  behavior in F-3-1.
- Live light/dark axe sweep and 390 px target geometry — PASS.
- Manual live history scroll restoration — FAIL: F-3-1.
- Claims completeness/assertion review — FAIL: F-3-2 through F-3-4.

## What would make this perfect

Fix all six findings. Preserve and restore scroll coordinates without losing
the already-correct H1 focus; add exact fixture and CSV-template claims; deepen
the backup and export-isolation assertions; and replace the two inconsistent
storage phrases. Then rerun every claim command from a clean checkout, add
phone and desktop Back/Forward scroll assertions, repeat the cold read and
demo isolation flow, and rerun the full metadata/link/axe/build suite. The next
round is perfect only if those checks leave zero findings and no untested
public statement.
