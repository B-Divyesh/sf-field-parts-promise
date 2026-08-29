# Parts Promise — perfection-loop round 2 handoff

## Status: PASS

Work order: `field-parts-promise-polish-2`

Production: <https://field-parts-promise.sociobot.in>

Reviewed candidate: `5b6b4dec17864f2c25761e532dacea383e483fc7`

Final live build: `4421108597432a7e5cad24936bff8701eb2a19fc`

All findings in `.factory/review-1.md` and `.factory/review-2.md` are resolved. The finding-by-finding change and evidence map is in `.factory/polish-2.md`.

## What shipped

- Every route out of demo now deletes `parts-promise-demo-v1` before opening live mode. Wordmark, browser Back, and confirmed exit are covered independently. Re-entry starts from the bundled Riverside Dental fixture.
- IndexedDB reads now resolve only after their transactions close. Demo deletion tolerates a transient blocked event and reports an error only when another tab keeps the database open.
- The jobs screen now imports neutral CSV data with a preview, row-level validation, duplicate job-number protection, and atomic saving.
- Workspace export downloads a versioned JSON backup containing jobs, required parts, sources, allocations, and timestamps. JSON restore validates relationships before replacing the current namespace.
- Import/export stays in the active demo or live IndexedDB database. No transfer makes a network write.
- Missing local job links render truthful not-found title, description, Open Graph data, home canonical, noindex, and recovery actions.
- All dynamic work sheets expose disclosure state, scroll into view, focus their heading, and restore trigger focus. This covers job, edit, required part, allocation, source, supplier evidence, and import sheets.
- The blueprint visual identity, mobile field-sheet layout, first-screen wording, legal routes, offline sample, and all earlier polish remain intact.
- The catalog line is now: “Check held parts before a solo tradesperson promises a visit date.”

## Verification

Fresh clone used for the full gate: `/tmp/parts-promise-polish2-clean-p9gq6T`.

```sh
npm ci
npm audit --audit-level=moderate
npm run format:check
npm test
cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings
npm run build
npm run test:e2e -- --retries=0
```

- `npm ci`: 83 packages; audit found 0 vulnerabilities.
- Unit/API: 15 Vitest and 3 Rust tests passed.
- `svelte-check`: 0 errors and 0 warnings.
- `cargo clippy ... -D warnings`: passed.
- `npm run build`: passed and produced `dist/` plus the release Rust binary.
- Browser suite: 35 passed; 21 expected skips because claim evidence runs once on desktop and mobile-only geometry runs once on mobile.
- Every one of the 16 claim commands in `.factory/claims.json` was also executed separately from the clean clone and passed.
- Built assets: JS 92.33 KB raw / 31.06 KB gzip; CSS 16.91 KB raw / 3.96 KB gzip; self-hosted fonts 56.44 KB total.

## Live evidence

- Container deployment completed through `/opt/fleet/lib/deploy-container.sh`.
- `GET /health` returned `{"status":"ok","build_sha":"4421108597432a7e5cad24936bff8701eb2a19fc"}`.
- Factory `verify-url.sh`: HTTPS 200, 564 ms cold load, no console errors, title present, `lang=en`, one H1, main landmark, no missing alt text, and no unlabeled buttons.
- A fresh production browser reran F-2-1 through F-2-4. Results are in `.factory/evidence/polish-2/live-check.json`.
- Live axe scans covered `/`, `/demo`, `/jobs`, `/privacy`, `/terms`, and the real 404 in both light and dark themes: zero serious/critical findings.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.8 s, TBT 100 ms, CLS 0.007.
- Evidence: `.factory/evidence/polish-2/` contains verifier JSON/HTML, desktop/mobile cold screenshots, finding screenshots, live audit JSON/script, and Lighthouse JSON.

## Privacy, offline, and operations

- Demo flow still makes only same-origin GET/HEAD requests and never asks for camera access.
- CSV/JSON transfer is explicit and local; it writes only the current IndexedDB namespace.
- The offline sample reload and allocation claim passes.
- The container starts with only `PORT`, runs non-root, serves its build identity, and returns a real HTTP 404 for unknown document paths.
- Security headers remain self-only CSP, nosniff, strict referrer policy, frame denial, and camera/microphone/geolocation denial.

## Remaining work

No review finding of any severity remains. Account sync, shared firm workspaces, billing, scanning, and conflict resolution remain deliberately outside this browser-only M1 release and are scheduled in later milestones in `.factory/plan.md`; the public copy does not claim them.
