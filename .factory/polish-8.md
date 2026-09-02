# Perfection-loop round 8 repair map

Date: 2026-09-02 UTC

Work order: `field-parts-promise-polish-8`

Repair source: `0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb`

Live URL: <https://field-parts-promise.sociobot.in>

All findings in reviews 1–8 were reread. Review 4 added no finding. Every
numbered finding, the legacy `F7-01` item, and the earlier unnumbered delivery
checks are mapped below.

## Evidence key

- **Claims:** every `C:<id>` means the exact command
  `npm run test:e2e -- --grep @claim:<id>` passed independently in clean clone
  `/tmp/field-parts-promise-polish8.D3OOx4/repo`. The 37/37 result is recorded
  in `evidence/polish-8/clean-claims/summary.json`.
- **Live home:** `/` at 390 × 844 is in `evidence/polish-8/live/cold-mobile.png`.
- **Live demo/new tab:** `/demo` and a native new-tab `/jobs?demo=1` are in
  `evidence/polish-8/live/demo-new-tab.png`; exact href, banner, request, and
  database results are in `evidence/polish-8/live/audit.json`.
- **Live routes:** ten production URLs, titles, landmarks, legal links, HTTP
  404, and Axe results are in `evidence/polish-8/live/audit.json`. Factory
  verifier screenshots and reports are under `evidence/polish-8/live/verify-*`.
- **Live offline:** the offline `/demo` reload is in
  `evidence/polish-8/live/demo-offline.png`.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Route changes render before focusing and announcing the destination H1. | Browser test `forward and browser-history route changes focus the new heading`; live `/privacy` and Back in `audit.json`. |
| F-1-2 | Entra identity, firm isolation, sync, invitations, and conflict handling back shared workspaces. | C:`tenant-data-isolation`, C:`two-device-sync`, C:`sync-conflict-resolution`; live `/onboarding`. |
| F-1-3 | Public claims are registered once and each has exactly one tagged outcome test. | `public claims contract`; 37/37 clean-claim summary. |
| F-1-4 | Every demo exit deletes sample changes before the unchanged live workspace opens. | C:`demo-reset-isolated`; live demo/new-tab evidence. |
| F-1-5 | Each route owns one title, description, canonical, Open Graph, Twitter, and robots value. | Browser test `each route owns one correct metadata set`; live ten-route sweep. |
| F-1-6 | `/demo` has its own title and canonical and is listed in the sitemap. | Metadata test; live `/demo` factory verifier screenshot. |
| F-1-7 | The first screen states the $39 firm price and $8 active-technician price. | C:`technician-seat-charge`; live home screenshot. |
| F-1-8 | The task label is “Allocate parts to a job.” | `.factory/copy-audit.md`; live `/`. |
| F-1-9 | The hero caption names van, warehouse, and supplier evidence. | Copy audit; live home screenshot. |
| F-1-10 | The preview is labelled “Sample job status.” | C:`sample-fixture`; live `/`. |
| F-1-11 | The preview heading names the at-risk visit date. | C:`promise-status-from-allocation`; live `/`. |
| F-1-12 | The process section is “How it works.” | Copy audit; live `/`. |
| F-1-13 | The process heading names the parts check before a promised date. | Copy audit; live home screenshot. |
| F-1-14 | The first step says “List required parts.” | Copy audit; live `/`. |
| F-1-15 | Controls consistently use “Allocate.” | C:`promise-status-from-allocation`; live `/demo`. |
| F-1-16 | The third step says “Review the visit date.” | Copy audit; live `/`. |
| F-1-17 | Theme buttons name their result and meet touch-target checks. | Browser test `all phone links and verifier-reported controls provide separated 44px touch targets`; live light/dark Axe sweep. |
| F-1-18 | README uses “Try it with sample data.” | README regression and copy audit. |
| F-1-19 | Claim machinery stays in developer documentation; product copy is plain. | Copy audit; live home screenshot. |
| F-1-20 | Server and client 404s use the product shell, legal links, recovery actions, and HTTP 404. | C:`container-runtime`; live `/not-on-this-drawing` route sweep. |
| F-1-21 | Demo labels say “Sample job” and “Required parts and their sources.” | C:`sample-fixture`; live `/demo`. |
| F-2-1 | Wordmark, Back, Reset demo, and Start for real share isolated cleanup. | C:`demo-reset-isolated`; live demo/new-tab evidence. |
| F-2-2 | Versioned JSON backup, CSV preview/validation, template download, and isolated transfer are implemented. | C:`workspace-backup-roundtrip`, C:`csv-import-validation`, C:`csv-template-download`, C:`demo-transfer-isolated`. |
| F-2-3 | Unknown jobs and paths render noindex 404 metadata. | Metadata test; live `/not-on-this-drawing`. |
| F-2-4 | Work sheets expose state, focus their heading, remain visible on phones, and restore trigger focus. | Browser test `each work form expands, becomes visible, receives focus, and restores its trigger`; live `/jobs?demo=1`. |
| F-3-1 | Back and Forward restore reading position while focusing the new H1. | Browser test `Back and Forward restore reading position while keeping the new heading focused`; live route-focus check. |
| F-3-2 | The Riverside Dental fixture has exact customer, job, part, quantity, and shortage assertions. | C:`sample-fixture`; live `/demo`. |
| F-3-3 | Backup and transfer checks compare complete records and keep the other namespace unchanged. | C:`workspace-backup-roundtrip`; C:`demo-transfer-isolated`. |
| F-3-4 | The CSV template download has an exact filename, type, content, and import test. | C:`csv-template-download`. |
| F-3-5 | The persistent banner names the local-workspace boundary. | C:`demo-reset-isolated`; live demo/new-tab screenshot. |
| F-3-6 | Reader copy says “browser database”; implementation names remain in developer notes. | Copy audit and README regression. |
| F7-01 | Phone links and buttons retain 44 × 44 px targets and grouped spacing. | Browser touch-target test; live 390 px home screenshot. |
| F-5-1 | Unsupported provider, merchant, and refund wording is absent. | C:`subscription-checkout`; source/copy scan. |
| F-5-2 | Privacy copy is limited to the tested sensitive-input boundary. | C:`sensitive-input-boundary`; live `/privacy` Axe/route check. |
| F-5-3 | Barcode entry/scanning works; the product does not place supplier orders. | C:`manual-barcode-allocation`, C:`camera-barcode-privacy`, C:`release-order-boundary`. |
| F-5-4 | Runtime-storage copy matches one replica and durable `/data`. | C:`durable-runtime-storage`; C:`container-runtime`. |
| F-5-5 | README points to registered checks without a completeness overclaim. | `public claims contract`; README audit. |
| F-5-6 | The long storage sentence was split into plain sentences. | Copy audit and README regression. |
| F-5-7 | The untestable fallback promise was removed. | Copy audit and public-claim scan. |
| F-5-8 | Checkout copy says it is unavailable and no charge starts. | C:`subscription-checkout`; live `/settings/billing`. |
| F-5-9 | The paid offer is consistently called Firm plan. | C:`technician-seat-charge`; copy audit. |
| F-5-10 | Pricing says the owner is included and uses no technician seat. | C:`technician-seat-charge`; live `/terms`. |
| F-5-11 | Home and social metadata say “Allocate parts to each job.” | Metadata test; live `/` factory verifier. |
| F-5-12 | Scan a part provides explicit camera permission and manual barcode fallback. | C:`manual-barcode-allocation`; C:`camera-barcode-privacy`. |
| F-5-13 | Every app/footer and the static 404 expose build identity. | C:`visible-build-identity`; live `/health` reports `0f05f4d…`. |
| F-5-14 | The footer discloses the Param Factory link as external. | Link test; live home screenshot. |
| F-5-15 | Claim terminology remains under the developer-facing “Claim checks” heading. | README audit; `public claims contract`. |
| F-5-16 | Checkout does nothing until the owner's named action and reports that no charge starts. | C:`subscription-checkout`; live `/settings/billing`. |
| F-6-1 | Crossing storage modes clears all workspace-derived transient UI and rejects stale responses. | C:`demo-reset-isolated`; live demo/new-tab evidence. |
| F-6-2 | The tagged sign-in claim rejects expired, wrong-signature, wrong-issuer, wrong-audience, and wrong-tenant tokens. | C:`entra-sign-in`. |
| F-6-3 | The pricing heading is “Firm plan pricing.” | C:`subscription-checkout`; live `/`. |
| F-6-4 | README states the export limit and wait behavior plainly. | C:`response-policy`; copy audit. |
| F-6-5 | README says the server starts without extra environment settings. | C:`container-runtime`; README regression. |
| F-7-1 | README says retrying a saved change does not create a duplicate. | C:`idempotent-sync`; copy audit. |
| F-7-2 | README says offline signed-in edits stay queued in the browser. | C:`offline-signed-in-sync`; copy audit. |
| F-8-1 | `href(path, demo)` now makes every rendered demo link reactive. The click handler follows that rendered URL and leaves modified/native navigation to the browser. The claim test checks all demo hrefs, opens Jobs and both legal destinations in new tabs, requires the banner, and enumerates databases. | C:`demo-reset-isolated`; live `/demo`, `/jobs?demo=1`, `/privacy?demo=1`, `/terms?demo=1`; `demo-new-tab.png`; `audit.json` records only `parts-promise-demo-v1` for all four tabs. |

## Earlier unnumbered checks

Immutable caching applies only to hashed assets; HTML and `sw.js` revalidate.
The multi-stage non-root container starts with only `PORT`, stores durable data
under `/data`, reports its source SHA, and rate-limits API endpoints. The
Permissions Policy, CSP, designed 404, responsive card geometry, original
blueprint identity, reduced-motion path, and self-hosted fonts remain intact.
Evidence: C:`container-runtime`, C:`durable-runtime-storage`,
C:`response-policy`, the full browser suite, `live/root-headers.txt`,
`live/js-headers.txt`, the live route/Axe sweep, and the factory screenshots.

## Final verification

- Clean clone: 37/37 exact claim commands passed; full Playwright passed 61
  with 43 expected cross-project skips; 24 Vitest and 15 Rust tests passed.
- Static checks: Svelte check, Prettier, Rustfmt, Clippy with `-D warnings`, npm
  audit, and production build passed. `dist/` was produced.
- Live: factory verifier passed `/` and `/demo`; the custom cold-browser audit
  passed every check with no unexpected console/page errors and same-origin
  GET/HEAD requests only.
- Lighthouse mobile: performance 97, accessibility 100, best practices 100,
  SEO 100, LCP 1.4 s, CLS 0.022, and TBT 190 ms.
- Deployment: `sf-field-parts-promise` serves build `0f05f4d44b88…`, mounts
  `sf-field-parts-promise-data` at `/data`, uses one replica, and returned 200
  at the product hostname after rollout.

No review finding remains unresolved.
