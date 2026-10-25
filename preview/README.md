# Isolated interactive cabinet preview

Author/Agent: ChatGPT-Codex. Date: 2026-10-25 UTC.
Scope: AI AGENT HUB / cabinet QA / existing REQUEST7268a425 / Draft PR6.

Build: `node preview/build.mjs`. Open generated `preview-dist/index.html` in a browser,
or serve ONLY preview-dist from a local static server. Click “Войти в демо”.
All seven approved sections and existing controls run actual app.js/cabinet.js, not an image.
Inbox/projects/community keep their honest existing unavailable states: no fabricated tasks,
counts or agent online statuses. Service fixtures are explicitly virtual/demo data.

The builder NEVER reads working config.js, OAuth config, CNAME, environment secrets or data.
It inlines approved source files, substitutes a preview-only storage namespace, adds an explicit
synthetic banner and local fetch transport, and replaces production connector instructions.
Browser CSP denies network connections/forms/frames. Only preview.invalid virtual responses
exist; this is not a signed token or functional Hub backend. Never enter real credentials.

Scenario selector covers absent/virtual service,403,500,loading, invalid login and expired
synthetic session. Logout invokes the existing auth handler and clears this preview's local
storage only. This does NOT prove server-side session revocation, actual OAuth callback,
refresh-token rotation, real Tuya or signed backend permissions. Those remain separate gates.

## Author QA

`tests/cabinet-browser.cjs` starts a bounded local loopback server and tests with real Chromium
at320/390/1280, mobile touch events, keyboard expansion, all seven routes/logout controls,
overflow, content above bottom menu, session failures, service states, errors and external
network absence. Browser requests use only synthetic transport. Browser/context/server close
in finally. CI has120s test timeout and5min job timeout, pinned Playwright1.56.1 with runner
Chrome, no application secrets. Screenshots/results + interactive preview are CI artifacts
retained14days; no deploy or main write permission. Static checks remain in their existing job.

## Separate hosting approval (NOT executed)

Configuration: preview/vercel.preview.json, repository root as build root, output preview-dist.
Only this synthetic output may be uploaded. Use a NEW isolated preview project/deployment,
never the existing production project, ai-agent-hub.fun, a production alias or DNS.
No OAuth environment variables, Supabase keys, provider credentials or production connections.
Do not activate a repository integration/automatic deployment or change Vercel project settings.
Before deployment, verify final HEAD and preview manifest hash, then obtain the owner's
explicit permission for this single isolated deployment. Verify the actual returned URL and
browser behavior before claiming hosted preview exists. Preview is not production-ready.

Rollback: delete only that separately created preview deployment/project, and remove its
artifacts; working site/data/OAuth are unaffected. Do not revert main or existing hosting.
Without hosting approval, the downloadable interactive HTML and private CI artifact are the
reviewable result; neither is claimed to be a public hosted web URL.

## Confirmed fixes from browser QA

- Persistent logout keeps the existing handler and has at least44x44px target.
- Mobile expanded-menu padding now matches the actual DOM: bottom nav is a sibling of
  .cabinet, so the previous .cabinet:has(.cabinet-bottom.expanded) selector never matched.
- Rejected/expired saved sessions close the cabinet; cached identity is not rendered before
  server validation. Explicit400/401/403 clears invalid local session credentials.
- Services on a direct hash route render after validated login through a local auth-change
  UI notification. No unauthenticated provider request is started by the initial hidden shell.

These are client UI/session-state fixes; no working OAuth, backend, ACL or secrets changed.
Independent Claude audit is pending and must not be inferred from author-run CI.
