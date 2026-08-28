# Parts Promise

Parts Promise is for small electrical, HVAC, and repair firms that need to check whether a required part is held for one job before agreeing its visit date.

M1 is a local-first, offline-capable job card. It lets one person create jobs and required parts, record van or warehouse sources, allocate a quantity to the job, attach supplier-date evidence, undo an allocation, and review a deterministic promise status. It is not a shared account, supplier connection, barcode scanner, or checkout product yet.

## Try it

Open `/?demo=1` (for example, <http://127.0.0.1:4173/?demo=1> while developing). The sample opens Riverside Dental job `RD-1042` with one missing condensate pump.

Allocate that pump from Van 2 to move the job from **Date at risk** to **Parts in hand**. The van then reaches zero pumps against a minimum of one, so Parts Promise suggests a reorder and never places one.

The demo uses the `parts-promise-demo-v1` IndexedDB database. **Reset demo** restores the bundled fixture. **Start for real** deletes the demo database and opens the separate, empty `parts-promise-live-v1` database.

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

`npm test` runs deterministic TypeScript promise-rule tests plus the Rust API health test. `npm run test:e2e` builds the web app and runs the five observable demo claims, accessibility checks, mobile keyboard/history coverage, and an offline reload. `npm run build` type-checks the Svelte app, writes `dist/`, and creates the release API binary.

## Architecture and privacy

- The Svelte PWA keeps M1 job data in browser IndexedDB. The demo and live names are separate and M1 makes no API request for either workspace.
- `public/sw.js` caches the built shell and fixture assets. After the first visit, the demo job and allocation flow survive an offline reload.
- The Rust/axum service serves `/health` and the compiled static app in the container. It does not accept M1 job data. Shared firm data, CIAM sign-in, sync, PostgreSQL migrations, and recurring Sociobot billing begin in M2.
- No analytics, supplier portal, payment provider, remote font, camera permission, or runtime AI call is included in M1.

The app includes privacy and terms routes at `/privacy` and `/terms`.

## Deployment

The factory deploys the product; this repository does not change DNS, billing, or infrastructure. The multi-stage Dockerfile builds the static app and Rust service, runs as a non-root user, listens on `PORT` (default `8080`), and serves both the app and `/health` without secrets or required environment variables.

```sh
curl http://127.0.0.1:8080/health
```

The intended production URL is <https://field-parts-promise.sociobot.in>. Production CIAM and Sociobot recurring checkout are M2 operator work, not M1 features.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
