# Parts Promise M3 handoff

Date: 2026-09-06 UTC  
Work order: `field-parts-promise-m3-build-1`  
Implementation candidate and deployed SHA: `b6a9c49dd239911807b4f7bcd22f63106244d3f3`  
Live URL: <https://field-parts-promise.sociobot.in>

## Scope completed

M3 only: field barcode entry and camera opt-in, supplier-date evidence, held
quantity move/fit actions, draft-only reorder decisions, offline operation
batches, and safe quantity-conflict handling.

- Added `/scan`, `/suppliers`, `/supplier-orders/:orderId`, and `/conflicts`.
- A barcode now finds a required part in the selected local job. Camera access
  starts only when a person chooses it; manual barcode entry remains available.
  Camera frames are not saved or sent.
- Supplier records hold a reference, expected date, confidence, and check time.
  Dates after the visit buffer show **Date at risk**; evidence older than 72
  hours shows **Needs a check**. These are evidence warnings, never availability
  guarantees.
- Added a supplier-order view, source-safe move and fitted actions, and a
  reorder dismissal/draft record. Drafts do not contact a supplier or place an
  order.
- Signed-in offline edits now carry ordered operation records and a cursor.
  They batch once after reconnect. A later conflicting allocation preserves the
  shared revision and opens a safe conflict choice rather than silently
  overwriting quantity evidence.
- The M3 routes have their own titles and direct-server document handling.
  Sitemap, README, demo instructions, copy audit, claims, and plan status now
  describe the shipped milestone.

## Verification

Clean setup began with `npm ci`. All 44 exact commands in
`.factory/claims.json` passed separately with their published command lines.
The full browser run passed **68 checks** with **50 intentional project skips**
(desktop-only claim probes and duplicate project coverage). Unit and API suites
passed 27 Vitest and 15 Rust tests.

Also passed:

```sh
npm test
npm run check
npm run format:check
cargo clippy --manifest-path server/Cargo.toml --all-targets -- -D warnings
npm audit --audit-level=high
npm run build
npm run test:e2e -- --retries=0 --reporter=list
```

`npm run build` produced `dist/`; its initial route JavaScript is 3.02 kB gzip,
the initial CSS is 2.37 kB gzip, and the deferred CIAM bundle is 62.19 kB gzip.

The production server was checked locally with `/opt/fleet/lib/verify-url.sh`.
The published Axe CLI could not find a system Chrome in this worker, so the
repository's Playwright/axe-core browser integration was run instead. It found
zero WCAG 2A/2AA violations on `/`, `/demo`, `/jobs`, `/scan`, `/suppliers`,
`/conflicts`, `/privacy`, `/terms`, and the 404 page.

## Deployment and live evidence

Deployed with the existing durable configuration:

```sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh field-parts-promise /work/repo Dockerfile 8080
```

The build image was immutable digest
`sha256:e26b9c29598ecbe9aa358fddb78bd2c11a934b2cdbf4809d605e91f34e4902d7`.
The deployment preserved `sf-field-parts-promise-data` at `/data` and one
replica. HTTPS cold verification returned 200 and `/health` returned the
implementation SHA above with SQLite and auth ready.

Fresh 1440×900 desktop and 390×844 phone sessions both showed, before
scrolling:

- Job: promise visit dates from parts held for the job.
- Audience: small trade firms that need a parts check before agreeing a visit
  date.
- First action: **Try it with sample data**.

Both sessions opened the Riverside Dental `RD-1042` sample with its missing
condensate pump and persistent demo label. Desktop allocated the pump to reach
**Parts in hand**, reset to **Date at risk**, and confirmed no live or cloud
browser database was created. The fresh demo scan matched `CP-19` to the local
condensate pump. A live supplier record showed its one unit held for the job in
`/supplier-orders/:orderId`; `/conflicts` rendered its empty state.

Live `verify-url.sh` reported no console errors, one H1, a main landmark,
`lang=en`, a descriptive title, and no images missing alt text. The live
Playwright/axe-core route matrix had zero WCAG 2A/2AA violations. The designed
unknown route returned HTTP 404. Six unauthenticated live requests to the
critical export endpoint returned five 401s followed by HTTP 429 with
`Retry-After: 60`, proving the live allowance before authentication.

M3 browser requests in the demo flow were same-origin GET/HEAD only. Unit and
browser tests cover tenant isolation, SQLite restart persistence, PORT-only
startup, offline recovery, and the two-device quantity conflict.

Evidence lives in `/work/.evidence/m3-local/` and `/work/.evidence/m3-live/`.

## External dependencies and known gaps

- Recurring billing registration remains an operator dependency. The public
  Firm plan is $39/month plus $8/month per active technician, but checkout is
  visibly unavailable and starts no charge. No direct Dodo or other payment
  integration was added. Public registration metadata is at
  `/work/.evidence/billing-offer.json`.
- Supplier integrations are intentionally not connected. M3 records supplier
  evidence and draft order lines only; it does not place an order or promise
  availability.
- Browser camera scanning depends on browser permission and `BarcodeDetector`;
  manual entry is the supported fallback.

## Next milestone

M4 remains plan-bound operations work: export/reporting, notification controls,
and recovery/operational evidence. Do not make supplier purchase, availability,
or recurring-entitlement claims until their external dependencies are verified.
