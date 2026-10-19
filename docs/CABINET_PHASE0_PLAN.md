# AI Agent Hub cabinet: Phase 0 and delivery gates

Owner-approved target: https://ai-agent-hub.fun ; repository `Yumis84/hub-web`.

## Product decision

- Desktop: persistent left sidebar with **Сегодня**, **Проекты**, **Агенты**, **Сервисы**. **Общее** is a later feature, only visible when L2 has working content. Account/settings in avatar menu.
- Mobile: bottom navigation for the four available destinations; 44px minimum touch targets.
- Today: human-actionable Inbox **Мне / Агентам / Журнал**, no fabricated counts or presence states. Show explicit loading/empty/error states.
- Agents are actors (ChatGPT/Claude/Grok); services are tools (Composio, user MCP, future integrations).
- Composio permissions: user-level connection, binary per-agent grants and master OFF, enforced by the server for every invocation. No new granular Hub permissions.

## Phase 0 (this PR)

- Avoid an exception when the removed legacy `#bootstrapAgent` element is absent.
- Keep current login/signup/OAuth and public domain untouched.
- Follow-up: move legacy acceptance fixture code out of the public production bundle, with parity tests before removal.
- Review browser security (CSP, DOM injection, token storage), including the existing `innerHTML` usage. Do not claim CSP is enabled until verified.

## Release sequence

1. PR0: stabilize current auth, verify browser sign-in/sign-out/reload/OAuth return, remove obsolete test hooks safely.
2. PR1: responsive shell, sidebar, mobile nav, routing, session/error boundaries.
3. PR2: Today with real user-scoped Inbox after verifying browser JWT authorization, cross-user isolation, and pagination behavior. No fake live states.
4. PR3: Projects read-only views.
5. PR4: Agents list and guided connector setup with verified connection check.
6. PR5: Services catalog and genuine provider status; Composio toggles only when gateway enforcement and revoke tests pass.
7. Later: shared L2/Общее when supported and usable.

## Blocking checks before shipping the cabinet

- Human JWT cannot be assumed to have access to agent-scoped Inbox. Verify with two separate user accounts.
- Inbox currently may be capped at 100 items; do not promise complete history without server cursor support.
- No Hub-owned verified ChatGPT app deep link yet: provide manual MCP connection instructions, not an invented install URL.
- Avoid reporting `online` unless real health signals exist.
- Keep acceptance database routes and test credentials out of production artifacts.
- Do not modify production, DNS, OAuth, `main`, or merge without owner authorization.

## Review sources

- Claude Vitalina UX review: Hub HANDOFF `c1a965bd`
- Grok independent review: Hub HANDOFF `2d4bcde4`
- Coordinator decision: Hub `a6b4208e`
