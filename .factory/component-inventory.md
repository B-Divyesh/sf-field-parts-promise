# Component inventory

The Svelte implementation should expose these components from `src/lib/components`. This is a bounded inventory, not a request to implement all components in M1. Extend variants before adding a duplicate.

| Component | Milestone | Purpose and variants | Required states / accessibility |
| --- | --- | --- | --- |
| `AppFrame` | M1 | Standard skip link, site/app header, main, route announcer, footer; `marketing`, `task` variants. | Safe-area support; route changes focus H1; exactly one H1 supplied by page. |
| `SiteHeader` | M1 | Wordmark link and at most four navigation links; signed-out/signed-in variants. | Native links; visible current page and keyboard focus; collapses without a trap. |
| `SiteFooter` | M1 | One-line product purpose, Privacy, Terms, Factory, build/version. | Links crawl to 200 routes; generated-art disclosure when assets exist. |
| `DemoBanner` | M1 | Persistent sample-data boundary with `Reset demo` and `Start for real`. | Visible at all demo routes; reset confirmation names what resets; live completion. |
| `BlueprintHero` | M1 | Original responsive exploded-parts scene and live compact product preview. | Reserved dimensions; meaningful scene alt or described by adjacent text; decorative lines hidden. |
| `ActionButton` | M1 | `primary`, `secondary`, `quiet`, `danger`; optional working state. | Native button, ≥44 px, disabled reason visible, working label, never icon-only unless universally understood and named. |
| `FieldControl` | M1 | Label, hint, input/select/textarea, unit suffix, validation. | Programmatic label, described errors, no placeholder label, invalid focus summary. |
| `StatusPlate` | M1 | `in-hand`, `expected`, `at-risk`, `check`; compact/full. | Word + unique icon + color; reason and checked time; status updates announced. |
| `JobRow` | M1 | Job number/site/date/blocker for promise board. | Empty/loading/error/stale variants; whole row is not a nested-interactive click trap. |
| `RequiredPartRow` | M1 | Required/covered quantity, unit, source leaders; collapsed/expanded. | Keyboard disclosure; unit always spoken; shortage not color-only. |
| `AllocationSheet` | M1 | Choose source and quantity, review, confirm; on-hand/supplier variants. | Modal focus lifecycle on phone; nonmodal inline desktop; names job/part/source/quantity before save. |
| `SourceOption` | M1 | Van, warehouse, supplier-order evidence with remaining quantity/check time. | Native radio/list semantics; unavailable reason; stale evidence visible. |
| `ReorderSuggestion` | M1 | Deterministic below-minimum explanation; review/dismiss/create-draft variants. | Never orders automatically; dismissal is undoable or specifically confirmed. |
| `SyncStatus` | M1/M2 | Offline, queued count, syncing, synced, failed. | Text plus symbol; polite announcements; retry does not clear outbox. |
| `BarcodeCapture` | M3 | Camera scanner with manual entry fallback. | Permission requested on action; denied/unsupported/error states; no image retention; close restores focus. |
| `SupplierEvidence` | M1/M3 | Order reference, ETA, confidence, checked by/time, stale marker. | Dates include locale and unambiguous machine value; confidence is text, not score/color alone. |
| `ConflictResolver` | M3 | Device/server revisions and valid resolution actions for field/quantity/delete conflicts. | Heading announces conflict; focus enters summary; no invalid “keep both”; preserves unresolved state on close. |
| `ToastRegion` | M1 | Brief noncritical feedback and Undo; info/success/error. | `aria-live` politeness matches severity; timeout pauses on hover/focus; critical errors also appear inline. |
| `ConfirmDialog` | M1 | Specific destructive or boundary confirmation. | Native/inert background behavior, initial non-destructive focus, Escape, focus restoration, named consequence. |
| `EmptyState` | M1 | Disconnected-leader fragment, plain explanation, one next action. | Image decorative when text repeats meaning; no dead end; no fabricated data. |

