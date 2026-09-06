# Demo sandbox

Demo URL: `/?demo=1`

The bundled sample is Riverside Dental job `RD-1042`, with a visit date of 2026-09-02. It contains a warehouse-held 24V contactor, four return air filters split between Warehouse A and Van 2, and one missing condensate pump.

Allocate the pump from Van 2 to make the job **Parts in hand**. The calculation leaves Van 2 with 0 pumps against its minimum of 1 and shows a reorder suggestion. The suggestion never creates a supplier order.

The demo uses a separate browser database. Its normal allocation and reset flow uses same-origin GET requests and does not ask for camera access.

Jobs, Privacy, and Terms links keep `demo=1` in their rendered URLs. Opening any of them in a new tab keeps the demo banner and does not create the live or cloud browser database.

**Scan a part** opens the barcode sheet. Camera access starts only after **Use camera**. **Enter barcode instead** accepts `CP-19`, finds the condensate pump, and continues to the same allocation sheet. Camera frames are not saved or sent.

The `/scan?demo=1` route lets you choose the sample job before entering its barcode. The sample barcode `CP-19` finds the condensate pump stored in that job.

Attach supplier evidence to the missing pump to see the expected-date status. A date after the visit date keeps the job **Date at risk**. Evidence older than 72 hours **Needs a check**. These are warnings, not arrival guarantees.

Allocate the pump, then use **Move quantity** to select a matching source. Use **Mark fitted** after the quantity is on the job. The sample can record a draft order line or a dismissal reason. It never contacts a supplier or places an order.

M2 account code does not run in demo mode. The demo does not open Microsoft sign-in, call `/api/v1`, check billing, or copy records into a firm.

Switching modes clears notices, open forms, draft values, conflicts, and other workspace-derived interface state before the other workspace renders. In-flight live sync responses cannot replace demo data.

Signed-in work batches offline changes on this device. Reconnecting applies that batch once. If two devices use the same last quantity, the later device gets a safe conflict and cannot overwrite the shared quantity.

- **Reset demo** writes the bundled fixture back into the demo database.
- **Start for real** confirms the boundary, deletes the demo database, and opens `/jobs` with live records unchanged.
- The wordmark and browser Back also delete the demo database before leaving. Re-entry starts from the bundled fixture.
- **Import workspace** and **Export workspace** operate only on the demo browser database while the banner is visible. They never read or write the live browser database.
- The service worker caches the shell and sample fixture on the first online visit. Reloading `/?demo=1` and allocating the pump works while offline.
