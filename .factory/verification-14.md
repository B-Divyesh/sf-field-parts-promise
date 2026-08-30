# Verification 14 — FAIL

Date: 2026-08-30 UTC  
Work order: `field-parts-promise-verify-14`  
Candidate: `428afeec1bbbd02272b55d5e98b13b3587df88ce`  
Live URL tested: `https://field-parts-promise.sociobot.in`

## Result

**FAIL — do not release or accept this deployment.** The permitted target is
not serving the candidate and its own health response declares PostgreSQL,
which breaches the required one-replica SQLite `/data` deployment contract.

No forbidden resource was read, connected to, changed, or restarted. All live
evidence below came from the permitted `sf-field-parts-promise` public URL.

## Release-blocking defects

### Critical — live service is an older, non-SQLite deployment

`GET /health` on the live target returned HTTP 200 with:

```json
{"status":"ok","build_sha":"0a8062b86f7cc5a92a550d9538943e8b3fee0c82","database":"postgres","auth":"ready"}
```

The tested candidate is `428afeec1bbbd02272b55d5e98b13b3587df88ce`.
`0a8062…` is an ancestor of the candidate; the candidate contains the later
SQLite repair `f32216e`. Therefore the public deployment does not match the
candidate, and it advertises a forbidden database implementation. This was
observed only from the allowed app's health endpoint; no database or other
service was inspected.

Required operator remediation: deploy candidate `428afeec…` as the sole
replica using `deploy.data_dir: "/data"`, then re-check `/health` until it
reports the candidate build SHA and `"database":"sqlite"`.

### High — no independently runnable container-image build available here

The Dockerfile is a compliant-looking multi-stage non-root definition and the
repository's container-runtime claim passed, but this worker has no `docker`,
`podman`, `buildah`, or `nerdctl` executable. I could not independently build
or run the OCI image itself. This is not the reason for the FAIL (the live
health evidence is sufficient), but the image must be built and smoke-tested
by the deployment worker after the critical issue is repaired.

## Required claims and local candidate QA

1. Began from clean candidate `428afeec…`; `npm ci` installed 85 packages with
   zero reported vulnerabilities.
2. `.factory/claims.json` exists with 31 claims. I ran every listed exact
   `npm run test:e2e -- --grep @claim:<id>` command separately from the demo
   entry point. All completed without failure. A consolidated
   `npm run test:e2e -- --grep @claim:` run then passed all 62 project cases.
   The final full browser run `npm run test:e2e -- --retries=0` passed:
   **52 passed, 36 expected project skips, 0 failed**.
3. `npm test` passed: 19 Vitest tests and 13 Rust API tests. This includes the
   100-request forwarded-IP rate-limit burst, the persisted two-handle limiter,
   and the SQLite close/reopen persistence regression.
4. `npm run check` passed with 0 errors/warnings; `npm run format:check`
   passed; `npm run build` completed and produced `dist/` and the release
   binary. Candidate app JavaScript is 37,789 bytes gzip; the CIAM chunk is
   61,703 bytes gzip; CSS is 4,203 bytes gzip.
5. The candidate deployment contract is explicit: `deploy.json` has exactly
   `{"data_dir":"/data","replicas":1}`. The server selects
   `/data/field-parts-promise.sqlite3` when `/data` is mounted; its regression
   test demonstrates state survives reopening that SQLite file. Dockerfile
   creates `/data`, runs as `nonroot`, and has no database connection env var.
   `/data` is not mounted in this disposable worker, so durable-volume restart
   persistence cannot be proven locally beyond that isolated regression.
6. Repository scan found no literal `sociobot-db`, `sociobot-v2`,
   `DATABASE_URL`, PostgreSQL/shared-PostgreSQL, or Key Vault runtime/config
   references. One test deliberately constructs retired-name strings from
   fragments solely to assert their absence; it is not runtime configuration.

## Live QA (allowed target only)

- Cold first read passed: title is `Parts Promise — Hold parts for each job`;
  the first screen says it allocates parts to jobs for small trade firms and
  has the one-click **Try it with sample data** action, explaining that it
  opens Riverside Dental with a missing pump.
- Cold-load Playwright request log contained only the same origin for the page,
  self-hosted fonts, JavaScript, CSS, and hero asset. There were no console or
  page errors. The response has CSP, HSTS, `nosniff`, `DENY`, strict referrer
  policy, and camera/microphone/geolocation disabled.
- Hashed live assets use `Cache-Control: public, max-age=31536000, immutable`;
  the service worker is revalidated. The root document is intentionally
  no-cache.
- Injected axe-core 4.11.4 scan had **0 serious or critical (indeed 0 total)
  WCAG 2 A/AA violations** at desktop and 390 px mobile. The full Playwright
  suite covers mobile, keyboard flow, focus, reduced motion, offline reload,
  service-worker update, and demo isolation.
- The live critical endpoint limit is enforced before authentication: seven
  `GET /api/v1/export` requests from one test forwarded IP returned five 401s,
  then two `429`s with `Retry-After: 11`. Observed allowance: **5 critical
  requests**. The candidate's documented critical bucket is 5 per 60 seconds;
  the target's 11-second retry is another indication it is not the candidate.

## Next steps

1. Build and deploy only candidate `428afeec…` to `sf-field-parts-promise`.
2. Ensure the target uses one replica and the durable `/data` mount; remove no
   data or resources from this work order.
3. Re-run the health, build-SHA, SQLite, rate-limit, and restart-persistence
   checks on that one allowed target. Do not inspect any other service or
   secret store.
4. Build and run the OCI image in an image-capable worker before requesting
   re-verification.
