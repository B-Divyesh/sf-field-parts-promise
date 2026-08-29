# Parts Promise

Parts Promise helps a solo tradesperson check whether a required part is held before agreeing a visit date. This browser-only release keeps jobs in one browser.

## Try the sample job

Open `/?demo=1` (for example, <http://127.0.0.1:4173/?demo=1> while developing). Riverside Dental job `RD-1042` opens with one missing condensate pump.

Allocate the pump from Van 2 to change the job from **Date at risk** to **Parts in hand**. The app suggests a reorder when Van 2 reaches zero pumps. It never places an order.

The sample uses a separate browser database named `parts-promise-demo-v1`. **Reset demo** restores the bundled sample. **Start for real** discards sample changes and reopens the unchanged `parts-promise-live-v1` workspace.

Leaving through the wordmark or browser Back also deletes the demo workspace. Reopening the demo always starts with the bundled sample.

The sample job and allocation flow work offline after the first visit. This browser-only release is free. It has no sign-in, team sync, barcode scan, supplier-order action, or checkout.

## Run and verify

Requirements: Node.js 22+, npm 10+, and stable Rust.

```sh
npm ci
npm run dev
```

Run the complete local suite before shipping:

```sh
npm test
npm run test:e2e
npm run build
```

`npm run build` writes `dist/`.

## Import, backup, and privacy

**Import workspace** previews CSV jobs, required parts, and sources. It reports each invalid row before saving. Download the CSV template from the import sheet.

**Export workspace** downloads a versioned JSON backup with every job, required part, source, allocation, and timestamp. Import that JSON file to restore the workspace after a preview. Imports and exports use only the browser database for the current mode.

The demo makes only same-origin GET requests and never asks for camera access. Browser site-data controls remove local records.

## Deployment

The Rust server starts with `PORT` only, defaults to `8080`, and serves `/health`. Unknown paths return HTTP 404 with a designed recovery page.

The factory deploys the product to <https://field-parts-promise.sociobot.in>.

## Claim tests

Every visitor-facing claim has one sandbox test. Run the commands recorded in [.factory/claims.json](.factory/claims.json) after `npm ci`.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).
