# Parts Promise repair handoff

## Status: repaired and verified

- Repair work order: `field-parts-promise-repair-1`
- Failed candidate: `4d9c65f0b260cb9c81f47322b2cef7d84fe9be89`
- Verifier report commit: `ca4ece7e7ef0130886014655825c9f5109c616e4`
- Production URL: <https://field-parts-promise.sociobot.in>

All five findings in `.factory/verification.md` were repaired without changing
the researched brief, M1 data rules, storage namespaces, deployment class, or
the five previously passing product behaviors.

## Repairs and regression coverage

1. The broad, unlisted privacy paragraph was removed. The remaining public
   statement now exactly matches the expanded `demo-reset-isolated` claim:
   demo changes stay isolated and the exercised flow makes only same-origin
   requests. Its tagged Playwright test records every request while changing,
   resetting, and leaving the demo. A separate browser regression prevents the
   removed account/telemetry/camera wording from returning untested.
2. Theme, demo-banner, text-action, allocation-removal, and toast-dismiss
   controls now have a minimum 44 px target. A 390 px mobile regression measures
   every control named by the verifier and fails below 44 px in either axis.
3. The axum delivery middleware now sends
   `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and
   `/fonts/*`, and `no-cache, max-age=0, must-revalidate` for `/sw.js`, HTML,
   route fallbacks, and `/health`. Rust integration coverage checks built JS,
   CSS, the hero SVG, a font, and the service worker policies.
4. The Rust builder now uses the required rolling `rust:1-slim` base. A Vitest
   release-contract test rejects minor-pinned Rust images, `.git` access, or a
   missing default `BUILD_SHA` argument.
5. Container responses now include
   `Permissions-Policy: camera=(), microphone=(), geolocation=()` alongside the
   existing CSP, nosniff, referrer, and framing policies. The API integration
   test asserts this exact value.

## Verification evidence

Run from a clean dependency state on 2026-08-28 UTC:

- `npm ci`: 83 packages installed; 0 vulnerabilities.
- `npm test`: 8 Vitest tests and 2 Rust tests passed.
- `npm run check`: 0 errors and 0 warnings.
- `npm run format:check`: Prettier and `cargo fmt` passed.
- `npm run build`: passed; produced `dist/` and the release Rust binary.
  Initial JS is 80.61 kB (27.66 kB gzip); CSS is 16.32 kB (3.89 kB gzip).
- `npm run test:e2e`: 15 passed and 7 intentional cross-project skips. This
  covers desktop Chromium, 390 px mobile, keyboard, route focus/history,
  serious/critical axe scans on every route, reduced motion, exact touch target
  geometry, privacy copy, demo reset, and offline service-worker reload.
- Every command in `.factory/claims.json` was also run independently: each of
  the five tagged claim tests passed in desktop Chromium with its intentional
  mobile duplicate skipped.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:8088 ...`: title present,
  `lang=en`, one H1, main landmark present, 0 images missing alt, 0 unlabeled
  buttons, and 0 console/page errors. Desktop and 390 px screenshots were
  inspected with no clipping or horizontal overflow.
- Lighthouse 13 mobile against the release server: performance 99,
  accessibility 100, best practices 100, SEO 100, LCP 1,805 ms, CLS 0, and
  total blocking time 40 ms.
- Container-equivalent `HEAD` checks returned 200 and the exact immutable
  policy for built JS/CSS, both self-hosted asset families, and the hero; the
  service worker returned the exact revalidation policy. Every response also
  carried the declared permissions policy and CSP.
- The Dockerfile was built by Azure Container Registry through the factory
  container deployment flow, which uses a source archive without `.git` and
  passes the source SHA through `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT`.
- After rollout, `/health` returned `status: ok` with the repair source commit;
  the custom HTTPS origin returned 200; cache/security response headers matched
  the local evidence; and the factory URL verifier completed without console or
  accessibility smoke failures.

## Run it

```sh
npm ci
npm test
npm run test:e2e
npm run check
npm run format:check
npm run build
```

Container contract:

```sh
docker build --build-arg BUILD_SHA=$(git rev-parse HEAD) -t parts-promise .
docker run --rm -p 8080:8080 parts-promise
curl http://127.0.0.1:8080/health
```

The container starts with only `PORT` (default `8080`). M1 has no non-health
server endpoint, so the backend contract's explicit health-check rate-limit
exemption applies. No account, paid unlock, runtime AI, or package consumer is
part of M1; those checks are not applicable to this repair.

## Known gaps and next steps

No release-blocking M1 repair gap remains. M2 account, tenant persistence,
sync, recurring Sociobot billing, non-health rate limits, metrics, and backup
work remains planned in `.factory/plan.md`; none was pulled into this repair.
The independent verifier should rerun the required next-verification list from
`.factory/verification.md` against the repair commit.
