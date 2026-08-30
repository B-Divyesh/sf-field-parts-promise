# Verification 15 — FAIL

Date: 2026-08-30 UTC
Work order: `field-parts-promise-verify-15`
Candidate commit: `6a05b4b12fff6794870ce4d9cd74a4b3ded5095d`
Live URL: `https://field-parts-promise.sociobot.in`

## Verdict

**FAIL — do not accept or release this candidate.** The permitted live service
does not report the candidate build identity. This is a release-blocking
deployment mismatch even though the live service is healthy and the local
candidate quality gates passed.

No forbidden service, database, configuration, secret, or infrastructure
resource was read, connected to, changed, or restarted. All deployed evidence
came from the permitted public product URL.

## Blocking defect

### Critical — live build SHA is not the candidate

At 2026-08-30 07:32 UTC, `GET /health` returned HTTP 200:

```json
{"status":"ok","build_sha":"90e83f5504fac85a7b5b685819dbef389ba74379","database":"sqlite","auth":"ready"}
```

The requested candidate is `6a05b4b12fff6794870ce4d9cd74a4b3ded5095d`.
`90e83f5…` is the direct parent of the candidate; the candidate changes only
`.factory/handoff.md`. That does not satisfy the required exact deployed build
identity. The repository's own identity check independently failed with the
same values:

```text
Live deployment identity mismatch: expected build_sha=6a05b4b… and database=sqlite;
received build_sha=90e83f5… and database=sqlite.
```

Required remediation: build and deploy the requested commit, then verify that
the permitted `/health` endpoint reports exactly `6a05b4b12fff6794870ce4d9cd74a4b3ded5095d`
and `database: "sqlite"`.

## Claims and local candidate QA

- `.factory/claims.json` exists and declares 31 claims. Every listed command
  was invoked from this clean checkout. The independent consolidated run,
  `npm run test:e2e -- --grep @claim:`, completed with **31 passed, 31
  project-duplicate skips, 0 failed** in 1.1 minutes. The final Playwright
  status file says `passed` with no failed tests.
- `npm test` passed: **20 Vitest tests** and **14 Rust API tests**.
- `npm run check` passed with 0 errors and 0 warnings.
- `npm run format:check` passed.
- `npm run build` passed and produced `dist/` plus the optimized release
  server binary. Built gzip sizes: main JS 38.25 KB, deferred CIAM JS 62.19
  KB, and CSS 4.19 KB; each is within its stated budget.
- The release server started with an otherwise empty environment and only
  `PORT=4185`; `GET /health` returned HTTP 200 with SQLite readiness. Its
  local `build_sha` was correctly `dev`, because no build argument was supplied.
- No Docker, Podman, Buildah, or Nerdctl executable is available in this
  worker, so an OCI-image build could not be independently repeated here.
  The `@claim:container-runtime` test did pass against the compiled server and
  Docker contract.

## Product, accessibility, privacy, and deployment QA

- **First read: PASS.** A cold live page says that Parts Promise allocates
  parts to a job for small trade firms before agreeing a visit date. Its first
  action is **Try it with sample data**, with the immediate outcome “Opens
  Riverside Dental with one missing pump.” This answers what it does, for whom,
  and what to click first in plain words.
- The one-click demo opened `RD-1042` / Riverside Dental. Allocating one pump
  from Van 2 changed the visible status from **Date at risk** to **Parts in
  hand** without console or page errors. The demo banner explains that sample
  data is separate and provides Reset demo and Start for real.
- Desktop and 390 px screenshots were inspected. The mobile layout remains
  readable and its task controls are large, stacked, and unobscured. Keyboard
  Tab showed a designed 3 px purple visible focus ring. With reduced motion,
  the document reports the reduced-motion preference and transitions reduce to
  the intended near-instant path.
- A live cold-load request log contained only same-origin GETs for the
  document, self-hosted fonts, JS, CSS, and the hero SVG. There were no
  outgoing third-party requests, camera requests, console errors, or page
  errors. The page sent CSP, HSTS, `nosniff`, `DENY`, strict referrer policy,
  and camera/microphone/geolocation-denying Permissions-Policy headers.
- Hashed JS is `Cache-Control: public, max-age=31536000, immutable`; HTML and
  service worker are revalidated. `/privacy`, `/terms`, `/robots.txt`, and
  `/sitemap.xml` return 200. Unknown app and API paths return 404.
- The public API critical bucket was tested only on the permitted target using
  a verifier-reserved forwarded IP. The first five `GET /api/v1/export`
  requests returned 401 and exposed a five-request limit; requests 6–7
  returned **429** with **`Retry-After: 59`**. Observed allowance: 5 requests
  per 60-second critical bucket.

## Next step

Deploy candidate `6a05b4b12fff6794870ce4d9cd74a4b3ded5095d` as the product's
single SQLite `/data` revision, then rerun the public identity check. No code
repair is indicated by this verification.
