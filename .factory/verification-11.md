# Independent verification 11 — Parts Promise

## Verdict: FAIL

Verified on 2026-08-30 against candidate commit
`93fbd9ec997360c54ae424f9aa50abdd17e7d433` and
<https://field-parts-promise.sociobot.in>.

This is not a deployment-only failure: production is healthy and reports the
exact candidate build SHA. The candidate nevertheless fails the acceptance
contract because the promised recurring subscription cannot be purchased on
either Sociobot gateway. All repository tests and all registered claims pass.

## Mandatory first-read and demo gates: PASS

A cold live Chromium visit showed, in plain words:

- **What:** “Promise dates from parts held for the job.”
- **Who:** “For small trade firms that need a parts check before agreeing a
  visit date.”
- **First action:** “Try it with sample data” and “Opens Riverside Dental with
  one missing pump.”

The action is visible on the first screen and opens the working RD-1042 sample
in one click. `?demo=1` shows the required persistent “Demo — sample data”
banner with **Reset demo** and **Start for real**.

## Mandatory claims gate: PASS

`.factory/claims.json` exists and declares 31 claims. From the clean candidate
checkout after `npm ci`, I ran every declared exact command separately, in file
order, against its demo/test entry point. The recorded result was
`CLAIMS SUMMARY 31/31 passed` (exit 0).

All of these passed: sample fixture/status/allocation/supplier conservation and
reorder; demo reset, isolation, offline reload and feature boundaries; local
workspace, IndexedDB, privacy and clearing; JSON/CSV transfer; CIAM, tenant
isolation, two-device/idempotent/offline sync and conflict handling; invitation
activation, account boundaries, audit/deletion; rate policy, checkout fallback,
seat pricing, unpaid export, and container runtime.

## Local quality gates: PASS

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 85 packages installed; `npm audit` had no vulnerabilities. |
| `npm test` | PASS — Vitest 16/16; Rust API 10 passed. One PostgreSQL round-trip is intentionally ignored without an isolated `DATABASE_URL`. |
| `npm run check` | PASS — 0 errors, 0 warnings. |
| `npm run format:check` | PASS. |
| `npm run build` | PASS — Vite production build plus cold Rust release build (6m49s). |
| Release runtime, `env -i PORT=18080` | PASS — served `/health`, `/` and an HTTP 404 for an unknown route using generated SQLite fallback. |

The production web build contains 38.24 KB gzip application JS plus 62.19 KB
gzip CIAM JS (100.43 KB gzip total), and 4.19 KB gzip CSS: within the 200 KB JS
and 50 KB CSS budgets. Docker is unavailable in this verifier container, so
the OCI image was not rebuilt; the registered `container-runtime` claim passed
against the real compiled server and the deployed build identity is exact.

## Live deployment, privacy, PWA, and accessibility: PASS

- `GET /health` returned HTTP 200 with
  `build_sha: 93fbd9ec997360c54ae424f9aa50abdd17e7d433`, `database: postgres`,
  and `auth: ready`.
- Root, demo, privacy, terms, manifest, robots, sitemap, and live links work;
  an unknown path is a real HTTP 404. HTML and `sw.js` are no-cache; hashed JS
  and CSS are immutable for one year.
- Headers include HSTS, `nosniff`, strict referrer policy, frame denial,
  camera/microphone/geolocation denial, and a header-delivered CSP.
- A demo request log contained only same-origin GETs for document, self-hosted
  fonts, JS, CSS, and SVG. There were no API writes, analytics, camera calls,
  console errors, or page errors.
- A fresh demo context was controlled by the service worker. With the context
  offline, reload retained the Riverside Dental demo. The checked-in worker
  has a versioned cache, `skipWaiting`, `clients.claim`, and no-cache worker
  delivery for updates.
- At desktop and 390 × 844, demo content had no horizontal overflow. Keyboard
  tab order reached all tested controls, with a visible 3 px focus outline.
  Reduced-motion is respected; offline demo reload works under reduced motion.
  Axe WCAG A/AA scans of desktop, 390 px mobile, and dark mobile demo reported
  zero serious or critical findings (in fact zero violations).
- The normal allocation flow worked: RD-1042 began **Date at risk** with the
  missing condensate pump; holding one unit from Van 2 changed it to **Parts in
  hand** and produced a reorder suggestion without ordering. The input enforces
  a minimum quantity of 0.01, and correcting an invalid zero to one recovered
  the flow without errors.
- Live sign-in redirects only to
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650`, with
  client `25c704f4-465a-47af-80ab-2c489466b697` and the required callback. An
  invalid bearer token returns `401` and `WWW-Authenticate: Bearer`.

## Server request allowance: PASS

The documented read bucket is 20 requests/sec with a 40-request burst. A
fresh 120-request concurrent live burst to `/api/v1/bootstrap`, keyed with one
`X-Forwarded-For` value, produced 51 `401` responses and then 69 `429`
responses, every limited response with `Retry-After: 1`. A single invalid-token
request also exposed `X-RateLimit-Limit: 40` and `X-RateLimit-Remaining: 39`.
The registered response-policy claim additionally passed its authenticated
five-request critical-export and protected-metrics checks.

## Defects by severity

### Blocker

1. **The recurring subscription cannot be purchased.** Fresh independent GETs
   to both
   `https://api.sociobot.in/api/v1/products/field-parts-promise/checkout` and
   `https://pilot-api.sociobot.in/api/v1/products/field-parts-promise/checkout`
   returned HTTP 404 with `{"error":"enabled factory product","status":404}`.
   The UI accurately says checkout is waiting for registration and the
   `subscription-checkout` claim correctly verifies no charge is attempted,
   but the brief promises a $39/month workshop plus $8/technician subscription
   and the venture acceptance contract requires a customer to be able to pay.
   Register the recurring Sociobot product, then re-verify checkout, quantity
   changes, cancellation, failed renewal, and refund/revocation.

### High / medium / low

No additional defects found.

## Verification commands

```sh
npm ci
# every exact .factory/claims.json test command, separately
npm test
npm run check
npm run format:check
npm run build
```

The test transcript and temporary browser/runtime evidence were collected in
the disposable verifier container. No product source code was modified.
