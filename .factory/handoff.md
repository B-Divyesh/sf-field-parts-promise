# Parts Promise handoff

Latest milestone: M1 — Local promise check and one-click demo

M1 is implemented, locally verified, and pushed to `main` at `4fd6c5d` (with `c27cbd7`). The detailed delivery record is [handoff-m1.md](handoff-m1.md).

## Current product state

The product now has a real local-first job and parts allocation flow, an isolated one-click demo at `/?demo=1`, deterministic promise and reorder rules, browser persistence, offline reload support, responsive task screens, legal pages, and a container that serves both the compiled app and `/health`.

Shared accounts, PostgreSQL persistence/migrations, CIAM, billing, multi-device sync, server rate limits, and payment are intentionally M2 scope under the approved venture plan. M1 contains no stubs that imply they work.

## Run and verify

```sh
npm ci
npm test
npm run test:e2e
npm run build
```

The release binary can be checked locally with:

```sh
PORT=8080 server/target/release/parts-promise-api
curl http://127.0.0.1:8080/health
```

## Deployment status

The M1 commits were pushed successfully. Deployment is not complete: this repository has no deployment workflow/configuration and the production hostname failed DNS resolution during the cold probe on 2026-08-28. The factory must deploy the pushed container build and then rerun the cold URL check before treating M1 as live.
