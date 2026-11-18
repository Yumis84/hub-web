# P0 OAuth browser diagnostics — HANDOFF

Author/Agent: CODEX  
Date: 2026-11-18 UTC  
ACTIVE_SCOPE: CODEX / ai-agent-hub / oauth-multi-account  
Status: BLOCKED on incident attribution. Production remains NO-GO.

## Evidence

- Owner-provided observation: GET /auth/v1/oauth/authorizations/{id} at 19:03 UTC on 2026-11-18 returned 400 validation_failed. Browser ownership and exact response reason remain unknown.
- Coordination reference f2ebe4cc could not be resolved under Yumis84/ai-agent-hub (GitHub 422, searches returned no match). Obtain the full SHA and branch/link before relying on its contents.
- Reviewed Draft PR #10 at code HEAD 5ebfd5b9ab2d5f0a63427d7af0282082f6d3da08. Ran Node fixtures: 10/10 passed. The password-login fixture retains the full consent URL including the encoded opaque ID. Missing/invalid web session takes the login path before details. Details failure with a restored session preserves web credentials in the draft. These fixtures establish the frontend sequence with mocks. No real ChatGPT flow was replayed.
- Current upstream GoTrue source checks origin before lookup. In the reviewed revision, a non-pending request can produce 400 validation_failed. Expired and other-owner requests are returned as 404 by that source. Hosted Auth version and the exact incident branch remain unverified. An earlier successful details request, including auto-approval when prior consent exists, is a useful timeline hypothesis. Details itself can associate a user and auto-approve, so it is outside the current read-only scope for live pending requests.
- A public issuer-discovery GET with Hub Origin returned HTTP 200 and sb-request-id. Access-Control-Expose-Headers listed X-Total-Count, Link and X-Supabase-Api-Version, without sb-request-id. This observation applies to the tested discovery response. Use DevTools Network to inspect the individual OAuth response after approval for diagnostics. Do not assume the JS SDK exposes the gateway ID.
- Frontend calls setSession, then getAuthorizationDetails, then renders consent unless the provider supplies an immediate callback. Explicit bind runs only on Approve. A 400 at the details endpoint does not establish an RPC failure or a missing browser login.

## Safely correlate browser and Supabase

If the original browser Network record already exists, inspect only the selected failed response. Record UTC timestamp, method, templated path, status, coarse Auth error code/message (redact identifiers and URLs), document origin and sb-request-id from response headers. Record context class (WebView, external browser, browser profile) and whether the same opaque authorization_id survived the login return as a boolean. Never open token responses, request authorization headers, cookies or storage values. Do not export a HAR, copy as cURL, record full URLs, or send callbacks/queries in evidence.

In Supabase Logs, locate the gateway event using that exact request ID and use the correlated timeline to locate the Auth entry. If Auth correlation is unavailable, use a narrow UTC window and require a unique match with method, route, status and gateway ID before attributing it. To link to ChatGPT B, also require the controlled B browser's record or an existing redacted record tying the request to B. The approximate timestamp by itself is insufficient. Record a prior details call on the same authorization as yes/no if the authorized operator can confirm it from the timeline without sharing the identifier.

## E2E gate

1. Prefer existing network evidence. If unavailable, obtain separate owner approval for a single controlled OAuth flow from B, preferably in an active isolated acceptance project with a disposable Hub user and working callbacks. The previously configured acceptance project was inactive.
2. In a fresh desktop profile, enable Preserve log before the single attempt. Keep ChatGPT B, Hub Login and Consent in the same browser context and verify the expected origin. Observe whether login returns to the same opaque request, whether details is called, its count and timing, and its response metadata. Avoid reloading or duplicating the consent tab. Stop at first details response. Any production attempt requires explicit permission that covers the possibility of provider auto-approval at details.
3. In isolated acceptance only, separately test a deliberate repeat after a request becomes non-pending, expiry, a different browser profile, and normal same-origin re-login. Use distinct disposable requests for each condition, then run the existing multi-client acceptance runbook before production approval.
4. Prepare the minimal incident-specific fix only once browser and Auth evidence identify the failing condition. No application-code change in this handoff.

References:
- Draft PR: https://github.com/Yumis84/hub-web/pull/10
- Existing E2E: https://github.com/Yumis84/hub-web/blob/5ebfd5b9ab2d5f0a63427d7af0282082f6d3da08/tests/oauth-isolated-e2e.md
- Upstream GoTrue: https://github.com/supabase/auth/blob/master/internal/api/oauthserver/authorize.go
- Correlation: https://supabase.com/changelog/correlated-logs

No production change, OAuth replay, approval, SQL, deployment or credential inspection occurred.
