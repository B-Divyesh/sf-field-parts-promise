# Parts Promise

Parts Promise helps small trade firms allocate required parts before promising a visit date. A solo user can work locally. A signed-in firm can share one workspace across devices.

## Try it with sample data

Open `/?demo=1`, or <http://127.0.0.1:4173/?demo=1> during development. The sample opens Riverside Dental job `RD-1042` with one missing condensate pump.

Allocate the pump from Van 2. The status changes from **Date at risk** to **Parts in hand**. Van 2 then has no spare pumps. The app suggests a reorder but never places one.

The demo uses a separate browser database. It never signs in or contacts the account, sync, or billing API. **Reset demo** restores the sample. **Start for real** deletes demo changes and opens the unchanged local workspace.

Use **Scan a part** to match a required part by barcode. Camera access begins only after **Use camera**. **Enter barcode instead** completes the same allocation without camera access. Camera frames stay on the device and are not sent.

## Accounts, sync, and billing

Sign-in uses the Sociobot Microsoft Entra tenant. A saved firm workspace appears on another signed-in device. Repeated sync requests with the same operation ID apply once.

Offline signed-in edits stay in a browser database outbox. They survive reload, retry after reconnect, and back off after a temporary failure.

Owners can record invitations by work email. The invitation becomes active when that email signs in. The firm plan costs $39 per month. Each active technician costs $8 per month. The owner is included in the base price without using a technician seat.

Checkout is not available yet. No charge will start. Existing cloud records and export remain available when a recorded plan is unpaid. New cloud writes stop.

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

`npm run build` writes the web app to `dist/` and builds the release server.

### Claim checks

See [`.factory/claims.json`](.factory/claims.json) for registered claim checks and their clean test commands.

## Data and API

Local and demo records use a browser database. **Export workspace** downloads a versioned JSON backup. **Import workspace** previews JSON or CSV and reports invalid rows before saving.

The Rust server exposes authenticated routes under `/api/v1`, `/health`, and protected `/metrics`. It validates Entra issuer, audience, tenant, signature, and token time. Requests derive the firm from the signed-in user's stable Entra object ID.

Limited API responses include a positive `Retry-After` header. Export allows five requests per minute, then tells the client how long to wait.

### Developer architecture note

The browser databases use IndexedDB. Local data uses `parts-promise-live-v1`. Demo data uses `parts-promise-demo-v1`. Offline shared edits use the `parts-promise-cloud-v1` outbox.

The deployment uses one replica and a durable `/data` directory. The server stores SQLite data and its generated metrics token there. Firm data remains available after a server restart.

## Deployment configuration

The multi-stage image runs as a non-root user and listens on `PORT`, which defaults to `8080`. Build identity comes from `BUILD_SHA`.

[`deploy.json`](deploy.json) sets `/data` as the durable data directory and sets one replica. The server starts without extra environment settings.

The factory deploys this container to <https://field-parts-promise.sociobot.in>.

## Privacy and legal

The normal demo flow sends only same-origin GET requests. It does not ask for camera access. Camera access requires the separate **Use camera** action.

Account data is sent only to this product API and Microsoft during sign-in. A user does not enter a password or payment-card number in Parts Promise.

See `/privacy` and `/terms` in the app.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
