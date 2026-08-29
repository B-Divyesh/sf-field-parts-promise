# Parts Promise — polish 3 handoff

## Status: PASS

Work order: `field-parts-promise-polish-3`
Released application commit: `11670381aa718b32522525840353c1137a3f1958`
Production: <https://field-parts-promise.sociobot.in>

This repair closes every finding in reviews 1–3, including the remaining
history, claims, backup, CSV-template, and copy findings from review 3. The
product remains the same container-hosted, browser-local PWA with its
exploded-parts blueprint visual system.

## What changed

- History entries now retain scroll coordinates. Back and Forward restore the
  prior reading position after the destination H1 receives focus without
  scrolling it away.
- The demo banner now accurately names the local workspace. Reset, wordmark,
  browser Back, and the confirmed exit remain isolated from the live browser
  workspace.
- Added the `sample-fixture` and `csv-template-download` claims. Every public
  sample and CSV-template statement now has a named, observable test.
- Strengthened backup and transfer proof: tests deep-compare every record and
  timestamp after JSON restore, inspect the exported demo backup, and
  byte-compare the untouched live workspace after demo transfer.
- Rewrote the two README storage sentences with one plain, consistent browser
  database term. The catalog sentence is verb-first and 52 characters long.

## Verification evidence

Local and clean-clone gates:

- Fresh clone: `/tmp/field-parts-promise-polish-3-9s9Nzw`, `npm ci`, then all
  18 exact commands in `.factory/claims.json` separately: PASS (the final
  Playwright run reports `{"status":"passed","failedTests":[]}`).
- `npm test`: PASS — 15 Vitest tests and 3 Rust tests.
- `npm run check`: PASS — zero Svelte/TypeScript errors or warnings.
- `npm run format:check`: PASS.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  PASS.
- `npm audit --audit-level=moderate`: PASS — zero vulnerabilities.
- `npm run build`: PASS — `dist/` and the release Rust binary produced. Final
  client bundle: 93.16 kB raw / 31.39 kB gzip; CSS: 16.98 kB raw / 3.96 kB gzip.
- `npm run test:e2e -- --retries=0`: PASS — Playwright's 62 scheduled desktop
  and 390 px checks completed with no failed test. Desktop-only claim evidence
  is intentionally skipped in the mobile project.

Production evidence:

- Deployed through `/opt/fleet/lib/deploy-container.sh field-parts-promise
  /work/repo Dockerfile 8080`. Live `/health` returns the release SHA above.
- `/opt/fleet/lib/verify-url.sh` passed cold on `/` and `/?demo=1`: HTTP 200,
  route titles, `lang=en`, one H1, main landmark, image alt text, labelled
  buttons, and no console/page errors. Artifacts:
  `.factory/qa-artifacts/polish-3-live/home/verify.json` and
  `.factory/qa-artifacts/polish-3-live/demo/verify.json`.
- Cold live axe sweep: zero serious/critical findings across `/`, `/?demo=1`,
  `/jobs`, `/privacy`, `/terms`, and the HTTP 404 in both themes. It also
  checked one owned metadata set per route, correct 404 title/status, demo
  reset/wordmark isolation, same-origin GET/HEAD demo traffic, and mobile
  Back scroll plus H1 focus. See
  `.factory/qa-artifacts/polish-3-live/live-qa.json`.
- Lighthouse mobile production result: Performance 99, Accessibility 100,
  LCP 1.7 s, CLS 0. See
  `.factory/qa-artifacts/polish-3-live/lighthouse-mobile.json`.

## Known gaps and next steps

No review finding remains. The deliberately stated release boundary is still
one solo tradesperson in one browser: no account, team sync, barcode scan,
supplier-order action, checkout, or payment. Planned future scope remains in
`.factory/plan.md`. No operator action is required.
