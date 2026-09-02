# Parts Promise independent verification 20 — FAIL

Date: 2026-09-02 UTC

Tested commit and deployed build: `6f0e3b0852fa89bdbe627e89bea831457fd192af`
Live URL: <https://field-parts-promise.sociobot.in>

## Result

**FAIL — mobile LCP is above the required 2.5-second performance budget.**
Two fresh Lighthouse mobile runs measured 2.8 s and 3.2 s. This is the sole
remaining release-blocking defect.

## What passed

- Clean install and all 37 individually invoked registered claim commands.
- Unit/API tests, type check, formatting check, production build, audit, and
  Rust clippy.
- Live build identity (`/health` returns the exact candidate SHA), SQLite,
  ready auth, security headers, immutable hashed asset caching, and 404.
- End-to-end live demo, invalid quantity recovery, allocation, reorder boundary,
  local-first privacy request log, service-worker update/offline reload,
  keyboard focus, 390 px mobile, reduced motion, and Axe serious/critical.
- Required Entra tenant redirect and server rate limit: five protected export
  requests per minute; sixth is 429 with `Retry-After: 60`.

## Evidence and next step

See `.factory/verification-20.md` and
`.factory/qa-artifacts/verification-20/`. Repair the LCP path, deploy it, then
repeat two fresh mobile Lighthouse runs plus the claim suite and live SHA check.
