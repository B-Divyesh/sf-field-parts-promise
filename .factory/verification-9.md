# Independent verification 9 — Parts Promise

## Verdict: PASS

Verified on 2026-08-29 against candidate commit
`2def11baf4c5473469fa8ae02c50ebfc25e2040c` and
<https://field-parts-promise.sociobot.in>.

Fresh production evidence resolves the earlier deployment concern. Live
`/health` returned exactly:

```json
{"status":"ok","build_sha":"2def11baf4c5473469fa8ae02c50ebfc25e2040c"}
```

The SHA-256 values of live `index.html`, `assets/index-C3DKxGI0.js`, and
`assets/index-CQwSfvsF.css` exactly equal this checkout's production build.

## Mandatory first-read and claims gates: PASS

I opened the live root cold in an empty Chromium profile. The first screen
plainly says it helps users “Promise dates from parts held for the job,” is
“For solo tradespeople who need a parts check before agreeing a visit date,”
and tells them to click **Try it with sample data**. Adjacent copy says that
it opens Riverside Dental with one missing pump. This is a visible one-click,
realistic demo. Screenshot: `qa-artifacts/verification-9-live-cold.png`.

After a clean `npm ci`, I ran every exact command registered in
`.factory/claims.json`, serially, through the Playwright demo entry point.
All 18 completed without a failure:

- `sample-fixture`
- `promise-status-from-allocation`
- `allocation-keeps-source`
- `supplier-quantity-conserved`
- `reorder-after-allocation`
- `demo-reset-isolated`
- `offline-reload`
- `local-workspace-flow`
- `m1-feature-boundaries`
- `free-browser-release`
- `indexeddb-local-storage`
- `demo-network-privacy`
- `clear-local-records`
- `workspace-backup-roundtrip`
- `csv-import-validation`
- `demo-transfer-isolated`
- `csv-template-download`
- `container-runtime`

The full 62-test browser suite subsequently reported
`{"status":"passed","failedTests":[]}` in `test-results/.last-run.json`.

## Local gates: PASS

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 83 locked packages, zero audit vulnerabilities |
| `npm test` | PASS — 15 Vitest tests and 3 Rust tests |
| `npm run check` | PASS — zero Svelte/TypeScript errors or warnings |
| `npm run format:check` | PASS |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS |
| `npm audit --audit-level=moderate` | PASS — zero vulnerabilities |
| `npm run build` | PASS — produced `dist/` and release server binary |
| `npm run test:e2e -- --retries=0` | PASS — 62 tests, no failed tests |

The initial JavaScript bundle is 93.16 kB raw / 31.39 kB gzip; CSS is 16.98
kB raw / 3.96 kB gzip, within the stated budgets.

## Independent live product QA: PASS

- **Core flow and recovery:** In `?demo=1`, RD-1042 started at **Date at
  risk**. An attempted two-unit allocation announced “Only 1 each is still
  needed for this job.” Correcting it to one unit from Van 2 produced **Parts
  in hand** and the truthful suggestion: Van 2 has zero pumps, below its
  one-unit minimum, and no supplier order was placed.
- **Mobile and keyboard:** At 390 x 844, Enter opened the sample job and
  allocation sheet; keyboard completion reached **Parts in hand**. There was
  no horizontal overflow (`innerWidth` and `scrollWidth` were both 390).
  Route focus settled on the new H1. Screenshot:
  `qa-artifacts/verification-9-live-mobile.png`.
- **Accessibility:** `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, title,
  `lang=en`, one H1, main landmark, no missing image alt text, no unlabelled
  buttons, and no console/page errors. Its report is
  `qa-artifacts/verification-9-verify-url/verify.json`. Independent axe scans
  of demo, demo jobs, Privacy, Terms, and the designed 404 had zero serious
  or critical findings. Reduced motion sets `--motion-row` to `0s`; sampled
  keyboard focus used a solid visible outline.
- **PWA:** The live service worker controlled the app, had neither installing
  nor waiting update, and used cache `parts-promise-shell-v3`. With the
  browser offline after the first visit, reload plus the allocation flow still
  reached **Parts in hand**.
- **Privacy:** A request log through the entire demo allocation flow contained
  only same-origin GET requests (document, self-hosted fonts, app JS/CSS, and
  original SVG). There were no analytics, third-party, camera, sign-in,
  checkout, or write requests. `Permissions-Policy` denies camera,
  microphone, and geolocation.
- **Headers and caching:** HTML and `sw.js` are no-cache; fingerprinted JS and
  CSS are one-year immutable. Responses provide a self-only CSP with
  header-delivered `frame-ancestors 'none'`, `nosniff`, strict referrer policy,
  and `X-Frame-Options: DENY`.
- **Backend/rate limits:** This M1 release exposes no customer-data API; live
  `/health` is the sole server endpoint and the documented plan explicitly
  exempts health checks from rate limiting. `/api/v1/jobs` is not an API route.
  Consequently there is no non-health documented allowance for which a 429 /
  `Retry-After` test applies. There is no sign-in, so CIAM is not applicable.

## Deployment/container note

The production build and the `container-runtime` claim passed; that claim
starts the compiled Rust server with only `PORT`, verifies health/build
identity, rejects job-data requests, verifies 404 behaviour, and checks the
non-root `rust:1-slim` Dockerfile contract. A direct Docker image build could
not be repeated because the verification container has no `docker` executable.
This is an environment limitation, not a product failure.

## Defects by severity

| Severity | Findings |
| --- | --- |
| Blocker | None |
| Critical | None |
| High | None |
| Medium | None |
| Low | None |
