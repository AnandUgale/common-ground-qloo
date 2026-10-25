# Live acceptance plan — October 25, 2026

No key has been received or used here. The human reports submitting the API request; no confirmation receipt was captured. The retained form tab still showed the previous draft, so it was not resubmitted. This is future preparation, not completed live evidence.

## Before any live call

Privately verify the issued key's hackathon scope, expiry, numeric quotas and remaining allowance, including prior probes or use outside this app. Unknown allowance means no tests or public live access. Configure the secret through an approved private server workflow, never chat or public source.

Cloudflare's inspected dashboard shows sign-in and terms acceptance. Account access remains unverified. No sign-in, account creation, subscription or paid plan was performed. Official docs confirm SQLite-backed Durable Objects are available on Workers Free and operations fail after free limits; actual account and deployment checks remain necessary.

## Prepared shared budget

One SQLite-backed Durable Object reserves 4 or 6 requests before each two- or three-person live run. Reservations check UTC-minute, UTC-day and total-event caps atomically. Unused slots are not refunded after missing identities, cancellation or failure. These are conservative reservations, not a provider quota/billing meter.

All caps remain **0**, with `QLOO_BUDGET_VERIFIED=false`, `QLOO_LIVE_ENABLED=false`, and `QLOO_CONTRACT_VERIFIED=false`. Caps can only be selected after the actual remaining allowance is verified. Fixed minute buckets are not sliding windows. The event cap never resets on day rollover. Missing configuration/binding, storage errors and malformed replies block Qloo calls.

Verify actual Qloo rate-window/reset semantics before attesting the budget. Adjacent fixed-minute bursts can exceed a rolling-window allowance. Do not equate this counter with provider rate-limit compliance; keep live disabled if verified limits/pacing cannot fit it.

The aggregate one-row counter stores no tastes, names, IPs, keys or response data. Preserve its namespace and fixed object name `common-ground-global-v1` across redeployments. Other apps or namespaces sharing the key are not counted. A hostile visitor could exhaust availability within the cap; this is consumption protection, not a complete anti-DDoS/fair-access guarantee.

Never replenish the production counter through namespace replacement, SQL reset or point-in-time restore. If state is lost/restored, stop live use until actual remaining key allowance and consumed/reserved capacity are conservatively reconciled. A code rollback must retain budget state. Lost coordinator replies/cancellation can retain reservations without a Qloo call; do not refund based on a client error.

Revision 0.1.1 bounds the coordinator request plus response parsing at eight seconds and attempts cancellation. A timeout stops the API run with no Qloo call or automatic retry; a late grant cannot resume it. Verify this in the actual provider runtime, including an accepted reservation whose response is lost. Timeout does not prove the coordinator cancelled or that its debit was reversed.

## Runtime checks without a Qloo key

After account/terms/publication gates clear, verify the reviewed Worker and SQLite migration in a separate test namespace using only synthetic reservations. Verify concurrent cap enforcement, output-gate durability, restart/redeploy persistence, exhausted counters and provider errors. Do not reset production state to run tests. Check API routing, static headers and Free CPU limits. Local tests use real Node SQLite transactions; they do not verify workerd or the deployed bindings.

The local 20-attempt test schedules synchronous callbacks in one Node process; it is not deployed concurrency evidence. The provider check must exercise distinct incoming requests/Worker instances and verify persisted aggregate counts, including failed/lost-response outcomes.

## First authenticated session: conditional ceiling of 24 calls

Only start if 24 calls fit the verified remaining allowance; otherwise reduce the plan first. Count every private probe. A failed request may still consume quota.

1. Use an isolated private operator validation context against the official API contract while the public app remains disabled. The current app has no public probe or credential-entry endpoint. Prepare a bounded private probe only after key scope is known; do not falsely set the contract attestation to bootstrap testing.
2. Confirm the hackathon URL, header, movie URN, identity/name/type fields, success envelopes and documented ordering semantics with real responses. Preserve sanitized findings privately. HTTP 200 and array position alone do not establish filter correctness or personal preference strength.
3. After evidence supports the mapping/order checks, record it and set the manual contract attestation. Configure conservative verified reservation caps, retain the private secret, and enable only the reviewed version.
4. Reserve up to 4 requests for initial private contract probes, one two-person run (4), one three-person run (6), one expansion (6), and one changed-favorite run (4): at most 24. Stop on schema, authorization, quota or ordering uncertainty. Replan before exceeding the ceiling.

The four probes are outside the app guard; the four planned app runs total 20 guarded calls. Subtract actual attempted probes and all other key use from the verified allowance before choosing application caps. An initial allowance of 24 does not permit a new app event cap of 24 after four probes. Reservation totals are not provider billing counts.

Use fictional participant profiles with public movie titles such as Arrival, Spirited Away and The Grand Budapest Hotel. These are proposed search inputs, not verified entities or expected overlap. Keep malformed/401/403/429 fault cases synthetic rather than wasting real quota to manufacture them.

## Comparison and evidence

Record the code version, nonsecret request parameters, canonical identity checks, list sizes, shared-candidate counts, observed ranks, unresolved cases, latency and request/reservation counts. Real Qloo responses stay out of public source.

Compare compromise vs first-person top pick under identical retrieved lists to isolate the compromise rule. Separately compare Qloo retrieval with a predeclared taste-blind catalogue to show whether evidence/selection changes. The catalogue is a weak engineering control, not a competitive recommender. Do not score each arm under its own ranks as quality evidence. Using Qloo as a shared reference favors Qloo and must be disclosed. No independent LLM comparison or human satisfaction study exists.

## Public judge rehearsal

Require an actual public functional URL, public source/open license, English instructions and an exact frozen version. In a fresh internal-browser session verify live identity choice, shared/unresolved cases, persistent exclusions, explicit additional-call consent, failures and secret absence. Verify budget/Free hosting support through **November 6, 10:15 IST**. November 5 finalist availability, organizer conflicts, agentic compliance and human final submission remain separate gates. Deadline: **October 31, 09:15 IST**.
