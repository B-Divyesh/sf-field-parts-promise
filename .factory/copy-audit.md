# Copy audit

Audited: 2026-09-01 for perfection-loop round 5. Counts split on whitespace. Hyphenated terms, prices, and build values count as one word.

## Landing page

Every visible landing-page sentence, heading, label, action, and image alternative is included below.

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass: destination-naming action |
| Parts Promise | 2 | Pass: product name |
| Demo | 1 | Pass: navigation destination |
| Jobs | 1 | Pass: navigation destination |
| Privacy | 1 | Pass: navigation destination |
| Sign in | 2 | Pass: action |
| Use dark theme | 3 | Pass: action |
| Allocate parts to a job | 5 | Pass: task label |
| Promise dates from parts held for the job | 8 | Pass: job-first H1 |
| For small trade firms that need a parts check before agreeing a visit date. | 14 | Pass: audience and result |
| Try it with sample data | 5 | Pass: primary action |
| Opens Riverside Dental with one missing pump. | 7 | Pass: exact action result |
| The sample job and allocation work offline after your first visit. | 11 | Pass: `offline-reload` |
| Sample changes stay in this browser. | 6 | Pass: `demo-reset-isolated` |
| The firm plan is $39/month plus $8 per active technician. | 10 | Pass: `technician-seat-charge` |
| A service drawing connects a job plate to warehouse, van, and supplier evidence. | 13 | Pass: useful image alternative |
| Each required part shows the van, warehouse, or supplier record that covers it. | 13 | Pass: useful caption |
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
| List required parts | 3 | Pass: step heading |
| Add each required part to the job. | 7 | Pass: instruction |
| Allocate each part | 3 | Pass: step heading |
| Allocate it from a van or warehouse source. | 8 | Pass: instruction |
| Review the visit date | 4 | Pass: step heading |
| Read the reason before you agree the visit date. | 9 | Pass: instruction |
| What this release does not do | 7 | Pass: scope heading |
| It does not place supplier orders. | 6 | Pass: `release-order-boundary` |
| The sample stays separate from signed-in firm workspaces. | 8 | Pass: `demo-transfer-isolated` |
| Read how local data works | 5 | Pass: action |
| Firm plan | 2 | Pass: section label |
| Pay for the firm plan and active technicians | 8 | Pass: pricing heading |
| The firm plan costs $39 each month. | 7 | Pass: `technician-seat-charge` |
| Each active technician costs $8 each month. | 7 | Pass: `technician-seat-charge` |
| The owner is included in the $39 base price and does not use a technician seat. | 15 | Pass: `technician-seat-charge` |
| Checkout is not available yet. | 6 | Pass: `subscription-checkout` |
| No charge will start. | 4 | Pass: `subscription-checkout` |
| Set up your firm | 4 | Pass: action |
| Promise job dates from parts held for the job. | 9 | Pass: footer description |
| Terms | 1 | Pass: legal destination |
| Built by Param Factory (external site) | 6 | Pass: destination disclosed |
| Build [short source revision] | 2 | Pass: `visible-build-identity` |

No landing sentence exceeds 22 words. No landing copy contains a banned word.

## Review-5 copy checks

- Reader-facing storage copy uses **browser database**. Exact IndexedDB names appear only under README’s **Developer architecture note**.
- **Firm plan** replaces the unexplained Workshop label.
- The page title, buttons, and workflow use **allocate** for the action.
- Checkout copy says only what this release proves: it is unavailable and no charge starts.
- Public copy makes no payment-provider, merchant, or refund claim.
- The privacy page describes the tested behavior: users do not enter passwords or card numbers in Parts Promise.
- The barcode flow names both explicit actions: **Use camera** and **Enter barcode instead**.
- The footer exposes the build and labels the Param Factory destination as external.

An automated README sentence scan found no sentence above 22 words. A source scan found no banned plain-words term in the README, landing copy, demo guide, or catalog description.

## Canonical terminology

| Concept | Reader-facing term |
| --- | --- |
| Customer workspace | firm workspace |
| Browser persistence | browser database |
| Work record | job |
| Needed material | required part |
| Assigned quantity | allocation |
| Van or warehouse evidence | source |
| Supplier record | supplier evidence |
| Planned work day | visit date |
| Result of the check | promise status |
| Field worker | technician |
| Paid offer | firm plan |

The implementation terms **IndexedDB**, database names, route names, and HTTP status values remain confined to developer notes and tests.
