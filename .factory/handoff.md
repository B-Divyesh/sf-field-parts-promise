# Parts Promise review 5 handoff

## Result — FAIL

Date: 2026-09-01 UTC

Work order: `field-parts-promise-review-5`

Repository HEAD reviewed: `c03dff99017567d07abdccebc7d0c4b63b97d53d`

Live build: `25ca773effc757331984d025c9b842d16c1a582a`

The product code in those commits is identical. No product code was changed.

The cold mobile and desktop first screens pass. The one-click sample opens with
realistic data, changes status after allocation, resets correctly, remains
separate from live storage, and issues only same-origin read requests. All 31
registered claim commands passed independently from a clean clone.

The review fails with one blocking regression and additional public-copy,
claim-registration, structure, and missed-feature findings. The earlier
browser-storage terminology issue has returned. Public copy also makes
unregistered payment-provider, refund, sensitive-data, release-boundary, and
deployment statements. Two README sentences exceed 22 words. The footer lacks
a build identifier and does not announce its external destination. The paid
firm offer still lacks the brief-implied barcode path.

Verification completed:

- `npm test`: 21 Vitest and 14 Rust checks passed.
- all 31 exact `.factory/claims.json` commands: passed from
  `/tmp/field-parts-promise-review-5-Wt5Q79`;
- `npm run check` and `npm run format:check`: passed;
- `npm run build`: passed and produced `dist/` plus the release server;
- `npm run test:e2e -- --retries=0`: 52 passed, 36 intentional skips;
- factory URL checks for `/` and `/demo`: passed;
- live route, metadata, link, history, request, and Axe checks: completed.

Full findings and fixes: [`.factory/review-5.md`](review-5.md). Evidence is in
`.factory/qa-artifacts/review-5/`.

---

# Historical: Parts Promise verification 16 handoff

## Result — PASS

Date: 2026-09-01 UTC

Work order: `field-parts-promise-verify-16`

Candidate and deployed commit: `25ca773effc757331984d025c9b842d16c1a582a`

Live URL: <https://field-parts-promise.sociobot.in>

Independent verification passes. All 31 manifest claim commands passed from
the clean candidate checkout. `npm test`, Svelte checking, formatting, strict
Rust clippy, the exact production build, and the full Playwright suite passed.
The full suite result was 52 runnable tests passed, 36 intentional
project-specific skips, and 0 failures.

The live `/health` response reports the exact candidate SHA, SQLite, and auth
readiness. The live HTML, main JavaScript, CSS, service worker, and manifest
match the locally built candidate byte for byte. The prior deployment-identity
blocker is resolved.

Fresh live checks passed the cold first-read gate, one-click demo, normal and
invalid allocation paths, reset recovery, desktop and 390 px layouts, keyboard
operation, visible focus, 200% text sizing, reduced motion, the 44-scan axe
route/theme/viewport matrix, privacy request recording, service-worker update,
offline reload, response headers, caching, and the five-request API allowance.
Mobile Lighthouse scored 94 performance and 100 for accessibility, best
practices, and SEO. No product defect was found.

The recurring subscription remains deliberately operator-gated until its
Workshop and technician-seat product is registered in the approved Sociobot
billing system. The current 424-before-charge behavior and explanatory UI are
tested. No product code was changed during verification.

Full evidence: [`.factory/verification-16.md`](verification-16.md).

---

# Historical: Parts Promise repair 12 handoff

## Result — release candidate ready for exact-identity deployment

Date: 2026-08-30 UTC

Work order: `field-parts-promise-repair-12`

Verifier report commit: `a8b7b6fc2f1ea85fbc281e48ccb28be80bfa773a`

Rejected candidate: `6a05b4b12fff6794870ce4d9cd74a4b3ded5095d`

Release candidate: the repository HEAD containing this handoff

Live URL: `https://field-parts-promise.sociobot.in`

## Release blocker and repair

The required failure was reproduced first against the permitted public target.
`GET /health` returned HTTP 200 with:

```json
{"status":"ok","build_sha":"90e83f5504fac85a7b5b685819dbef389ba74379","database":"sqlite","auth":"ready"}
```

That is the rejected candidate's direct parent, not full SHA `6a05b4b…`.
The application and SQLite contract were already correct; the root cause was
that the handoff-only candidate had not been rebuilt and deployed.

The release identity checker already requires an exact supplied build SHA and
SQLite. Repair commit `888c37e` adds the missing regression for verifier 15's
exact payload: parent build `90e83f5…` is rejected even though it correctly
reports SQLite. The production image must be built from the final repository
HEAD with `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT` set to that same full
SHA. The post-deploy gate is:

```sh
EXPECTED_BUILD_SHA="$(git rev-parse HEAD)" npm run verify:live-identity
```

## Clean local verification

- `npm ci` installed 85 packages; audit reported 0 vulnerabilities.
- `npm test` passed: 21 Vitest tests and 14 Rust API tests.
- `npm run check` passed with 0 errors and 0 warnings.
- `npm run format:check` passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` passed.
- `npm run build` passed and produced `dist/` plus the release server. Main JS
  is 38.25 KB gzip, deferred CIAM JS is 62.19 KB gzip, and CSS is 4.19 KB gzip.
- `npm run test:e2e -- --grep @claim: --retries=0` passed all 31 declared
  claims with 31 intentional project-duplicate skips.
- `npm run test:e2e -- --retries=0` passed all 52 runnable browser cases with
  36 intentional project skips. Coverage includes desktop, 390 px mobile,
  keyboard and focus management, route/theme axe checks, privacy request
  recording, offline reload, service-worker update, response policy, and the
  compiled server started with only `PORT`.

## Deployment boundaries

The permitted target template was checked by querying only
`sf-field-parts-promise`. It has exactly one `PORT` environment setting, a
single `/data` mount backed by `sf-field-parts-promise-data`, and
`minReplicas: 1` / `maxReplicas: 1`. The repair preserves that template and
changes only the target image. No shared service, secret, database, or other
product resource was inspected or modified.

## Known gaps and next steps

No product-code gap remains from verification 15. Independent verification
should compare the permitted public `/health` payload to the full candidate
SHA and `database: "sqlite"`, then repeat the already-green claim and browser
matrix. The pre-release WAL file described in the historical handoff remains
preserved and unused; this repair does not inspect, delete, or migrate it.

---

# Historical repair handoff (superseded)

## Result — PASS

Date: 2026-08-30 UTC
Work order: `field-parts-promise-repair-11`
Base candidate: `428afeec1bbbd02272b55d5e98b13b3587df88ce`
Deployed source commit: `90e83f5504fac85a7b5b685819dbef389ba74379`
Deployed revision: `sf-field-parts-promise--singlevfs`

The permitted live target now returns exactly:

```json
{"status":"ok","build_sha":"90e83f5504fac85a7b5b685819dbef389ba74379","database":"sqlite","auth":"ready"}
```

## Release-blocker repair

- Reproduced the verifier's permitted live failure before changing source:
  `/health` returned build `0a8062b86f7cc5a92a550d9538943e8b3fee0c82`
  with `database: "postgres"`.
- The intended SQLite candidate had been deployed as an image but its revision
  could not activate. Target-only revision logs showed SQLite failing while
  attempting WAL-backed startup on the durable Azure Files mount.
- SQLite now uses the rollback (`DELETE`) journal, one pool connection, and
  bounded retry for transient startup locks. Its connection URI uses
  `vfs=unix-none`, which is appropriate only because `deploy.json` and the
  live target enforce one replica and one writer; it avoids Azure Files'
  unreliable SQLite byte-range locks.
- The originally locked SQLite file on the product's own `/data` mount was
  preserved untouched. The successful release uses the stable
  `parts-promise.sqlite3` file on that same mount. No database, schema, or
  external service was inspected, dropped, or modified.
- The production Docker build now copies the release-identity checker that
  Svelte type-checks. A fresh ACR build succeeded for the final source image.

## Regression coverage

- `scripts/verify-live-identity.mjs` requires an HTTP-200 health response with
  the supplied exact build SHA and `database: "sqlite"`; `npm run
  verify:live-identity` ran successfully against production.
- A unit regression feeds the exact retired health payload (`0a8062…` plus the
  retired database value) to that checker and asserts rejection.
- The Rust file-backed database regression asserts that the mounted-database
  configuration uses the `DELETE` journal. The release-contract regression
  asserts the stable SQLite file, `vfs=unix-none`, `/data`, one replica, the
  non-root Docker mount, and that the Docker build copies `scripts/`.
- Runtime-source scanning continues to reject retired database/service
  configuration references. The live template has only `PORT`, no secrets,
  one `/data` Azure Files volume mount, and min/max replicas set to one.

## Verification evidence

- `npm ci` — 85 packages installed; audit reported 0 vulnerabilities.
- `npm test` — 20 Vitest tests and 14 Rust API tests passed.
- `npm run check` — 0 errors and 0 warnings.
- `npm run format:check` — passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` — passed.
- `npm run build` — passed; `dist/` produced. Main JS is 38.25 KB gzip and CSS is 4.19 KB gzip.
- `npm run test:e2e -- --retries=0` — final full 88-case configured browser run passed (52 runnable cases and 36 intentional project skips). It covers desktop, 390 px mobile, keyboard, focus management, privacy request recording, offline reload, service-worker update, response policy, and axe route/theme coverage.
- `npm run test:e2e -- --grep @claim:container-runtime --retries=0` — passed on the final source (one Chromium pass, one expected project skip), starting the server with only `PORT`.
- The final ACR build (`ch1jv`) succeeded and pushed `sf-field-parts-promise:90e83f5504fa` with `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT` set to the deployed commit.
- `/opt/fleet/lib/verify-url.sh https://field-parts-promise.sociobot.in …` — passed: title, `lang=en`, one H1, main landmark, image alternatives, button labels, desktop/mobile screenshots, and zero console/page errors.
- Live axe scans of `/demo` at desktop and 390 px mobile had 0 serious/critical findings and 0 console errors.
- Live mobile Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100.
- Live response policy: CSP, HSTS, `nosniff`, `DENY`, strict referrer policy, and camera/microphone/geolocation denial are present. Root HTML is no-cache; hashed JS is immutable for one year; `sw.js` is update-safe no-cache.
- Live critical-rate burst from one forwarded IP: five 401 responses, then two 429 responses with `Retry-After: 60`.

## Deployment contract confirmed

`sf-field-parts-promise` is serving the final image with:

- `deploy.data_dir: "/data"` and `/data` mounted from its own
  `sf-field-parts-promise-data` Azure Files volume;
- exactly one replica (`minReplicas: 1`, `maxReplicas: 1`);
- exactly one container environment variable: `PORT=8080`;
- no configured container secrets or database connection references.

## Known gap

The pre-release WAL candidate's locked original SQLite file remains preserved
on the product's `/data` share rather than being deleted. It was never served
by a ready revision and is not used by the release. No recovery or operator
action is required for the deployed product.
