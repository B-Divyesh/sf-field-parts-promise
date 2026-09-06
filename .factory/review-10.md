# Verify parts before promising a visit date — review 10

- Review date: 2026-09-06 UTC
- Work order: `field-parts-promise-review-10`
- Live URL: <https://field-parts-promise.sociobot.in>
- Current milestone reviewed: M3
- Implementation candidate: `b6a9c49dd239911807b4f7bcd22f63106244d3f3`
- Documentation checkout: `8e6b78248fe9698fae52cb82ede265d836336502`
- Live build identity: `40766071e5464eef46db29bf89eb69e818c86128`

## Verdict

**PASS — 0 findings at every severity and 0 untested public claims.**

No product code or deployment changed during this review. The live build is
healthy and uses SQLite. The candidate-to-checkout difference contains only
handoffs, QA reports, and evidence; it contains no product source, deployment,
or dependency change. The live build is the earlier documentation-only
`40766071…` image, so the reviewed implementation remains `b6a9c49…`.

The requested evidence mirror at
`factory-evidence/field-parts-promise-verify-23/qa-report.md` is not present
in the supplied checkout. The committed repository report
`.factory/verification-23.md` was read in full and its evidence was checked
again independently below.

## Job, audience, and first action before scrolling

Fresh 1440 × 900 desktop and 390 × 844 phone browser sessions opened `/` at
scroll position zero.

- Job: **Promise dates from parts held for the job.**
- Audience: small trade firms that need a parts check before agreeing a visit
  date.
- First action: **Try it with sample data.**

The adjacent outcome says it opens Riverside Dental with one missing pump. All
four items fit before scrolling on both devices, with no horizontal overflow.

## Sample sandbox and M3 flow

One click opened the Riverside Dental `RD-1042` sample with a missing
condensate pump and **Date at risk**. The persistent demo label was present,
and IndexedDB contained only `parts-promise-demo-v1`.

- Manual barcode `CP-19` matched the condensate pump.
- A one-unit Van 2 allocation changed the status to **Parts in hand**.
- The reorder boundary said no supplier order had been placed.
- A supplier date after the visit kept the job **Date at risk** and appeared
  on the supplier-date screen.
- Reset returned the job to the original shortage and still used only demo
  storage.
- Rendered Jobs, Privacy, and Terms demo links retained `demo=1`, including a
  fresh legal-page tab.

This confirms the M3 scope: scan/manual barcode fallback, supplier-date
evidence, field allocation actions, draft-only reorder work, offline batching,
and safe allocation conflicts. It does not treat unshipped supplier ordering,
messaging, or later operations work as current promises.

## Claims and local gates

A clean local clone at `8e6b782…` installed documented prerequisites with
`npm ci`. Each of the 44 exact commands in `.factory/claims.json` ran
individually. All 44 passed; the registry also has exactly one matching tagged
test for each ID.

The same checkout passed:

| Check | Result |
| --- | --- |
| `npm test` | PASS — 27 Vitest and 15 Rust tests |
| `npm run check` | PASS — 0 errors and 0 warnings |
| `npm run format:check` | PASS |
| Clippy with `-D warnings` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` and the release server built |
| `npm run test:e2e -- --retries=0` | PASS — 68 passed, 50 expected skips |

The release build's initial landing JavaScript is 6.88 kB plus the 43.31 kB
preload helper. Initial CSS is 8.18 kB. The deferred CIAM chunk is 62.19 kB
gzip.

## Live accessibility, privacy, offline, and routes

- The factory URL verifier passed with the expected title, `lang=en`, one H1,
  one main landmark, no missing image alternatives, no unlabelled buttons, and
  no console errors.
- Axe found zero serious or critical issues across `/`, `/demo`, `/jobs`,
  `/scan?demo=1`, `/suppliers?demo=1`, `/conflicts?demo=1`, auth/onboarding,
  settings, Privacy, Terms, and the designed unknown-route 404.
- Keyboard operation reached the skip link first and completed the phone sample
  allocation. The focus outline was a visible 3 px purple ring; reset-dialog
  focus stayed inside the dialog.
- Reduced-motion tokens were all `0s`. At 200% text on a 390 px viewport, no
  text or control overflowed; the decorative page edge accounted for a 10 px
  scroll width only.
- Demo traffic made nine same-origin GET/HEAD requests, no write request, no
  cross-origin request, and no camera request. The camera remains behind its
  separate explicit action.
- The current service worker controlled the page without a waiting update.
  Offline reload and allocation reached **Parts in hand** from the sample.
- The deliberate unknown URL returned HTTP 404 with `Page not found — Parts
  Promise`; this is expected designed recovery, not a defect.

Fresh mobile Lighthouse scored 97 performance, 100 accessibility, 100 best
practices, and 100 SEO. LCP was 1.35 s, CLS 0.022, total blocking time 184 ms,
and total transfer 120,858 bytes.

## Backend and durable state

`/health` returned 200 with SQLite readiness and auth readiness. An invalid
bearer token returned 401 with `WWW-Authenticate: Bearer`. A 60-request live
read burst returned 40 authentication responses and 20 HTTP 429 responses,
each with `Retry-After: 2`. A seven-request export burst returned five
authentication responses and two HTTP 429 responses, each with
`Retry-After: 60`.

The independently rerun claims cover tenant isolation, idempotent sync,
two-device conflict handling, unpaid export access, SQLite restart persistence,
and PORT-only production startup. The review did not restart the live service
or inspect any other service.

## Earlier findings

All earlier review and verification findings, including prior minor items, were
rechecked against the current product. Their current dispositions remain:

| Earlier items | Current disposition |
| --- | --- |
| F-1-1 through F-1-21 | Fixed: first-read copy, routes, metadata, focus/history, pricing, and 404 checks remain green. |
| F-2-1 through F-2-4 | Fixed: demo cleanup/isolation, backup/import, missing-job 404, and sheet focus remain green. |
| F-3-1 through F-3-6 | Fixed: history, fixture, transfer, CSV template, banner, and terminology checks remain green. |
| F-5-1 through F-5-16 | Fixed: provider boundaries, barcode paths, billing wording, build identity, and checkout boundary remain green. |
| F-6-1 through F-6-5 | Fixed: mode clearing, token validation, pricing, rate-limit wording, and PORT-only runtime remain green. |
| F-7-1, F-7-2, F7-01 | Fixed: retry/offline wording, outbox behavior, and phone target/focus checks remain green. |
| F-8-1 | Fixed: native demo links keep `demo=1` and demo-only storage in a new tab. |

## Current milestone and external dependencies

M3 is the current reviewed milestone. Its shipped behavior is accepted by this
review. M1 and M2 behavior remains covered by the passing claims and full
suite.

Recurring billing registration is an external operator dependency. The public
offer correctly states $39/month per firm plus $8/month per active technician;
checkout remains unavailable and starts no charge. Supplier integration is
also external and unshipped: the product records evidence and draft lines but
does not place supplier orders or guarantee availability. Messaging and
operations capabilities remain later planned work.

## Findings

None.

- Finding count: **0**
- Untested public claim count: **0**
