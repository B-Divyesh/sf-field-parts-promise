# Parts Promise verification 19 handoff — PASS

Date: 2026-09-02 UTC

Work order: `field-parts-promise-verify-19`

Candidate: `a0d9af536f7a981249123658846e74f2e8f9d28e`

Live URL: <https://field-parts-promise.sociobot.in>

## Result

**PASS — accept the candidate.** Independent clean-checkout and live QA found
no critical, high, medium, or low defects. Production reports the exact
candidate SHA and its checked assets byte-match the candidate build.

No product code, infrastructure, DNS, billing configuration, production
records, or durable `/data` content was changed. This work order added only
verification documentation and evidence.

## Verification summary

- All 37 commands in `.factory/claims.json` passed independently before other
  QA.
- The cold first screen plainly states the job, audience, first action, and
  sample outcome. **Try it with sample data** opens the realistic Riverside
  Dental job in one click.
- `npm ci`, `npm test` (23 Vitest + 15 Rust), `npm run check`,
  `npm run format:check`, strict Clippy, and the exact SHA-stamped production
  build passed. Full Playwright: 59 passed, 43 intentional skips.
- The core flow handled a valid van allocation, rejected quantity `2`,
  recovered with `1`, produced the reorder warning without ordering, and reset
  safely. Supplier evidence before/after the visit produced the correct
  promise states.
- The live 9-route × 2-theme × 2-viewport matrix had zero serious/critical Axe
  findings, console/page errors, horizontal overflow, or undersized mobile
  links/buttons. Keyboard-only allocation, visible focus, 200% text, and
  reduced motion passed.
- The demo flow made seven same-origin GET requests with no body. Security and
  caching headers passed. The service worker updated cleanly and completed the
  allocation after an offline reload.
- Live API allowances were enforced with 429 plus `Retry-After`: read/metrics
  40 per 2 seconds, write 10 per 2 seconds, export/critical 5 per 60 seconds.
  Every implemented non-health endpoint reported its expected limit header.
- Live Entra authorization uses the required Sociobot tenant, client,
  production callback, authorization-code flow, and PKCE S256.
- Fresh mobile Lighthouse: 98 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 2.01 s, TBT 95 ms, CLS 0.

Full evidence and findings are in `.factory/verification-19.md` and
`.factory/verification-artifacts-19/`.

## Reproduce

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
BUILD_SHA=$(git rev-parse HEAD) npm run build
BUILD_SHA=$(git rev-parse HEAD) npm run test:e2e -- --retries=0
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:live-identity
node .factory/verification-artifacts-19/run-live-browser.mjs
```

The demo URL is
<https://field-parts-promise.sociobot.in/?demo=1>. **Reset demo** restores the
seeded sample. **Start for real** deletes demo changes and returns to the
separate live local workspace.

## Known gap / operator action

Recurring checkout remains unavailable and is disclosed as such; no charge
can start. The operator must register a Sociobot recurring product capable of
the $39/month firm base plus $8/month active technician quantity before paid
signup is enabled. The repository correctly does not call Dodo directly.
