# Parts Promise

Parts Promise is planned for solo-to-20-person electrical, HVAC, and repair firms. It will tie each required part to one job before the firm agrees a visit date. It is an offline-first PWA with a Rust sync API.

This repository is currently a **planning and tooling skeleton**. The product flow is not implemented yet. M1 will add the local job card and isolated sample-data demo; see [the venture plan](.factory/plan.md) for the exact scope and claims.

## Repository guide

- `.factory/plan.md` — PRD, evidence, architecture, milestone contract, tests, and risks.
- `.factory/design.md` — the exploded-parts blueprint visual thesis and token rules.
- `.factory/claims.json` — observable claims M1 must implement and test.
- `.factory/component-inventory.md` — the bounded product component system.
- `src/` — Svelte/Vite web skeleton and design tokens.
- `server/` — axum API skeleton; shared data begins in M2.

## Run and verify

Requirements: Node.js 22+, npm 10+, and stable Rust.

```sh
npm install
npm run dev
npm test
npm run build
```

`npm test` runs the current TypeScript and Rust tests. `npm run build` type-checks Svelte, writes the web bundle to `dist/`, and creates a release API binary under `server/target/release/`. M1 will add Playwright claim tests under `e2e/`; Playwright is pinned to 1.58.2 for the factory browser image.

To run only the API scaffold:

```sh
cargo run --manifest-path server/Cargo.toml
curl http://127.0.0.1:8080/health
```

The API accepts `PORT` and defaults to `8080`. No secret or other environment variable is required for the skeleton.

## Deployment

The planned production URL is <https://field-parts-promise.sociobot.in>. The web bundle targets Static Web Apps; the API has a non-root multi-stage `Dockerfile` for Container Apps. This repository does not modify infrastructure, DNS, or billing configuration.

## Privacy and billing

M1's demo will use a separate browser database and make no API request. Accounts and cloud sync start in M2 through Sociobot Entra CIAM. Subscription checkout will go only through the Sociobot billing API; the product will never embed Dodo credentials or a payment provider SDK. Runtime AI is deliberately out of scope because allocation decisions must come from attributable evidence.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
