# CAUA Health Report
Timestamp: 2026-09-07T00:00:00Z

## Summary: ⚠️ INCONCLUSIVE — Network policy blocked external connections

> **Note:** This health check ran in a remote execution environment whose egress proxy
> denied outbound HTTPS connections to both `cacaofrutabrutal.com:443` and
> `kjygovuiphbxcdxeduco.supabase.co:443`. Checks that require those connections
> returned HTTP 000 (connection rejected). The results below reflect what was observable;
> they do NOT indicate the site or Supabase are down — only that they were unreachable
> from this container.

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ BLOCKED | HTTP 000 — egress proxy denied CONNECT to cacaofrutabrutal.com:443 |
| Security headers | ⚠️ INCONCLUSIVE | Only `X-Content-Type-Options: nosniff` detected; `X-Frame-Options` and `Strict-Transport-Security` NOT seen (may be proxy-filtered) |
| Supabase auth endpoint | ❌ BLOCKED | HTTP 000 — egress proxy denied CONNECT to kjygovuiphbxcdxeduco.supabase.co:443 |
| Supabase REST endpoint | ❌ BLOCKED | HTTP 000 — egress proxy denied CONNECT to kjygovuiphbxcdxeduco.supabase.co:443 |
| HTTPS redirect (HTTP→HTTPS) | ❌ BLOCKED | Got HTTP 403 from proxy, not from origin — result is proxy rejection, not site redirect |
| SSL certificate validity | ⚠️ INCONCLUSIVE | No SSL error in curl output, but connection was blocked before TLS handshake completed |
| /fund route accessible | ❌ BLOCKED | HTTP 000 — egress proxy denied CONNECT to cacaofrutabrutal.com:443 |

## Issues Found

### Critical: Health checks could not run
- **Root cause:** The remote execution environment's network policy blocks outbound HTTPS to `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co`.
- **Recommended action:** Re-run this scheduled task with a network policy that allows HTTPS egress to the target domains, OR run equivalent checks from a machine with unrestricted network access (e.g., a GitHub Action, a Vercel cron, or a local workstation).
- **Proxy status command:** `curl -sS "$HTTPS_PROXY/__agentproxy/status"` for details.

### Warning: Missing security headers (unconfirmed)
- Only `X-Content-Type-Options: nosniff` was returned by the security headers check. `X-Frame-Options` and `Strict-Transport-Security` were absent from what was visible. Since the connection was likely intercepted by the proxy, this result is unreliable — verify from an unrestricted network.

## Recommended Next Steps
1. Configure the Claude Code remote environment with a network policy that permits HTTPS to `cacaofrutabrutal.com` and `*.supabase.co`.
2. Alternatively, move these health checks to a GitHub Action or an uptime monitoring service (e.g., BetterUptime, UptimeRobot, Checkly) that has direct internet access.
3. Once connectivity is restored, re-run all 7 checks and confirm site availability, Supabase health, and security header presence.
