# Polish round 1 — finding closure

Candidate reviewed: `3ed9c6a37148e55d87735f30e9cffb61cfb9125d`  
Repair commit: `fdb846d45bf971c1e842ba08c007338af5240012`  
Live URL: <https://field-parts-promise.sociobot.in>

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Navigation and `popstate` now await workspace loading, render, then focus `main h1`. | `forward and browser-history route changes focus the new heading`; mobile deep-link/history test; live focus check returned `focused: true`. |
| F-1-2 | Public first-screen and README audience now name a solo tradesperson using one browser. | Cold live landing screenshot: `.factory/evidence/polish-1/screenshot-mobile.png`; README review. |
| F-1-3 | Offline copy is limited to the sample job/allocation; the unsupported legal-route assertion was removed. | `@claim:offline-reload`; all claim commands from clean clone. |
| F-1-4 | Demo exit now says live records reopen unchanged; its claim test creates and preserves an existing live job. | `@claim:demo-reset-isolated`; live `LIVE-CHECK` browser check preserved the record. |
| F-1-5 | Metadata nodes have one static owner and are updated in place for title, description, canonical, OG, and Twitter values. | `each route owns one correct metadata set`; live check returned count `1` for every checked metadata selector. |
| F-1-6 | `/demo` always uses Demo metadata and `/demo` is in `sitemap.xml`. | Metadata test; live `/demo` title `Demo — Parts Promise` and canonical `/demo`. |
| F-1-7 | The first-screen fact now states “Free for one browser in this release.” | `@claim:free-browser-release`; live mobile screenshot. |
| F-1-8 | Replaced the decorative revision label with “Allocate parts to a job.” | Copy audit and live screenshot. |
| F-1-9 | Rewrote the hero caption in task language. | `.factory/copy-audit.md`; live screenshot. |
| F-1-10 | Renamed the preview label to “Sample job status.” | Copy audit; live screenshot. |
| F-1-11 | Renamed the preview heading to identify the visit date. | Copy audit; live screenshot. |
| F-1-12 | Renamed the steps section “How it works.” | Copy audit; live screenshot. |
| F-1-13 | Rewrote the steps heading as “Check parts before agreeing a visit date.” | Copy audit; live screenshot. |
| F-1-14 | Renamed the first step “List required parts.” | Copy audit; live screenshot. |
| F-1-15 | Renamed the second step “Allocate each part.” | Copy audit; live screenshot. |
| F-1-16 | Renamed the third step “Review the visit date.” | Copy audit; live screenshot. |
| F-1-17 | Theme control now visibly says “Use dark theme” or “Use light theme.” | Mobile touch-target test and live screenshot. |
| F-1-18 | README heading now says “Try the sample job.” | README review. |
| F-1-19 | Removed public M1/revision language and raw claim IDs from product explanation; claim IDs are isolated in the developer-facing claim-test section. | README review; footer live screenshot. |
| F-1-20 | Rewrote both SPA and static 404 copy as “Page not found,” with jobs/home recovery links. | `container-runtime`; live unknown URL returned HTTP 404. |
| F-1-21 | Renamed demo job labels “Sample job” and “Required parts and their sources.” | Demo live check and copy audit. |
| Earlier verification: claims completeness | Kept the complete claim registry, narrowed copy where needed, and added the free-release claim/test. | Every command in `.factory/claims.json` ran from `/tmp/parts-promise-clean-yBSLdW`; full browser suite passed. |
| Earlier verification: touch targets | Preserved 44 px controls and re-ran the mobile touch-target test. | `all verifier-reported phone controls provide 44px touch targets`. |
| Earlier verification: caching, Docker, permissions, 404 | Preserved the prior cache/header/Docker/404 repairs and rechecked them on the new container revision. | Live JS `Cache-Control: public, max-age=31536000, immutable`; live 404 status 404; `container-runtime`; `npm test`. |

Live cold-load evidence is in `.factory/evidence/polish-1/`: `screenshot-desktop.png`, `screenshot-mobile.png`, and `verify.json`.
