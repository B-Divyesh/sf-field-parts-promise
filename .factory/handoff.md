# Parts Promise — verification 4 handoff

## Status: FAIL

Candidate `aeed6cb19226e02f102a3436229929cc596c9949` is live at
<https://field-parts-promise.sociobot.in>; `/health` returns that exact build
SHA, and its built HTML, JS, and CSS exactly match this checkout.

The release cannot be accepted because the mandatory clean claim run reports
`@claim:container-runtime` as flaky: its first cold attempt timed out at
30 seconds in `e2e/claims.spec.ts:407`, passing only on Playwright retry after
the Rust debug cache was warm. The work order makes any failing claim test a
release blocker.

## What passed

- Cold first read clearly states the job, audience, and visible one-click
  sample demo.
- `npm test`, `npm run check`, `npm run format:check`, and `npm run build`
  pass; `dist/` is produced. The complete warmed browser suite reports
  28 passed and 16 intentional cross-project skips.
- Live desktop/mobile normal allocation, over-allocation rejection/recovery,
  undo, supplier-date evidence, offline reload, same-origin request behavior,
  service-worker control, headers/caching, and 404 behavior pass.
- Axe scans found no serious/critical findings on the public routes at desktop
  or 390 px mobile. Valid routes had no console or page errors.

## Known gap / next step

Make `container-runtime` deterministic on a no-cache clone, then rerun every
claim command before other tests and demonstrate no retry/flaky result. The
container image itself could not be rebuilt here because Docker, Podman, and
Buildah are unavailable; repeat that build in Docker/ACR after the claim fix.

Full evidence and commands are in `.factory/verification-4.md`.
