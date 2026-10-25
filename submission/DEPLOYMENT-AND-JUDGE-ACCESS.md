# Deployment and judge-access preparation

Prepared October 25, 2026. **Not deployed or submitted.** Public account access, API authorization, runtime behavior and judge access remain unverified.

## Zero-spend path

Official browser checks found [Cloudflare Workers](https://www.cloudflare.com/products/workers/) explicitly offering free use without a credit card. [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) lists the Free plan as default, 100,000 requests/day and 10 ms CPU/invocation. [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) says asset requests/storage are free and API paths routed through the Worker consume Worker quota; limits can cause 429 responses. This is public documentation, not proof of this entrant's account access or runtime fit.

Stay on Workers Free. No paid plan, billing/card enrollment, domain, database, extra AI service or paid workaround is authorized. The app uses a provider subdomain and simple bounded JS. Worker CPU, wall time, response size and quotas must be measured after deployment, not inferred from the local Node run.

## API access handoff

The [official guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide#getting-your-api-key) links the [Qloo key request form](https://forms.gle/zz12orkLHTAneLGz6). The inspected form has required email, first/last name, Devpost username, country and project idea; GitHub username is optional. It shows two required agreements: hackathon-only API use, and reading/accepting the hackathon API rules on the Devpost overview. It mentions Qloo Terms of Use. No card/payment field is visible. The guide says manual approval typically takes a few business days, with no guaranteed delivery date.

Update October 25: the human reports submitting the form. No receipt has been captured and the old retained tab still showed a draft; no duplicate request was sent. Approval/key remains pending. The earlier prepared description is preserved below as historical request preparation:

> Common Ground is a movie-only group compromise agent for two or three people. It resolves user-selected movie favorites to Qloo IDs, retrieves separate movie candidate lists through Qloo Insights, finds overlap using an explicit worst-rank compromise rule, and shows the tool decisions and per-person evidence. The group may request one larger candidate pool while preserving hard movie exclusions. We have a clearly labeled synthetic local prototype; live Qloo integration and public deployment are not yet verified. No paid LLM or service is required.

Key receipt is not a successful integration. Configure it privately on the server; do not paste it into a chat. Preserve access through judging. The guide says hackathon keys remain active through judging, but verify the actual issued key's scope and period.

## Conditional deployment sequence

1. Verify authorized Cloudflare account access and Free/no-card status in the internal browser. Current login page requires human credential entry and says continuing accepts Cloudflare terms. No authenticated account has been inspected or created here. After the human completes sign-in and reviews terms, verify the actual plan and no-card requirements before deployment.
2. Confirm Qloo access, movie response mapping and returned ordering privately. Search envelope `results[]` and Insights envelope `results.entities[]` are documented; strict entity mapping in the adapter remains unvalidated against real responses.
3. Review source/provenance and the chosen MIT license. Keep credentials, `.dev.vars`, `.env` and private response/evaluation data out of the public repository. No public repository has been created.
4. Use the official Wrangler setup flow from the [Workers documentation](https://developers.cloudflare.com/workers/) when account/terms gates clear. `wrangler.jsonc` prepares a module Worker, static `public/` assets, and `/api/*` routes through the Worker. This configuration has not been validated in workerd or deployed. No deployment command has been run.
5. Set the approved key as the Worker secret `QLOO_API_KEY`, and only then explicitly set `QLOO_LIVE_ENABLED` to `true`. After recording authenticated field/type/order semantics checks, set the separate operator gate `QLOO_CONTRACT_VERIFIED=true`. Until all three conditions hold, live recommendations are unavailable. The flag is a manual attestation, not an automatic proof. Never put the key in a public variable, browser field or command argument recorded in logs. Use a provider-approved interactive secret flow, handled privately by the human if needed.
6. Before exposing live API routes publicly, verify the prepared shared-quota policy in the actual provider runtime and fit caps to the actual key's remaining allowance. The SQLite-backed counter reserves the full 4/6-call bound before each live run and retains reservations after failure/cancellation; all caps are 0 and the budget-verification flag is false. The six-call adapter cap remains per run. The new guard has local SQLite tests, not workerd/deployment evidence. See [live acceptance plan](LIVE-ACCEPTANCE-PLAN.md). Remain Free and keep live disabled until these checks pass.
7. Obtain applicable publishing approval for a concrete reviewed version, deploy, and test the actual public URL in a fresh internal-browser tab. Source code being public is a separate publication gate. Do not call a fixture deployment a qualifying entry.

## Judge-access checks — all pending

| Check | Evidence needed |
| --- | --- |
| Public functional URL | No entrant account or private network needed; real two-person and three-person workflows work. |
| Qloo contribution | Actual canonical IDs, per-person live candidate retrieval, documented ordering and effect of changing a favorite. HTTP 200 alone is insufficient. |
| Error states | Wrong/missing key, no match, ambiguity, empty list, no overlap, 429 and transport failure stay distinct; no fixture fallback. |
| Data integrity | Duplicate IDs, wrong entity types and bad envelopes fail closed. Unknown or omitted ranks remain unknown. |
| Exclusions/consent | Hard movie exclusions persist; larger pool is an explicit group action. |
| Security/quotas | No secrets in bundle/source/network URL/logs; unexpected origins rejected; request and shared API limits verified. |
| CPU/deployment | Free Worker runs within CPU limits; static/security headers and API routing checked remotely. |
| Source/license | Public GitHub/GitLab/Bitbucket repository, visible license, exact runnable version and English instructions. |
| Availability | Free judge access through November 5, 2026, 23:45 EST = November 6, 10:15 IST. |
| Finalists | November 5 preparation and live appearance schedule/entrant availability confirmed before representing availability. |
| Submission | Final rules and eligibility/conflicts review, human consequential submission handoff, receipt and exact version. |

Submission deadline from saved rules: October 30, 2026, 23:45 EDT = October 31, 09:15 IST. Registration, public deployment and a complete entry have not occurred.
