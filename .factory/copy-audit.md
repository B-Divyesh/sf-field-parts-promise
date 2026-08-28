# M1 landing copy audit

Audited: 2026-08-28. Route: `/`. Counts treat hyphenated terms and numbers as one word.

| Copy | Words | Result |
| --- | ---: | --- |
| Parts allocation / revision 01 | 4 | Pass |
| Promise dates from parts held for the job | 8 | Pass |
| For trade firms that need a clear parts check before agreeing a visit date. | 14 | Pass |
| Try it with sample data | 5 | Pass |
| Opens Riverside Dental with one missing pump. | 7 | Pass |
| Works offline after your first visit. | 6 | Pass — `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass — `demo-reset-isolated` |
| No sign-in or checkout in this release. | 7 | Pass — `m1-feature-boundaries` |
| Every leader ends at the source that holds the part for the job. | 13 | Pass |
| Live sample / job datum | 4 | Pass |
| See what blocks a date | 6 | Pass |
| RD-1042 needs one condensate pump. | 5 | Pass |
| The job stays at risk until a source holds it. | 10 | Pass — `promise-status-from-allocation` |
| Open the sample job | 4 | Pass |
| Date at risk | 3 | Pass |
| Condensate pump needs 1 each. | 5 | Pass |
| Three drawing marks | 3 | Pass |
| Check the parts before the promise | 7 | Pass |
| Add each required part to the job. | 7 | Pass — `local-workspace-flow` |
| Allocate it from a van or warehouse source. | 8 | Pass — `local-workspace-flow` |
| Read the reason before you agree the visit date. | 9 | Pass — `local-workspace-flow` |
| What this first release does not do | 7 | Pass |
| It does not sync between people, scan barcodes, place supplier orders, or take payment. | 14 | Pass — `m1-feature-boundaries` |
| It keeps one local workspace and a separate demo. | 9 | Pass — `m1-feature-boundaries`, `demo-reset-isolated` |
| Read how local data works | 5 | Pass |
| Promise job dates from parts held for the job. | 8 | Pass — `promise-status-from-allocation` |
| Revision M1 / local-first | 3 | Pass |

No sentence exceeds 22 words. The audit found none of the banned terms: leverage, seamless, effortless, robust, powerful, intuitive, reimagine, supercharge, unlock, delightful, journey, ecosystem, or “AI-powered.”

## Canonical terminology

| Concept | User-facing word |
| --- | --- |
| Work record | job |
| Needed material | required part |
| Held quantity | allocation |
| Van or warehouse evidence | source |
| Supplier record | supplier order |
| Planned work day | visit date |
| Result of the check | promise status |
| Field worker | technician |
