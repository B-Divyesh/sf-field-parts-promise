# Parts Promise verification 18 handoff — PASS

Date: 2026-09-01 UTC

Work order: `field-parts-promise-verify-18`

Candidate: `1dc52f562f69857388821b940a0e78e1b3a8ff3a`

Live URL: <https://field-parts-promise.sociobot.in>

## Result

**PASS — accept this candidate.** No critical, high, medium, or low defects
were found. The live deployment reports the exact candidate build, uses
SQLite, matches the local production web build byte-for-byte, and gives all
hashed JS/CSS assets a one-year immutable cache policy.

The full evidence is in `.factory/verification-18.md`. Machine-readable
reports and screenshots are in `.factory/verification-artifacts-18/`.

## Verification summary

- All 37 commands declared in `.factory/claims.json`: passed separately from
  the clean checkout.
- Cold first read: passed on desktop and 390 px mobile. The page says what it
  does, who it is for, what to click, and what opens next. The sample is one
  click away.
- `npm ci`: passed with 0 reported vulnerabilities.
- `npm test`: passed, 22 Vitest and 15 Rust tests.
- Type checks, formatting, strict Rust lint, and candidate-stamped production
  build: passed.
- Full Playwright suite: 59 passed, 43 intentional skips, 0 failed.
- Live Axe matrix: 44 analyses, 0 serious/critical findings.
- Invalid quantity recovery, keyboard-only allocation, designed focus, 200%
  text, 390 px layout, reduced motion, camera boundary, service-worker update,
  and offline allocation: passed.
- Demo privacy: same-origin GETs only, with no body or cookie.
- API limits: read 40/2 s, write 10/2 s, critical 5/60 s. Excess requests
  returned 429 with `Retry-After`.
- Entra redirect: correct Sociobot CIAM tenant, client, callback, and PKCE S256.
- Lighthouse mobile: 99 performance and 100 for accessibility, best practices,
  and SEO; LCP 2.0 s, TBT 60 ms, CLS 0.
- Cache repair: main JS, lazy sign-in JS, and CSS return
  `public, max-age=31536000, immutable`.

## How to re-run

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
BUILD_SHA=1dc52f562f69857388821b940a0e78e1b3a8ff3a npm run build
BUILD_SHA=1dc52f562f69857388821b940a0e78e1b3a8ff3a npm run test:e2e -- --retries=0
EXPECTED_BUILD_SHA=1dc52f562f69857388821b940a0e78e1b3a8ff3a npm run verify:live-identity
```

## Known gap and operator action

Recurring checkout is still unavailable because the Sociobot billing gateway
does not have a supported recurring base-plus-seat registration for this
product. The UI states this plainly and never starts a charge. Register the
approved `$39/month + $8/active technician/month` product before accepting the
recurring-billing milestone; do not integrate Dodo directly.

Planned later supplier-watch and notification work remains in
`.factory/plan.md` and is not claimed as shipped.

## Scope and mutations

No product code, infrastructure, DNS, billing configuration, customer records,
or persistent `/data` files were changed. Only the verification report,
handoff, and evidence artifacts were added or updated.
