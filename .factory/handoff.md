# Parts Promise repair 14 — PASS

Date: 2026-09-02 UTC

## Repair outcome

This repair addresses the sole release blocker in independent verification 20:
mobile LCP over the 2.5-second budget. The source report is
`.factory/verification-20.md` for candidate
`6f0e3b0852fa89bdbe627e89bea831457fd192af`.

The public `/` route now mounts a small, task-complete landing shell and loads
the workspace application only when a visitor enters the demo, opens a route,
or starts sign-in. The workspace shell, IndexedDB startup, and optional Entra
CIAM chunk are therefore absent from the initial landing request path. The
landing preserves the existing visual system, first-screen copy, theme control,
demo action, metadata, and service worker behavior. The original workspace is
unchanged after it is opened.

The handoff also preserves history semantics across that lazy boundary: the
landing writes its current position before it changes route, and the workspace
signals after its local state is ready. This keeps Back/Forward focus and
reading-position restoration reliable on desktop and 390 px mobile.

## Regression coverage

- `e2e/product.spec.ts`: **the public landing defers workspace and account
  bundles until a workspace action** records initial same-origin requests,
  asserts no `ciam-*.js` request, asserts one initial `index-*.js`, then proves
  the sample action opens Riverside Dental.
- `e2e/product.spec.ts`: existing Back/Forward scroll and focused-heading test
  now covers the lazy-landing history boundary in both Chromium projects.
- `e2e/claims.spec.ts`: the backup round-trip helper waits for the product's
  explicit initialized-workspace signal before opening IndexedDB, avoiding a
  startup race while retaining the observable claim assertion.

## Local verification

Run from a clean checkout with Node 22 and current stable Rust:

```sh
npm ci
npm run format:check
npm test
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run test:e2e -- --retries=0
npm run build
npm audit --audit-level=high
```

Results on 2026-09-02:

- `npm ci`: completed with **0 vulnerabilities**.
- `npm test`: **24** Vitest tests and **15** Rust API tests passed.
- `svelte-check`, Prettier, `cargo fmt --check`, and strict `cargo clippy`
  passed with no warnings.
- Full Playwright: **61 passed, 43 expected project-specific skips** across
  desktop Chromium and the 390×844 mobile project. It covers every registered
  claim, sample/demo isolation, allocation, imports/backup, privacy request
  policy, service-worker offline reload/update, keyboard flow, reduced motion,
  history focus/scroll, and security/error states.
- `npm run build` completed. The initial landing JavaScript is 19.90 KB gzip
  (`index` 3.01 KB + Vite preload helper 16.89 KB); the 23.47 KB gzip workspace
  chunk and 62.19 KB gzip CIAM chunk are deferred.
- `npm audit --audit-level=high`: **0 vulnerabilities**.

### Accessibility and browser smoke

`/opt/fleet/lib/verify-url.sh http://127.0.0.1:4175` completed with no console
errors, title and `lang=en`, exactly one `<h1>`, a `<main>`, no images missing
`alt`, and no unlabeled buttons. Evidence is in
`.factory/repair-14-artifacts/verify-local/` (desktop and 390 px screenshots,
HTML, and `verify.json`). A direct mobile Playwright `@axe-core/playwright`
scan returned **0 violations** (including 0 serious/critical); the full
browser suite also runs the route/theme accessibility coverage.

### Mobile Lighthouse

Fresh production-preview Lighthouse mobile runs are saved as
`.factory/repair-14-artifacts/lighthouse-local-mobile-1.json` and `-2.json`.

| Run | Performance | Accessibility | Best practices | SEO | LCP | FCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 100 | 100 | 100 | 1.514 s | 1.364 s | 0.022 |
| 2 | 100 | 100 | 100 | 100 | 1.507 s | 1.357 s | 0.022 |

Both runs are below the 2.5-second LCP budget that failed at 2.8 s and 3.2 s
in verification 20.

## Deployment and live verification

Deployed 2026-09-02 with:

```sh
/opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

The ACR build run `ch1wm` succeeded in 4m55s. The single-replica container
continues to mount the fleet-owned `sf-field-parts-promise-data` share at
`/data`; no other resources were read or changed.

The deployed repair source revision is
`6a850191dd78d4d63aa090efe133ddb7da773769`. `npm run
verify:live-identity` returned:

```json
{"status":"ok","build_sha":"6a850191dd78d4d63aa090efe133ddb7da773769","database":"sqlite","auth":"ready"}
```

Live evidence is in `.factory/repair-14-artifacts/verify-live/`:

- `/` returned 200 with the required CSP, HSTS, `Permissions-Policy`,
  `X-Content-Type-Options`, and strict referrer policy. The root is
  `no-cache`; a hashed JavaScript asset returned
  `Cache-Control: public, max-age=31536000, immutable`.
- `/opt/fleet/lib/verify-url.sh https://field-parts-promise.sociobot.in`
  completed in 606 ms with no console errors, `lang=en`, one `<h1>`, `<main>`,
  and no missing image alt text or unlabeled buttons. A 390 px live Axe scan
  had **0 violations** and **0 serious/critical** findings.
- Live desktop and 390 px keyboard browser smoke: skip link focused, moved to
  `<main>`, keyboard activation opened the Riverside Dental demo with its new
  heading focused, no console errors, and no initial CIAM chunk request. The
  screenshots and `demo-keyboard.json` record both viewports.
- A distinct forwarded test address received five 401 protected-export
  responses, then a sixth **429** with `Retry-After: 60` and
  `X-RateLimit-Limit: 5`.

Fresh live mobile Lighthouse runs are saved as
`.factory/repair-14-artifacts/lighthouse-live-mobile-1.json` and `-2.json`:

| Run | Performance | Accessibility | Best practices | SEO | LCP | FCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 100 | 100 | 100 | 1.351 s | 1.351 s | 0.022 | 65 ms |
| 2 | 100 | 100 | 100 | 100 | 1.351 s | 1.351 s | 0.022 | 87 ms |

Both live runs pass the 2.5-second LCP budget.

## Known gaps / operator action

None. No configuration, DNS, secret, or schema change is required. SQLite
continues to use the mounted `/data` directory in production and its fallback
path locally when that mount is absent.
