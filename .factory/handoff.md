# Planning handoff

Work order: `venture-field-parts-promise-plan`

Completed: 2026-08-28

Next work order: `venture-field-parts-promise-m1`

## What was done

- Wrote `.factory/plan.md` as the venture delivery contract: customer, promise, three jobs, pricing, evidence, architecture, data/tenancy model, offline conflict rules, authentication, billing boundary, rate limits, observability/recovery, five shippable milestones, claim/test/DoD contracts, and risk-retiring experiments.
- Wrote `.factory/design.md` for the product-specific **exploded-parts blueprint** system, including light/dark palettes, type, spacing, shape, motion, state, accessibility, responsive, and original-asset provenance rules.
- Added `.factory/claims.json` with the five M1 claims. Their Playwright tests are deliberately M1 work because this planner did not build or pretend to build the product.
- Added a 20-component inventory in `.factory/component-inventory.md` and a compile-checked TypeScript inventory.
- Scaffolded Svelte 5/Vite/strict TypeScript, pinned Playwright 1.58.2, Vitest, formatting/type checks, and patched dependency versions. The current page explicitly identifies itself as a planning skeleton.
- Scaffolded the Rust/axum API with JSON logs, graceful shutdown, `PORT=8080` default, build identity, `/health`, tests, migration location, and a non-root multi-stage Dockerfile. Shared API routes and PostgreSQL begin in M2; no fake persistence was added.
- Added GitHub Actions for clean npm install, formatting, TypeScript/Rust tests, Svelte check, web build, and release API build.
- Updated the researched brief state to the admitted state supplied by the work order. Kept the existing MIT license and expanded README run/test/build/deploy guidance.

## Verification

- `npm audit --audit-level=moderate` — passed, 0 vulnerabilities.
- `npm run format:check` — passed.
- `npm test` — passed: 2 Vitest tests and 1 Rust API test.
- `npm run build` — passed: Svelte check reported 0 errors/warnings; Vite wrote `dist/`; release Rust binary built.
- Web bundle at foundation: 10.21 KB JS gzip and 1.36 KB CSS gzip.
- Started the release API with `PORT=18080`; `GET /health` returned `{"status":"ok","build_sha":"dev"}`.
- `jq` parsed the JSON contracts and `git diff --check` passed.
- A Docker engine was not available in this worker, so the Dockerfile itself was not built locally. The exact release binary copied by it was built and run.

Lighthouse, axe, Playwright claim tests, service-worker/offline checks, route crawling, and mobile screenshots do not apply to this non-product planning skeleton; they are explicit M1 acceptance gates.

## Known gaps / M1 starting point

- No product flow, routing, IndexedDB, service worker, demo data, production metadata/assets, legal pages, or claim E2E tests exist yet. This is intentional. Implement exactly M1 in `.factory/plan.md` and do not pull M2 accounts/backend persistence into it.
- The starter uses system fallbacks. M1 must self-host and license the two specified font subsets within the 120 KB budget.
- M1 must author the original vector hero/status/404/social/favicon assets and append their provenance to `.factory/design.md`.
- The placeholder page links to the repository; it must be replaced by the standard landing/app route shell in M1.

## Needs operator action before M2 acceptance

- Register `https://field-parts-promise.sociobot.in/auth/callback` on the shared Entra SPA application and confirm it with a staging redirect.
- Register a recurring Sociobot test product for **Workshop base — $39/month** and **Technician seat — $8/month per active technician**.
- Confirm the Sociobot recurring checkout/verification or event contract supports exact seat quantities, cancellation, and refunds. The attached paid-unlock contract documents only one-time licenses; builders must not bypass Sociobot or call Dodo directly.
