# Isolated acceptance frontend HANDOFF

Coordination: 4ae4f859  
Status: implementation prepared and locally tested. Deployment and OAuth E2E remain NO-GO.

## Proposed origin and Auth settings

Use a separate Cloudflare Pages project with candidate origin `https://hub-acceptance-ai-agent-hub.pages.dev`. Availability and ownership of this exact hostname are pending. If unavailable, update the origin constant and rerun the tests before publication. Publish only the contents of `acceptance-site/` as the site root. Do not publish the repository root, CNAME, legacy test client, or any production assets. Keep the Pages output limited to the approved origin.

| Setting | Planned value |
| --- | --- |
| Supabase project | trrhyahuzqbozxanaczw |
| Site URL | https://hub-acceptance-ai-agent-hub.pages.dev |
| OAuth authorization path | /consent/ |
| Web sign-in | /login/, same-origin password login only |
| MCP resource | https://trrhyahuzqbozxanaczw.supabase.co/functions/v1/mcp-project-acceptance/mcp |
| OAuth client redirect URI | Exact URI shown in the management page for ChatGPT B's acceptance connection |
| /callback/ | Guard landing that clears the query. ChatGPT B receives its own OAuth callback directly. Do not register this guard as the ChatGPT B redirect URI. |

Supabase Auth's Site URL/authorization path and OAuth client registration are distinct settings. Do not add a wildcard callback. Read-only discovery on 2026-11-18 advertised PKCE S256 and did not advertise `authorization_response_iss_parameter_supported`. For new clients the OpenAI documentation gives per-callback-ID routes when RFC 9207 requirements are unmet. It also documents a stable callback for qualifying servers and older published entries. Obtain the exact management-page URI for the acceptance connection. No attempt was made to create a client or discover its URI via OAuth. The frontend fails closed with an empty callback until the exact value is approved and supplied.

The acceptance client stores the session on the separate origin under a dedicated storage key. Consent compares the provider-supplied redirect URI with the configured callback before showing approval. Any final success/error redirect is checked again. A provider-side prior-consent auto-approval can happen during details retrieval before the frontend observes the result. Use a disposable grant-free user and get E2E authorization before making that call. End-to-end binding, token audience, MCP permissions and installation independence still require runtime validation.

## Publication and rollback

1. Obtain owner approval for the separate Pages project and exact hostname, plus the acceptance Auth settings and callback. Capture existing acceptance settings and previous static revision. Confirm Auth changes use project ref trrhyahuzqbozxanaczw.
2. Set only the verified callback in config, run `node --test tests/oauth-session.test.cjs tests/acceptance-isolation.test.mjs`, and publish only the acceptance subtree through the approved route. Confirm CSP and referrer headers on all three pages, no production routes, and acceptance discovery metadata. Static probes use ordinary GET only.
3. Apply approved acceptance Auth settings. Verify site origin, consent path, registration and resource values without launching OAuth. Complete the background dependency review below. Request separate E2E authorization.
4. Roll back by re-publishing the previous acceptance artifact or taking the dedicated site offline if it had no prior deployment. Restore only captured acceptance Auth settings under owner approval. Check that acceptance redirects and resource metadata match the intended state. Do not remove grants or reconnect existing clients as a rollback action.

## Exact missing background checks

- Cron: list active job names, schedules and commands in Integrations → Cron → Jobs; trace destination hosts and invoked SQL functions/Edge Functions through their reviewed source. Check last-run and any post-restore attempts in Job History. Schema inventory alone did not expose rows.
- Database Webhooks and other outgoing triggers: inventory enabled table/event/hook mappings and destination hosts or invoked functions. Verify functions called indirectly, including acceptance broker and gateway RPCs. Capture no headers, secrets or payloads.
- Platform Webhooks: inspect project and organization subscriptions, especially `v1.project.restored`; check destinations and recent delivery outcomes.
- Edge Functions: obtain source for `mcp-p0-staging` v2 and verify invokers/configuration. Verify the callable RPCs used by the acceptance gateway and broker lack production side effects. Check environment reference names and sanitized destinations through owner-provided metadata.
- External triggers: check n8n and other schedulers for active workflows whose node configuration targets the acceptance project; check their downstream destinations, retries and execution history since restoration. Title/description searches do not cover node contents.
- Block E2E for any unresolved active route to production, missing actual callback, or unverified isolated consent origin. No SQL is authorized by this handoff.

Reference: https://developers.openai.com/plugins/build/auth
