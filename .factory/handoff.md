# Parts Promise repair handoff

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
