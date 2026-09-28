# CAUA Health Report
Timestamp: 2026-09-28T14:09:23Z

## Summary: ⛔ BLOCKED — Network policy prevented all checks

All health checks failed to execute because the remote execution environment's
egress proxy denied outbound CONNECT requests to both `cacaofrutabrutal.com:443`
and `kjygovuiphbxcdxeduco.supabase.co:443` with HTTP 403 (organization policy).

This is a **monitoring infrastructure failure**, not necessarily a site outage.
The proxy `/status` endpoint confirmed: `"gateway answered 403 to CONNECT (policy denial or upstream failure)"`.

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⛔ BLOCKED | Egress proxy denied CONNECT to cacaofrutabrutal.com:443 |
| Security headers | ⛔ BLOCKED | Egress proxy denied CONNECT to cacaofrutabrutal.com:443 |
| Supabase auth endpoint | ⛔ BLOCKED | Egress proxy denied CONNECT to kjygovuiphbxcdxeduco.supabase.co:443 |
| Supabase REST endpoint | ⛔ BLOCKED | Egress proxy denied CONNECT to kjygovuiphbxcdxeduco.supabase.co:443 |
| HTTPS redirect | ⛔ BLOCKED | Egress proxy denied CONNECT to cacaofrutabrutal.com:80 |
| SSL certificate validity | ⛔ BLOCKED | Egress proxy denied CONNECT to cacaofrutabrutal.com:443 |
| /fund route accessible | ⛔ BLOCKED | Egress proxy denied CONNECT to cacaofrutabrutal.com:443 |

## Issues found

### ⛔ Monitoring environment: egress policy blocks external health checks
- **Root cause:** The Claude Code remote execution environment's egress proxy
  (`HTTPS_PROXY`) is configured with an organization-level policy that denies
  CONNECT tunnels to external production domains.
- **Evidence:** `recentRelayFailures` in proxy status shows 403 for
  `cacaofrutabrutal.com:443` and `mcp.supabase.com:443`.
- **Impact:** Zero visibility — no check could run, site status is unknown.
- **Recommended actions:**
  1. **Re-run this scheduled task from a different environment** (e.g., a
     non-restricted Claude Code session, a GitHub Action, or an external
     uptime monitor like Better Uptime / UptimeRobot).
  2. **Allow-list production domains** in the Claude Code on the Web environment
     network policy (see https://code.claude.com/docs/en/claude-code-on-the-web).
  3. **Set up an independent uptime monitor** for `cacaofrutabrutal.com` and
     the Supabase project so you get alerts even when this routine is blocked.

## Environment details
- Runner: Claude Code remote execution environment (cloud container)
- Proxy: agent proxy active, `bundleCoversEveryHost: true`, `selective: false`
- Proxy status endpoint: `http://127.0.0.1:40853/__agentproxy/status`
- Proxy error: `gateway answered 403 to CONNECT (policy denial or upstream failure)`
