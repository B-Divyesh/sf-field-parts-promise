# M1 handoff — Local promise check and one-click demo

Work order: `venture-field-parts-promise-m1`

Built: 2026-08-28

Commit range pushed: `1e7ed01..4fd6c5d` on `main`

## What shipped

- The local-first M1 product flow: a job, required parts, source records, allocations, allocation removal, undo, job edits, manual source entry, supplier-order evidence, deterministic promise status, and deterministic reorder suggestions.
- An isolated `/?demo=1` workspace seeded with Riverside Dental `RD-1042`. Allocating the one missing condensate pump from Van 2 moves the status from **Date at risk** to **Parts in hand**, then shows a review-only reorder suggestion.
- Separate IndexedDB databases: `parts-promise-demo-v1` and `parts-promise-live-v1`. Reset restores only the sample. Starting for real deletes the sample database and opens an empty live-local workspace.
- An offline PWA shell that precaches built JavaScript/CSS and the product assets. The fresh-browser offline claim reloads the demo and completes the pump allocation without a network connection.
- The complete blueprint visual system: original hand-authored SVG service drawing, original SVG/PNG social art, favicon/touch icon, self-hosted Barlow Condensed and Atkinson Hyperlegible Next subsets with OFL files, responsive light/dark treatment, keyboard states, reduced-motion path, and legal/404 routes.
- Metadata, canonical/Open Graph/Twitter data, manifest, robots, sitemap, a Static Web Apps security/fallback config, and `/privacy` and `/terms` routes.
- The container now builds the web bundle and Rust service together. The non-root service serves the app and deep links, `/health`, and security headers on `PORT` with no required environment variables.

## Claim evidence

All five existing M1 entries in `.factory/claims.json` now have one tagged Playwright test and passed from a fresh demo browser:

| Claim | Tagged evidence |
| --- | --- |
| `promise-status-from-allocation` | Starts at Date at risk; allocating Van 2’s pump yields Parts in hand. |
| `allocation-keeps-source` | Reload confirms job, source, quantity, unit, updater, and checked time. |
| `reorder-after-allocation` | Shows zero remaining versus minimum one and proves no cross-origin/order request. |
| `demo-reset-isolated` | Reset restores the fixture; leaving opens an empty live local workspace. |
| `offline-reload` | Fresh browser waits for service-worker shell cache, goes offline, reloads, and allocates successfully. |

Run an individual claim with the `test` command recorded in `claims.json`, for example:

```sh
npm run test:e2e -- --grep @claim:offline-reload
```

## Verification

- `npm run format:check` — passed.
- `npm test` — passed: 7 Vitest tests and Rust API tests.
- `npm run test:e2e` — passed: 10 tests, 6 intentional project skips. This includes every claim, axe serious/critical checks across public/app routes, internal-link crawling, no browser-console errors, keyboard/history mobile flow, and reduced motion.
- `npm run build` — passed: Svelte check 0 errors/warnings, `dist/` produced, and release Rust binary produced.
- `npm audit --audit-level=moderate` — passed, 0 vulnerabilities.
- Release app smoke: `PORT=18080 server/target/release/parts-promise-api`; `/health` returned `{"status":"ok","build_sha":"dev"}`; `/jobs/job-rd-1042?demo=1` returned 200; CSP, nosniff, referrer, and frame headers were present.
- Lighthouse mobile against the production build: Performance **100**, Accessibility **100**, LCP **127 ms**, CLS **0**. Built bundle: 27.69 KB gzip JS, 3.89 KB gzip CSS; self-hosted fonts total 56 KB; original social PNG is 42 KB.
- Docker engine was unavailable in this worker, so the Dockerfile itself was not run. Its exact Vite build and release Rust stages were built and smoke-tested locally.

## Scope decision

The work-order boilerplate requested CIAM, shared database migrations, rate limits, and Dodo billing. The approved M1 contract explicitly places those features in M2 and explicitly says “No backend data, account, telemetry, checkout, or fake sync controls.” M1 therefore implements real browser IndexedDB persistence and the real isolation/offline behavior required for this milestone, without a misleading auth or payment stub. The plan was not changed because it was internally correct.

## Known gaps and what M2 needs

- M2 owns Entra CIAM, PostgreSQL migrations/RLS, organization ownership, transactional sync, server rate limits, backups, and Sociobot recurring billing. Do not migrate demo records into any future firm workspace.
- Before M2 acceptance, the factory must register `https://field-parts-promise.sociobot.in/auth/callback` and provide a Sociobot test recurring product/seat contract at the plan’s $39 base + $8 active technician prices.
- Factory deployment is blocked outside this repository: there is no deployment workflow or deployment configuration here, and a cold probe on 2026-08-28 returned DNS resolution failure for `field-parts-promise.sociobot.in`. The pushed commits are ready for the factory container build, but no live deployment was created or claimed.
- M1 is awaiting the required independent review → polish loop before M2 starts.
