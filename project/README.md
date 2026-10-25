# Common Ground

An original movie-compromise prototype for two or three people. It resolves each favorite, retrieves a separate candidate list for each person, and chooses a shared candidate by minimizing the worst observed rank. Equal worst ranks are resolved by total rank, then stable movie ID. These are retrieval positions, not measured personal enjoyment or comparable Qloo utilities.

**Current evidence: synthetic local prototype only.** No authenticated Qloo request, public deployment, registration, submission, human study or award has been verified. All demonstration films and IDs are invented. The live adapter is disabled by default; schema tests use synthetic wire objects and do not prove actual Qloo response compatibility.

## Run locally

Requires Node.js 24 or later, including built-in SQLite for the quota tests. No package install or external service is needed.

Current local revision: **0.1.1**, with 36 passing Node tests. The stalled-coordinator regression intentionally waits about eight seconds; it never contacts Qloo.

```text
npm test
npm start
```

Open http://127.0.0.1:4317 in the ChatGPT internal browser. The local server binds only to loopback. `PORT` may be set to another free local port.

Try default Aurora/Mariner/Atlas, then the conflict scenario and explicit pool expansion. Exclude the resulting shared movie: it stays excluded. Try Echo for ambiguity or an unknown favorite for a missing match. The sparse and unavailable scenarios exercise evidence gaps and transport failure. The fixture-only fixed-catalogue baseline illustrates algorithm behavior; it does not measure live Qloo value or human relevance.

## Design

- `src/core.mjs`: validation, resolution/retrieval/decision state machine, compromise selection.
- `src/fixtures.mjs`: wholly invented contract data; no Qloo response data.
- `src/qloo.mjs`: server-only adapter for hackathon `/search` and `/v2/insights`.
- `src/api.mjs`: same-origin API, request limits and explicit mode separation.
- `server.mjs`: dependency-free local server; `worker.mjs` and `wrangler.jsonc`: prepared deployment path, not deployment evidence.
- `public/`: accessible form, per-person rank cards, explicit expansion, hard movie exclusions and tool trace. No third-party scripts, analytics or persistent profiles.

The adaptive state machine asks for disambiguation, diagnoses missing intersections, stops on upstream failure and only expands after an explicit request. Whether the implemented behavior satisfies the organizer's agentic requirement remains a rules-review gate. No LLM is used and no LLM-superiority claim is made.

## Limits

Movie favorites only; no venue, streaming availability, showtime, dietary or booking claims. Maximum three people, five search matches, 20 candidates initially and 40 after expansion, and six upstream calls per run. Hard exclusions are movie IDs. Exclusion filtering preserves original retrieval positions. There is no automatic retry or automatic soft-preference relaxation.

Live entity field mapping, result ordering, returned content and Qloo parameter effects require authenticated checks. The adapter fails closed on unexpected data. `QLOO_CONTRACT_VERIFIED=true` is an explicit operator gate, set only after recording those checks. Live API runs also require a verified shared quota policy and available `QLOO_BUDGET` binding. A key and live-enable flag alone cannot return live results. There is no fallback to fixtures. Shared-counter code has local SQLite tests; actual Cloudflare runtime, account access and public availability protections remain unverified.

`src/quota.mjs` prepares conservative global reservations before live calls: 4 or 6 per run, UTC-minute/day and total-event caps, with no refunds. One SQLite-backed Durable Object stores aggregate counts only. All limits default to 0 and `QLOO_BUDGET_VERIFIED=false`. Preserve its namespace/object name across redeployments. This counter covers this app, not other uses of the key; it is not a provider quota meter or complete anti-abuse protection. See [live acceptance plan](../submission/LIVE-ACCEPTANCE-PLAN.md).

The coordinator exchange, including response parsing, has an eight-second deadline. Failure stops the run before Qloo; no automatic retry or refund occurs. A late coordinator grant may retain a reservation but cannot restart the failed API run. Local tests reproduce an unresponsive coordinator and its late grant; actual provider cancellation, binding and persistence behavior remain unverified.

Each initial run, expansion, or exclusion rerun starts a new server run with at most six upstream calls. Expansion resolves names again to avoid trusting stale/client-supplied IDs. It can consume six additional requests; the cap is not session-wide. The trace identifies runs and reports their actual upstream request counts, with a page total for completed responses. Cancelled runs may also consume quota. Browser edits abort pending requests; the local server and adapter propagate cancellation and stop between tools. Upstream work already accepted by Qloo cannot be undone.

Keep approved Qloo keys in server environment secrets. Never put them in browser assets, query strings, source, logs, screenshots or research chats. Do not commit real Qloo responses: the developer guide permits private server caching but prohibits public repository storage of response data. See [deployment and judge-access preparation](../submission/DEPLOYMENT-AND-JUDGE-ACCESS.md).

## Provenance

Created fresh on October 25, 2026 for this event. No code was copied from another competition. Product and implementation choices were delegated to Pro/Codex by the human; no human authorship, personal review or testing is asserted. MIT covers this original code and synthetic fixtures, not Qloo data or third-party rights.
