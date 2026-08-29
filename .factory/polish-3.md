# Parts Promise — polish 3 evidence map

Released application commit: `11670381aa718b32522525840353c1137a3f1958`
Live URL: <https://field-parts-promise.sociobot.in>

All evidence below is from the final source, clean clone, or cold deployed
site. Live evidence is retained in
`.factory/qa-artifacts/polish-3-live/`; its route sweep covers light and dark
themes, one H1/main/lang/metadata set per route, axe serious/critical results,
the HTTP 404, demo isolation, and mobile history focus/scroll.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Preserved destination-H1 focus and added persisted scroll coordinates for history entries. | `forward and browser-history route changes focus the new heading`; `Back and Forward restore reading position while keeping the new heading focused`; live `history-mobile.png` and `live-qa.json`. |
| F-1-2 | Kept the audience truthful: a solo tradesperson using one browser, with no team sync. | `@claim:m1-feature-boundaries`; cold live home screenshot. |
| F-1-3 | Kept the offline wording limited to the sample allocation flow. | `@claim:offline-reload`; cold live `/?demo=1`. |
| F-1-4 | Kept truthful exit language and the unchanged live-workspace behavior. | `@claim:demo-reset-isolated`; live `live-qa.json`. |
| F-1-5 | Kept one route-owned description, canonical, Open Graph, and Twitter set. | `each route owns one correct metadata set`; live `live-qa.json`. |
| F-1-6 | Kept `/demo` title/canonical behavior and its sitemap route. | Metadata test; live `/?demo=1` title in `demo/verify.json`. |
| F-1-7 | Kept the visible free browser-release fact. | `@claim:free-browser-release`; home cold screenshot. |
| F-1-8 | Kept “Allocate parts to a job.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-9 | Kept the plain source-record hero caption. | `.factory/copy-audit.md`; home screenshot. |
| F-1-10 | Kept “Sample job status.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-11 | Kept the visit-date-risk heading. | `.factory/copy-audit.md`; home screenshot. |
| F-1-12 | Kept “How it works.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-13 | Kept “Check parts before agreeing a visit date.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-14 | Kept “List required parts.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-15 | Kept “Allocate each part.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-16 | Kept “Review the visit date.” | `.factory/copy-audit.md`; home screenshot. |
| F-1-17 | Kept result-naming light/dark theme controls with 44 px targets. | `all phone links and verifier-reported controls provide separated 44px touch targets`; live both-theme axe sweep. |
| F-1-18 | Kept the README heading “Try the sample job.” | README audit. |
| F-1-19 | Kept public browser-release language and separated internal claim IDs. | README audit; `@claim:m1-feature-boundaries`. |
| F-1-20 | Kept plain recovery wording/actions on a real HTTP 404. | Live `/not-on-this-drawing`, `live-qa.json`, and `container-runtime`. |
| F-1-21 | Kept “Sample job” and “Required parts and their sources.” | `@claim:sample-fixture`; `demo/after-allocation.png`. |
| F-2-1 | Kept centralized deletion for wordmark, Back, reset, and confirmed demo exit. | `@claim:demo-reset-isolated`; live `live-qa.json`. |
| F-2-2 | Kept CSV import plus versioned JSON backup/restore in the active workspace only. | `@claim:workspace-backup-roundtrip`, `@claim:csv-import-validation`, `@claim:demo-transfer-isolated`. |
| F-2-3 | Kept effective missing-job 404 title, metadata, canonical, and noindex state. | `each route owns one correct metadata set`; local missing-job regression. |
| F-2-4 | Kept work-sheet disclosure semantics, focus, visibility, and trigger restoration. | `each work form expands, becomes visible, receives focus, and restores its trigger`. |
| F-3-1 | Added `history.scrollRestoration = 'manual'`, saved coordinates per history entry, restored them after `preventScroll` H1 focus, and made programmatic restoration instant. | New desktop/mobile history regression; cold live mobile footer → Privacy → Back restored `scrollY=1642` and H1 focus in `live-qa.json`. |
| F-3-2 | Added the `sample-fixture` claim and an exact fixture assertion. | `@claim:sample-fixture`; clean clone pass; `demo/verify.json`. |
| F-3-3 | Deepened JSON backup proof and exercised demo export isolation, including a byte-equivalent live workspace assertion. | `@claim:workspace-backup-roundtrip`; `@claim:demo-transfer-isolated`; clean clone pass. |
| F-3-4 | Added the `csv-template-download` claim and a browser download/import test for filename, `text/csv`, header, and valid rows. | `@claim:csv-template-download`; clean clone pass. |
| F-3-5 | Rewrote the banner to say that no sample data is saved to the local workspace. | Cold live `/?demo=1`; `demo/verify.json`; `.factory/copy-audit.md`. |
| F-3-6 | Rewrote README storage references to one plain “browser database” term. | README audit; `.factory/copy-audit.md`. |
| F7-01 | Preserved 44 × 44 px visible links/buttons and 8 px grouped spacing at 390 px. | Mobile touch-target browser regression; live both-theme axe sweep. |

## Claim-gate evidence

Fresh clone `/tmp/field-parts-promise-polish-3-9s9Nzw` ran `npm ci` then all
18 exact commands from `.factory/claims.json` separately. Every command
passed: `sample-fixture`, `promise-status-from-allocation`,
`allocation-keeps-source`, `supplier-quantity-conserved`,
`reorder-after-allocation`, `demo-reset-isolated`, `offline-reload`,
`local-workspace-flow`, `m1-feature-boundaries`, `free-browser-release`,
`indexeddb-local-storage`, `demo-network-privacy`, `clear-local-records`,
`workspace-backup-roundtrip`, `csv-import-validation`,
`demo-transfer-isolated`, `csv-template-download`, and `container-runtime`.

The final clean-clone Playwright status was
`{"status":"passed","failedTests":[]}`. No finding, including any minor
copy or evidence finding, remains unresolved.
