# Personal cabinet / IoT Hub checkpoint

Author/Agent: ChatGPT Work,2026-10-29 UTC. Task4130a0c8-d6dc-4a8c-885d-d0c6cb0361d8.
ACTIVE_SCOPE ChatGPT Work / AI AGENT HUB / cabinet-iot-readonly.

## Reused architecture and source

Frontend7@850fe81df209655190834cad50eff85a05aba7a5 on independently reviewed6@1d8eff7.
Seven approved menu sections, mobile More, global logout, session-validation boundary and
existing Tuya Services view are preserved. Existing app.js authentication code unchanged.
Backend173@ea0b9fe150c66733c603965ea7778eb3a59f458c on167@49457b9 supplies Tuya service
and broker patterns; Issue166 defines remote computers,168 is Qwen,not a device gateway.
L1acceptance172 remains independent,not declared complete by these UI changes.

New devices.js is mounted INSIDE existing Services alongside existing Tuya connection
management. Cards/categories/detail/three independent statuses,last successful check,
capabilities/diagnostic/history and safe revoke. Wizard:provider/method -> owned existing
connection -> server verification -> explicit READ consent -> save -> list. No credential
or arbitrary host/URL field. CONTROL disabled in IoT and existing Tuya permission selector.
No device-control API or command is exposed by this change.

Projects/Inbox/community/agents now request their existing authorized read APIs with
loading/error/empty states instead of fabricated counters. Inbox reads bounded pages and
explicit continuation only; no ACK/claim or project switch. API availability depends on
installed backend; an API failure is never labelled an empty Inbox or disconnected device.

## Inventory: observed vs Hub-registered

| Source | Fresh external evidence | Hub integration state |
|---|---|---|
| Eduard / Yumis-pc | DesktopCommander account reports bothOnline | Hub owner binding/adapter NOT verified |
| Synology NAS | fixed TCP22/5001/8123 reachable | no universal Hub link verified |
| HomeAssistant | saved-credential auth200 valid | credential remains inside Synology connector; Hub bridge missing |
| Keenetic Giga KN-1010 | task88270917 records HTTPS challenge/DPAPI preparation | current auth not tested here; separate working adapter task preserved |
| SmartLife/Tuya | existing167/173 isolated tests | product entitlement/durable broker/OAuth/inventory runtime gates open |

These observations are not seeded as real user inventory in the frontend. Source catalog
contains only generic provider types. Historical ChatGPT connectivity is not a Hub grant.
New authorize/register/diagnose/revoke contracts device_*_v1 are PREPARED endpoints,not
claimed deployed PostgREST RPCs. The new backend facade composes existing trusted identity,
Connection Broker and provider adapter ports; no DB or secret vault is introduced. A durable
broker transaction/route bridge and real adapter wiring remain required before real pilot.

Working-copy search:both authorized PCs online;bounded source-name searches and common
project directories did not locate hub-web. Eduard search hit its2s cap,so not exhaustive.
No local files,branches,dirty changes,device settings or credentials were overwritten.
Cloud source subset directories are not git checkouts; new isolated source restored from
exact GitHub7commit. No main or existing PR branch mutation.

## Tests / review artifact

Build:node preview/build.mjs. Self-contained preview-dist/index.html includes actual source,
explicit synthetic banner,isolated local storage and CSP connect-src none. No config.js,
working OAuth/publishable keys,production data or external requests copied into preview.
node --test backend services/devices/broker-view.test.mjs:12targeted synthetic tests.
Existing cabinet-browser.cjs retains all59browser regressions;new devices-browser.cjs covers
320/390/1280 cards/detail/wizard/filter/keyboard/offline/auth/unavailable/false revoke,
registration/confirmed revoke,logout/session switch/two-user isolation and secret sentinel.
Actual CI results/HEAD/screenshots artifact are recorded in Hub and PR; local syntax/build
passed. Cloud executor lacked a Chromium binary; actual browser execution is in GitHubCI,
not falsely reported local. No public hosted preview was created.

Independent review:baseline6 accepted by Claude;7/173 audit had source-access blocker.
This delta needs separate source package/current-head review; author tests are not auditPASS.

## Pilot and rollback boundary

Owner approval required before any hosted routing/DB/OAuth changes,public preview or real
CONTROL. First pilot:existing isolated Hub,exact reviewed frontend/backend commits,
dedicated two-user sessions and READ-only adapter whose existing account reference is
proved owner-bound;server durable proof/replay/audit persistence must be wired. Existing
external connectors cannot be imported by copying tokens or reusing another user's session.
Use the current connection when broker can safely bind it;otherwise needs connection.

No server persistence or route deployment performed here. Rollback staged code by restoring
frontend7 and removing unactivated device facade wiring;leave existing connections/audit
and provider/device settings intact. Existing pages config/CNAME/DNS/OAuth untouched.
Full real OAuth,Hub device registration,live-provider diagnostic throughHub and revocation
E2E remain BLOCKED;do not announce production or real device pilot READY from simulations.
