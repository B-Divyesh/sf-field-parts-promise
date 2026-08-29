# Polish round 2 — cumulative finding closure

Released candidate: `5b6b4dec17864f2c25761e532dacea383e483fc7`

Review report commit: `3cbe8a9b0f8670e99d002d415a277e82b6e747bd`

Repair commits: `3dfb65d`, `7bcdf75`, `4421108`

Live URL: <https://field-parts-promise.sociobot.in>

Live build: `4421108597432a7e5cad24936bff8701eb2a19fc`

Every finding in `.factory/review-1.md` and `.factory/review-2.md` is closed. Live evidence is under `.factory/evidence/polish-2/`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Preserved route loading followed by focus on the destination H1 and a polite route announcement. | `forward and browser-history route changes focus the new heading`; mobile history test; live `live-check.json`. |
| F-1-2 | Preserved the honest solo-tradesperson, one-browser audience and explicit no-team-sync boundary. | `@claim:m1-feature-boundaries`; cold mobile [screenshot](evidence/polish-2/cold-mobile.png); live landing check. |
| F-1-3 | Preserved the narrow offline claim for the sample job and allocation only. | `@claim:offline-reload`; `.factory/copy-audit.md`; live `/demo`. |
| F-1-4 | Preserved truthful exit copy: live records reopen unchanged and sample changes are discarded. | `@claim:demo-reset-isolated` creates a live record first; live `live-check.json`. |
| F-1-5 | Preserved one route-owned description, canonical, Open Graph, and Twitter metadata set. | `each route owns one correct metadata set`; factory `verify-url.sh`; live HTML in `evidence/polish-2/index.html`. |
| F-1-6 | Preserved `Demo — Parts Promise`, canonical `/demo`, and the sitemap entry. | Metadata browser test; live `/demo`; `public/sitemap.xml`. |
| F-1-7 | Preserved “Free for one browser in this release” without presenting an unavailable paid tier. | `@claim:free-browser-release`; cold mobile screenshot. |
| F-1-8 | Preserved the useful label “Allocate parts to a job.” | Copy audit; cold mobile screenshot. |
| F-1-9 | Preserved the plain hero caption naming van, warehouse, and supplier records. | Copy audit; cold mobile screenshot. |
| F-1-10 | Preserved the “Sample job status” section label. | Copy audit; live landing check. |
| F-1-11 | Preserved “See why a visit date is at risk.” | Copy audit; live landing check. |
| F-1-12 | Preserved the plain “How it works” section name. | Copy audit; cold mobile screenshot. |
| F-1-13 | Preserved “Check parts before agreeing a visit date.” | Copy audit; cold mobile screenshot. |
| F-1-14 | Preserved “List required parts.” | Copy audit; live landing check. |
| F-1-15 | Preserved “Allocate each part” consistently with the task UI. | Copy audit; live landing check. |
| F-1-16 | Preserved “Review the visit date.” | Copy audit; live landing check. |
| F-1-17 | Preserved result-naming “Use dark theme” and “Use light theme” controls. | Mobile 44 px target test; both-theme live axe run. |
| F-1-18 | Preserved the README heading “Try the sample job.” | README inspection. |
| F-1-19 | Preserved reader-facing “browser-only release” wording; internal claim IDs stay in developer documentation. | README and live footer inspection. |
| F-1-20 | Preserved plain “Page not found” copy and jobs/home recovery links on SPA and static 404s. | `container-runtime`; live unknown route and missing-job screenshot. |
| F-1-21 | Preserved “Sample job” and “Required parts and their sources.” | Demo live check; copy audit. |
| F-2-1 | Centralized demo exit handling for links, confirmed exit, and `popstate`; reads now close their IndexedDB transaction before resolving, and transient delete blocking is tolerated before a real multi-tab error. | `@claim:demo-reset-isolated` covers wordmark and Back separately, database absence, clean re-entry, live-record survival, and zero console errors; live `live-check.json`. |
| F-2-2 | Added CSV import with a downloadable schema, preview, row-numbered validation, duplicate protection, and atomic save. Added versioned JSON export/import for every workspace record and timestamp. Transfers use only the active demo or live namespace. | `@claim:workspace-backup-roundtrip`, `@claim:csv-import-validation`, `@claim:demo-transfer-isolated`; mobile [validation screenshot](evidence/polish-2/import-validation-mobile.png); live check. |
| F-2-3 | Derives an effective not-found state after IndexedDB lookup. Missing job links now use Page not found title/H1/description/OG, home canonical, and `noindex`. | `each route owns one correct metadata set`; live [missing-job screenshot](evidence/polish-2/missing-job-desktop.png); live `live-check.json`. |
| F-2-4 | Every job, edit, part, allocation, source, supplier, and import trigger now exposes `aria-expanded`/`aria-controls`, scrolls its sheet into view, focuses its heading, and restores trigger focus on close. Reduced-motion users get instant scrolling. | `each work form expands, becomes visible, receives focus, and restores its trigger`; live [mobile focus screenshot](evidence/polish-2/form-focus-mobile.png); live `live-check.json`. |

## Cumulative acceptance evidence

- All 16 exact commands in `.factory/claims.json` passed separately from a fresh clone.
- The complete browser suite passed: 35 passed and 21 intentional cross-project skips.
- Unit/API: 15 Vitest and 3 Rust tests passed. Svelte check had 0 errors/warnings. Rust clippy passed with warnings denied.
- Live axe: zero serious/critical findings on six routes in light and dark themes.
- Factory URL verification: HTTPS 200, no console errors, title/lang/main/H1/alt/button checks passed.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.8 s, TBT 100 ms, CLS 0.007.
- Production bundle: 92.33 KB JS raw / 31.12 KB gzip and 16.91 KB CSS raw / 3.96 KB gzip.
- The live `/health` response reported the exact build SHA above after the final redeploy.

No finding from either review remains open.
