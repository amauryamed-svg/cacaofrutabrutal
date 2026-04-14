# CAUA Health Report
Timestamp: 2026-04-14T17:13:41Z

## Summary: FAIL (network-blocked — checks could not execute)

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ FAIL | curl 403 — host blocked by egress proxy |
| Security headers | ❌ FAIL | curl 403 — host blocked by egress proxy |
| Supabase auth endpoint | ❌ FAIL | curl 403 — host blocked by egress proxy |
| Supabase REST endpoint | ❌ FAIL | curl 403 — host blocked by egress proxy |
| HTTPS redirect (HTTP→HTTPS) | ❌ FAIL | curl 403 — host blocked by egress proxy |
| SSL certificate validity | ❌ FAIL | curl 403 — host blocked by egress proxy |
| /fund route accessible | ❌ FAIL | curl 403 — host blocked by egress proxy |

## Root Cause

All checks failed with `curl: (56) CONNECT tunnel failed, response 403 / x-deny-reason: host_not_allowed`.

The Claude Code sandbox enforces a strict egress allowlist via an HTTPS proxy. Neither `cacaofrutabrutal.com` nor `kjygovuiphbxcdxeduco.supabase.co` is present in that list, so every outbound request is blocked before it reaches the target servers.

This is **not** a production outage — it is a sandbox environment restriction. The actual site and Supabase project may be fully operational.

## Issues Found

### BLOCKER — Checks cannot be run from this environment
- **Cause:** Egress proxy (`http://container_container_...`) denies connections to hosts outside its allowlist.
- **Resolution options:**
  1. Run the health checks from a machine / CI runner with unrestricted internet access (e.g., a GitHub Actions workflow, a Vercel cron job, or an external uptime monitor such as Better Uptime / UptimeRobot).
  2. Request that `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co` be added to the Claude Code sandbox egress allowlist (contact Anthropic support or adjust the Claude Code network policy if self-hosted).

## Recommended Follow-up Actions

1. **Set up an external uptime monitor** (e.g., UptimeRobot, Better Uptime) to run checks 1, 3, 4, 5, 7 continuously.
2. **Add a GitHub Actions workflow** (e.g., `.github/workflows/health.yml`) that runs these curl checks on a schedule (e.g., every 30 minutes) and posts results to Slack or creates a GitHub issue on failure.
3. Once accessible, re-run all checks and validate:
   - `X-Frame-Options` and `Strict-Transport-Security` headers are present.
   - CSP header is configured (currently assumed missing — common on Vercel SPAs).
   - HTTP → HTTPS redirect is enforced at the edge.
   - SSL certificate is valid and not near expiry.
   - Supabase `user_profiles` table returns 200 or 401 (RLS active), not 404/500.
