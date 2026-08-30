# Landing copy audit

Audited: 2026-08-29 for M2. Route: `/`. Counts treat hyphenated terms and prices as one word.

| Copy | Words | Result |
| --- | ---: | --- |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation |
| Jobs | 1 | Pass: navigation |
| Team | 1 | Pass: signed-in navigation |
| Privacy | 1 | Pass: navigation |
| Sign in | 2 | Pass: action |
| Allocate parts to a job | 5 | Pass: useful label |
| Promise dates from parts held for the job | 8 | Pass: job headline |
| For small trade firms that need a parts check before agreeing a visit date. | 14 | Pass: audience and change |
| Try it with sample data | 5 | Pass: primary action |
| Opens Riverside Dental with one missing pump. | 7 | Pass: `sample-fixture` |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| Workshop is $39/month plus $8 per active technician. | 8 | Pass: `technician-seat-charge` |
| Sample job status | 3 | Pass: section label |
| See why a visit date is at risk | 9 | Pass: section heading |
| RD-1042 needs one condensate pump. | 5 | Pass: `sample-fixture` |
| The job stays at risk until a source holds it. | 10 | Pass: `promise-status-from-allocation` |
| Open the sample job | 4 | Pass: action |
| RD-1042 · Riverside Dental | 3 | Pass: sample identity |
| Date at risk | 3 | Pass: status |
| Condensate pump needs 1 each. | 5 | Pass: sample shortage |
| How it works | 3 | Pass: section label |
| Check parts before agreeing a visit date | 8 | Pass: section heading |
| List required parts | 3 | Pass: step |
| Add each required part to the job. | 7 | Pass: `local-workspace-flow` |
| Allocate each part | 3 | Pass: step |
| Allocate it from a van or warehouse source. | 8 | Pass: `local-workspace-flow` |
| Review the visit date | 4 | Pass: step |
| Read the reason before you agree the visit date. | 9 | Pass: `local-workspace-flow` |
| What this release does not do | 7 | Pass: scope heading |
| It does not scan barcodes or place supplier orders. | 9 | Pass: `demo-feature-boundaries` |
| The sample stays separate from signed-in firm workspaces. | 8 | Pass: `demo-transfer-isolated` |
| Read how local data works | 5 | Pass: link |
| Firm plan | 2 | Pass: section label |
| Pay for the workshop and active technicians | 7 | Pass: pricing heading |
| Workshop costs $39 each month. | 5 | Pass: stated price |
| Each active technician costs $8 each month. | 7 | Pass: stated price |
| The owner does not use a technician seat. | 8 | Pass: `technician-seat-charge` |
| Sociobot and Dodo handle payment. | 5 | Pass: merchant information |
| Checkout stays off until a product operator verifies its recurring plan registration. | 12 | Pass: `subscription-checkout` |
| Set up your firm | 4 | Pass: action |

No sentence exceeds 22 words. None contains a banned term.

## M2 account copy checked separately

The onboarding, team, billing, sign-in, error, and sync text was checked with the same 22-word limit. Longer UI paragraphs are split into separate sentences. Errors state what happened and what to do. The checkout error says that no charge was made.

Repair-added account copy:

| Sentence | Words | Result |
| --- | ---: | --- |
| Export or delete firm data | 5 | Pass: data settings heading |
| Firm data export | 3 | Pass: export section heading |
| The JSON export includes the workspace, team, billing state, and audit events. | 12 | Pass: export scope |
| Export remains available if payment stops. | 7 | Pass: billing boundary |
| Export firm data | 3 | Pass: export action |
| Delete this firm | 3 | Pass: deletion heading |
| Scheduling starts a 14-day hold. | 5 | Pass: deletion hold |
| Type the firm name exactly before scheduling deletion. | 8 | Pass: confirmation instruction |
| Schedule firm deletion | 3 | Pass: destructive action |
| Cancel firm deletion | 3 | Pass: recovery action |
| Resolve the shared workspace conflict | 5 | Pass: conflict heading |
| Quantity evidence differs. | 3 | Pass: conflict reason |
| Parts Promise will not overwrite it. | 6 | Pass: safety outcome |
| Download this device's revision before using the shared revision. | 9 | Pass: conflict instruction |
| Download device revision | 3 | Pass: backup action |
| Use shared revision | 3 | Pass: resolution action |
| The product operator must verify its Dodo plan and factory record before a charge can start. | 15 | Pass: `subscription-checkout` |

No repair-added sentence exceeds 22 words or contains a banned term.

## Canonical terminology

| Concept | User-facing word |
| --- | --- |
| Customer workspace | firm workspace |
| Work record | job |
| Needed material | required part |
| Held quantity | allocation |
| Van or warehouse evidence | source |
| Supplier record | supplier order |
| Planned work day | visit date |
| Result of the check | promise status |
| Field worker | technician |
