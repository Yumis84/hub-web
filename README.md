# Hub Web Auth — FIRST TENANT bootstrap

Minimal static Auth UI for Hub Core v2.

## Security
- Browser uses only Supabase URL + publishable key.
- Never use service_role/admin credentials in this frontend.
- Passwords/tokens are not manually persisted by application code.
- app.users is populated by the existing auth trigger.
- Private Hub data remains behind RLS/MCP Gateway.

## Configure
`config.js` contains only the Supabase public browser configuration. Never add service-role/admin credentials.\n\nFor production hosting, inject equivalent public runtime config during deployment and keep `config.js` out of source control if desired.

## Acceptance
1. Register User A via UI.
2. Confirm auth.users and app.users share the same UUID.
3. Sign in/out and reload session.
4. Register User B independently.
5. Run MCP/RLS isolation tests; do not infer isolation from UI behavior.
