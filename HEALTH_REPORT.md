# CAUA Health Report
Timestamp: 2026-08-31T00:00:00Z

## Summary: ⚠️ INCONCLUSIVE — Network Policy Blocked Checks

All HTTPS checks to cacaofrutabrutal.com and kjygovuiphbxcdxeduco.supabase.co were rejected by the remote execution environment's egress proxy. The checks below reflect actual curl results; any status of BLOCKED means the proxy denied the connection, not that the service is down.

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ BLOCKED | Proxy denied CONNECT to cacaofrutabrutal.com:443 — HTTP 000, exit 56 |
| Security headers | ⚠️ PARTIAL | Only `X-Content-Type-Options: nosniff` visible (likely from proxy); X-Frame-Options, Strict-Transport-Security, CSP not confirmed |
| Supabase auth endpoint | ❌ BLOCKED | Proxy denied CONNECT to kjygovuiphbxcdxeduco.supabase.co:443 — HTTP 000, exit 56 |
| Supabase REST endpoint | ❌ BLOCKED | Proxy denied CONNECT to kjygovuiphbxcdxeduco.supabase.co:443 — HTTP 000, exit 56 |
| HTTPS redirect (HTTP→HTTPS) | ❌ BLOCKED | Proxy returned 403 on port 80; not a site response |
| SSL certificate validity | ✅ NO SSL ERRORS | curl reported no SSL/certificate errors in output (inconclusive due to proxy block) |
| /fund route accessible | ❌ BLOCKED | Proxy denied CONNECT to cacaofrutabrutal.com:443 — HTTP 000, exit 56 |

## Issues Found

### Critical: Health monitoring cannot run from this environment
- **Root cause:** The remote execution environment (claude.ai cloud runner) applies an egress network policy that blocks outbound HTTPS CONNECT tunneling to arbitrary external domains.
- **Affected checks:** Site availability, Supabase auth, Supabase REST, HTTPS redirect, /fund route (5 of 7 checks).
- **Not a site outage:** This is a monitoring infrastructure failure, not evidence that the site or Supabase are down.

### Recommended Actions
1. **Move health checks to a different runner** — Use a GitHub Actions workflow, a Vercel cron, or a dedicated monitoring service (e.g., BetterUptime, Checkly, UptimeRobot) that has unrestricted egress.
2. **Alternative:** Run this scheduled check via `npx supabase` CLI locally or from a self-hosted runner where egress to these domains is allowed.
3. **Security headers gap (pre-existing concern):** The partial headers response showed only `X-Content-Type-Options: nosniff`. X-Frame-Options and Strict-Transport-Security were not confirmed. Verify these are present via a browser DevTools network tab or an external tool like securityheaders.com.

## Proxy Status
```
Proxy error: connect_rejected — the egress proxy denied the CONNECT request
(organization policy) or could not reach the destination.
Domains blocked: cacaofrutabrutal.com:443, kjygovuiphbxcdxeduco.supabase.co:443
```
