# Perfection-loop round 7 repair map

Date: 2026-09-02 UTC

Implementation source: this repair replaces only the two reader-facing README
sentences found in review 7. It keeps the released product behavior, visual
identity, sandbox, routes, claims, and deployment class intact.

Live URL: <https://field-parts-promise.sociobot.in>

## Finding map

The evidence suite is run from a clean clone. Live browser evidence is stored
under `evidence/polish-7/live/`; the cold 390 px screenshot is
`cold-mobile.png`, and the desktop verifier screenshot is
`verify/screenshot-desktop.png`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Route changes render before moving focus to the destination H1 and announce it. | `forward and browser-history route changes focus the new heading`; live `/privacy`, `/?demo=1`, and `/jobs?demo=1` focus check. |
| F-1-2 | Firm workspaces use Entra identity, tenant isolation, sync, invitations, and conflict handling. | `@claim:tenant-data-isolation`, `@claim:two-device-sync`, `@claim:sync-conflict-resolution`; live `/onboarding`. |
| F-1-3 | Public claims are registered once and each has one exact tagged test. | `public claims contract`; all 37 clean-clone claim commands. |
| F-1-4 | Every demo exit deletes sample changes before reopening unchanged live data. | `@claim:demo-reset-isolated`; live `/?demo=1`, `demo-reset-mobile.png`. |
| F-1-5 | Routes own one title, description, canonical, Open Graph, Twitter, and robots value. | `each route owns one correct metadata set`; live route audit. |
| F-1-6 | `/demo` has its title, canonical, and sitemap entry. | `each route owns one correct metadata set`; live `/demo`. |
| F-1-7 | First screen states the $39 firm price and $8 active-technician price. | `@claim:technician-seat-charge`; `cold-mobile.png`. |
| F-1-8 | The task label is “Allocate parts to a job.” | copy audit; live `/`. |
| F-1-9 | Hero caption names van, warehouse, and supplier records. | copy audit; `cold-mobile.png`. |
| F-1-10 | Preview is labelled “Sample job status.” | `@claim:sample-fixture`; live `/`. |
| F-1-11 | Preview heading names the at-risk visit date. | `@claim:promise-status-from-allocation`; live `/`. |
| F-1-12 | Process section is “How it works.” | copy audit; live `/`. |
| F-1-13 | Process heading names the parts check before agreeing a date. | copy audit; `cold-mobile.png`. |
| F-1-14 | First step says “List required parts.” | copy audit; live `/`. |
| F-1-15 | User controls use “Allocate” consistently. | `@claim:promise-status-from-allocation`; live `/?demo=1`. |
| F-1-16 | Third step says “Review the visit date.” | copy audit; live `/`. |
| F-1-17 | Theme buttons name their result and meet touch-target checks. | phone touch-target test; Axe live sweep. |
| F-1-18 | README heading is “Try it with sample data.” | round-seven copy audit; README regression test. |
| F-1-19 | Claim machinery stays in developer material and product copy is plain. | copy audit; live `/`. |
| F-1-20 | SPA and server 404s say “Page not found,” recover, link legal pages, and return 404. | `@claim:container-runtime`; live `/not-on-this-drawing`. |
| F-1-21 | Demo labels are “Sample job” and “Required parts and their sources.” | `@claim:sample-fixture`; live `/?demo=1`. |
| F-2-1 | Wordmark, Back, Reset demo, and Start for real share isolated cleanup. | `@claim:demo-reset-isolated`; `demo-reset-mobile.png`. |
| F-2-2 | JSON backup, CSV preview/validation, template download, and isolated transfer are present. | `@claim:workspace-backup-roundtrip`, `@claim:csv-import-validation`, `@claim:csv-template-download`, `@claim:demo-transfer-isolated`. |
| F-2-3 | Unknown jobs and paths render noindex 404 metadata. | metadata test; live `/jobs/not-a-real-job`. |
| F-2-4 | Work sheets expose state, focus their heading, stay visible on mobile, and restore focus. | `each work form expands, becomes visible, receives focus, and restores its trigger`; live `/jobs?demo=1`. |
| F-3-1 | Back and Forward restore scroll while focusing the new H1. | desktop/mobile history test; live route audit. |
| F-3-2 | Riverside Dental fixture has exact claim coverage. | `@claim:sample-fixture`; live `/?demo=1`. |
| F-3-3 | Backup/transfer checks compare complete records and keep the other namespace unchanged. | `@claim:workspace-backup-roundtrip`; `@claim:demo-transfer-isolated`. |
| F-3-4 | CSV template has an exact download/import claim. | `@claim:csv-template-download`. |
| F-3-5 | Banner names the local-workspace boundary. | `@claim:demo-reset-isolated`; `demo-reset-mobile.png`. |
| F-3-6 | Reader copy uses browser-database language; exact implementation names are developer-only. | copy audit; README regression test. |
| F-5-1 | Unsupported payment-provider, merchant, and refund wording is absent. | `@claim:subscription-checkout`; source scan. |
| F-5-2 | Privacy copy is limited to the tested sensitive-input boundary. | `@claim:sensitive-input-boundary`; live `/privacy`. |
| F-5-3 | Barcode entry/scanning work; supplier orders are not placed. | `@claim:release-order-boundary`, `@claim:manual-barcode-allocation`, `@claim:camera-barcode-privacy`. |
| F-5-4 | Runtime-storage statements match the one-replica `/data` implementation. | `@claim:durable-runtime-storage`; `container release contract`. |
| F-5-5 | README points to registered checks without a completeness overclaim. | `public claims contract`; README audit. |
| F-5-16 | Checkout does nothing before the owner’s named action and reports no charge. | `@claim:subscription-checkout`; live `/settings/billing`. |
| F-5-6 | Long storage sentence is split. | README sentence audit. |
| F-5-7 | Untestable fallback promise remains absent. | README sentence audit. |
| F-5-8 | Checkout wording says it is unavailable and no charge starts. | `@claim:subscription-checkout`; live `/settings/billing`. |
| F-5-9 | Paid tier is consistently called Firm plan. | `@claim:technician-seat-charge`; copy audit. |
| F-5-10 | Pricing says the owner is included and has no technician seat. | `@claim:technician-seat-charge`; live `/terms`. |
| F-5-11 | Home and social metadata use “Allocate parts to each job.” | metadata test; verifier report. |
| F-5-12 | Scan a part provides explicit camera permission and manual barcode fallback. | `@claim:manual-barcode-allocation`; `@claim:camera-barcode-privacy`. |
| F-5-13 | Every footer and static 404 show a build identity. | `@claim:visible-build-identity`; live `/health`. |
| F-5-14 | Footer discloses the Param Factory link is external. | route/link test; `cold-mobile.png`. |
| F-5-15 | Claim terminology remains under “Claim checks.” | README audit; `public claims contract`. |
| F-6-1 | Crossing storage modes clears derived UI and rejects stale responses. | `@claim:demo-reset-isolated`; `demo-reset-mobile.png`. |
| F-6-2 | Invalid Entra tokens, including wrong signatures, are rejected with the bearer challenge. | `@claim:entra-sign-in`; Rust API tests. |
| F-6-3 | Pricing heading is “Firm plan pricing.” | `@claim:subscription-checkout`; live `/`. |
| F-6-4 | Export-limit wording states the limit and wait plainly. | `@claim:response-policy`; README audit. |
| F-6-5 | README says the server starts without extra environment settings. | `@claim:container-runtime`; README regression test. |
| F-7-1 | Replaced “Repeated sync requests with the same operation ID apply once.” with “Retrying the same saved change does not create a duplicate.” | `round 7 README wording`; `@claim:idempotent-sync`; pushed README at `3805dc1`, plus cold live `/` check. |
| F-7-2 | Replaced “Offline signed-in edits stay in a browser database outbox.” with “Offline signed-in edits stay queued in this browser.” | `round 7 README wording`; `@claim:offline-signed-in-sync`; pushed README at `3805dc1`, plus cold live `/?demo=1` check. |

## Round-seven evidence

- Clean clone: every command in `.factory/claims.json` passes independently.
- Local gates: `npm test`, `npm run check`, `npm run format:check`, production
  build, and the full Playwright suite pass.
- Live gates: cold home and demo checks, factory URL verifier, Axe serious and
  critical scan, and the live 404 check pass at the URL above.
- The deployed cold check re-reads the two README sentences from the committed
  source and verifies the live app retains the plain first screen and one-click
  isolated demo.
