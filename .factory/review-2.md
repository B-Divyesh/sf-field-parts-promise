# Adversarial first-read review 2 — Parts Promise

Work order: `field-parts-promise-review-2`

Reviewed: 2026-08-29 UTC

Repository HEAD: `affd0d760eb47189f540223d6b420573b4d2f1ca`

Live build from `/health`: `5b6b4dec17864f2c25761e532dacea383e483fc7`

## Verdict

**FAIL — 1 blocking, 1 high, and 2 medium findings remain.**

The cold landing page is clear, the sample is realistic, Reset works, and all
13 declared claim commands pass. The review still fails because two ordinary
navigation paths leave demo mode without discarding demo changes. The public
copy says those changes last only until the visitor leaves, and the current
claim test does not exercise those exits. A missing import/export path, an
incorrect title on missing job routes, and unannounced mobile form expansion
also remain.

## Cold first read

Fresh Chromium contexts opened the live URL without scrolling at 390 × 844 and
1440 × 900.

- What it does: it ties each required part to a van, warehouse, or supplier
  record before a solo tradesperson agrees a visit date.
- For whom: solo tradespeople who promise visits that depend on parts.
- What to click first: **Try it with sample data**. The adjacent text says,
  “Opens Riverside Dental with one missing pump.”

This gate passes at both widths. The phone first screen includes the headline,
audience, action, action outcome, and all three facts. There is no horizontal
overflow. The cold load made six same-origin GET requests and logged no page or
console error; the browser-only test harness warning about its blocked service
worker was not a product error.

## Findings

### Blocking

#### F-2-1 — Ordinary demo exits preserve the edits that the banner says will be discarded

- Exact quote/location: live demo banner, “Changes stay in this browser until
  you reset or leave”; Privacy, “Leaving demo deletes its browser database”;
  `src/App.svelte:237-255`, `src/App.svelte:300-305`, and
  `src/App.svelte:592-595`.
- Evidence: in a fresh live context, allocate the missing pump so RD-1042 says
  **Parts in hand**. Click the **Parts Promise** wordmark. The URL becomes `/`,
  the demo banner disappears, and `parts-promise-demo-v1` remains in IndexedDB.
  Click **Demo** and RD-1042 still says **Parts in hand**. Browser Back from a
  demo entered through the landing page has the same route transition. Only
  **Start for real → Leave demo** calls `deleteWorkspace('demo')`.
- Why this fails: the visitor has visibly left demo mode, but the sample edit is
  retained. Re-entering the demo does not start from the bundled sample. This
  violates the demo sandbox contract and makes two public privacy statements
  false. The passing `demo-reset-isolated` test covers only the dedicated
  **Start for real** button, so the broader “until you leave” claim is untested.
- Concrete fix: centralize demo exit handling. Whenever routing changes from a
  demo URL to a non-demo URL—including wordmark clicks and `popstate`—delete
  the demo database before loading the live workspace. Keep the confirmation
  for **Start for real**, or route all exits through it. Add tagged tests that
  allocate the pump, leave through the wordmark and Back separately, assert
  `parts-promise-demo-v1` is absent, re-enter demo, and assert **Date at risk**.

### High

#### F-2-2 — The only local workspace has no import, export, or backup path

- Exact quote/location: README, “This browser-only release keeps jobs in one
  browser”; Privacy, “Use your browser's site-data controls to remove local
  records”; no import or export control exists on `/jobs` or a job route.
- Why this fails: the brief starts from spreadsheet/notes workflows, while this
  release asks a tradesperson to create operational jobs and stock evidence in
  one browser. A normal user needs a way to seed that workspace and recover it
  before relying on it. Clearing site data or losing the device currently
  removes the only copy.
- Concrete fix: add **Import CSV** for jobs, required parts, and sources with a
  preview and row-level validation. Add **Export workspace** as a versioned
  CSV/JSON backup containing jobs, requirements, sources, allocations, and
  timestamps. Keep demo import/export isolated from the live database. Register
  round-trip, invalid-row, and demo-isolation claims and tests.

### Medium

#### F-2-3 — A missing job deep link renders a 404 under job metadata

- Exact location: live `/jobs/not-a-real-job`; `src/App.svelte:109-150`.
- Evidence: the page H1 is **Page not found**, but the title and Open Graph
  title are **Job parts — Parts Promise**, the description is “Parts held for
  this job,” the canonical names the missing job URL, and the HTTP response is
  200. `getPage()` classifies every `/jobs/*` path as a job before the workspace
  lookup proves that the job exists.
- Why this fails: a deleted, mistyped, or device-local job link tells the
  visitor and link-preview clients that a job page exists while the visible
  page says it does not.
- Concrete fix: derive an effective not-found state after workspace loading
  when `activeJob` is absent, then apply the 404 title, description, Open Graph,
  and recovery view. Add a deep-link test for an unknown job ID. If the server
  cannot know client-local IDs, the client metadata must still be truthful.

#### F-2-4 — Opening a work form does not move focus or announce the new region

- Exact location: live `/jobs` at 390 × 844; the **Add a job** control and the
  conditional `.work-sheet` sections in `src/App.svelte`.
- Evidence: after activating **Add a job**, keyboard focus remains on that
  button. The new form begins at y=763 and extends to y=1479, so only part of
  its heading appears at the bottom of the phone viewport. The trigger has no
  `aria-expanded`/`aria-controls`, and the inserted region has no live
  announcement. The same pattern is used for job, part, source, allocation,
  and supplier forms.
- Why this fails: a keyboard or screen-reader visitor is not told that a form
  opened, and a touch visitor can reasonably read the unchanged top of the
  screen as no result.
- Concrete fix: after `tick()`, scroll the opened sheet into view and focus its
  heading or first field. Add `aria-expanded` and `aria-controls` to each
  trigger, restore focus on Close, and test focus/visibility at 390 px for all
  five form types.

## Complete copy audit

Counts ignore standalone punctuation, treat hyphenated terms and route/command
tokens as one word, and omit shell code blocks. No sentence exceeds 22 words.
No banned marketing term appears. All landing actions name their result, so
this audit creates no copy finding.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass |
| Jobs | 1 | Pass |
| Privacy | 1 | Pass |
| Use dark theme | 3 | Pass: result-naming button |
| Parts Promise — Hold parts for each job | 7 | Pass: route announcement/title |
| Allocate parts to a job | 5 | Pass |
| Promise dates from parts held for the job | 8 | Pass: headline |
| For solo tradespeople who need a parts check before agreeing a visit date. | 13 | Pass |
| Try it with sample data | 5 | Pass: result-naming action |
| Opens Riverside Dental with one missing pump. | 7 | Pass |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` and `indexeddb-local-storage` |
| Free for one browser in this release. | 8 | Pass: `free-browser-release` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: `local-workspace-flow` |
| Sample job status | 3 | Pass |
| See why a visit date is at risk | 9 | Pass |
| RD-1042 needs one condensate pump. | 5 | Pass: sample fixture |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: result-naming action |
| RD-1042 · Riverside Dental | 3 | Pass |
| Date at risk | 3 | Pass |
| Condensate pump needs 1 each. | 5 | Pass |
| How it works | 3 | Pass |
| Check parts before agreeing a visit date | 8 | Pass |
| List required parts | 3 | Pass |
| Add each required part to the job. | 7 | Pass: `local-workspace-flow` |
| Allocate each part | 3 | Pass |
| Allocate it from a van or warehouse source. | 8 | Pass: `local-workspace-flow` |
| Review the visit date | 4 | Pass |
| Read the reason before you agree the visit date. | 9 | Pass: `local-workspace-flow` |
| What this first release does not do | 7 | Pass |
| It does not sync between people, scan barcodes, place supplier orders, or take payment. | 14 | Pass: `m1-feature-boundaries` |
| It keeps one local workspace and a separate demo. | 9 | Pass: `demo-reset-isolated` |
| Read how local data works | 5 | Pass: result-naming action |
| Promise job dates from parts held for the job. | 8 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory | 4 | Pass |
| Browser-only release | 2 | Pass |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass |
| Parts Promise helps a solo tradesperson check whether a required part is held before agreeing a visit date. | 18 | Pass |
| This browser-only release keeps jobs in one browser. | 8 | Pass: `indexeddb-local-storage` |
| Try the sample job | 4 | Pass |
| Open `/?demo=1` (for example, `http://127.0.0.1:4173/?demo=1` while developing). | 7 | Pass |
| Riverside Dental job `RD-1042` opens with one missing condensate pump. | 10 | Pass: sample fixture |
| Allocate the pump from Van 2 to change the job from Date at risk to Parts in hand. | 18 | Pass: `promise-status-from-allocation` |
| The app suggests a reorder when Van 2 reaches zero pumps. | 11 | Pass: `reorder-after-allocation` |
| It never places an order. | 5 | Pass: `reorder-after-allocation` |
| The sample uses the separate `parts-promise-demo-v1` IndexedDB workspace. | 8 | Pass: `indexeddb-local-storage` |
| Reset demo restores the bundled sample. | 6 | Pass: `demo-reset-isolated` |
| Start for real discards sample changes and reopens the unchanged `parts-promise-live-v1` workspace. | 12 | Pass for this action: `demo-reset-isolated` |
| The sample job and allocation flow work offline after the first visit. | 12 | Pass: `offline-reload` |
| This browser-only release is free. | 5 | Pass: `free-browser-release` |
| It has no sign-in, team sync, barcode scan, supplier-order action, or checkout. | 12 | Pass: `m1-feature-boundaries` |
| Run and verify | 3 | Pass |
| Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass |
| Run the complete local suite before shipping: | 7 | Pass |
| `npm run build` writes `dist/`. | 5 | Pass: observed during verification |
| Privacy and deployment | 3 | Pass |
| Jobs, required parts, sources, and allocations use browser IndexedDB. | 9 | Pass: `indexeddb-local-storage` |
| The demo makes only same-origin GET requests and never asks for camera access. | 13 | Pass: `demo-network-privacy` |
| Browser site-data controls remove local records. | 6 | Pass: `clear-local-records` |
| The Rust server starts with `PORT` only, defaults to `8080`, and serves `/health`. | 13 | Pass: `container-runtime` plus server source/default contract |
| Unknown paths return HTTP 404 with a designed recovery page. | 10 | Pass: `container-runtime` |
| The factory deploys the product to `https://field-parts-promise.sociobot.in`. | 7 | Pass: live target inspected |
| Claim tests | 2 | Pass |
| Every visitor-facing claim has one sandbox test. | 7 | Flag: F-2-1 shows a broader public exit claim without a complete test |
| Run the commands recorded in `.factory/claims.json` after `npm ci`. | 9 | Pass |
| License | 1 | Pass |
| MIT © 2026 Sociobot (Param Factory). | 5 | Pass |

Canonical terms remain consistent: **job**, **required part**, **allocation**,
**source**, **supplier order**, **visit date**, **promise status**, and **solo
tradesperson**.

## Demo and sandbox checks

- One click from `/` opens `/?demo=1` on **Riverside Dental parts**.
- The first phone screen after the click shows RD-1042, its visit date, **Date
  at risk**, the missing pump, and the persistent demo banner.
- Allocating the pump from Van 2 changes the status to **Parts in hand** and
  shows the reorder suggestion.
- **Reset demo** restores **Date at risk**.
- The registered explicit exit test creates a live record, changes/reset the
  demo, leaves through **Start for real**, and confirms the live record is
  unchanged.
- The live request log for the demo flow contains only same-origin GETs; the
  camera sentinel remains false. The offline claim passes after a service
  worker-controlled reload.
- F-2-1 records the failed wordmark/Back exit behavior.

## Claim verification

All exact commands were run separately after `npm ci` in the fresh clone
`/tmp/parts-review-2-n91evP`.

| Claim ID | Result | Observable evidence |
| --- | --- | --- |
| `promise-status-from-allocation` | PASS | At risk becomes Parts in hand only after the pump allocation. |
| `allocation-keeps-source` | PASS | Reload retains job, source, quantity, unit, updater, and checked time. |
| `supplier-quantity-conserved` | PASS | A consumed one-unit supplier order is disabled for a second job. |
| `reorder-after-allocation` | PASS | Zero remaining suggests review and creates no order/network write. |
| `demo-reset-isolated` | PASS | Reset restores the fixture; the dedicated leave action preserves a pre-existing live job. |
| `offline-reload` | PASS | The cached sample reloads and accepts the pump allocation offline. |
| `local-workspace-flow` | PASS | Create, source, allocate, undo, attach supplier evidence, and review all complete. |
| `m1-feature-boundaries` | PASS | No sign-in, sync, scan, order, buy, or checkout action is exposed. |
| `free-browser-release` | PASS | Free copy is present and no payment action exists. |
| `indexeddb-local-storage` | PASS | Named demo and live IndexedDB workspaces are observed. |
| `demo-network-privacy` | PASS | Requests are same-origin GET/HEAD and camera is not requested. |
| `clear-local-records` | PASS | Browser storage clearing removes the created live job. |
| `container-runtime` | PASS | Compiled server serves health/app and returns a real 404 with no job-data API. |

Result: **13/13 declared commands pass.** F-2-1 is not a command failure; it is
a public-claim coverage gap and a reproduced behavior failure outside the one
exit path that the registered test exercises.

## Earlier finding verification

The review read `.factory/review-1.md`, `.factory/polish-1.md`,
`.factory/handoff.md`, and `.factory/handoff-m1.md`. Each earlier numbered
finding was checked on the live build and in the current source.

| Earlier finding | Result this round | Evidence |
| --- | --- | --- |
| F-1-1 route focus | Fixed | Live forward and Back navigation focus `main h1`; source awaits `tick()` and focuses it. |
| F-1-2 firm audience mismatch | Fixed as previously specified | Landing and README now say solo tradesperson/one browser and disclose no team sync. |
| F-1-3 overbroad offline/legal claims | Fixed | Copy limits offline behavior to the sample flow; `offline-reload` passes. |
| F-1-4 false empty-workspace exit copy | Fixed for the named exit | Copy now says the live workspace reopens unchanged; the explicit exit claim passes. F-2-1 is a separate unhandled exit path. |
| F-1-5 duplicate metadata | Fixed | One route-correct description, canonical, OG, and Twitter set is present on checked routes. |
| F-1-6 `/demo` title/sitemap | Fixed | Live title is `Demo — Parts Promise`; `/demo` is in `sitemap.xml`. |
| F-1-7 missing current price | Fixed | First screen says “Free for one browser in this release”; claim passes. |
| F-1-8 revision lore | Fixed | “Allocate parts to a job.” |
| F-1-9 leader jargon | Fixed | Caption names van, warehouse, and supplier records. |
| F-1-10 sample preview label | Fixed | “Sample job status.” |
| F-1-11 ambiguous date heading | Fixed | “See why a visit date is at risk.” |
| F-1-12 mood section label | Fixed | “How it works.” |
| F-1-13 abstract promise heading | Fixed | “Check parts before agreeing a visit date.” |
| F-1-14 vague List step | Fixed | “List required parts.” |
| F-1-15 vague Hold step | Fixed | “Allocate each part.” |
| F-1-16 vague Review step | Fixed | “Review the visit date.” |
| F-1-17 theme jargon | Fixed | “Use dark theme” / “Use light theme.” |
| F-1-18 README Try it heading | Fixed | “Try the sample job.” |
| F-1-19 M1/raw claim language | Fixed | Public explanation says browser-only release; claim IDs stay in developer material. |
| F-1-20 metaphor-only 404 | Fixed | Live 404 says “Page not found” and provides **Open jobs** / **Go to home**. |
| F-1-21 technical demo labels | Fixed | “Sample job” and “Required parts and their sources.” |

No earlier numbered finding is being reissued under its old ID.

## Structure, accessibility, and visual check

- `/`, `/demo`, `/jobs`, `/privacy`, `/terms`, and the real 404 have one H1,
  route-correct titles/descriptions/canonicals/OG fields, favicon/touch icon,
  consistent header/footer, and no duplicate metadata. F-2-3 covers the
  missing-job exception.
- The live unknown route returns HTTP 404 and shows designed recovery actions.
- The sitemap lists every stable public route. `robots.txt`, the OG image,
  fonts, manifest, and internal links resolve. The external factory link
  declares `rel="external"` and returns 200.
- Forward/Back focus works after rendered route changes. F-2-4 covers dynamic
  form disclosure rather than route focus.
- Axe found zero serious/critical violations on six routes in light and dark
  themes. The existing phone touch, dialog focus, reduced-motion, and
  console-error checks pass.
- The blueprint drawing, technical typography, safety-orange marks,
  asymmetric desktop composition, and field-sheet mobile layout match
  `.factory/design.md` and do not resemble a generic gradient/card template.

## Missed leverage and AI check

F-2-2 is the concrete missed-leverage finding: import from the existing
spreadsheet workflow and export for local backup. The allocation decision is
deterministic and evidence-based, so an AI feature is not obviously useful and
would add privacy/cost risk. No runtime AI provider, embedded key, analytics,
third-party script, or remote font was found.

## Verification summary

- `npm test` — PASS: 12 Vitest tests and 3 Rust tests.
- `npm run build` — PASS: 0 Svelte errors/warnings; `dist/` produced; web JS
  27.58 KB gzip; release Rust binary built.
- `npm run test:e2e -- --retries=0` — PASS: 31 passed, 17 intentional skips.
- Every exact `.factory/claims.json` command from a fresh clone — PASS: 13/13.
- Live axe sweep, light and dark, six routes — PASS: no serious/critical issue.
- Live internal/external link crawl — PASS for actionable destinations.
- Manual adversarial demo exit — FAIL: F-2-1.

## What would make this perfect

Fix all four findings and add the named regression tests. The acceptance bar
for the next round is: every way out of demo discards its database, import and
export round-trip without crossing the demo/live boundary, missing job URLs
publish not-found metadata, and every opened work form becomes visible and
receives announced focus. Then rerun the cold read, all claim commands, full
link/metadata crawl, both-theme axe sweep, and full build from a clean clone.
