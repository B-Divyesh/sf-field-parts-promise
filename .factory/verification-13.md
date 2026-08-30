# Independent verification 13 — Parts Promise

## Verdict: FAIL

Verified on 2026-08-30 for candidate
`0a8062b86f7cc5a92a550d9538943e8b3fee0c82` and
<https://field-parts-promise.sociobot.in>.

The live deployment is healthy and matches the requested candidate, and the
product's core local/demo workflow is usable. Release is nevertheless blocked:
the paid recurring product is still absent from both Sociobot gateways, the
documented API allowance is multiplied across live replicas, and the mandated
pre-install claims run fails from the clean clone.

No product source code was changed during verification.

## Defects by severity

All three findings below are release blocking under this work order. No
additional medium- or low-severity product defect was found.

### Blocker — the recurring subscription cannot be purchased

Fresh requests to both checkout URLs returned HTTP 404 with
`{"error":"enabled factory product","status":404}`:

- `https://api.sociobot.in/api/v1/products/field-parts-promise/checkout`
- `https://pilot-api.sociobot.in/api/v1/products/field-parts-promise/checkout`

The UI accurately says checkout is waiting for recurring-plan registration,
and its 424 fallback prevents an accidental charge. That is safe, but it does
not meet the researched $39/month plus $8/technician model or the venture
requirement that a customer can pay without operator help. This is the earlier
deployment-only failure, reproduced from fresh evidence.

### Blocker — the mandatory clean-clone claims invocation fails

`.factory/claims.json` exists, contains 31 entries, and each ID appears in
exactly one tagged Playwright test. Per the work order, every declared command
was executed before any install. All 31 failed before entering their sandbox:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@playwright/test'
imported from /work/repo/playwright.config.ts
CLAIMS_SUMMARY {"total":31,"failed":31}
```

After the required `npm ci`, the same 31 commands were rerun separately and in
file order. They all passed: `31/31`, `0` failed, in 862.7 seconds. Thus the
claim behavior is green in an installed checkout, but the literal clean-clone
gate required by this work order is not self-bootstrapping and failed.

### Blocker — the documented live rate allowance is not enforced globally

The source and README document a five-request critical bucket. Live responses
also advertise `X-RateLimit-Limit: 5`, but repeated requests from one fixed
`X-Forwarded-For` value were distributed across independent process buckets:

- `/api/v1/export`: requests 1–14 reached authentication; the first 429 was
  request 15; request 16 reached authentication again. A 30-request sequence
  returned 15 × 401 and 15 × 429. Every 429 had `Retry-After: 11`.
- `/api/v1/bootstrap`: despite an advertised burst of 40, the first 429 in a
  sequential 180-request sequence was request 154. The sequence returned
  158 × 401 and 22 × 429; every 429 had `Retry-After: 1`.
- Write-path probes did eventually throttle: 30 `/api/v1/sync` requests
  returned 20 × 422 and 10 × 429 with `Retry-After: 1`.

The backend therefore has a limiter, but the effective allowance scales with
the number of replicas. The documented five-request allowance is not the live
single-client allowance. Use a shared limiter or ingress-level enforcement so
request six is rejected regardless of replica selection.

## Mandatory first-read and demo gates: PASS

A cold live visit showed, in the first screen:

- **What:** “Promise dates from parts held for the job.”
- **Who:** “For small trade firms that need a parts check before agreeing a
  visit date.”
- **First action:** “Try it with sample data,” beside “Opens Riverside Dental
  with one missing pump.”
- **Three facts:** offline use after the first visit, browser-local sample
  changes, and exact Workshop pricing.

The action is one click and opens the working Riverside Dental `RD-1042`
sample. A persistent banner says “Demo — sample data; nothing is saved” and
offers **Reset demo** and **Start for real**.

## Candidate and deployment identity: PASS

- Clean checkout `HEAD` and `origin/main` were exactly
  `0a8062b86f7cc5a92a550d9538943e8b3fee0c82`.
- Live `/health` returned HTTP 200 with that exact `build_sha`,
  `database: "postgres"`, and `auth: "ready"`.
- The fresh production build emitted `index-D8q2hJLO.js` and
  `index-DEJqsrtx.css`. Their SHA-256 hashes matched the live files byte for
  byte.

## Local quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 85 packages installed; 0 vulnerabilities. |
| Every claim command after install | PASS — 31/31, no failed command. |
| `npm test` | PASS — Vitest 16/16; Rust 13 passed, 1 PostgreSQL integration test intentionally ignored without an isolated database. |
| `npm run check` | PASS — 0 errors and 0 warnings. |
| `npm run format:check` | PASS. |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS. |
| `npm run build` | PASS — exact Vite and optimized Rust release build; `dist/` produced. |
| `npm run test:e2e -- --retries=0` | PASS — 52 passed, 36 intentional cross-project skips, 0 failed. |

No Docker/Podman client is installed in the verifier, so the OCI image could
not be rebuilt. The release Rust binary's only-`PORT` startup is covered by the
passing `container-runtime` claim, and the live container identity is proven by
`/health`.

## End-to-end product behavior

- Fresh desktop and 390 × 844 contexts opened the demo at **Date at risk**
  with one condensate pump missing. Keyboard-only allocation of one unit from
  Van 2 changed the job to **Parts in hand** and displayed job, source,
  quantity, unit, updater, and check time. Undo returned it to **Date at risk**.
- In a fresh live local workspace, empty submission focused the required job
  number and reported “Please fill out this field.” Quantity `0` focused the
  input and reported the `0.01` minimum. Correcting it to `1` created job
  `BOUND-001` and its required part.
- Entering allocation quantity `2` when only `1` was needed did not submit;
  the allocation sheet stayed open and no allocation was created. Correcting
  to `1` succeeded.
- The installed claim suite additionally exercised supplier quantity
  conservation, supplier ETA/confidence evidence, reorder suggestions, JSON
  backup/restore, CSV preview/import errors, demo reset and isolation, shared
  sync/idempotency/conflicts, invitations, audit export, deletion hold, and
  unpaid-plan export.
- The landing page and README claims were cross-checked against
  `.factory/claims.json`; no unlisted visitor-facing capability claim was
  found. The product honestly states that this release does not scan barcodes
  or place supplier orders.

## Privacy, security, auth, and routing

- The complete fresh demo request log contained seven same-origin requests,
  all without a camera call. There were no analytics, remote fonts/scripts,
  console errors, page errors, or failed requests.
- Root and `sw.js` return `Cache-Control: no-cache, max-age=0,
  must-revalidate`; the hashed main JS returns `public, max-age=31536000,
  immutable`.
- Responses include HSTS, `nosniff`, strict referrer policy, frame denial,
  camera/microphone/geolocation denial, and a header CSP limited to the app,
  Microsoft CIAM, and the two Sociobot billing origins.
- A malformed bearer token returned 401 with `WWW-Authenticate: Bearer`.
- Clicking **Sign in** reached only
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650`
  with client `25c704f4-465a-47af-80ab-2c489466b697`, scopes
  `openid profile email offline_access`, PKCE, and the production callback.
  The Microsoft page loaded as “Sign in to your account.”
- No test user credential was provided, so a real production-tenant write was
  not created. Tenant persistence and isolation passed in the local API/browser
  suite; live PostgreSQL readiness is reported by `/health`.
- A crawl found no broken intended internal links. The designed unknown route
  returned a real HTTP 404. `robots.txt` and `sitemap.xml` were present.

## Accessibility, mobile, and PWA

- `/opt/fleet/lib/verify-url.sh` passed live in 720 ms: correct title,
  `lang=en`, one H1, a main landmark, zero missing image alternatives, zero
  unlabeled buttons, and no console/page errors.
- Independent live axe scans covered 11 routes, light/dark themes, and desktop
  plus 390 px mobile: **44 scans, 0 serious or critical findings**.
- The main action had a visible 3 px purple focus outline. Keyboard Enter
  completed navigation and allocation. All visible controls measured in the
  desktop/mobile core flow were at least 44 × 44 CSS px.
- At 390 px with the root font doubled to 200%, the document remained 390 px
  wide with no horizontal overflow and visible main content.
- Under reduced-motion emulation, `--motion-row` resolved to `0s`.
- The live service worker controlled the page, had no installing or waiting
  update, and used cache `parts-promise-shell-v5`. After going offline, the
  demo reloaded and the pump allocation still completed without console,
  page, or request-failure errors.

## Performance and budgets

Fresh live mobile Lighthouse:

| Category/metric | Result |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.7 s |
| LCP | 2.2 s |
| TBT | 60 ms |
| CLS | 0 |
| Total transfer | 436 KiB |

Build outputs meet component budgets: main JS 38.24 KB gzip, lazy CIAM JS
62.19 KB gzip, CSS 4.19 KB gzip, self-hosted fonts 56 KB total, hero SVG
2.3 KB, and no runtime CDN assets.

## Required release actions

1. Register and verify the recurring product in both Sociobot gateways,
   including a real pilot checkout and subscription lifecycle.
2. Enforce rate limits in shared state or at ingress so the documented
   allowance applies to one client across every replica.
3. Make the exact claim commands runnable at the mandated clean-clone stage,
   or amend the verification contract to require `npm ci` first.
