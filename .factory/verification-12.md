# Independent verification 12 — Parts Promise

## Verdict: FAIL

Verified on 2026-08-30 for requested candidate
`d19e4c24de08e43213886623054fb21711cda1d0` and
<https://field-parts-promise.sociobot.in>.

The requested candidate cannot be verified because that object does not exist
in the supplied GitHub repository. `git fetch origin
d19e4c24de08e43213886623054fb21711cda1d0` returned `not our ref`, and
`git ls-remote origin` showed only `main` at
`d19e4c8a4e1ffc99df3729651d4e8e1da435eadc`. Production `/health` reports that
same available commit, not the requested candidate. This is a release-blocking
source/deployment provenance failure.

Testing continued against the clean available source commit `d19e4c8…` and the
live deployment to distinguish product defects from the missing candidate.

## Mandatory first-read and demo gates: PASS on the live deployment

A cold live visit at desktop and 390 × 844 showed, in the first screen:

- **What:** “Promise dates from parts held for the job.”
- **Who:** “For small trade firms that need a parts check before agreeing a
  visit date.”
- **First action:** “Try it with sample data,” with the adjacent outcome
  “Opens Riverside Dental with one missing pump.”

The one-click action opens the working `RD-1042` sample. The demo shows its
persistent sample-data banner with **Reset demo** and **Start for real**.

## Mandatory claims gate: PASS on available commit `d19e4c8…`

`.factory/claims.json` exists with 31 entries. After `npm ci`, every declared
`test` command was run separately and in file order, using its demo/test entry
point. Result: **31/31 passed, 0 failed**.

This covers the fixture, allocation/status rules, source persistence, supplier
quantity conservation, reorder suggestion, isolated reset, offline reload,
complete local workflow, demo boundaries, IndexedDB storage, request privacy,
record clearing, JSON/CSV transfer, Entra sign-in, tenant isolation,
two-device/idempotent/offline sync, conflict handling, invitations, account
boundaries, audit/deletion, request policy, billing fallback, seat pricing,
unpaid export, and container runtime.

The passing claims do not cure the missing requested candidate, unavailable
paid plan, or failing full browser suite below.

## Local quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 85 packages; audit reported 0 vulnerabilities. |
| `npm test` | PASS — Vitest 16/16; Rust 11 passed, 1 PostgreSQL-only round-trip ignored because no isolated `DATABASE_URL` was supplied. |
| `npm run check` | PASS — 0 errors and 0 warnings. |
| `npm run format:check` | PASS. |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS. |
| `npm run build` | PASS — exact Vite and release Rust build; `dist/` produced. |
| `npm run test:e2e -- --retries=0` | **FAIL** — 51 passed, 36 skipped, 1 timed out. |
| Accessibility test alone | **FAIL** — both desktop and mobile projects timed out at 30 seconds. |

The reproducible failing test is
`e2e/product.spec.ts:4`, “public and app routes have no serious accessibility
findings.” It scans 22 theme/route combinations inside the default 30-second
test timeout. The full suite timed out in Chromium; running this test alone
timed out in both Chromium projects. A release whose repository test command
does not pass fails the definition of done even though independent settled
axe scans found no accessibility violations.

The production web build is within static budgets: main JS 38.24 KB gzip,
lazy CIAM JS 62.19 KB gzip (100.43 KB total), and CSS 4.19 KB gzip. A fresh
mobile Lighthouse run against the live demo scored Performance 90,
Accessibility 100, Best Practices 100, and SEO 100; LCP was 2061 ms, CLS 0,
TBT 361 ms, and total transferred bytes 200,553.

No Docker or Podman engine is installed in this verifier. The real release
binary build, the registered only-`PORT` runtime claim, and the live container
were tested; the OCI image itself was not rebuilt locally.

## Live product evidence

- `/health` returned HTTP 200 with build
  `d19e4c8a4e1ffc99df3729651d4e8e1da435eadc`, PostgreSQL, and ready auth.
- The locally built production HTML, main JS, CIAM JS, and CSS matched the live
  files byte for byte by SHA-256.
- Root, demo, jobs, privacy, terms, manifest, robots, sitemap, and service
  worker returned 200. An unknown path returned a real HTTP 404.
- HTML and `sw.js` use `no-cache`; hashed JS/CSS use one-year immutable cache
  headers.
- Response headers include HSTS, `nosniff`, strict referrer policy, frame
  denial, a header CSP, and camera/microphone/geolocation denial.
- A complete live demo request log contained only same-origin GET/HEAD
  requests. It recorded no camera access, console errors, page errors, API
  writes, analytics, or third-party assets.
- The live worker controlled the page, had no installing/waiting update, and
  exposed cache `parts-promise-shell-v5`. Offline reload retained the sample
  and allocation flow.
- The sample began **Date at risk** with one missing condensate pump. Keyboard
  allocation from Van 2 changed it to **Parts in hand** and retained the
  reorder suggestion. Quantity `0` triggered native minimum validation;
  quantity `2` produced the announced error “Only 1 each is still needed for
  this job.” Correcting to `1` completed the action without console errors.
- At 390 px there was no horizontal overflow. Visible interactive elements on
  home, demo, and jobs were at least 44 × 44 CSS px. Keyboard focus used a
  visible 3 px purple outline with a 3 px offset; confirmation focus stayed in
  the dialog and restored correctly. Reduced-motion mode was exercised.
- A settled axe scan covered 11 routes in light and dark themes at desktop and
  390 px: **44 scans, 0 serious or critical findings**.
- Sign-in requested only the shared Sociobot CIAM authority
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650`,
  client `25c704f4-465a-47af-80ab-2c489466b697`, and the production callback.
  An invalid bearer token returned 401 with `WWW-Authenticate: Bearer`.

## Request allowance

The documented read limit is 20 requests/second with burst 40 per forwarded
client IP. A fresh concurrent burst of 120 live requests from one
`X-Forwarded-For` value returned 45 × 401 and 75 × 429 as the bucket refilled
during the burst. Every 429 included `Retry-After: 1`; an isolated response
advertised `X-RateLimit-Limit: 40`. The separate five-request critical export
bucket passed its registered claim test.

## Defects by severity

### Blocker

1. **The requested candidate is absent and is not deployed.** The SHA cannot
   be fetched from the supplied remote. The only remote branch and live health
   identity are `d19e4c8…`. No QA result can establish that
   `d19e4c24…` contains or produces the tested product.
2. **The promised recurring subscription cannot be purchased.** Fresh GETs to
   both production and pilot Sociobot checkout endpoints returned HTTP 404
   with `{"error":"enabled factory product","status":404}`. The UI honestly
   stops before charging, but the brief requires a $39/month workshop plus
   $8/month per active technician, and the venture contract requires a buyer
   to be able to pay.

### High

1. **The repository's complete Playwright gate fails reproducibly.** The
   cross-route axe test exceeds its 30-second timeout in both configured
   projects. Increase or partition that test's timeout while preserving its
   route/theme coverage, then rerun the unmodified full suite.

### Medium / low

No additional product defects found.

## Required release actions

1. Publish the exact requested candidate SHA or correct the work order, deploy
   that exact revision, and confirm it through `/health`.
2. Register the recurring Sociobot product in pilot and production, then test
   a real pilot checkout, seat changes, cancellation, failed renewal, and
   refund/revocation.
3. Repair the browser test timeout and obtain a clean full `npm run test:e2e`
   result.

No product source code was modified during verification.
