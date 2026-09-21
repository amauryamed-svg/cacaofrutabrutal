# CAUA Health Report
Timestamp: 2026-09-21T14:01:45Z

## Summary: ⛔ BLOCKED — Network Policy Prevented All Checks

> **The remote execution environment's egress proxy denied all outbound HTTPS connections
> to `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co`.**
> No health checks could produce valid results. This is a configuration issue with
> the Claude Code remote environment, not necessarily a problem with the live site.

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⛔ BLOCKED | Proxy 403 on CONNECT to `cacaofrutabrutal.com:443` — curl exit 56, HTTP 000 |
| Security headers | ⛔ BLOCKED | Response headers seen were from the proxy's own 403, not origin |
| Supabase auth endpoint | ⛔ BLOCKED | Proxy 403 on CONNECT to `kjygovuiphbxcdxeduco.supabase.co:443` |
| Supabase REST endpoint | ⛔ BLOCKED | Same — proxy denied CONNECT |
| HTTPS redirect (HTTP→HTTPS) | ⛔ BLOCKED | HTTP 403 from proxy (not origin redirect) |
| SSL certificate validity | ⚠️ INCONCLUSIVE | No TLS errors seen, but connection never reached origin |
| /fund route accessible | ⛔ BLOCKED | Proxy 403 on CONNECT to `cacaofrutabrutal.com:443` |

## Issues Found

### CRITICAL: Egress network policy blocks all checks

**Root cause:** The Claude Code remote environment was created with a network policy that
does not allow outbound connections to `cacaofrutabrutal.com` or `supabase.co`.
The proxy's `recentRelayFailures` log confirms 8+ `connect_rejected` events for:
- `cacaofrutabrutal.com:443`
- `kjygovuiphbxcdxeduco.supabase.co:443`
- `mcp.supabase.com:443`

**Recommended action:**
1. Recreate the remote session with an **"Allowed list"** or **"Allow all"** network policy
   (see https://code.claude.com/docs/en/claude-code-on-the-web — network policy config).
2. Alternatively, run this health check from a local terminal where outbound access
   to these hosts is unrestricted.

## Notes
- `mcp.supabase.com:443` was also blocked (Supabase MCP server cannot authenticate in
  non-interactive sessions either — unrelated but consistent).
- No site code was modified during this run.
