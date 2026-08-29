# Independent verification 8 — Parts Promise

## Verdict: PASS

Verified on 2026-08-29 against candidate commit
`92a940321eb16b2fcea57063a70c19e147942358` and the live deployment
<https://field-parts-promise.sociobot.in>.

The live `/health` response reports exactly
`{"status":"ok","build_sha":"92a940321eb16b2fcea57063a70c19e147942358"}`.
Local and live SHA-256 values also match for `index.html`, the hashed JS/CSS,
both self-hosted fonts, hero SVG, service worker, and web manifest.

## First-read and demo gate: PASS

I opened the live root in a fresh Chromium context with an empty browser
profile. The first screen says, in plain words:

- **What it does:** "Promise dates from parts held for the job."
- **For whom:** "For solo tradespeople who need a parts check before agreeing
  a visit date."
- **What to click first:** **Try it with sample data**; adjacent copy says it
  opens Riverside Dental with one missing pump.

The action is present on the first screen and opens the working, realistic
RD-1042 sample in one click. Evidence: `qa-artifacts/verification-8-live-cold-desktop.png`.

## Mandatory claims gate: PASS

`.factory/claims.json` exists with 16 unique claims. After a clean `npm ci`, I
ran every exact declared command separately through the shipped demo entry
point. Every command exited 0; the per-claim logs and summary are in
`qa-artifacts/verification-8-claims/`.

| Claim | Result |
| --- | --- |
| `promise-status-from-allocation` | PASS |
| `allocation-keeps-source` | PASS |
| `supplier-quantity-conserved` | PASS |
| `reorder-after-allocation` | PASS |
| `demo-reset-isolated` | PASS |
| `offline-reload` | PASS |
| `local-workspace-flow` | PASS |
| `m1-feature-boundaries` | PASS |
| `free-browser-release` | PASS |
| `indexeddb-local-storage` | PASS |
| `demo-network-privacy` | PASS |
| `clear-local-records` | PASS |
| `workspace-backup-roundtrip` | PASS |
| `csv-import-validation` | PASS |
| `demo-transfer-isolated` | PASS |
| `container-runtime` | PASS |

I also cross-checked visitor-facing copy on the landing page, Privacy, Terms,
README, and demo guide against the registry. No unlisted visitor-facing claim
was found.

## Local quality gates: PASS

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 83 locked packages; zero audit vulnerabilities |
| `npm test` | PASS — 15 Vitest and 3 Rust tests |
| `npm run check` | PASS — zero errors/warnings |
| `npm run format:check` | PASS |
| `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` | PASS |
| `npm audit --audit-level=moderate` | PASS — zero vulnerabilities |
| `npm run build` | PASS — produced `dist/` and release Rust binary |
| `npm run test:e2e` | PASS — 35 passed, 21 intentional project skips |

Logs are in `qa-artifacts/verification-8-local/`. The production build is
92.33 KB raw / 31.12 KB gzip JavaScript and 16.99 KB raw / 3.97 KB gzip CSS,
well within the static-product budgets.

## Product, responsive, keyboard, and accessibility QA: PASS

- **Normal path, live desktop:** RD-1042 begins **Date at risk**; allocating
  one condensate pump from Van 2 changes it to **Parts in hand**. The final
  spare causes the truthful reorder suggestion, which explicitly says no
  supplier order has been placed.
- **Boundary and recovery, live desktop:** entering quantity 2 announces
  "Only 1 each is still needed for this job." Correcting it to 1 succeeds in
  the open sheet without losing work.
- **Data boundaries:** the claim suite covers supplier-unit conservation,
  allocation persistence over reload, undo, supplier-date evidence,
  row-level invalid CSV prevention, JSON backup/restore, and demo/live storage
  isolation.
- **390 px and keyboard:** on the live 390 × 844 viewport, keyboard Enter
  completed the allocation flow. All sampled visible controls were at least
  44 px high and wide, including the repaired header/footer links; the full
  local suite tests every route in both themes and required 8 px separation.
- **Focus and motion:** the full browser suite verifies route-heading focus,
  dialog focus containment/restoration, visible focus, and mobile form-sheet
  focus. The live reduced-motion context reports `--motion-row: 0s`.
- **Axe:** live axe scans of demo, Jobs, Privacy, Terms, and designed 404 found
  zero serious or critical violations. The full local suite expands this to
  six routes, two themes, and desktop/mobile projects.
- **Basic crawl:** `/opt/fleet/lib/verify-url.sh` passed against the live URL:
  HTTP 200, title, `lang=en`, exactly one H1, main landmark, no missing image
  alt text or unlabeled buttons, and no landing console/page errors. Its JSON
  and screenshots are in `qa-artifacts/verification-8-live/verify-url/`.

The direct designed-404 navigation emits Chromium's expected failed-resource
console message because its document response is correctly HTTP 404; this is
not an application exception. Normal and demo routes had no console/page
errors.

## Privacy, PWA, security, and runtime: PASS

- A full live demo request log recorded only same-origin GET requests; it made
  no analytics, third-party, mutation, camera, sign-in, checkout, or AI call.
  The source-to-job data remains in the separate browser IndexedDB workspaces.
- Live responses provide `X-Content-Type-Options: nosniff`, strict referrer
  policy, `X-Frame-Options: DENY`, camera/microphone/geolocation denial, and a
  self-only CSP with header-delivered `frame-ancestors 'none'`.
- HTML and `sw.js` use no-cache; fingerprinted JS/CSS are immutable for one
  year; stable fonts and the SVG use one-hour caching. Response evidence is in
  `qa-artifacts/verification-8-live/*.headers`.
- The production PWA had an active service-worker controller with no waiting
  or installing update. After going offline, reloading `?demo=1`, and
  allocating the sample pump, it still reached **Parts in hand**.
- This M1 release has no sign-in and no customer-data API. `/health` is the
  sole server API and is health-check exempt; `/api/v1/jobs` is not a job-data
  endpoint. Therefore there is no documented non-health request allowance or
  applicable 429/`Retry-After` path to exercise. CIAM verification is not
  applicable.

## Defects by severity

| Severity | Findings |
| --- | --- |
| Blocker | None |
| Critical | None |
| High | None |
| Medium | None |
| Low | None |

## Evidence index

- Claim logs: `qa-artifacts/verification-8-claims/`
- Local test/build/lint logs: `qa-artifacts/verification-8-local/`
- Live headers, parity hashes, request/axe smoke, PWA smoke, and URL verifier:
  `qa-artifacts/verification-8-live/`
- Desktop and 390 px live screenshots:
  `qa-artifacts/verification-8-live-*.png`

