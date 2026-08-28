# Parts Promise — polish round 1 handoff

## Delivered

Repair commit `fdb846d45bf971c1e842ba08c007338af5240012` closes every finding in `.factory/review-1.md` and the earlier verification reports. It narrows this browser-local release to its honest solo-operator scope, makes the demo exit message and behavior preserve existing live records, fixes route-heading focus, gives every route a single correct metadata set, adds `/demo` to the sitemap, states the current free offer, and rewrites the flagged public copy and 404 page in plain language.

`.factory/claims.json` now has 12 observable claims, including the free browser-only release. The demo-isolation test now creates a live record before entering demo and proves it survives leaving demo. The browser suite adds route metadata and desktop/mobile forward/back focus assertions.

## Verification

- Clean clone: `/tmp/parts-promise-clean-yBSLdW`; `npm ci`, `npm test`, every exact command in `.factory/claims.json`, `npm run build`, and `npm run test:e2e` completed successfully. The full browser result was `passed` with no failed tests.
- Local source: `npm run check` passed with 0 errors/warnings; `npm run format:check` passed; `npm test` passed (9 Vitest and 3 Rust tests); `npm run build` passed and produced `dist/`.
- Browser suite: 44 configured Playwright cases passed across desktop and mobile profiles (desktop-only claim evidence is intentionally skipped on the second profile).
- Live deployment: container image `sociobotregistry.azurecr.io/sf-field-parts-promise:fdb846d45bf9`; `https://field-parts-promise.sociobot.in/health` returned `{"status":"ok","build_sha":"fdb846d45bf971c1e842ba08c007338af5240012"}`.
- Live cold check: `/opt/fleet/lib/verify-url.sh` passed. `.factory/evidence/polish-1/verify.json` records title, `lang=en`, one H1, main landmark, image alt coverage, no unlabeled buttons, and no console errors. It saved desktop and 390 px mobile screenshots beside the report.
- Live axe check: `/`, `/?demo=1`, `/demo`, `/jobs?demo=1`, `/privacy`, `/terms`, and the designed unknown route had zero serious/critical findings. Valid routes had no console errors and no mobile horizontal overflow.
- Live functional check: a cold sample allocation changed `Date at risk` to `Parts in hand`; an existing live job survived demo exit; navigation to Privacy focused the page H1; route metadata selectors each had exactly one node. The unknown route returned HTTP 404. Fingerprinted JS returned `Cache-Control: public, max-age=31536000, immutable`.

## Run locally

```sh
npm ci
npm test
npm run test:e2e
npm run build
```

Use `npm run dev` for development. The demo entry point is `/?demo=1`; `/demo` is its canonical public URL.

## Known gaps and next steps

There are no unresolved review findings for this polish round. This release intentionally remains local to one browser; firm workspaces, sign-in, sync/conflict resolution, barcode scanning, supplier ordering, and paid team plans remain future product work rather than supported behavior.
