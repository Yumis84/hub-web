# Isolated OAuth acceptance

Use an active, owner-authorized acceptance project with the relevant Auth, binding and gateway behavior from production. Supply a dedicated acceptance frontend, exact registered callbacks and the deployed RPC definition with its index and policy metadata. The previously configured acceptance project was inactive during audit. Stop if the gateway, issuer, consent origin, callbacks or Hub users belong to production. Use two independent disposable ChatGPT installations, a disposable Claude installation for continuity, and two disposable Hub users. Enter credentials only into the verified acceptance site.

Record timestamps, HTTP status and error codes, and aliases for the owner, client, authorization, grant, session, Hub connection and agent. Keep bearer tokens, authorization codes, passwords, client secrets and PKCE verifier values out of evidence. Redact raw authorization IDs and avoid recording callback queries.

| Step | Action | Expected result |
|---|---|---|
| 1 | Connect installation A to user U. Record its permissions and read a fixture memory item and event through A. Connect disposable Claude and record equivalent checks. | Each client has a working baseline with the expected owner and grants. |
| 2 | Start B from an independent browser profile. Use the original sign-in return to consent and approve for U. | B connects. A and B have distinguishable session/grant and Hub connection identities. Record whether Supabase assigned different client IDs or reused one. A and Claude still read the same fixtures with their baseline grants. |
| 3 | Refresh B through its client. Verify rotation through sanitized Auth metadata. Run A's identity, memory and event probes and refresh A separately. | B rotates independently. A remains usable with its original connection and expected scopes. |
| 4 | Revoke B's Hub connection by its fixture row ID. Verify B loses that Hub access. Repeat with a fresh B grant and the provider's targeted OAuth revocation, where supported. Check B's next refresh and record any residual access-token lifetime. Recheck A and Claude after each operation. | Both revocation paths affect only the intended B identity. If the provider can revoke only by a shared user/client pair and A shares it, stop and record a blocker before revocation. |
| 5 | Reconnect B and exercise prior-consent redirect, retry after an isolated approval failure, and concurrent approvals on fresh fixtures. | Prior consent still resolves to a usable connection. No orphaned Active connection after approval failure. Concurrent operations preserve distinct grants or fail without changing A. |
| 6 | Connect a client to user V. Probe U's known fixture IDs with V's normal OAuth credentials. | Access is denied or filtered. U's existing clients remain able to read their own fixtures. |
| 7 | Repeat consent in the same browser context, a separate profile and the mobile context. Check an expired authorization and temporary Auth failure using isolated fixtures. | Login return preserves the pending request. Expiry is shown as an authorization error. A transient Auth failure preserves the browser session. |

Use normal connector credentials for the data probes so that assessments reflect OAuth permissions and RLS. A successful mock callback test does not establish provider PKCE, state or redirect URI validation. Record those checks against the real acceptance OAuth exchange using redacted evidence.

**Release gate:** Record each step as PASS, FAIL or BLOCKED. Keep production at NO-GO until independence, targeted revocation, prior consent and tenant isolation have all been verified.
