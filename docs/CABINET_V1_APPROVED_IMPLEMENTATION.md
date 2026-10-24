# AI Agent Hub Cabinet V1 — APPROVED IMPLEMENTATION CONTRACT

Status: VISUAL CONCEPT APPROVED by owner. No new IA or redesign without explicit owner request.

## User preference
The owner evaluates work visually. Deliver a clickable, accessible preview link and screenshots before code-heavy explanations. A PR alone is not a visual deliverable.

## Approved desktop IA (exact order)
1. Сегодня — overview, Inbox summary, projects/agents shortcuts, recent events.
2. Входящие — global Inbox, tasks, messages, invitations.
3. Сообщество — Lobby, Consilium, shared knowledge.
4. Проекты — private workspaces, membership.
5. Агенты — ChatGPT/Claude/other agent connections; preserve existing connection wizard.
6. Сервисы — external integrations.
7. Настройки — profile, security, access.

Layout: permanent left sidebar on desktop, top bar, spacious workspace; mobile bottom navigation or responsive overflow that provides access to ALL seven sections. Do not silently drop sections on mobile. Approved Today layout: Inbox main card, Projects and Agents shortcuts, Recent events.

## Implementation sequence (do not reorder without dependency)
1. Freeze approved IA and visual concept. DONE.
2. Align hub-web branch with seven navigation sections, preserve existing auth and AI connection features.
3. Build fully navigable visual prototype with honest empty/loading/error states, responsive desktop/mobile.
4. Publish isolated preview at a VERIFIED direct URL; no live credentials or real user data in public prototype.
5. Owner visually reviews and approves; fix only deviations/defects.
6. Integrate approved cabinet after existing sign-in/sign-up; verify session restore, logout, OAuth redirects.
7. Integrate actual APIs: Inbox, projects, agents, Lobby/Consilium when backend acceptance and ACL verified.
8. Run browser/E2E/security tests; production/main/DNS/OAuth changes require separate approval.

## Constraints
- Repository: Yumis84/hub-web; baseline feature/cabinet-phase0-stabilize, separate UX draft feature/cabinet-today-ux-v1.
- Backend work PR #165 in Yumis84/ai-agent-hub belongs to parallel Work session. Do not collide.
- Do not claim preview deployed without a verified public URL.
- No invented Inbox counts, project data, agent online statuses or fake production functionality.
- Preserve the original approved visual design. Do not replace it with alternative menu proposals.
