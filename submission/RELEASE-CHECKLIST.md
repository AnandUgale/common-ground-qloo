# Release checklist — local pre-key snapshot

The ZIP is a review artifact, not a qualifying entry. Publishing, registration and final submission have not occurred.

**Current revision 0.1.1:** an agent-led reliability repair adds an eight-second quota-coordinator exchange deadline. The new regression first failed at ten seconds on old code, then the complete 36-test suite passed; late synthetic grants cannot call Qloo. Current files are packaged separately by package-local-source-v0.1.1.ps1 using source-manifest-v0.1.1.json and local-tests-v0.1.1.tap. All 30 payload hashes are verified on creation. The original 0.1.0 ZIP/manifest/test output remain unchanged and historical. Actual Cloudflare cancellation/durability still needs provider verification.

| Gate | Current evidence | Required next evidence |
| --- | --- | --- |
| Original source | Fresh event-only code, MIT, source hashes | Exact public version and readable license at repository root |
| Local core | 36 passing tests for 0.1.1; 35 in historical 0.1.0; internal-browser fixture checks | Preserve failures, deadlines and exclusions in real service tests |
| Live data separation | Fixture labels, strict mapping and disabled live flags | Authenticated fields/types/order verification |
| Shared quota | Locally tested SQLite reservations; caps 0 | Key allowance, DO runtime/migration/durability/persistence checks |
| Secret handling | No environment files in the allowlisted ZIP; header-only server adapter | Private approved configuration and actual bundle/log inspection |
| Hosting | Official Free/no-card offer; current login/terms gate | Verified Free account, provider CPU/headers/routing and public smoke test |
| Review | Earlier Pro scope/local critiques plus labeled agent-led fallback review | Resume meaningful Pro critique when usable; unreadable replies are never approval. Missing supplemental Pro review alone does not block otherwise authorized preparation under the conditional human exception. |
| API request | Submitted per human; receipt not captured | Organizer approval and key scope; do not duplicate a request |
| Submission/demo | Truthful narrative and local demo draft | Public Qloo app, source, English artifacts, eligibility/conflict review and human final action |
| Finalists | November 5 requirement in saved official overview | Actual preparation/appearance availability and schedule |

Operational deadline: October 31, 2026, 09:15 IST. Judge access must continue through November 6, 10:15 IST. Actual organizer rank and any award remain unknown.

## Package boundaries

`package-local-source.ps1` checks the 20 frozen project hashes and disabled live/contract/budget flags before packaging. It includes only those source files, selected preparation documents, the prior test output and manifests. Root LICENSE and README are included. It verifies each archived payload hash after writing. It does not install packages, make network requests, create accounts, publish or run deployment commands.

This check is a bounded inventory/configuration check, not a guarantee of absence of every possible secret or a security certification. Test credential strings are synthetic. Real Qloo responses, environment files, research conversations and browser screenshots are excluded.

Keep the first package unchanged. Any source change needs a new reviewed manifest/version rather than silently replacing this snapshot. The supplemental Pro reply remains unavailable; no product feature expansion is justified by that missing review.

Later documentation clarifications, including research/AGENT-FALLBACK-QUOTA-REVIEW.md and tighter acceptance boundaries, are outside the unchanged first ZIP. Its archived documents retain their original snapshot wording. Source remains unchanged; no new release version is implied.
