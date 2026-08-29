# Parts Promise

Parts Promise helps small trade firms promise job dates from parts held for each job. A solo user can work locally. A signed-in firm can share the same workspace across devices.

## Try it with sample data

Open `/?demo=1`, or <http://127.0.0.1:4173/?demo=1> during development. The sample opens Riverside Dental job `RD-1042` with one missing condensate pump.

Allocate the pump from Van 2. The status changes from **Date at risk** to **Parts in hand**. Van 2 then has no spare pumps, so the app suggests a reorder. It never places an order.

The demo uses the separate `parts-promise-demo-v1` browser database. It never signs in or contacts the account, sync, or billing API. **Reset demo** restores the sample. **Start for real** deletes demo changes and opens the unchanged local workspace.

## Accounts, sync, and billing

Sign-in uses the shared Sociobot Microsoft Entra tenant. Firm records use PostgreSQL in production and are separated by membership and row-level security. A saved firm workspace appears on another signed-in device. Repeated sync requests with the same operation ID apply once. Offline signed-in edits stay in the `parts-promise-cloud-v1` IndexedDB outbox. They retry after reconnect and back off after a temporary failure.

If two devices change the same revision, the app shows both record counts. Quantity differences cannot be overwritten from the stale device. The user can download that device revision before choosing the shared revision.

Owners can record invitations by work email. The invitation becomes active when that email signs in. Technicians count as $8 monthly seats; the owner does not. The Workshop base is $39 per month.

The recurring product is not registered in either Sociobot gateway yet. Production uses `api.sociobot.in`; browser tests explicitly use `pilot-api.sociobot.in`. The billing screen explains that no charge was made when registration is missing. It does not call Dodo directly or simulate payment. Existing cloud records and export remain available when a recorded plan is unpaid; new cloud writes stop.

## Run and verify

Requirements: Node.js 22+, npm 10+, and stable Rust.

```sh
npm ci
npm run dev
```

Run the complete local suite:

```sh
npm test
npm run test:e2e
npm run build
```

`npm run build` writes the web app to `dist/` and builds the release server. Each visitor-facing claim and its clean-sandbox command is listed in [`.factory/claims.json`](.factory/claims.json).

## Data and API

Local and demo records use IndexedDB. **Export workspace** downloads a versioned JSON backup. **Import workspace** previews JSON or CSV and reports invalid rows before saving.

The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. It validates Entra issuer, audience, tenant, signature, and token time. Requests derive the firm from the signed-in user's stable Entra object ID. Read, write, account, and payment paths have IP-based limits with positive `Retry-After` responses. Export uses the five-request critical bucket. Metrics report request latency/status, sync conflicts, queue age, and notification failures.

The signed-in data page exports the firm workspace, team, billing state, and audit events. Owners can schedule firm deletion with a 14-day recovery hold and cancel it during that hold.

Production obtains separate PostgreSQL runtime and migration URLs from the factory Key Vault through managed identity. A clean container with only `PORT` uses a local SQLite fallback, so it still starts without secrets. See [`server/migrations/README.md`](server/migrations/README.md) for the reversible schema.

## Deployment configuration

The multi-stage image runs as a non-root user and listens on `PORT` (default `8080`). Build identity comes from `BUILD_SHA`. The factory deploys the container to <https://field-parts-promise.sociobot.in>.

Optional overrides are `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `ENTRA_TENANT_ID`, `ENTRA_TENANT_SUBDOMAIN`, `ENTRA_CLIENT_ID`, `METRICS_TOKEN`, `DATA_DIR`, and `MANAGED_IDENTITY_CLIENT_ID`. No override is required to start.

## Privacy and legal

The demo sends only same-origin GET requests and never asks for camera access. Account data is sent only to this product API and Microsoft during sign-in. See `/privacy` and `/terms` in the app.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
