# Parts Promise repair handoff

- Work order: `field-parts-promise-repair-2`
- Base report commit: `6a79a9840c60f08df0829b178ff09848e489a1a2`
- Repaired candidate: the final `main` commit containing this handoff
- Artifact/deployment class: unchanged `web-with-backend` container
- Verified: 2026-08-28 UTC

## Status

**Repair complete and ready for independent verification.** Both release blockers in `.factory/verification-2.md` are fixed at their root. The researched brief, M1 allocation behavior, local-first data model, demo boundary, offline flow, and product visual system remain intact.

## Reproduction and repairs

### Real HTTP 404

Before the change, a production build followed by the real Rust server returned `HTTP/1.1 200 OK` for `/not-on-this-drawing` and served `dist/index.html`. The `ServeDir` fallback had no way to distinguish a valid SPA deep link from an unknown route.

The security/response middleware now recognizes the valid M1 document routes. When `ServeDir` supplies the HTML shell for any other extensionless route, the middleware changes the response to `404 Not Found` and applies the document no-cache policy. The shell still runs, so the existing designed not-found screen remains visible. `/`, `/demo`, `/jobs`, `/jobs/:id`, `/privacy`, and `/terms` remain 200.

Regression coverage:

- Rust `unknown_document_path_returns_real_http_404_with_designed_shell` checks every valid deep link, the unknown status, no-cache header, and designed body.
- Claim `container-runtime` starts the actual server with only `PORT` and asserts `/` = 200, `/health` = 200, a job-data POST is not accepted, and an unknown route = 404.

### Complete claims contract

All retained visitor-reliant behavior is now registered in `.factory/claims.json`. Six missing entries were added: `local-workspace-flow`, `m1-feature-boundaries`, `indexeddb-local-storage`, `demo-network-privacy`, `clear-local-records`, and `container-runtime`. Each has one exact `@claim:<id>` browser test. The previous combined demo/privacy statement was split so reset isolation and network privacy each have one test.

Unshipped future pricing, account, seat, export-timing, and checkout assertions were removed from public M1 copy. README and privacy/terms copy now use only the observable M1 boundary. `src/release-contract.test.ts` fails if any claim ID or test tag is missing, duplicated, or lacks its exact grep command.

### Mobile visual repair found during the required sweep

At 390 px, the three how-it-works descriptions occupied the 52 px number column. They now span the card width. A 390 px geometry test requires each description to use at least 75% of its card.

## Verification evidence

Clean install:

- `npm ci` — 83 packages installed; 0 vulnerabilities.

Claims:

- Every one of the 11 commands in `.factory/claims.json` was run separately after the clean install.
- Each command passed its Chromium evidence test with one intentional mobile-project skip.
- `npm run test:e2e` — 23 passed, 15 intentional cross-project skips across 38 project cases.

Local quality gates:

- `npm test` — 9 Vitest tests and 3 Rust tests passed.
- `npm run check` — 0 errors and 0 warnings.
- `npm run format:check` — Prettier and `cargo fmt` passed.
- `npm run build` — Svelte check, Vite production build, and locked Rust release build passed; `dist/` produced.
- Initial JS: 80,025 bytes / 27,067 gzip. CSS: 16,343 bytes / 3,902 gzip. Fonts: 56,440 bytes total. Hero SVG: 2,321 bytes.

Browser and accessibility:

- Desktop Chromium and exact 390 x 844 mobile passed.
- Mobile keyboard/history allocation, 44 px controls, the repaired card geometry, reduced motion, and desktop service-worker update state passed.
- Playwright axe scanned `/`, `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and an unknown route in both projects with no serious or critical findings.
- `/opt/fleet/lib/verify-url.sh` reported title, `lang=en`, one `h1`, a main landmark, zero missing image alts, zero unlabeled buttons, and no console/page errors. Desktop and mobile screenshots were inspected.

Privacy, offline, and response policy:

- The complete demo request flow used same-origin GET/HEAD requests only; the camera sentinel was never called.
- Demo and live IndexedDB contents were read directly; browser site-data clearing returned the live workspace to empty.
- Offline reload and pump allocation passed after the service worker cached the shell. `registration.update()` left no installing or waiting worker; `parts-promise-shell-v2` controlled the page.
- Production-shaped local responses: unknown path 404, valid job deep link 200, hashed JS `public, max-age=31536000, immutable`, and `/sw.js` `no-cache, max-age=0, must-revalidate`.
- CSP, nosniff, strict referrer policy, frame denial, and camera/microphone/geolocation Permissions-Policy were present.
- A 100-request, 20-way `/health` smoke returned 100 x 200. Health remains the only server endpoint and is eligible for the documented rate-limit exemption.

Performance:

- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100.
- LCP 1,936 ms, CLS 0, total blocking time 25 ms.

Package/consumer, CIAM, billing, AI live-path, and non-health API rate-limit tests do not apply to M1. This release has no package surface, sign-in, checkout, runtime AI, or non-health API. Those remain later milestones in `.factory/plan.md`.

## Deployment and live verification

Use the work-order container configuration:

```sh
/opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

The factory build receives the final source commit as `BUILD_SHA`, runs the image as `nonroot`, and supplies only `PORT=8080`. After the final commit, the worker verifies that live `/health.build_sha` equals `git rev-parse HEAD`, the unknown path is 404, valid deep links are 200, response headers match the local evidence, and the live JS/CSS/service-worker hashes match `dist/`.

## Known gaps and next steps

No M1 release blocker is known. Sign-in, team persistence, billing, scanning, supplier actions, and non-health APIs remain explicitly out of scope until M2/M3. Independent verification should rerun every claims command and the live identity/hash/404 checks before changing this status to PASS.
