# CAUA Health Report
Timestamp: 2026-04-16T23:05:06Z

## Summary: ⚠️ INCONCLUSIVE — Claude Code sandbox blocks all external egress

> **CORRECTION TO PRIOR REPORTS (2026-04-13 through 2026-04-16T21:07Z):**
> Previous runs diagnosed HTTP 403s as "Vercel IP Access Rules blocking the monitor" or
> "Supabase origin allowlist." This was incorrect. Verbose curl now reveals:
> - TLS cert issuer: `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA`
> - HTTP header: `x-deny-reason: host_not_allowed` (set by sandbox, not Vercel)
> - Supabase body: `"Host not in allowlist"` (sandbox proxy rejection, not Supabase)
>
> **The Claude Code execution environment intercepts and blocks all outbound HTTPS requests
> to external hosts via a TLS-inspecting egress proxy. No production check can be
> completed from this environment. The site and Supabase may be fully healthy.**

---

## Check Results

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⚠️ INCONCLUSIVE | Sandbox egress blocked — `x-deny-reason: host_not_allowed` |
| Security headers | ⚠️ INCONCLUSIVE | No headers returned; request blocked before origin |
| Supabase auth endpoint | ⚠️ INCONCLUSIVE | Sandbox blocked — body: `"Host not in allowlist"` |
| Supabase REST endpoint | ⚠️ INCONCLUSIVE | Sandbox blocked — body: `"Host not in allowlist"` |
| HTTPS redirect (HTTP→HTTPS) | ⚠️ INCONCLUSIVE | Sandbox blocked on port 80 before redirect could fire |
| SSL certificate | ⚠️ INCONCLUSIVE | Cert seen is sandbox inspection cert, not real origin cert |
| /fund route | ⚠️ INCONCLUSIVE | Sandbox blocked — `x-deny-reason: host_not_allowed` |

---

## Raw Check Output

```
# 1. Site availability
→ 403  0.644467s

# 2. Security headers (curl -sI https://cacaofrutabrutal.com)
→ (no output — all blocked)

# 3. Supabase auth endpoint
→ 403   body: "Host not in allowlist"

# 4. Supabase REST endpoint
→ 403   body: "Host not in allowlist"

# 5. HTTP → HTTPS redirect (http://)
→ 403   x-deny-reason: host_not_allowed

# 6. SSL certificate
→ SSL OK (but cert issuer: O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
          — this is the sandbox inspection cert, NOT the real Vercel/LetsEncrypt cert)

# 7. /fund route
→ 403   x-deny-reason: host_not_allowed
```

---

## Root Cause

The Claude Code agent runs inside an Anthropic sandbox with a **TLS-inspecting egress proxy**.
All outbound HTTPS connections are intercepted and the proxy substitutes its own certificate.
Any host not on the sandbox allowlist is rejected with HTTP 403 and `x-deny-reason: host_not_allowed`.

This is a **monitoring environment limitation**, not a production issue.

---

## Recommended Fix for Monitoring

Run these checks from an environment with unrestricted outbound access:

| Option | How |
|--------|-----|
| **Local machine** | Run the curl commands below from a developer laptop |
| **GitHub Actions** | Add a `.github/workflows/health.yml` cron job (see template below) |
| **UptimeRobot / Better Uptime** | Set up free external uptime monitoring |
| **Vercel cron** | Call a `/api/health` serverless function that checks Supabase internally |

### GitHub Actions Health Check Template

```yaml
# .github/workflows/health.yml
name: Health Check
on:
  schedule:
    - cron: '0 */6 * * *'   # every 6 hours
  workflow_dispatch:

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Site availability
        run: |
          STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com)
          echo "Site: $STATUS"
          [ "$STATUS" = "200" ] || exit 1

      - name: Security headers
        run: |
          curl -sI https://cacaofrutabrutal.com \
            | grep -iE 'x-frame-options|strict-transport' \
            || (echo "WARN: Missing security headers" && exit 1)

      - name: Supabase auth
        run: |
          STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
            -H 'apikey: ${{ secrets.SUPABASE_ANON_KEY }}' \
            https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings)
          echo "Supabase auth: $STATUS"
          [ "$STATUS" = "200" ] || exit 1

      - name: HTTPS redirect
        run: |
          STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://cacaofrutabrutal.com)
          echo "HTTP redirect: $STATUS"
          [[ "$STATUS" = "301" || "$STATUS" = "302" ]] || exit 1
```

### Manual Re-run Commands (from a local machine)

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU"

# 1. Site — PASS: 200, <3s
curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://cacaofrutabrutal.com

# 2. Security headers — PASS: X-Frame-Options + Strict-Transport present
curl -sI https://cacaofrutabrutal.com | grep -iE 'x-frame-options|x-content-type|strict-transport|content-security'

# 3. Supabase auth — PASS: 200
curl -s -o /dev/null -w '%{http_code}' \
  -H "apikey: $ANON" \
  https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings

# 4. Supabase REST — PASS: 200 or 401 (RLS active); FAIL: 404/500
curl -s -o /dev/null -w '%{http_code}' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  'https://kjygovuiphbxcdxeduco.supabase.co/rest/v1/user_profiles?limit=1'

# 5. HTTPS redirect — PASS: 301 or 302
curl -s -o /dev/null -w '%{http_code}' http://cacaofrutabrutal.com

# 6. SSL — PASS: no SSL errors, real issuer should be Let's Encrypt or Vercel
curl -sv --max-time 5 https://cacaofrutabrutal.com 2>&1 | grep -i 'issuer\|expire\|SSL'

# 7. /fund route — PASS: 200
curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com/fund
```

---

*Generated by CAUA health monitor — no application code was modified.*
*Run history: 2026-04-16T23:05Z · 2026-04-16T21:07Z · 2026-04-15T19:05Z · 2026-04-14T21:04Z · 2026-04-13*
