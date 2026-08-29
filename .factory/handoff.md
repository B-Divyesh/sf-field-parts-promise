# Parts Promise — repair 5 handoff

## Status: PASS

Work order: `field-parts-promise-repair-5`

Verifier report: commit `2945f88c07786a3088968d3a4d23d565d2351b62`,
candidate `ce0e270de5d87b5cb142053836cc89ffbb824cbc`

Production: <https://field-parts-promise.sociobot.in>

The release blocker in `.factory/verification-7.md` is repaired. The product
remains the same container-hosted, browser-local PWA and every previously
passing behavior remains covered.

## Repair

### F7-01 — mobile link touch targets

Reproduced at 390 × 844 before editing. The existing button-only regression
passed while representative links measured `Jobs` 36 × 44 px, the wordmark
127.69 × 29 px, `Open the sample job` 147 × 21 px, footer `Terms` 39 × 18 px,
and `Go to home` 83 × 21 px.

Root cause: `src/app.css` applied a 44 px minimum height to buttons and header
links, but no shared link target contract. The mobile header also had a zero
row gap.

Correction:

- The shared anchor primitive is now an inline-flex target with a 44 px minimum
  width and height.
- The mobile header row gap is now 8 px. Existing navigation, footer, and
  action groups retain at least 8 px between adjacent controls.
- The Playwright regression now enumerates every visible anchor on `/`,
  `/?demo=1`, `/jobs`, `/privacy`, `/terms`, and the designed 404 at 390 × 844
  in both light and dark themes. It asserts every link is at least 44 × 44 px
  and grouped controls are at least 8 px apart.

After repair, the formerly failing links measure: `Jobs` 44 × 44 px,
wordmark 127.69 × 44 px, `Open the sample job` 147 × 44 px, footer `Terms`
44 × 44 px, and `Go to home` 83 × 44 px. Lighthouse's `target-size` audit has
score 1 with zero failing items.

## Verification evidence

Clean install and static gates:

- `npm ci`: 83 packages installed; zero vulnerabilities.
- `npm test`: PASS — 15 Vitest tests and 3 Rust tests.
- `npm run check`: PASS — zero errors and zero warnings.
- `npm run format:check`: PASS.
- `cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings`:
  PASS.
- `npm audit --audit-level=moderate`: PASS — zero vulnerabilities.
- `npm run build`: PASS — wrote `dist/` and the release Rust binary.

Production assets remain within budget: JavaScript is 92.33 KB raw / 31.12 KB
gzip, CSS is 16.99 KB raw / 3.97 KB gzip, self-hosted fonts total 56.44 KB,
and the hero SVG is 2.32 KB.

Browser and claim gates:

- `npm run test:e2e -- --retries=0`: PASS — 35 passed and 21 intentional
  project-specific skips across desktop Chromium and 390 × 844 mobile.
- All 16 exact commands in `.factory/claims.json`: PASS when run separately.
- The repaired touch-target regression: PASS in both themes across all six
  verifier routes.
- Axe WCAG 2 A/AA: zero serious or critical findings across six routes, two
  themes, and both browser projects (24 scans).
- Keyboard allocation, route/history focus, modal containment/Escape/focus
  restoration, visible focus, form error announcements, reduced motion, and
  200% text reflow remain covered by the browser suite.
- Offline reload and allocation, current service-worker control, demo reset
  isolation, IndexedDB persistence, import/export, and update-safe cache rules
  remain covered by the claim and release-contract tests.
- Demo privacy remains same-origin GET/HEAD only with no camera request. No
  analytics, remote fonts, authentication, billing, or runtime AI was added.

Runtime and response policy:

- The release binary started under `env -i PORT=4180` with no other runtime
  configuration. `/health` and `/` returned 200; unknown and job-data paths
  returned 404; `POST /api/jobs` returned 405.
- Factory `verify-url.sh` against that release server: PASS — title, `lang=en`,
  one H1, main landmark, alt/button labels, and zero console errors.
- Responses include self-only CSP with header-delivered `frame-ancestors`,
  `nosniff`, strict referrer policy, frame denial, and disabled camera,
  microphone, and geolocation.
- HTML and `sw.js` use `no-cache`; the fingerprinted JS uses one-year
  immutable caching. `/health` is the only API route and stays rate-limit
  exempt; there is no applicable non-health API allowance.
- Package/consumer verification is not applicable because this is a private
  web product, not a published package.

Lighthouse 13 mobile on the production build: Performance 99, Accessibility
100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 2.1 s, TBT 10 ms, CLS 0.
The report is `.factory/repair-5-artifacts/lighthouse-mobile.json`. Desktop and
390 px screenshots plus the local verifier result are under
`.factory/repair-5-artifacts/local-verify/`.

## Deployment and live identity

The repair is deployed with `/opt/fleet/lib/deploy-container.sh` using the
repository `Dockerfile` and port 8080. The ACR build succeeds from the
`.git`-excluded source context, the runtime is non-root, and production
`/health` reports the same full SHA as `git rev-parse HEAD`. Local and live
hashes match for the built HTML, JS, CSS, fonts, hero asset, service worker,
and manifest. The live URL passes `verify-url.sh`, the mobile link geometry
audit, the same-origin privacy flow, the offline reload/allocation flow, and
the response-header/cache checks.

## Known gaps and next steps

No release-blocking repair gap remains. Product scope is intentionally still
M1: one browser, no account, team sync, barcode scan, supplier-order action,
checkout, or payment. Those planned milestones remain in `.factory/plan.md`.
No operator action is needed for this repair.
