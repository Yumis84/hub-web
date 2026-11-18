# Production OAuth origin mismatch — HANDOFF

Author: CODEX  
Scope: AI Agent Hub / OAuth ChatGPT B  
Date: 2026-11-18 UTC  
Verdict: GO to review the proposed one-field correction. NO-GO to execute an OAuth test until owner approval and readback.

The coordinator correlated two production GET details errors around 19:03 UTC. Auth logged validation_failed / unauthorized request origin. The provided Referer was GitHub Pages. Origin itself was not supplied. The upstream handler reads Origin, not Referer, before authorization lookup. The public Pages consent route redirects to apex with its query preserved. A normal browser executing consent JS there sends https://ai-agent-hub.fun on the cross-origin fetch to Auth; this is inferred for the incident, not a capture of those two request headers.

Production ref enhcnvzzkyvusthfjnci, verified via a read-only Management API connection:
- site_url: https://yumis84.github.io/hub-web/
- uri_allow_list: https://yumis84.github.io/hub-web/**
- oauth_server_authorization_path: /oauth/consent
- OAuth server and dynamic client registration enabled.

Current browser route checks with synthetic queries and no authorization requests: Pages login and consent return 301 to apex; www consent also returns 301 to apex; apex consent returns 200. Live app.js and consent.js match main 08ad3bfe. Draft PR #10 at 33d686c6 before this handoff improves session handling, but does not change Auth allowed origins. Production bind RPC runs only after explicit approval in the frontend, so this details rejection is earlier.

Minimal proposed change after separate owner authorization: append exact bare https://ai-agent-hub.fun to production Auth Redirect URLs and preserve https://yumis84.github.io/hub-web/**. This matches a browser Origin without a path; do not use a slash/path glob alone. Leave Site URL, consent path, client callback registration, issuer, signing settings, Gateway and grants untouched. No frontend diff required for the 400. Keeping legacy Site URL preserves existing origin matching and entry routing. Changing Site URL later would be broader and needs its own dependency review. Do not add www unless proven necessary.

Read back exact config before and after. Verify public redirect chain with a synthetic parameter. Compare current A/Claude baseline using existing read-only calls only if already available; no reconnect or revoke. With explicit approval for exactly one B OAuth run, use a fresh browser context, check final consent origin (apex), capture redacted Origin, status and sb-request-id for first details response, and stop on unexpected redirect, 400, or auto-approval. Stop before clicking Approve unless separately authorized to complete the connection. PASS for origin diagnosis is a details response accepted from apex, correlated to Auth; full connection is a separate result. If rollback is approved, remove only the new exact entry and verify earlier values. No expected impact on existing token refresh/callbacks from the additive rule, but live A/Claude regression checks were not run.

Sources: https://supabase.com/docs/reference/api/v1-get-auth-service-config and https://github.com/supabase/auth/blob/master/internal/api/oauthserver/authorize.go and https://github.com/supabase/auth/blob/master/internal/utilities/request.go

Only this documentation was committed to the draft branch. No Auth change, OAuth, SQL, merge or deploy.
