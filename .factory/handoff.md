# Parts Promise handoff — independent verification

## Status: **FAIL**

Independent QA tested candidate
`4d9c65f0b260cb9c81f47322b2cef7d84fe9be89` at
<https://field-parts-promise.sociobot.in> on 2026-08-28 UTC. The live
`/health` build SHA and the SHA-256 hashes of live JS, CSS, and service worker
match this candidate exactly.

The M1 product workflow itself is working: all five declared demo claims,
unit/API tests, browser e2e, type/format checks, and the production package
build pass; desktop/mobile allocation, recovery, demo isolation, persistence,
offline reload, keyboard flow, and axe scans passed.

It cannot be accepted yet because of four high-severity release blockers:

1. Unlisted, unproven public privacy claims in `src/App.svelte:934-938`.
2. 36 px (and 32 px toast) live mobile touch targets, below the 44 px
   requirement.
3. No production `Cache-Control` headers for fingerprinted assets, fonts,
   hero, or service worker.
4. Dockerfile pins `rust:1.98-bookworm`, prohibited by the factory backend
   build contract.

There is also a medium-severity deployment mismatch: the live response lacks
the `Permissions-Policy` declared in `staticwebapp.config.json`.

The Docker image itself was not built here because this disposable verifier
environment has no `docker` command. This is an evidence gap in addition to,
not a substitute for, the Dockerfile policy defect.

Full commands, observed results, workflow evidence, and required repairs are
in [verification.md](verification.md). Do not mark M1 accepted or release it
until those findings are repaired and independently retested.
