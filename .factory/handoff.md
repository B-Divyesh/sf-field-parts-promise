# Parts Promise round 7 handoff — PASS

Date: 2026-09-02 UTC

Repair commit: `3805dc1daf4cabd5a782a83aa541e2ebc432f023`

Deployed build: `3805dc1daf4cabd5a782a83aa541e2ebc432f023`

Live URL: <https://field-parts-promise.sociobot.in>

## Result

**PASS — zero unresolved findings.** Review 7 found only two reader-facing
README terms. Both are fixed with the exact required language:

- “Retrying the same saved change does not create a duplicate.”
- “Offline signed-in edits stay queued in this browser.”

`src/release-contract.test.ts` keeps both phrases under regression coverage and
rejects the retired reader-facing wording. The catalog description is now the
verb-first line: “Allocate required parts to each job before promising a visit
date.” `.factory/polish-7.md` maps every finding from reviews 1–7 to its
retained repair and evidence.

## Verification

- Clean GitHub clone at `3805dc1daf4cabd5a782a83aa541e2ebc432f023`:
  `npm ci`, then all 37 exact `.factory/claims.json` commands run separately.
  Result: 37 logs, 37 commands with a pass result, and 0 failures.
- `npm test`: 24 Vitest tests and 15 Rust/API tests passed.
- `npm run check`: 0 errors and 0 warnings.
- `npm run format:check`: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  passed.
- `BUILD_SHA=3805dc1daf4cabd5a782a83aa541e2ebc432f023 npm run build`:
  passed and produced `dist/`. Initial gzip sizes: main JS 39.88 KB, deferred
  CIAM JS 62.19 KB, CSS 4.24 KB.
- Full Playwright suite: passed with no failed tests. It includes both-theme
  Axe scans, mobile first-screen checks, keyboard/history/focus tests, offline
  reload, demo isolation, API, privacy, and every claim flow.
- Local production-server verification: `/health` returned the exact build SHA,
  SQLite, and ready auth. The factory URL verifier found the correct title,
  `lang=en`, one H1, main landmark, complete image alternatives, labelled
  buttons, and zero console errors. Evidence:
  `evidence/polish-7/local/verify/verify.json`.
- Deployed through `/opt/fleet/lib/deploy-container.sh` using the owned
  `sf-field-parts-promise` container app and its existing one-replica `/data`
  mount. No unrelated resource or secret was accessed.
- Cold live verification: `/health` returned the exact deployed SHA. The
  factory verifier passed with no console errors; the live audit passed 72
  route, metadata, demo, 404, focus, and Axe serious/critical checks. Evidence:
  `evidence/polish-7/live/verify/verify.json` and
  `evidence/polish-7/live/audit.json`.
- Final visual cold checks confirmed the mobile first screen, one-click sample
  path, persistent demo banner, Reset demo, Start for real, at-risk sample
  state, and no horizontal overflow. Screenshots:
  `evidence/polish-7/live/cold-mobile.png` and
  `evidence/polish-7/live/demo-isolation-mobile.png`.

## Reproduce

```sh
npm ci
npm test
npm run check
npm run format:check
BUILD_SHA=$(git rev-parse HEAD) npm run build
BUILD_SHA=$(git rev-parse HEAD) npm run test:e2e -- --retries=0
```

Run every `test` command in `.factory/claims.json` separately from a clean
clone. The isolated sample URL is
<https://field-parts-promise.sociobot.in/?demo=1>.

## Known gaps and next steps

None. Checkout remains explicitly unavailable by the existing, tested release
boundary; no charge starts. The product is deployed and the repair is pushed.
