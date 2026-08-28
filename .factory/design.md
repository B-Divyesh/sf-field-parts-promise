# Parts Promise visual thesis

## Direction: exploded-parts blueprint

Parts Promise should look like the moment a service drawing becomes operational: a job is the datum plate, required parts float in an exploded arrangement, and thin leader lines make each part's source visible. The image explains the product's central distinction—stock is not enough; a quantity must line up with a job.

This is not a nostalgic blueprint skin and not a generic navy dashboard. Ruled coordinates, crop marks, revision stamps, leader lines, and safety-orange annotations appear only where they communicate ownership, evidence, version, or risk. Task content remains quiet and legible. The composition is asymmetric, with dense technical detail gathered around a broad clear working area.

The look fits electricians, HVAC technicians, and repair firms because it borrows the grammar of wiring diagrams, exploded service manuals, tagged parts bins, and high-visibility field marks. It avoids pretending to be a full ERP.

## Stack and rendering decision

Use Svelte 5 + Vite + strict TypeScript because this is a reactive local-first PWA, not a content site or an ecosystem-heavy dashboard. Use semantic HTML and CSS for controls. Use hand-authored SVG only for the hero assembly, empty-state fragments, status marks, favicon, and social image. Do not ship canvas/WebGL, a component framework, Tailwind, remote fonts, or a runtime image service.

The SVG scene is subordinate to the product UI: on a 390 px phone it occupies a reserved 4:3 frame below/alongside the plain headline and never places required text over busy lines. The live job preview, not decorative art, demonstrates the product.

## Palette

The light theme is **drawing table daylight**: warm drawing paper, ink navy, blueprint blue, and one safety-orange action mark. The dark theme is **night service bay**: deep blue-black, chalk-white text, cyan drawing lines, and amber action marks. There are no gradients.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#F3F0E7` | `#071824` | Page field. |
| `--color-surface` | `#FFFDF8` | `#0D2635` | Working sheet/surface. |
| `--color-surface-raised` | `#FFFFFF` | `#143346` | Sheets/dialogs only. |
| `--color-text` | `#132633` | `#F7F2E8` | Primary ink. |
| `--color-text-muted` | `#526470` | `#B9CBD4` | Supporting text; never smaller than 14 px. |
| `--color-line` | `#AAB8BF` | `#496779` | Rules and outlines. |
| `--color-blueprint` | `#075A78` | `#68D2E8` | Links, evidence, diagram leaders. |
| `--color-accent` | `#A83A08` | `#FFB45F` | Primary actions and active registration mark. |
| `--color-accent-contrast` | `#FFFFFF` | `#071824` | Text on accent. |
| `--color-success` | `#17623A` | `#78D69C` | Parts in hand, always with check/label. |
| `--color-warning` | `#874B00` | `#FFD06A` | Expected/stale, always with clock/label. |
| `--color-danger` | `#A82722` | `#FF928A` | At risk/conflict, always with break/label. |
| `--color-focus` | `#6B35C3` | `#D7B7FF` | Focus ring, intentionally distinct from status. |

Text and control combinations must be checked with automated contrast tests in both themes. Normal text is ≥4.5:1; large text, focus, and control boundaries are ≥3:1. Never use blueprint cyan as small text on the light background without verifying the exact pair.

## Typography

- **Display and labels:** Barlow Condensed variable, weights 600–700, OFL 1.1, self-hosted as a WOFF2 Latin subset. Its narrow engineered forms suit job numbers and drawing titles. Do not set body copy in it.
- **Body and controls:** Atkinson Hyperlegible Next variable, weights 400–700, OFL 1.1, self-hosted as one WOFF2 Latin subset. Its differentiated characters help in field conditions and for part numbers.
- Fallbacks are `"Arial Narrow", "Roboto Condensed", sans-serif` for display and `system-ui, -apple-system, "Segoe UI", sans-serif` for body. The planning skeleton uses fallbacks until M1 adds reviewed font files and license copies. Maximum two font files and 120 KB total; `font-display: swap`; preload only these two.

Type scale uses fluid sizes but lands on these steps: caption/technical label 14/18, body 16/24, strong body 18/26, section title 24/29, page title 36/38 on phone and 56/56 on wide screens, display 72/68 only where the landing composition has room. Use uppercase only for short technical labels with `0.08em` tracking. Job numbers, quantities, dates, and tabular lists use tabular figures. Long copy is 45–70 characters wide.

## Spacing, grid, and shape

Base unit is 4 px; the working rhythm is 8 px. Tokens: `1=4`, `2=8`, `3=12`, `4=16`, `5=24`, `6=32`, `7=48`, `8=64`, `9=96`. Phone gutters are 16 px, tablet 24 px, wide 32 px. Task content caps at 1200 px.

Corners express object type, not fashion:

- `2px` for blueprint plates, table rows, tags, and input fields.
- `6px` for interactive sheets and independent working surfaces.
- `999px` only for small status chips/counters, never whole cards or buttons.

Use 1 px rules for structure, 2 px for current selection, and a 3 px focus ring with 2 px offset. Shadows are rare: `0 12px 30px rgb(7 24 36 / 0.16)` only for sheets/dialogs that physically sit above work. Prefer proximity and a paper-tone step to nested cards.

At 390 px, required-part rows are full width and sources stack below their leader. At 720 px, the leader runs horizontally into a second column. At ≥1100 px, the job card may hold a 7/5 column task/evidence split. The phone drops decorative coordinate labels and nonessential hero fragments; it does not shrink them into noise.

## Icon and illustration grammar

Icons are 20 or 24 px, 1.75 px square-ended strokes with a small registration notch. Universal icons may stand alone only with an accessible name; product/status icons also show text. “Parts in hand” is a closed registration target, “Expected” a target plus clock tick, “At risk” a broken leader, and “Needs a check” an open target plus question mark.

The hero contains a simplified contactor, filter, pump, van drawer, warehouse bin, and supplier-order slip arranged around one job datum. It must contain no embedded user-readable text; HTML supplies all required labels. The 404 uses one detached part whose leader ends outside the drawing, with a plain return action.

## Interaction grammar

- Selecting a required part illuminates only its leader and source; unrelated lines recede.
- Allocation happens in context: the row separates by 8 px as its source sheet rises from the row's edge.
- A status change registers like two drawing marks aligning. The text changes immediately and an `aria-live` message explains why.
- Edit affordances use explicit verbs: **Allocate part**, **Check supplier date**, **Move quantity**, **Mark fitted**, **Undo allocation**.
- Destructive actions name the record and either provide Undo or a specific confirmation. There is no generic “OK.”
- Links are underlined or have a persistent leader-line affordance. Buttons remain filled/outlined controls; the two are never styled identically.

## Motion policy

Motion communicates assembly and revision, never ambient activity.

- Row/source expansion: 180 ms, ease-out, transform/opacity only, originating at the selected leader.
- Status registration: 220 ms; two marks translate no more than 8 px into alignment, then stop.
- Route content: 160 ms opacity with at most 6 px vertical movement. No scrolling parallax in the task app.
- Loading uses a static hatched placeholder with an updating text label, not an endless spinner. A progress indicator may animate only while measurable work runs.
- Under `prefers-reduced-motion: reduce`, remove translations and transitions; state and live text update instantly. Nothing flashes, pulses indefinitely, or exceeds three flashes per second.

## States

- **Empty:** a single disconnected leader line, a sentence saying what belongs here, and one next-step verb. No celebratory illustration.
- **Loading:** reserve final geometry; use low-contrast hatching plus “Loading jobs…” in a live region. Do not imply progress that cannot be measured.
- **Error:** state what failed and one recovery action. Preserve entered work. Technical IDs sit behind a disclosure/copy action.
- **Offline:** a persistent slim plate says “Offline — changes are kept on this device” and shows queued count. It is informational, not danger red.
- **Stale:** timestamp and “Needs a check” sit beside the evidence. Never hide staleness in a tooltip.
- **Conflict:** show both revisions, the actual shortage/change, and only valid resolutions. Use danger color plus the broken-leader icon and text.
- **Success:** update in place and offer Undo when safe. Avoid toast-only confirmation; the source/quantity remains visible in the row.

## Accessibility and field conditions

Body text is at least 16 px. Targets are at least 44×44 px with 8 px between adjacent controls. The primary flow works with keyboard and switch input; source lists use native radios/list semantics, quantity uses a labelled number input plus buttons, and dialogs/sheets trap and restore focus correctly. Status never relies on color. At 200% text zoom, controls reflow without covering the promise status. High sunlight is served by the light theme's ink contrast; dark mode is explicit, not browser inversion.

Camera access starts only after **Scan barcode** and includes **Enter barcode instead** on the same screen. Camera frames are never stored or uploaded. Reduced motion, theme choice, and text zoom are not paid features.

## Asset provenance

No visual asset was generated or copied during planning. M1 creates the hero, status marks, 404 fragment, SVG favicon, touch icon, and 1200×630 Open Graph image as original hand-authored vector geometry in this repository, derived from generic geometric depictions of service parts rather than a manufacturer's drawing. Those assets are released under the repository MIT license. Record creator, date, source file, exports, and any reference material in this section when added.

Font provenance to record in M1: exact upstream release URLs/checksums and included OFL licenses for Barlow Condensed and Atkinson Hyperlegible Next. No Google Fonts CSS or other CDN is allowed.

