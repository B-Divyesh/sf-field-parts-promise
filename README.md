# Parts Promise

Parts Promise is for small electrical, HVAC, and repair firms. It checks whether a required part is held before the firm agrees a job's visit date.

M1 is a local, offline-capable job card. One person can create a job and record a van or warehouse source. They can allocate and undo quantities, attach supplier-date evidence, and review the promise status. Claim `local-workspace-flow` covers this work.

This release has no sign-in, team sync, barcode scan, supplier-order action, or checkout. Records stay in one browser. Claim `m1-feature-boundaries` checks those limits in the shipped interface.

## Try it

Open `/?demo=1` (for example, <http://127.0.0.1:4173/?demo=1> while developing). The sample opens Riverside Dental job `RD-1042` with one missing condensate pump.

Allocate that pump from Van 2 to move the job from **Date at risk** to **Parts in hand**. The van then reaches zero pumps against a minimum of one, so Parts Promise suggests a reorder and never places one.

The demo uses the `parts-promise-demo-v1` IndexedDB database. **Reset demo** restores the bundled fixture. **Start for real** deletes the demo database and opens the separate, empty `parts-promise-live-v1` database. Claims `indexeddb-local-storage` and `demo-reset-isolated` cover these boundaries.

## Run and verify

Requirements: Node.js 22+, npm 10+, and stable Rust.

```sh
npm ci
npm run dev
```

Use these checks before shipping:

```sh
npm test
npm run test:e2e
npm run build
```

`npm test` runs the deterministic TypeScript rules and Rust server tests. `npm run test:e2e` runs every browser claim, accessibility checks, mobile keyboard/history coverage, and the offline reload. `npm run build` type-checks the Svelte app, writes `dist/`, and creates the release server binary.

## Architecture and privacy

- Jobs, required parts, sources, and allocations use the named browser IndexedDB databases. Claim `indexeddb-local-storage` reads the stored allocation directly.
- The service worker keeps the sample allocation flow working after an offline reload. Claim `offline-reload` performs that flow without a network.
- The demo makes only same-origin GET requests and never asks for camera access. Claim `demo-network-privacy` records the full request and permission flow.
- The Rust server serves `/health` and the compiled app. It has no job-data endpoint in M1. Claim `container-runtime` starts it with only `PORT` and probes these responses.

The app includes privacy and terms routes at `/privacy` and `/terms`.

## Deployment

The factory deploys the product. The multi-stage image runs as a non-root user and listens on `PORT`, which defaults to `8080`. The server needs no secret or other environment variable. Unknown paths keep the designed page and return HTTP 404.

```sh
curl http://127.0.0.1:8080/health
```

The production URL is <https://field-parts-promise.sociobot.in>.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
