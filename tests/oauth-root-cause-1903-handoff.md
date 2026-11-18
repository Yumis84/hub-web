# OAuth incident 19:03 UTC — HANDOFF

Author: CODEX  
Coordination: 2d52f1a3  
Verdict: NO-GO for an OAuth test. Exact cause unconfirmed.

Supplied observation: 2026-11-18 around 19:03 UTC, production Auth GET /auth/v1/oauth/authorizations/{id} returned 400 validation_failed. No raw Auth error message, correlation ID or evidence identifying ChatGPT B was available. Dashboard redirected to sign-in. The connected log reader requires a ClickHouse SQL query, excluded by owner instruction. No SQL or OAuth executed.

Production frontend baseline 08ad3bfe: consent.js lines 8–17 checks for stored credentials, restores via setSession and then requests details once per module initialization. Reload, another tab, or same-ID login return can initialize it again. app.js lines 4–5 and 15 allow premature return from cached UI state. consent.js line 28 can classify a valid OAuth-request error as a session failure, clear browser credentials, and offer a return to the same URL. The approval RPC at line 24 only runs on the explicit button. Draft code at 6ff4e711 separates details errors from invalid credentials and validates homepage session first. That corrects the misleading login loop, but does not prove why Auth produced 400.

Current upstream GoTrue get-details code can return validation_failed when the request is no longer pending. It can auto-approve a pending request with prior matching consent. It also checks origin and has a missing-ID validation path. This does not identify the exact deployed Auth build or establish any repeat in this incident. A repeat GET by itself is insufficient; show the earlier event and state transition.

Next evidence: in the signed-in Supabase Auth Logs UI select 2026-11-18 19:02–19:05 UTC, locate GET details 400 and collect sanitized error message, timestamp, request ID and browser origin. Correlate the original B browser response using sb-request-id if retained. Search neighboring events for the same opaque authorization ID within Supabase, record only aliases/equality, order, status and any preceding approval/auto-approval or denial. Check whether browser returned to the same ID and whether web session restored before the failing GET. Report no credentials, raw authorization IDs, or full callback URLs. Ref: https://supabase.com/changelog/correlated-logs

Minimal confirmed frontend correction already exists in Draft PR. If evidence confirms a non-pending authorization, the minimal incident-specific UX change is to preserve session, stop reusing that request and direct the user to start a fresh authorization from ChatGPT, without automatically launching it. Do not implement this based on the generic error code alone. If logs identify another cause, address that branch specifically.

One OAuth test requires separate explicit owner approval and a verified target. A live details request can change OAuth state through auto-approval. No code, production, infrastructure or existing connections were changed; only this HANDOFF was added.
