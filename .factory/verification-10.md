# Independent verification 10 — Parts Promise

## Verdict: FAIL

Verified on 2026-08-29 against candidate commit
`7d38c3129687ea9945b36f65fdba88c931010faa` and
<https://field-parts-promise.sociobot.in>.

This is a release-blocking FAIL. The live deployment is healthy and matches
the candidate, and the core local/demo flow works well, but three exact claim
commands failed from the clean checkout. Checkout is also unavailable on both
Sociobot gateways. The acceptance contract says either condition blocks a
release.

Evidence is in `.factory/verification-artifacts-10/`.

## Mandatory first-read gate: PASS

A fresh Chromium context opened the live root at 1440 × 900. The first screen
answers all three required questions in plain words:

- What it does: **“Promise dates from parts held for the job.”**
- Who it is for: **“For small trade firms that need a parts check before
  agreeing a visit date.”**
- What to do first: **“Try it with sample data,”** followed by **“Opens
  Riverside Dental with one missing pump.”**

The action is visible without setup and opens the working sample in one click.
The demo keeps a persistent banner with **Reset demo** and **Start for real**.
Evidence: `cold-live-desktop.png`, `live-browser-corrections.log`.

## Mandatory claims gate: FAIL

After `npm ci` in the clean candidate checkout, I executed every exact `test`
command in `.factory/claims.json`, in file order. There were 24 commands.

| Claim | Clean-run result |
| --- | --- |
| `sample-fixture` | **FAIL** — Playwright timed out after 60 s while its API web-server command downloaded/compiled Rust crates |
| `promise-status-from-allocation` | **FAIL** — the next 60 s web-server timeout occurred while compilation continued |
| `allocation-keeps-source` | **FAIL** — the third 60 s web-server timeout occurred before the server became ready |
| `supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `demo-feature-boundaries` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `clear-local-records` | PASS |
| `workspace-backup-roundtrip` | PASS |
| `csv-import-validation` | PASS |
| `demo-transfer-isolated` | PASS |
| `csv-template-download` | PASS |
| `entra-sign-in` | PASS |
| `tenant-data-isolation` | PASS |
| `two-device-sync` | PASS |
| `idempotent-sync` | PASS |
| `subscription-checkout` | PASS |
| `technician-seat-charge` | PASS |
| `expired-plan-keeps-export` | PASS |
| `container-runtime` | PASS |

The cause is test orchestration, not a failed product assertion:
`playwright.config.ts` gives each web server the default 60-second startup
window, while the cold Rust build runs in the web-server phase. The comment in
`e2e/global-setup.ts` says compilation happens before the web server, but
Playwright starts web servers before global setup. Compilation made incremental
progress across the first three commands and the fourth then ran successfully.

This distinction does not change the result: the work order explicitly says
any failing listed claim test is release-blocking. Full logs are
`claim-sample-fixture.log`, `claim-promise-status-from-allocation.log`, and
`claim-allocation-keeps-source.log`; the complete status list is
`claims-summary.tsv`.

After the build cache was warm, the full suite passed with **45 passed and 29
intentional cross-project skips**. Thus all claim assertions can pass, but not
under the required clean-clone invocation. Evidence: `e2e-full-retry.log`.

## Fresh live deployment evidence

- `/health` returned HTTP 200 with
  `build_sha: 7d38c3129687ea9945b36f65fdba88c931010faa`, `database: postgres`, and
  `auth: ready`.
- SHA-256 hashes of live and local production `index.html`, initial JS, CSS,
  and `sw.js` match exactly.
- `/`, `/demo`, `/?demo=1`, `/jobs`, `/auth/callback`, `/onboarding`, team,
  billing, privacy, terms, robots, sitemap, and manifest returned 200. An
  unknown route returned HTTP 404.
- HTML and `sw.js` use `no-cache, max-age=0, must-revalidate`. Fingerprinted JS
  and CSS use `public, max-age=31536000, immutable`.
- Responses include HSTS, CSP with header-delivered `frame-ancestors 'none'`,
  `nosniff`, strict referrer policy, `X-Frame-Options: DENY`, and a permissions
  policy denying camera, microphone, and geolocation.

Evidence: `live-health.json`, `live-*-headers.txt`, downloaded `live-index.*`,
`live-sw.js`, and `live-route-status.tsv`.

## Product, boundary, and recovery checks

- The demo opened RD-1042 at **Date at risk** with one condensate pump missing.
- Attempting to hold 2 when only 1 was required produced the specific recovery
  message **“Only 1 each is still needed for this job.”** Correcting the value
  to 1 changed the status to **Parts in hand**.
- A new job rejected quantity `0` using the `0.01` minimum, accepted the
  corrected quantity `1`, and preserved the entered job/part data.
- Supplier evidence dated after the visit buffer left the job at **Date at
  risk** and explained why.
- Backup/import, undo, supplier quantity conservation, reorder suggestion,
  demo/live isolation, and local storage clearing passed their registered
  claim tests.

Evidence: `live-boundary-qa.log`, `live-demo-desktop-offline.png`, and the
individual claim logs.

## PWA, mobile, keyboard, and accessibility

- At 390 × 844 there was no horizontal overflow. Visible controls measured at
  least 44 × 44 CSS pixels.
- Keyboard-only navigation opened the job, opened allocation, selected Van 2,
  and completed the allocation. Route navigation focused the new H1. The next
  keyboard-focused button had a visible 3 px purple outline with 3 px offset.
- `prefers-reduced-motion: reduce` set the motion token to `0s`.
- Independent axe scans of the demo, mobile completed state, privacy, terms,
  and designed 404 found zero serious/critical violations. The full repository
  suite also scans every public/account route in both themes and passed.
- `/opt/fleet/lib/verify-url.sh` passed on the live root and demo: title,
  `lang=en`, one H1, main landmark, alt text, labelled buttons, and no load
  errors.
- The service worker controlled the app, had no installing/waiting update, and
  used only `parts-promise-shell-v4`. Offline reload retained the sample and
  the completed allocation. Chrome reported no manifest or installability
  errors.

Evidence: `live-demo-mobile.png`, `live-browser-corrections.log`,
`pwa-installability.json`, and `verify-home/` / `verify-demo/`.

## Privacy and security

- The complete live demo allocation request log contains six requests: the
  same-origin document, two self-hosted fonts, hashed JS/CSS, and the original
  SVG. Every request is GET; there are no analytics, third-party, API, camera,
  or write requests.
- Allowed-origin CORS preflight returns the production origin. An evil origin
  receives no `Access-Control-Allow-Origin`.
- Live sign-in navigated to
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650`
  with the required client ID and production callback. An invalid bearer token
  returned 401 plus `WWW-Authenticate: Bearer`.
- A local real-server restart test persisted firm A's workspace, replayed one
  idempotency key only once, and did not expose firm A's record to firm B.

Evidence: `live-request-log.json`, `live-cors.log`, `live-entra.log`,
`live-invalid-auth.log`, and `backend-persistence.log`.

## Backend limits

Fresh live bursts observed:

| Route class | Documented allowance | Observed result |
| --- | --- | --- |
| Read (`/api/v1/bootstrap`) | 20/s, burst 40 | First 40 entered the route; 429 responses followed, with `Retry-After` |
| Write (`/api/v1/sync`) | 5/s, burst 10 | 10 entered the route; 20 of 30 were 429, with `Retry-After` |
| Critical (`/api/v1/onboarding`) | 5/min, burst 5 | 5 entered the route; 15 of 20 were 429, with `Retry-After: 11` |
| Protected metrics | Read bucket | 429 responses followed the read burst, with `Retry-After` |

Health is intentionally exempt. Read/write buckets currently emit
`Retry-After: 0` for sub-second waits; the header exists, but zero is not useful
backoff guidance.

The documented export allowance is not enforced. `.factory/plan.md` puts
export creation in the 5/min, burst-5 class, but `/api/v1/export` is attached
to the read bucket. Twelve simultaneous live requests all reached auth (401),
with no 429. Evidence: `live-rate-limit*.log` and
`live-export-rate-limit.log`.

## Build and performance

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS — 85 packages, zero vulnerabilities |
| `npm test` | PASS — 15 Vitest tests; 8 Rust tests passed, 1 PostgreSQL test ignored by design |
| `npm run check` | PASS — zero errors/warnings |
| `npm run format:check` | PASS |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS |
| `npm audit --audit-level=moderate` | PASS — zero vulnerabilities |
| `npm run build` | PASS — exact production build; cold release compile took 6m19s |
| Warm `npm run test:e2e -- --retries=0` | PASS — 45 passed, 29 intentionally skipped |

The initial JS is 108.23 kB raw / 35.88 kB gzip, CSS is 18.36 kB raw /
4.17 kB gzip, and fonts total 56.44 kB. The CIAM chunk is lazy-loaded at
62.08 kB gzip. All are within budget.

Fresh mobile Lighthouse: **97 performance, 100 accessibility, 100 best
practices, 100 SEO**; LCP 1.884 s, CLS 0, TBT 164 ms. Evidence:
`lighthouse-mobile.json` and build logs.

Docker/Podman is unavailable in this verification container, so I could not
rebuild the OCI image. The registered `container-runtime` claim did start the
real compiled server with only `PORT`, and the deployed assets/build SHA match.

## Defects by severity

### Blocker

1. **Three registered claim commands fail from a clean checkout.** Each hits
   the fixed 60-second Playwright web-server timeout during the cold Rust
   compile. The claims contract explicitly makes any such failure
   release-blocking.
2. **A customer cannot pay.** Fresh GETs to both the pilot and production
   Sociobot checkout URLs return
   `404 {"error":"enabled factory product","status":404}`. This violates the
   venture acceptance journey requiring a stranger to pay in under five
   minutes. The UI honestly discloses the missing registration, but disclosure
   does not make the purchase flow complete.

### High

1. **Signed-in offline edits have no durable outbox or conflict resolution.**
   `commit()` saves locally and attempts one immediate sync. A failure only
   sets a notice; reconnect does not retry. A server version conflict is shown
   as an error with no two-revision resolution UI. This does not meet the
   brief's offline-conflict constraint for a shared PWA.
2. **There is no signed-in account/firm deletion path.** Browser controls can
   delete local IndexedDB, and export exists, but no public route or API lets a
   customer delete server-held firm/account records. This misses the venture
   data-safety requirement for export/delete.
3. **Production recovery is not proven.** The repository's M2 handoff states
   that an isolated PostgreSQL restore drill has not been run. Retention
   configuration alone does not prove recovery.
4. **The documented export rate limit is not enforced.** Export is in the
   40-burst read bucket rather than the documented 5/min, burst-5 critical
   bucket.
5. **The claims registry is incomplete for README/privacy promises.** Examples
   without their own registered claim text and observable claim test include
   invitation activation by matching email, account network destinations, and
   audit-log recording. The existing seat test exercises invitation as setup,
   but its registered claim is only price/seat counting.

### Medium

1. **Metrics are below the documented operations contract.** The protected
   endpoint exposes only total requests and total failures. It does not expose
   the promised latency/status, sync-conflict, queue-age, or notification
   measures needed for the documented error budgets.

### Low

1. **Read/write throttles return `Retry-After: 0`.** This satisfies the literal
   header check but gives clients no meaningful delay and can encourage an
   immediate retry loop.

No serious/critical accessibility issue, cross-origin demo request, console
error on supported routes, deployment mismatch, bundle-budget failure, or
core local allocation error was found.
