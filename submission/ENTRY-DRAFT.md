# Common Ground — provisional entry narrative

**Draft only; not ready to submit.** This describes implemented local behavior and clearly identifies pending live proof.

## Short description

A movie compromise tool that shows each person's candidate ranks, preserves exclusions and explains when evidence does not support a shared choice.

## Problem and audience

Small groups often settle on one person's suggestion. Common Ground explores a transparent alternative: start from two or three individual favorites, compare separate candidate lists and minimize the worst observed rank. This is a declared decision convention, not a measured claim about group satisfaction.

## Implemented locally

The original JavaScript prototype resolves identities through a tool boundary, requests clarification for ambiguous/missing matches, retrieves separate candidate lists and selects common movies by worst rank, total rank and stable ID. Hard movie exclusions survive explicit pool expansion. Missing evidence remains unresolved. The interface labels all current demonstration films, IDs and ranks as synthetic and shows the decision trace.

The code includes a server-only Qloo adapter, strict response mapping, cancellation, bounded requests and a prepared shared reservation counter. The adaptive state machine chooses the next permitted action from observed identity/retrieval states. No LLM is used; organizer acceptance of the agentic implementation remains unverified.

The current official rules allow an application that functions as an agentic tool as one of three alternatives. Our intended case is the observable tool sequence: resolve, request clarification, retrieve evidence, choose a supported compromise or diagnose no overlap, then offer one explicit larger-pool action while preserving exclusions. This is a description of implemented control flow, not organizer confirmation of eligibility.

## Intended Qloo contribution — live evidence pending

Qloo is intended to supply canonical identities and separately retrieved movie candidates for each person. The compromise algorithm cannot invent this taste evidence. Changing/removing retrieved lists should change/remove a supported selection; this needs demonstration with approved authenticated responses.

The current adapter has not been verified against real Qloo fields or ordering. No live Qloo recommendation has been demonstrated. The taste-blind fixture control illustrates a calculation only; no Qloo or LLM superiority result exists.

## Engineering and limitations

Source was created fresh for this event and is prepared under MIT. Plain browser assets and a proposed Cloudflare Worker use one SQLite-backed Durable Object for aggregate request reservations, with no private user profile database. Public deployment, provider runtime, account access and the actual API quota remain pending. Real Qloo response data must not enter the public repository.

The product selects a movie, not a screening, booking or available stream. Rank is an observed retrieval position, not a probability of enjoyment. Groups are limited to two or three; the tool supports explicit pool expansion and refuses unsupported compromises. Real-world impact remains a hypothesis.

## Evidence required before submission

- Authenticated Qloo field/type/order verification and permitted nonsecret evidence.
- Real shared and unresolved workflows, exclusions and controlled contribution comparisons.
- Provider CPU, quota and deployed shared-counter checks.
- Public functional URL, public source/license/instructions and exact version.
- Eligibility/conflict and agentic-requirement review, finalist availability and applicable human final submission.

The API request was reported submitted by the human on October 25. Key receipt, competition registration and final submission remain unverified. No rank, win probability, testing participants or prize result is claimed.
