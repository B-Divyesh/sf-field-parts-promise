# Parts Promise repair handoff

Date: 2026-08-30 UTC
Work order: `field-parts-promise-repair-10`
Source repair commit: `f32216e`

## Completed repair

- Reproduced the supplied candidate's retired external-state path before editing: source and artifacts still contained managed database retrieval, multiple runtime drivers, and the old deployment evidence.
- Made SQLite the only server storage implementation. Startup creates or opens `/data/field-parts-promise.sqlite3`; the metrics credential is also persisted under `/data`. A local no-mount fallback uses a `data` directory beside the executable so the server still starts with only `PORT`.
- Removed the retired runtime code, schema artifacts, old evidence files, driver dependency entries, connection configuration, and deployment references. `server/Cargo.lock` now contains only the SQLite driver path.
- Added [`deploy.json`](../deploy.json) with `deploy.data_dir` set to `/data` and one replica. The image creates a writable `/data` directory for its non-root runtime user.
- Kept the persisted fixed-window limiter. With one replica it enforces its advertised allowance; its existing two-handle regression confirms request six is rejected even when two independent handles use the same SQLite file.
- Added regression coverage that rejects retired state references in every present tracked file and verifies that a firm workspace survives closing and reopening the SQLite file.

## Verification

- `npm ci` — 85 packages installed; 0 vulnerabilities.
- `npm test` — 19 Vitest tests and 13 Rust tests passed.
- `npm run check` — 0 errors and 0 warnings.
- `npm run format:check` — passed.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings` — passed.
- `npm run build` — passed; `dist/` produced. Main JavaScript is 38.25 KB gzip and CSS is 4.19 KB gzip.
- `npm run test:e2e -- --retries=0` — 52 passed and 36 intentional project skips. This covers the 31 claims, 390 px mobile, keyboard allocation, focus, response policy, request privacy, offline reload, service-worker update, and the accessibility sweep.
- The production binary was run with an empty environment plus `PORT=4175`. `/health` returned `{"status":"ok","build_sha":"dev","database":"sqlite","auth":"ready"}`. The local URL verifier passed: title, `lang=en`, one H1, main landmark, image alternatives, button labels, and zero console/page errors.
- The tracked-file forbidden-reference regression and a direct repository scan are clean.

## Needs operator action

- Deployment could not be performed from this worker. The direct read of only `sf-field-parts-promise` was denied `Microsoft.App/containerApps/read`; no other service was inspected or changed. Deploy the committed image to that app with the `/data` mount, no retired environment/secrets, and one replica, then confirm `/health` reports `database: "sqlite"`.
- The recurring billing product remains an operator-owned dependency. This worker did not contact either billing gateway or change billing resources. Register and verify the researched recurring plan before enabling checkout; until then the existing 424 safety response remains correct.
