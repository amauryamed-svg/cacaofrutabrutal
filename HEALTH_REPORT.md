# CAUA Health Report
Timestamp: 2026-04-14T18:07:10Z

## Summary: ⚠️ INCONCLUSIVE — Egress Proxy Blocked All Checks

All 7 checks were attempted via `curl` and `WebFetch`. Every outbound request to
`cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co` was rejected by the
execution environment's egress proxy with HTTP 403 `host_not_allowed`.

This is a **sandbox network restriction**, not a production issue. The CAUA domains are not
in the proxy's allowlist, so no real connectivity data was collected.

---

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❓ INCONCLUSIVE | curl exit 56 — proxy blocked (403 host_not_allowed) |
| Security headers | ❓ INCONCLUSIVE | No response received from origin |
| Supabase auth endpoint | ❓ INCONCLUSIVE | proxy blocked (403 host_not_allowed) |
| Supabase REST endpoint | ❓ INCONCLUSIVE | proxy blocked (403 host_not_allowed) |
| HTTPS redirect (HTTP→HTTPS) | ❓ INCONCLUSIVE | proxy blocked (403 host_not_allowed) |
| SSL certificate validity | ❓ INCONCLUSIVE | proxy blocked before TLS handshake |
| /fund route accessible | ❓ INCONCLUSIVE | proxy blocked (403 host_not_allowed) |

---

## Issues Found

### 1. Sandbox egress restriction prevents remote checks
- **Root cause:** The Claude Code execution environment uses a strict egress proxy that only
  allows traffic to a fixed allowlist of hosts (npm, PyPI, GitHub, Google APIs, etc.).
  Neither `cacaofrutabrutal.com` nor `*.supabase.co` are in that list.
- **Impact:** Zero health data collected for this run.
- **Recommended action:** Run these checks from outside the sandbox — options:
  1. **GitHub Actions workflow** — add a scheduled job (e.g. every 6h) that runs the
     7 `curl` commands and posts results as a PR comment or Slack notification.
  2. **Vercel cron / Edge Function** — a `/api/health` endpoint that self-probes and writes
     results to a Supabase `health_logs` table.
  3. **Local terminal** — paste and run the 7 `curl` commands directly from any machine
     with unrestricted internet access.

---

## How to Re-run Manually

```bash
# 1. Site availability
curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://cacaofrutabrutal.com

# 2. Security headers
curl -sI https://cacaofrutabrutal.com | grep -iE 'x-frame-options|x-content-type|strict-transport|content-security'

# 3. Supabase auth
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU"
curl -s -o /dev/null -w '%{http_code}' -H "apikey: $ANON" \
  https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings

# 4. Supabase REST
curl -s -o /dev/null -w '%{http_code}' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  'https://kjygovuiphbxcdxeduco.supabase.co/rest/v1/user_profiles?limit=1'

# 5. HTTPS redirect
curl -s -o /dev/null -w '%{http_code}' http://cacaofrutabrutal.com

# 6. SSL validity
curl -sI --max-time 5 https://cacaofrutabrutal.com 2>&1 | grep -i 'expire\|SSL\|certificate' || echo 'SSL OK'

# 7. /fund route
curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com/fund
```

Expected results:

| Check | Expected |
|-------|----------|
| 1. Site availability | `200`, response < 3s |
| 2. Security headers | `strict-transport-security` + `x-frame-options` present; CSP recommended |
| 3. Supabase auth | `200` |
| 4. Supabase REST | `200` or `401` (RLS blocking anon is acceptable — not 404/500) |
| 5. HTTPS redirect | `301` or `302` |
| 6. SSL validity | No SSL errors in output |
| 7. /fund route | `200` (SPA handles routing) |
