# Perfection-loop round 6 repair map

Date: 2026-09-02 UTC

Implementation commit: `54fe70e7d87134f88bb3780b6368c1bd3803cf88`

Live URL: <https://field-parts-promise.sociobot.in>

All earlier review and polish reports were reread. Review 4 added no finding.
The table below maps every finding from reviews 1–6 to the retained or new
change and the round-six evidence.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Route changes and history navigation render first, focus the destination H1, and announce its new text. | `forward and browser-history route changes focus the new heading`; round-six route audit in `evidence/polish-6/live/audit.json` |
| F-1-2 | The product supports the firm job with tenant-isolated accounts, sync, invitations, audit, and data controls while keeping public local use. | `@claim:entra-sign-in`, `@claim:tenant-data-isolation`, `@claim:two-device-sync`, `@claim:invitation-email-activation` |
| F-1-3 | The registry has 37 unique claims and exactly one matching tagged browser test for each. | `public claims contract`; 37/37 clean-clone command results in `evidence/polish-6/clean-claims/summary.json` |
| F-1-4 | Demo exits discard sample changes and reopen the unchanged live workspace. | `@claim:demo-reset-isolated`; live audit checks both directions with unique identifiers |
| F-1-5 | Each route owns one title, description, canonical, Open Graph, Twitter, and robots value. | `each route owns one correct metadata set`; nine-route live audit |
| F-1-6 | `/demo` keeps its `Demo — Parts Promise` title, canonical URL, and sitemap entry. | metadata browser test; `/demo` checks in `evidence/polish-6/live/audit.json` |
| F-1-7 | The first screen states the firm and active-technician prices without suggesting checkout is available. | `@claim:technician-seat-charge`, `@claim:subscription-checkout`; `evidence/polish-6/live/cold-mobile.png` |
| F-1-8 | The task label remains “Allocate parts to a job.” | `.factory/copy-audit.md`; live cold screenshot |
| F-1-9 | The hero caption names the van, warehouse, and supplier records. | `.factory/copy-audit.md`; live cold screenshot |
| F-1-10 | The preview is labelled “Sample job status.” | `.factory/copy-audit.md`; live route audit |
| F-1-11 | The preview heading names the visit date and why it is at risk. | `.factory/copy-audit.md`; live route audit |
| F-1-12 | The process section is named “How it works.” | `.factory/copy-audit.md`; live cold screenshot |
| F-1-13 | The process heading says “Check parts before agreeing a visit date.” | `.factory/copy-audit.md`; live cold screenshot |
| F-1-14 | Step one remains “List required parts.” | `.factory/copy-audit.md` |
| F-1-15 | UI actions consistently use **allocate**. | `@claim:promise-status-from-allocation`; copy audit |
| F-1-16 | Step three remains “Review the visit date.” | `.factory/copy-audit.md` |
| F-1-17 | Theme actions name their result and retain 44 px targets. | `all phone links and verifier-reported controls provide separated 44px touch targets`; live Axe sweep |
| F-1-18 | README uses the complete heading “Try it with sample data.” | README inspection; release wording regression test |
| F-1-19 | Reader-facing product copy stays plain; claim identifiers remain in developer material. | README inspection; `.factory/copy-audit.md` |
| F-1-20 | SPA and static error pages say “Page not found,” expose recovery and legal links, and return HTTP 404. | `container-runtime`; live unknown-route 404 and route audit |
| F-1-21 | Demo labels remain “Sample job” and “Required parts and their sources.” | `@claim:sample-fixture`; `evidence/polish-6/live/demo-isolation-mobile.png` |
| F-2-1 | Wordmark, Back, Reset demo, and Start for real share the isolated deletion path. | `@claim:demo-reset-isolated`; live unique-token isolation checks |
| F-2-2 | JSON round-trip, CSV preview and validation, template download, and mode-isolated transfer remain complete. | `@claim:workspace-backup-roundtrip`, `@claim:csv-import-validation`, `@claim:csv-template-download`, `@claim:demo-transfer-isolated` |
| F-2-3 | Missing jobs and unknown paths render real noindex 404 state under 404 metadata. | metadata test; `container-runtime`; live HTTP 404 |
| F-2-4 | Every work sheet receives heading focus, exposes disclosure state, stays visible on mobile, and restores its trigger. | `each work form expands, becomes visible, receives focus, and restores its trigger` |
| F-3-1 | Back and Forward preserve reading position while moving focus to the destination heading. | desktop and mobile history tests in the full browser suite |
| F-3-2 | The Riverside Dental fixture is registered and checked field by field. | `@claim:sample-fixture`; clean-clone claim log |
| F-3-3 | Backup and transfer checks compare complete records and preserve the opposite namespace. | `@claim:workspace-backup-roundtrip`; `@claim:demo-transfer-isolated` |
| F-3-4 | The downloadable CSV template has an exact download-and-import claim. | `@claim:csv-template-download` |
| F-3-5 | The persistent banner says sample data is not saved to the local workspace. | `@claim:demo-reset-isolated`; live demo screenshot |
| F-3-6 | Public and README copy consistently uses **browser database**; the implementation name appears only in a developer note. | source terminology scan; `.factory/copy-audit.md` |
| F-5-1 | Public copy and API metadata make no payment-provider, merchant, or refund promise. | source scan; `@claim:subscription-checkout` |
| F-5-2 | Privacy wording describes the observed sensitive-input boundary and has a route/request test. | `@claim:sensitive-input-boundary` |
| F-5-3 | The release-wide order boundary applies outside demo; barcode entry and camera scanning are implemented. | `@claim:release-order-boundary`, `@claim:manual-barcode-allocation`, `@claim:camera-barcode-privacy` |
| F-5-4 | README runtime statements match the tested `/data`, file, replica, and startup behavior. | `@claim:durable-runtime-storage`, `@claim:container-runtime` |
| F-5-5 | README no longer claims that the registry is complete; it points to the registered checks. | README “Claim checks”; claim-registry unit test |
| F-5-16 | Checkout sends no request on page load and one POST only after the owner presses the named button. | `@claim:subscription-checkout` request log |
| F-5-6 | The long browser-storage sentence remains split into short sentences. | README sentence scan; `.factory/copy-audit.md` |
| F-5-7 | The long fallback sentence and unregistered fallback promise remain removed. | README sentence scan; release wording regression test |
| F-5-8 | Public copy says “Checkout is not available yet. No charge will start.” | `@claim:subscription-checkout`; live cold audit |
| F-5-9 | User-facing copy consistently calls the paid tier **Firm plan**. | source scan; `@claim:technician-seat-charge` |
| F-5-10 | Terms states that the owner is included in the $39 base price and uses no technician seat. | `@claim:technician-seat-charge`; live Terms route audit |
| F-5-11 | Home, Open Graph, and Twitter titles say “Allocate parts to each job.” | metadata test; live factory URL verifier |
| F-5-12 | Scan a part has an explicit camera permission step, a manual fallback, barcode matching, and allocation continuation. | `@claim:manual-barcode-allocation`, `@claim:camera-barcode-privacy` |
| F-5-13 | Every route footer and the static 404 show the immutable build identity. | `@claim:visible-build-identity`; live `/health` SHA and route audit |
| F-5-14 | The footer says “Built by Param Factory (external site).” | route/link browser tests; live cold screenshot |
| F-5-15 | Internal claim language remains under the developer-only “Claim checks” heading. | README inspection; `.factory/copy-audit.md` |
| F-6-1 | Workspace-mode changes increment a generation guard, clear all workspace-derived transient UI, suppress stale async results, hide live sync state in demo, and clear the route announcement. The exact claim now injects unique live and demo tokens and proves each is absent from the opposite mode's full DOM. | `@claim:demo-reset-isolated`; `clears every workspace-derived transient value`; live checks “live identifier absent from demo DOM” and “demo identifier absent from live DOM”; `evidence/polish-6/live/demo-isolation-mobile.png` |
| F-6-2 | The single tagged Entra claim now sends expired, wrong-signature, wrong-issuer, wrong-audience, and wrong-tenant tokens and requires `401` plus `WWW-Authenticate: Bearer` for each. The claim location now includes README. Rust coverage also includes the wrong signature and response header. | `@claim:entra-sign-in`; `rejects invalid claims, expired tokens, and a wrong signature`; clean log `evidence/polish-6/clean-claims/entra-sign-in.log`; live malformed token returned `401` and `WWW-Authenticate: Bearer` |
| F-6-3 | Replaced the unavailable action heading with “Firm plan pricing” while retaining the exact price and checkout boundary. | `states round-six pricing and runtime wording plainly`; `@claim:subscription-checkout`; live cold audit and screenshot |
| F-6-4 | Replaced internal limiter jargon with “Export allows five requests per minute, then tells the client how long to wait.” The registered claim and test assert five successes followed by `429` and a positive `Retry-After`. | `@claim:response-policy`; clean claim log; release wording regression test |
| F-6-5 | Replaced the unnamed override sentence with “The server starts without extra environment settings.” | `@claim:container-runtime`; release wording regression test; clean container test |

## Verification summary

- Clean clone at commit `54fe70e7d87134f88bb3780b6368c1bd3803cf88`:
  all 37 exact claim commands passed independently. Logs and the machine-readable
  summary are under `evidence/polish-6/clean-claims/`.
- Full clean-clone gates: 23 Vitest tests and 15 Rust tests passed; Svelte check,
  Prettier check, Clippy, and `npm audit --audit-level=high` passed; production
  build completed; Playwright reported 59 passed and 43 intentional
  project-specific skips.
- Exact-commit local browser audit: 72/72 checks passed. Factory URL verification
  reported one H1, a main landmark, `lang=en`, no missing alt text, no unlabeled
  buttons, and no console errors.
- Live cold audit: 72/72 checks passed at the public URL. `/health` reports the
  exact implementation commit and SQLite. The factory verifier loaded the page
  in 603 ms with no console errors.
- Live Lighthouse: performance 99, accessibility 100, best practices 100, SEO
  100; LCP 1.8 s, CLS 0, total blocking time 50 ms.
- Checkout remains operator-gated and unavailable. No shared platform resource,
  secret, staging slot, or unrelated product was accessed.
