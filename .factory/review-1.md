# Adversarial first-read review 1 — Parts Promise

Work order: `field-parts-promise-review-1`  
Reviewed: 2026-08-28 UTC  
Repository base: `e9627c3adc448e7da07a73855e93a288d4985947`  
Live build: `3ed9c6a37148e55d87735f30e9cffb61cfb9125d`

## Verdict

**FAIL — 3 blocking, 4 high/medium, and 14 copy findings remain.**

The cold landing page is clear and the one-click demo is real. Every declared
claim test passes. The review still fails because route-change focus is broken,
the shipped one-browser product does not serve the full firm audience in the
brief, the earlier claims-completeness blocker is only partly fixed, route
metadata is ambiguous, and several public labels violate the supplied
plain-words rules.

## Cold first read

Fresh Chromium contexts opened the live URL without scrolling at 390 × 844 and
1440 × 900.

- What it does: it records required parts against sources so a firm can decide
  whether to agree a visit date.
- For whom: trade firms agreeing visits that depend on parts.
- What to click first: **Try it with sample data**. The adjacent sentence says,
  “Opens Riverside Dental with one missing pump.”

This gate passes on both viewports. At 390 px the headline, audience sentence,
action, outcome, and three facts are all visible in the first screen. There was
no horizontal overflow, console error, or page error. The cold load made six
same-origin GET requests.

## Findings

### Blocking

#### F-1-1 — Client-side route changes do not focus the new page heading

- Exact location: live navigation from `/` to `/privacy`, `/?demo=1`,
  `/jobs?demo=1`, and `/jobs/job-rd-1042?demo=1`; `src/App.svelte:205-227`.
- Evidence: after clicking **Privacy**, `document.activeElement` remained the
  Privacy link. After clicking the demo CTA or a demo job, focus fell to
  `<body>`. Back from a job to the jobs list also left focus on `<body>`.
- Why this fails: a keyboard or screen-reader user is not placed at the new
  route's content. This is broken routing under the site-structure contract.
  The existing test is named “history focus” but checks only H1 text; it never
  asserts the focused element.
- Concrete fix: await `loadCurrentWorkspace()`, render the destination, then
  focus `main h1` after `tick()`. Add forward and back/forward tests on phone
  and desktop that assert `document.activeElement === document.querySelector('main h1')`.

#### F-1-2 — The product cannot complete the brief's job for its stated firm audience

- Exact quote/location: landing, “For trade firms…” and “It does not sync
  between people”; README lines 3 and 7, “small electrical, HVAC, and repair
  firms” and “Records stay in one browser.”
- Why this fails: the brief targets solo-to-20-person firms and describes an
  owner/coordinator and field technicians updating the same allocation truth.
  A browser-local workspace cannot tell two people that the same van or
  warehouse quantity was already allocated. The core risk of double promises
  remains for every multi-person firm in the stated audience.
- Concrete fix: implement authenticated firm workspaces, offline outbox sync,
  and explicit allocation-conflict handling. Until that ships, narrow the
  first-screen audience to a solo operator using one browser and do not present
  the product as ready for trade firms generally.

#### F-1-3 — The earlier claims-completeness blocker is only partly fixed

- Earlier finding: `.factory/verification.md` and
  `.factory/verification-2.md`, both titled **claims contract is incomplete**
  or **unlisted, untested public claims**. Those reports did not assign an ID;
  this review assigns `F-1-3` for traceability.
- Exact quote/location: landing, “Works offline after your first visit.” README
  line 5, “M1 is a local, offline-capable job card.” README line 43, “The app
  includes privacy and terms routes at `/privacy` and `/terms`.”
- Evidence: `offline-reload` tests only the bundled sample job's reload and pump
  allocation. It does not prove that the unqualified product/job-card claim
  works offline across create, edit, source, supplier evidence, undo, and legal
  routes. The legal-route sentence has no claims entry or exact claim tag.
- Why this fails: all 11 registered tests pass, but the public wording remains
  broader than the registered observable behavior. The required one-to-one
  claim contract is therefore still incomplete.
- Concrete fix: either rewrite both offline sentences to “The sample job and
  allocation work offline after your first visit” and remove the legal-route
  assertion, or add exact tagged tests for the broader offline and legal-route
  claims.

### High

#### F-1-4 — Leaving demo falsely says an existing live workspace is empty

- Exact quote/location: demo confirmation at `src/App.svelte:618-619`, “Your
  new local workspace starts empty”; toast in `confirmExitDemo`, “You are in an
  empty local workspace.”
- Evidence: in a fresh live browser context, I created job `QA-1` for “Existing
  Live Customer,” entered demo, and left demo. The live job remained intact,
  but both messages said the workspace was empty. The current isolation test
  starts with an empty live database and cannot catch this case.
- Why this fails: the safe behavior is hidden behind alarming, false copy. A
  returning user can reasonably believe their real records were erased.
- Concrete fix: say “Sample changes are discarded. Your local workspace will
  reopen unchanged.” Change the toast to “Your local workspace is open. Sample
  changes were discarded.” Extend `demo-reset-isolated` with a pre-existing
  live record and assert it survives unchanged.

#### F-1-5 — Non-home routes publish duplicate and conflicting metadata

- Exact location: `index.html` static description/canonical/OG tags plus
  `src/App.svelte:535-540` route tags.
- Evidence: `/privacy`, for example, contains two descriptions
  (“Promise job dates…” and “How Parts Promise handles local data”) and two
  canonicals (`/` and `/privacy`). `document.querySelector` returns the home
  values first. Every checked non-home route retains the home Open Graph and
  Twitter title/description.
- Why this fails: crawlers and link previews receive ambiguous canonical data
  and route-inaccurate descriptions.
- Concrete fix: own each metadata field once. Update the existing description,
  canonical, Open Graph, and Twitter nodes on route changes, and add a browser
  test asserting exactly one route-correct value for each field.

### Medium

#### F-1-6 — The supported `/demo` route has the wrong title and is absent from the sitemap

- Exact location: live `/demo`; `src/App.svelte:136-145`;
  `public/sitemap.xml:3-6`.
- Evidence: `/demo` returns 200 and shows the sample, but its title is
  “RD-1042 parts — Parts Promise,” not “Demo — Parts Promise.” The sitemap does
  not list `/demo` even though the app and server treat it as a real route.
- Why this fails: the same demo has inconsistent identity by entry URL, and the
  sitemap does not list every public route.
- Concrete fix: use the demo metadata whenever `demo === true` and
  `currentPath` is `/` or `/demo`; choose `/demo` as the single canonical demo
  URL and add it to `sitemap.xml`.

#### F-1-7 — The landing page never states the current price

- Exact location: first-screen facts and the section after “How it works.” The
  only payment text is “No sign-in or checkout in this release.”
- Why this fails: “no checkout” does not tell a visitor whether the current
  browser-local release is free, unavailable, or priced elsewhere. The supplied
  site skeleton requires a price fact and an exact paid-tier section when a paid
  tier exists.
- Concrete fix: state the current usable offer, for example, “Free for one
  browser in this release,” and register/test that claim. Add the `$39/month +
  $8/technician` section only when that paid product can actually be bought.

### Low — landing and interface copy

#### F-1-8 — “Parts allocation / revision 01” is decorative release lore

- Location: landing eyebrow, `src/App.svelte:652`.
- Why this fails: “revision 01” tells a first-time visitor nothing they can use.
- Rewrite: delete the line, or use “Allocate parts to a job.”

#### F-1-9 — “Every leader ends at the source that holds the part for the job” uses drawing jargon

- Location: landing hero caption.
- Why this fails: “leader” names the illustration device rather than the user
  benefit.
- Rewrite: “Each required part shows the van, warehouse, or supplier record
  that covers it.”

#### F-1-10 — “Live sample / job datum” does not name the section plainly

- Location: landing preview eyebrow, `src/App.svelte:679`.
- Why this fails: “datum” is engineering jargon and “live” is ambiguous for a
  static preview.
- Rewrite: “Sample job status.”

#### F-1-11 — “See what blocks a date” uses an ambiguous noun

- Location: landing preview heading, `src/App.svelte:680`.
- Why this fails: heard out of context, “a date” does not identify a service
  visit.
- Rewrite: “See why a visit date is at risk.”

#### F-1-12 — “Three drawing marks” is a mood label, not a section name

- Location: landing how-it-works eyebrow, `src/App.svelte:696`.
- Why this fails: the section contains steps, not drawing marks.
- Rewrite: “How it works.”

#### F-1-13 — “Check the parts before the promise” is an abstract heading

- Location: landing how-it-works heading, `src/App.svelte:697`.
- Why this fails: “the promise” requires surrounding brand context and does not
  name the section's process.
- Rewrite: “Check parts before agreeing a visit date.”

#### F-1-14 — “List” does not name the first step out of context

- Location: first landing step, `src/App.svelte:700`.
- Rewrite: “List required parts.”

#### F-1-15 — “Hold” is ambiguous and conflicts with “Allocate”

- Location: second landing step, `src/App.svelte:703-704`.
- Why this fails: the heading calls the action “Hold,” while its sentence and
  the working UI call it “Allocate.”
- Rewrite: “Allocate each part.”

#### F-1-16 — “Review” does not name what the visitor reviews

- Location: third landing step, `src/App.svelte:708-709`.
- Rewrite: “Review the visit date.”

#### F-1-17 — “Night sheet” and “Day sheet” do not name the button result

- Location: persistent theme button, `src/App.svelte:565-570`.
- Why this fails: the visible label is blueprint-themed jargon even though the
  accessible name is clear.
- Rewrite: “Use dark theme” / “Use light theme.”

#### F-1-18 — The README heading “Try it” is incomplete out of context

- Location: `README.md:9`.
- Rewrite: “Try the sample job.”

#### F-1-19 — “M1” and raw claim IDs interrupt the README's product explanation

- Exact locations: README lines 5, 7, 15, and 38-41; footer “Revision M1 ·
  local-first”; privacy heading “Local data in M1.”
- Why this fails: “M1” is never defined for a reader, and sentences such as
  “Claim `local-workspace-flow` covers this work” mix internal QA identifiers
  into the user-facing explanation.
- Concrete fix: say “this browser-only release” in public copy. Move claim IDs
  into a separate developer-facing “Claim tests” table with their commands.

#### F-1-20 — The 404 message explains the error only through blueprint metaphors

- Exact quote/location: `/not-on-this-drawing`, “Drawing 404 / detached
  leader,” “This page is not on the drawing,” and “The leader for this page
  ends outside this revision.”
- Why this fails: the route is visually designed and returns the right status,
  but its primary explanation violates the no-metaphor copy rule.
- Rewrite: H1 “Page not found”; body “This address does not match a Parts
  Promise page. Return to your jobs or the home page”; actions “Open jobs” and
  “Go to home.” Keep the detached-part art as decoration.

#### F-1-21 — The demo's technical labels obscure otherwise clear sample data

- Exact quote/location: demo, “Job datum / local record” and “Required parts /
  source leaders.”
- Why this fails: “datum” and “source leaders” describe the visual system, not
  tasks a technician performs.
- Rewrite: “Sample job” and “Required parts and their sources.”

## Complete copy audit

Counts split on spaces, treat hyphenated forms and route/command tokens as one
word, and omit code blocks because they are commands rather than sentences. No
sentence exceeds 22 words. No banned marketing adjective appears.

### Landing page copy units

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation |
| Jobs | 1 | Pass: navigation |
| Privacy | 1 | Pass: navigation |
| Night sheet | 2 | Flag: F-1-17 |
| Parts allocation / revision 01 | 4 | Flag: F-1-8 |
| Promise dates from parts held for the job | 8 | Pass |
| For trade firms that need a clear parts check before agreeing a visit date. | 14 | Pass |
| Try it with sample data | 5 | Pass |
| Opens Riverside Dental with one missing pump. | 7 | Pass |
| Works offline after your first visit. | 6 | Flag: F-1-3 |
| Sample changes stay in this browser. | 6 | Pass: `demo-network-privacy` and `demo-reset-isolated` |
| No sign-in or checkout in this release. | 7 | Pass: `m1-feature-boundaries` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: image alt |
| Every leader ends at the source that holds the part for the job. | 13 | Flag: F-1-9 |
| Live sample / job datum | 4 | Flag: F-1-10 |
| See what blocks a date | 6 | Flag: F-1-11 |
| RD-1042 needs one condensate pump. | 5 | Pass |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass |
| RD-1042 · Riverside Dental | 3 | Pass: sample label |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass |
| Three drawing marks | 3 | Flag: F-1-12 |
| Check the parts before the promise | 6 | Flag: F-1-13 |
| List | 1 | Flag: F-1-14 |
| Add each required part to the job. | 7 | Pass: `local-workspace-flow` |
| Hold | 1 | Flag: F-1-15 |
| Allocate it from a van or warehouse source. | 8 | Pass: `local-workspace-flow` |
| Review | 1 | Flag: F-1-16 |
| Read the reason before you agree the visit date. | 9 | Pass: `local-workspace-flow` |
| What this first release does not do | 7 | Pass |
| It does not sync between people, scan barcodes, place supplier orders, or take payment. | 14 | Pass as a boundary; F-1-2 covers the resulting scope gap |
| It keeps one local workspace and a separate demo. | 9 | Pass: `m1-feature-boundaries`, `demo-reset-isolated` |
| Read how local data works | 5 | Pass |
| Promise job dates from parts held for the job. | 8 | Pass: footer |
| Built by Param Factory | 4 | Pass |
| Revision M1 · local-first | 3 | Flag: F-1-19 |

### README headings and sentences

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass |
| Parts Promise is for small electrical, HVAC, and repair firms. | 10 | Pass |
| It checks whether a required part is held before the firm agrees a job's visit date. | 16 | Pass |
| M1 is a local, offline-capable job card. | 7 | Flags: F-1-3, F-1-19 |
| One person can create a job and record a van or warehouse source. | 13 | Pass: `local-workspace-flow` |
| They can allocate and undo quantities, attach supplier-date evidence, and review the promise status. | 14 | Pass: `local-workspace-flow` |
| Claim `local-workspace-flow` covers this work. | 5 | Flag: F-1-19 |
| This release has no sign-in, team sync, barcode scan, supplier-order action, or checkout. | 13 | Pass: `m1-feature-boundaries` |
| Records stay in one browser. | 5 | Pass as an honest boundary; F-1-2 covers the audience gap |
| Claim `m1-feature-boundaries` checks those limits in the shipped interface. | 9 | Flag: F-1-19 |
| Try it | 2 | Flag: F-1-18 |
| Open `/?demo=1` (for example, `http://127.0.0.1:4173/?demo=1` while developing). | 7 | Pass |
| The sample opens Riverside Dental job `RD-1042` with one missing condensate pump. | 12 | Pass |
| Allocate that pump from Van 2 to move the job from Date at risk to Parts in hand. | 18 | Pass |
| The van then reaches zero pumps against a minimum of one, so Parts Promise suggests a reorder and never places one. | 21 | Pass: `reorder-after-allocation` |
| The demo uses the `parts-promise-demo-v1` IndexedDB database. | 7 | Pass: `indexeddb-local-storage` |
| Reset demo restores the bundled fixture. | 6 | Pass: `demo-reset-isolated` |
| Start for real deletes the demo database and opens the separate, empty `parts-promise-live-v1` database. | 14 | Pass only from a fresh context; see F-1-4 |
| Claims `indexeddb-local-storage` and `demo-reset-isolated` cover these boundaries. | 7 | Flag: F-1-19 |
| Run and verify | 3 | Pass |
| Requirements: Node.js 22+, npm 10+, and stable Rust. | 8 | Pass: developer context |
| Use these checks before shipping: | 5 | Pass |
| `npm test` runs the deterministic TypeScript rules and Rust server tests. | 11 | Pass: verified |
| `npm run test:e2e` runs every browser claim, accessibility checks, mobile keyboard/history coverage, and the offline reload. | 16 | Pass: verified, although F-1-1 identifies the missing focus assertion |
| `npm run build` type-checks the Svelte app, writes `dist/`, and creates the release server binary. | 15 | Pass: verified |
| Architecture and privacy | 3 | Pass |
| Jobs, required parts, sources, and allocations use the named browser IndexedDB databases. | 12 | Pass: `indexeddb-local-storage` |
| Claim `indexeddb-local-storage` reads the stored allocation directly. | 7 | Flag: F-1-19 |
| The service worker keeps the sample allocation flow working after an offline reload. | 13 | Pass: `offline-reload` |
| Claim `offline-reload` performs that flow without a network. | 8 | Flag: F-1-19 |
| The demo makes only same-origin GET requests and never asks for camera access. | 13 | Pass: `demo-network-privacy` |
| Claim `demo-network-privacy` records the full request and permission flow. | 9 | Flag: F-1-19 |
| The Rust server serves `/health` and the compiled app. | 9 | Pass: `container-runtime` |
| It has no job-data endpoint in M1. | 7 | Flag: F-1-19 for “M1”; behavior passes `container-runtime` |
| Claim `container-runtime` starts it with only `PORT` and probes these responses. | 11 | Flag: F-1-19 |
| The app includes privacy and terms routes at `/privacy` and `/terms`. | 11 | Flag: F-1-3 |
| Deployment | 1 | Pass |
| The factory deploys the product. | 5 | Pass: process statement |
| The multi-stage image runs as a non-root user and listens on `PORT`, which defaults to `8080`. | 16 | Pass: `container-runtime` |
| The server needs no secret or other environment variable. | 9 | Pass: `container-runtime` |
| Unknown paths keep the designed page and return HTTP 404. | 10 | Pass: `container-runtime` |
| The production URL is `https://field-parts-promise.sociobot.in`. | 5 | Pass |
| License | 1 | Pass |
| MIT © 2026 Sociobot (Param Factory). | 6 | Pass |

## Demo and sandbox evidence

- The landing CTA enters `/?demo=1` in one click.
- The first resolved screen shows **Riverside Dental parts**, `RD-1042`, visit
  date, **Date at risk**, the missing condensate pump, and existing allocations.
- The persistent banner says “Demo — sample data, nothing is saved to a firm”
  and provides **Reset demo** and **Start for real**.
- Allocating one pump from Van 2 changed **Date at risk** to **Parts in hand**
  and showed “No supplier order has been placed.”
- Reset restored **Date at risk** and the one-pump shortage.
- A live `QA-1` record survived a complete demo enter/leave cycle. Only the
  incorrect empty-workspace message failed, as recorded in F-1-4.
- The exercised live flow made only same-origin GET requests and made zero
  camera requests. The demo and live IndexedDB databases remained separate.

The demo functionality passes; it is not the source of a blocking missing-demo
finding.

## Claims results

The checkout was clean before `npm ci`. Every command in
`.factory/claims.json` was run independently. Each command completed with one
Chromium pass and one intentional project skip.

| Claim | Result |
| --- | --- |
| `promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `m1-feature-boundaries` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `clear-local-records` | PASS |
| `container-runtime` | PASS |

No listed claim test failed. F-1-3 concerns public claims that are broader than
or absent from the listed contract; F-1-4 concerns an existing-live-data case
the current isolation test does not cover.

## Earlier findings rechecked

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files.
The available verification and handoff records were still checked.

| Earlier finding or gap | Live and code result |
| --- | --- |
| Claims contract incomplete / unlisted claims | **Half-fixed; blocking again as F-1-3.** Eleven claims now have one tagged test and all pass, but the broad offline and legal-route wording remains outside the exact contract. |
| Mobile controls below 44 px | Fixed. Theme, demo, removal, and toast controls are at least 44 px; the geometry test passes. |
| Immutable caching absent | Fixed. Hashed JS returns `public, max-age=31536000, immutable`; `/sw.js` returns `no-cache, max-age=0, must-revalidate`. |
| Rust builder image policy | Fixed. `Dockerfile` uses `rust:1-slim`; the release-contract test passes. |
| Missing Permissions-Policy | Fixed. Live responses send `camera=(), microphone=(), geolocation=()`. |
| Unknown paths returned 200 | Fixed. The live unknown route returns HTTP 404 with the designed screen. |
| Mobile how-it-works text used the number column | Fixed. The 390 px geometry regression test passes and the screenshot shows full-width descriptions. |
| Deployment/DNS unavailable | Fixed. HTTPS routes respond and `/health` reports the deployed build SHA. |

## Structure, accessibility, and delivery checks

| Check | Result |
| --- | --- |
| One H1, `lang`, header/nav/main/footer, skip link | PASS on all eight checked routes |
| Route titles | FAIL for `/demo`; see F-1-6 |
| Description/canonical/OG/Twitter | FAIL on non-home routes; see F-1-5 |
| Favicon, apple-touch icon, 1200 × 630 OG art | PASS |
| Designed HTTP 404 | PASS for status and identity; copy fails F-1-20 |
| Deep links and content restoration | PASS |
| Route-change focus | BLOCKING FAIL; see F-1-1 |
| Link crawl | PASS; all navigational links returned 200, including `sociobot.in` |
| Header/footer consistency | PASS |
| Distinct visual identity | PASS; the asymmetric blueprint/parts drawing is product-specific, not a generic SaaS template |
| 390 px layout and touch targets | PASS |
| Axe serious/critical scan | PASS on `/`, demo, jobs, job detail, privacy, terms, and 404 |
| Reduced motion | PASS in the shipped test |
| Console/page errors | PASS on normal routes; the browser logs the expected failed-resource message for the intentional HTTP 404 |
| First-load JS | PASS: 80.02 kB raw / 27.42 kB gzip |
| `/opt/fleet/lib/verify-url.sh` | PASS: title, `lang=en`, one H1, main, alt text, labelled buttons, no landing errors |
| `robots.txt` | PASS |
| `sitemap.xml` | FAIL: `/demo` omitted; see F-1-6 |

## Local verification

- `npm ci` — PASS, 83 packages, 0 vulnerabilities.
- Eleven exact claim commands — PASS.
- `npm test` — PASS, 9 Vitest and 3 Rust tests.
- `npm run test:e2e` — PASS, 23 passed and 15 intentional project skips.
- `npm run build` — PASS; Svelte check reported 0 errors and warnings,
  `dist/` was produced, and the locked Rust release build completed.

## Missed leverage

F-1-2 is the missed-leverage finding: team-safe sync with visible conflict
resolution is the one obvious capability demanded by the brief's multi-person
workflow. Runtime AI is not warranted here. The decision must remain auditable
from allocations and supplier evidence; decorative inference would weaken it.

## What would make this perfect

Resolve every finding above, especially route focus, exact claim coverage, and
the audience/sync mismatch. Then rerun every claim command, the full browser
suite, a populated-live-data demo isolation case, exact per-route metadata
assertions, keyboard forward/back focus checks, the full copy audit, build, and
live crawl. A perfect result has no remaining finding, no unlisted claim, and no
untested route behavior.
