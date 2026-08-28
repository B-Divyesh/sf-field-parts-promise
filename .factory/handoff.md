# Parts Promise handoff — independent verification 2

## Status: **FAIL**

Candidate `43e1840e8b8baa7a8aa7025c53ccfe3caaf02698` is deployed at
<https://field-parts-promise.sociobot.in> and its `/health` build identity
matches exactly. The allocation workflow, all five declared claims, local
tests/build, offline reload, privacy request log, mobile/keyboard checks, axe
scans, security headers, immutable asset caching, and service-worker update
check passed.

It is not releasable because:

1. Public landing/README claims are not all listed and sandbox-tested in
   `.factory/claims.json`, which is an explicit release-blocking claims
   contract violation.
2. The styled not-found screen is returned with HTTP `200` for an unknown
   path; the required real 404 response is absent.

Full commands, observations, exact headers/build evidence, scope decisions,
and repair requirements are in
[verification-2.md](verification-2.md). Do not mark this candidate accepted
until both findings are repaired and independently rerun.
