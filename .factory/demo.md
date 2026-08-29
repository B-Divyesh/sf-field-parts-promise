# Demo sandbox

Demo URL: `/?demo=1`

The bundled sample is Riverside Dental job `RD-1042`, with a visit date of 2026-09-02. It contains a warehouse-held 24V contactor, four return air filters split between Warehouse A and Van 2, and one missing condensate pump.

Allocate the pump from Van 2 to make the job **Parts in hand**. The calculation leaves Van 2 with 0 pumps against its minimum of 1 and shows a reorder suggestion. The suggestion never creates a supplier order.

The demo reads and writes `parts-promise-demo-v1` in IndexedDB. Its browser traffic uses same-origin GET requests and never asks for camera access. The live local workspace is `parts-promise-live-v1`.

- **Reset demo** writes the bundled fixture back into the demo database.
- **Start for real** confirms the boundary, deletes the demo database, and opens `/jobs` with live records unchanged.
- The wordmark and browser Back also delete the demo database before leaving. Re-entry starts from the bundled fixture.
- **Import workspace** and **Export workspace** operate only on the demo browser database while the banner is visible. They never read or write the live browser database.
- The service worker caches the shell and sample fixture on the first online visit. Reloading `/?demo=1` and allocating the pump works while offline.
