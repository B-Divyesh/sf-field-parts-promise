# Landing copy audit

Audited: 2026-08-28. Route: `/`. Counts treat hyphenated terms and numbers as one word.

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation |
| Jobs | 1 | Pass: navigation |
| Privacy | 1 | Pass: navigation |
| Use dark theme | 3 | Pass: button result |
| Allocate parts to a job | 5 | Pass |
| Promise dates from parts held for the job | 8 | Pass |
| For solo tradespeople who need a parts check before agreeing a visit date. | 13 | Pass |
| Try it with sample data | 5 | Pass |
| Opens Riverside Dental with one missing pump. | 7 | Pass |
| The sample job and allocation work offline after your first visit. | 11 | Pass — `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass — `demo-reset-isolated` |
| Free for one browser in this release. | 8 | Pass — `free-browser-release` |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass |
| Sample job status | 3 | Pass |
| See why a visit date is at risk | 9 | Pass |
| RD-1042 needs one condensate pump. | 5 | Pass |
| The job stays at risk until a source holds it. | 10 | Pass — `promise-status-from-allocation` |
| Open the sample job | 4 | Pass |
| RD-1042 · Riverside Dental | 3 | Pass: sample label |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass |
| How it works | 3 | Pass |
| Check parts before agreeing a visit date | 8 | Pass |
| List required parts | 3 | Pass |
| Add each required part to the job. | 7 | Pass — `local-workspace-flow` |
| Allocate each part | 3 | Pass |
| Allocate it from a van or warehouse source. | 8 | Pass — `local-workspace-flow` |
| Review the visit date | 4 | Pass |
| Read the reason before you agree the visit date. | 9 | Pass — `local-workspace-flow` |
| What this first release does not do | 7 | Pass |
| It does not sync between people, scan barcodes, place supplier orders, or take payment. | 14 | Pass — `m1-feature-boundaries` |
| It keeps one local workspace and a separate demo. | 9 | Pass — `demo-reset-isolated` |
| Read how local data works | 5 | Pass |
| Promise job dates from parts held for the job. | 8 | Pass: product statement |
| Built by Param Factory | 4 | Pass |
| Browser-only release | 2 | Pass |

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
| Field worker | solo tradesperson |
