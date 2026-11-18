# Production OAuth Redirect URLs — HANDOFF

Author: CODEX  
Owner decision reference: a49a7616-d37d-405c-8376-7f8d84804fd8  
Target project: enhcnvzzkyvusthfjnci

The owner instruction in the active workstream authorized appending exactly one origin. The native Hub decision body was not accessible from the available tools. The UUID did not resolve in repository search.

| Auth field | Before | Verified after |
| --- | --- | --- |
| Redirect URLs | `https://yumis84.github.io/hub-web/**` | `https://yumis84.github.io/hub-web/**,https://ai-agent-hub.fun` |
| Site URL | `https://yumis84.github.io/hub-web/` | Same |
| OAuth consent path | `/oauth/consent` | Same |
| OAuth server / dynamic registration | Enabled / enabled | Same |

The Management API update sent only the redirect allowlist field and succeeded. An independent GET verified the exact new value and the unchanged fields listed above. No OAuth clients, callbacks, keys or ACL were changed. OAuth E2E, SQL, deploy and merge were not performed. Existing client functionality was not tested.

## Rollback

Requires a separate owner instruction. Read the current Auth config for the same project. Remove only the exact entry `https://ai-agent-hub.fun` from Redirect URLs, preserving all other current entries. If the list still matches the verified after-state, the result is exactly `https://yumis84.github.io/hub-web/**`. Send only the allowlist field and verify with a fresh GET, including Site URL and consent path. Do not replace any unrelated changes made after this handoff.
