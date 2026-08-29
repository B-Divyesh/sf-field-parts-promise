# Parts Promise — independent verification 7 handoff

## Status: FAIL

Work order: `field-parts-promise-verify-7`

Candidate: `ce0e270de5d87b5cb142053836cc89ffbb824cbc`

Production: <https://field-parts-promise.sociobot.in>

The live deployment is healthy and exactly matches the candidate. All 16 claim
commands, local gates, the full browser suite, the live core workflow, offline
reload, privacy checks, and performance budgets pass. The candidate still
fails the non-negotiable mobile accessibility contract because multiple links
have touch targets smaller than 44 × 44 CSS px at the required 390 px viewport.

## Release blocker

**F7-01 — Medium, release-blocking:** persistent header/footer links and some
inline/recovery links have undersized phone hit areas. Examples measured live:
`Jobs` 36 × 44 px, footer `Terms` 39 × 18 px, `Open the sample job` 147 × 21 px,
and `Go to home` 83 × 21 px. This occurs in both themes. Working-flow buttons
meet the target requirement.

Give all interactive links at least a 44 × 44 px clickable area and keep 8 px
between adjacent targets. Extend the mobile geometry test to include anchors;
the present test checks selected buttons only.

## Verification summary

- First read: PASS — what, who, and “Try it with sample data” are all visible
  in the first 390 px screen.
- Claims: PASS — 16/16 exact `.factory/claims.json` commands.
- Unit/API: PASS — 15 Vitest + 3 Rust.
- Type/format/lint: PASS — zero Svelte diagnostics; Prettier, rustfmt, and
  Clippy `-D warnings` clean.
- Production build: PASS — `dist/` plus release server.
- Browser suite: PASS — 35 passed / 21 intentional skips.
- Live identity: PASS — `/health` reports the exact candidate SHA; eight key
  deployed artifacts match the local build byte-for-byte.
- Privacy/PWA: PASS — same-origin GET-only demo, zero camera calls, current
  service worker, working offline reload/allocation.
- Axe: PASS — zero serious/critical findings in 24 scans.
- Lighthouse mobile: 92 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.8 s, CLS 0.007.
- Backend allowance: not applicable. The release has no non-health API;
  `/health` is explicitly exempt. 100 concurrent `/` and `/health` requests
  all returned 200.

## How to reproduce

```sh
npm ci
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run build
npm run test:e2e -- --retries=0
```

For F7-01, open the live site at 390 × 844 and inspect visible link rectangles
with `getBoundingClientRect()` on `/`, `/?demo=1`, `/jobs`, `/privacy`,
`/terms`, and the designed 404.

Full evidence and claim logs are in `.factory/qa-artifacts/verification-7/`.
The detailed report is `.factory/verification-7.md`. Product code was not
modified.
