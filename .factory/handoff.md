# Parts Promise repair 7 handoff

Date: 2026-08-30 UTC
Work order: `field-parts-promise-repair-7`

## Outcome

Independent verification 11 has one release blocker: the promised recurring
Parts Promise subscription is absent from both Sociobot billing catalogues. It
is not a repository or deployment defect. At repair time, fresh unauthenticated
GETs returned the same response from both endpoints:

```text
https://api.sociobot.in/api/v1/products/field-parts-promise/checkout
https://pilot-api.sociobot.in/api/v1/products/field-parts-promise/checkout
HTTP 404 {"error":"enabled factory product","status":404}
```

The product continues to fail closed: the signed-in owner receives a 424 with
`billing_product_not_registered`, a clear next step, and no redirect to Dodo.
It does not falsely claim that checkout works.

The repository instruction forbids billing or infrastructure mutations from
this product repository. The only supplied factory paid-product integration is
for a one-time fixed-price license, which cannot represent the researched
`$39/month` workshop charge plus `$8/month` active-technician quantity. A
direct Dodo integration or a substituted one-time product would violate both
the product brief and the factory contract.

## Repository repair and regression coverage

- Added `registered_checkout_returns_the_gateway_url_without_following_its_redirect`
  in `server/src/lib.rs`. It starts a local Sociobot-gateway stand-in that
  returns the real gateway shape, HTTP 303, then asserts that the owner-only
  Parts Promise API returns the gateway checkout URL and does **not** follow
  the hosted Dodo redirect itself. This is the exact success-path regression
  that becomes live as soon as the recurring product is registered.
- Preserved the verified 404 fallback claim. `@claim:subscription-checkout`
  runs against the real pilot adapter and proves the unavailable product stops
  before any charge.
- Preserved all existing demo, offline, identity, shared-workspace, export,
  data-deletion, rate-limit, accessibility, privacy, and response-policy
  behavior.

## Verification

- Clean install: `npm ci` installed 85 packages; `npm audit --audit-level=moderate`
  found 0 vulnerabilities.
- Unit/API: `npm test` passed 16 Vitest tests and 11 Rust tests. One real
  PostgreSQL round-trip remains intentionally ignored without an isolated
  `DATABASE_URL`.
- Static checks: `npm run check`, `npm run format:check`, and strict
  `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`
  passed.
- Production build: `npm run build` passed and produced `dist/`. Initial JS is
  38.24 KB gzip, CSS is 4.19 KB gzip, and the lazy CIAM chunk is 62.19 KB gzip.
- Browser: `npm run test:e2e -- --retries=0` passed. Every one of the 31 exact
  commands in `.factory/claims.json` was then run separately from the clean
  install; all passed. This includes desktop, 390 px mobile, keyboard,
  Playwright axe serious/critical scans, privacy destinations, offline reload
  and worker-update behavior, CIAM redirect/token-policy coverage, and API
  response policy.
- Release runtime: the real release binary started with only `PORT` plus a
  temporary data directory. `/health` returned `200` with SQLite fallback and
  build SHA `dev`; `/` returned 200 and an unknown route returned a real 404.
- `verify-url.sh` passed locally for `/` and `/?demo=1`: no page or console
  errors, correct titles, `lang=en`, one h1, a main landmark, and no image
  missing alt text. Evidence is under `.factory/repair-7-artifacts/`.
- The standalone `@axe-core/cli` could not launch the container's ChromeDriver
  against the preinstalled Playwright Chromium, even with the explicit binary
  path. The repository's Playwright `AxeBuilder` scans did run in the complete
  browser suite and passed with zero serious/critical findings across light and
  dark public/account routes, including the 390 px project.
- No Docker/Podman engine is installed in this worker. The Dockerfile's two
  build stages and distroless runtime inputs were validated by the production
  web build and release-binary smoke above; container deployment remains the
  factory ACR build.

## Deploy and live checks

Commit `58a687699d98775faf8594af5d866c6ea8a353a3` is pushed to `main` and
deployed through:

```sh
/opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

After deployment, `GET /health` returned 200 with that exact SHA, PostgreSQL,
and ready auth. `verify-url.sh` passed against the public home and demo URLs
at desktop and 390 px with no console/page errors. The live mobile probe
confirmed: same-origin-only demo requests, a controlling worker, successful
offline demo reload, no horizontal overflow, 44 px minimum visible button
size, and zero serious/critical axe results. The live sign-in action requested
only the shared Sociobot CIAM authorization endpoint with client
`25c704f4-465a-47af-80ab-2c489466b697` and callback
`https://field-parts-promise.sociobot.in/auth/callback`.

A fresh 80-request invalid-token burst to live `/api/v1/bootstrap` returned
42 × 401 followed by 38 × 429, all limited responses with `Retry-After: 1`.
Live headers still provide CSP, HSTS, nosniff, strict referrer policy, frame
denial, device-permission denial, and no-cache delivery for HTML and `sw.js`.

Mobile Lighthouse against the live demo scored Performance **99**,
Accessibility **100**, Best Practices **100**, SEO **100**; LCP was
1,996.962 ms and CLS 0. The served health/header, `verify-url`, screenshot,
and Lighthouse evidence is retained under `.factory/repair-7-artifacts/`.

The repeated post-deploy pilot and production checkout probes still return the
documented `404 enabled factory product`; deployment did not and cannot alter
that separate billing-catalogue state.

## Remaining release blocker — factory operator action

Register a **recurring** Sociobot product named `field-parts-promise` in both
pilot and production with these exact commercial terms: `$39/month` workshop
base and `$8/month` per active technician; preserve the owner exclusion.
Configure the product's return URL and signed entitlement-event contract for
this backend. Then complete a real pilot checkout with `4242 4242 4242 4242`
and verify return, active-seat increase/decrease, cancellation, failed renewal,
and refund/revocation. Finally rerun the registered checkout regression and
the live purchase path.

Until that catalogue state exists, this product is buildable and safe to demo,
but cannot honestly be marked release-ready for its recurring paid plan.
