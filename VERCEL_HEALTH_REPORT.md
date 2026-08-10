# Vercel Deploy Health Report
Timestamp: 2026-08-10T14:30:00Z
Window: last 7 days
Project: caua-mvp (Vercel project — id not retrievable; Vercel MCP enabledInChat: false)

## Summary: PASS ⚠️ (pipeline healthy; site & Vercel MCP inaccessible from monitor container)

> **Note — 63rd consecutive egress-blocked run.** This remote execution container's
> egress proxy blocks outbound HTTPS to external domains (cacaofrutabrutal.com, vercel.com).
> All curl-based checks return 000/403/CURLE_RECV_ERROR from the proxy, NOT from the live site.
> The Vercel MCP connector is installed but `enabledInChat: false` for this session.
> Evidence that the site is UP: both 7-day GitHub Actions runs completed `success` and
> the promote-alias step succeeded, meaning Vercel confirmed a READY deployment and
> aliased it to cacaofrutabrutal.com + www.

## Deploy activity (7d)
- Total: 2 | READY/success: 2 | ERROR: 0 | CANCELED: 0
- Last READY: Run 31396216667 — c7af940 — "chore: health report 2026-08-10 — all checks blocked by proxy egress" — ~0h ago — build 61s
- Last READY (prior): Run 30822295051 — 62a43c2 — "chore: Vercel health report 2026-08-03 — pipeline PASS (62nd blocked run)" — 167h ago — build 61s
- Last ERROR: none in window

## Build performance
- Last 2 successful runs avg build time: 61s (gh Actions wall-clock, includes polling wait + alias promotion)
- Actual Vite build is subset of this; 61s total is well within thresholds
- Verdict: OK (historical baseline ~90s; current ~61s = faster)

## Domains
- cacaofrutabrutal.com → alias promotion succeeded in both runs ✅ (inferred from gh Actions `success`)
- www.cacaofrutabrutal.com → same ✅
- Vercel MCP domain query: NOT AVAILABLE (enabledInChat: false)

## Checks
| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ BLOCKED | Proxy returns 403; curl HTTP 000. Not a site failure — egress policy. |
| 2 | Bundle freshness | ⚠️ BLOCKED | curl body empty due to proxy block. Cannot verify asset hashes. |
| 3 | Vercel deploys 7d | ✅ PASS (via gh) | gh Actions: 2 runs, 2 success, 0 ERROR |
| 4 | Build duration | ✅ OK | 61s avg — well under 4-min threshold |
| 5 | Domain alias | ✅ PASS (inferred) | promote-alias step succeeded both runs; workflow aliases both domains |
| 6 | Failed deploy logs | ✅ N/A | No ERROR deployments in 7d |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | 2 gh success runs; alias promotion confirmed READY dep per run |
| 8 | Workflow integrity | ✅ UNCHANGED | No changes to deploy-vercel.yml or vercel.json in last 7 days |
| 9 | SPA routes | ⚠️ BLOCKED | curl exit 56 (proxy block); not a routing regression |

## Failed deployments (if any)
None in the 7-day window.

## Issues / Action items
1. **Vercel MCP not enabled in chat**: The Vercel MCP server is installed
   (`installedServerId: ce17b2be-c8b3-4032-8770-a1702e6da06b`) but `enabledInChat: false`.
   **Action**: Enable the Vercel connector for this session in claude.ai connector settings.
   Once enabled, direct deployment/domain queries will replace the gh-Actions-inferred data.

2. **Egress proxy blocks outbound HTTPS**: Site availability, bundle freshness, and SPA
   route checks cannot run from this container. This has been the case for 63 consecutive
   weekly runs. Checks 1, 2, 9 will remain BLOCKED until the monitor is moved to an
   environment with open egress, or a Cloudflare Worker / external uptime service is used.

3. (If any real concern): No genuine failures detected in the 7-day window based on
   available data (gh Actions pipeline fully green).

## Vercel MCP tools used
- None used (Vercel MCP `enabledInChat: false` for this session)
- `mcp__github__actions_list` (list_workflow_runs) — primary deploy data source
- `SearchMcpRegistry` — confirmed Vercel MCP is installed but disabled for chat
