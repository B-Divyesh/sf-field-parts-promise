# Parts Promise

Parts Promise helps small trade firms promise job dates from parts held for each job. A solo user can work locally. A signed-in firm can share one workspace across devices.

## Try it with sample data

Open `/?demo=1`, or <http://127.0.0.1:4173/?demo=1> during development. The sample opens Riverside Dental job `RD-1042` with one missing condensate pump.

Allocate the pump from Van 2. The status changes from **Date at risk** to **Parts in hand**. Van 2 then has no spare pumps, so the app suggests a reorder. It never places an order.

The demo uses the separate `parts-promise-demo-v1` browser database. It never signs in or contacts the account, sync, or billing API. **Reset demo** restores the sample. **Start for real** deletes demo changes and opens the unchanged local workspace.

## Accounts, sync, and billing

Sign-in uses the Sociobot Microsoft Entra tenant. A saved firm workspace appears on another signed-in device. Repeated sync requests with the same operation ID apply once. Offline signed-in edits stay in the `parts-promise-cloud-v1` IndexedDB outbox. They retry after reconnect and back off after a temporary failure.

Owners can record invitations by work email. The invitation becomes active when that email signs in. Technicians count as $8 monthly seats; the owner does not. The Workshop base is $39 per month.

Billing acceptance is explicitly operator-gated. Until the recurring product is registered in the approved billing gateway, the billing screen returns HTTP 424 and never starts a charge. Existing cloud records and export remain available when a recorded plan is unpaid; new cloud writes stop.

## Run and verify

Requirements: Node.js 22+, npm 10+, and stable Rust.

```sh
npm ci
npm run dev
```

Run the complete local suite:

```sh
npm test
npm run check
npm run format:check
npm run build
npm run test:e2e -- --retries=0
```

`npm run build` writes the web app to `dist/` and builds the release server. Each visitor-facing claim and its clean-sandbox command is listed in [`.factory/claims.json`](.factory/claims.json).

## Data and API

Local and demo records use IndexedDB. **Export workspace** downloads a versioned JSON backup. **Import workspace** previews JSON or CSV and reports invalid rows before saving.

The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. It validates Entra issuer, audience, tenant, signature, and token time. Requests derive the firm from the signed-in user's stable Entra object ID. Read, write, account, and payment paths use a persisted rate-limit bucket and return a positive `Retry-After` header when exceeded. Export uses the five-request critical bucket.

All server state, including the tenant workspace, rate-limit buckets, and generated metrics credential, is stored in one SQLite file and token file under `/data`. The deployed app has one replica and a durable `/data` mount. On a developer machine with no `/data` mount, the server falls back to a `data` directory beside its executable so it can still start with only `PORT`.

## Deployment configuration

The multi-stage image runs as a non-root user and listens on `PORT` (default `8080`). Build identity comes from `BUILD_SHA`. Its deployment contract is [`deploy.json`](deploy.json): `/data` is the durable data directory and the replica count is one.

Optional overrides are `ENTRA_TENANT_ID`, `ENTRA_TENANT_SUBDOMAIN`, `ENTRA_CLIENT_ID`, `METRICS_TOKEN`, `DATA_DIR`, `SOCIOBOT_BILLING_BASE_URL`, and `SOCIOBOT_BILLING_ACCEPTANCE`. No override is required to start.

## Privacy and legal

The demo sends only same-origin GET requests and never asks for camera access. Account data is sent only to this product API and Microsoft during sign-in. See `/privacy` and `/terms` in the app.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
