# CAUA Health Report
Timestamp: 2026-04-20T22:08:41Z

## Summary: ⚠️ INCONCLUSIVE — Sandbox Egress Block

> **All HTTP checks were blocked by the Anthropic sandbox egress proxy.** Every request to `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co` returned **HTTP 403 `x-deny-reason: host_not_allowed`** — issued by the proxy, not by the real servers. This is a network-level sandbox restriction, **not a production outage**. Results below cannot confirm or deny real site health. Re-run from an external environment (local terminal, CI runner, or uptime monitor).

---

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⚠️ INCONCLUSIVE | 403 `host_not_allowed` — sandbox egress proxy, 0.44s response time |
| Security headers | ⚠️ INCONCLUSIVE | No app-layer headers returned; blocked at proxy |
| Supabase auth endpoint | ⚠️ INCONCLUSIVE | 403 `host_not_allowed` — sandbox egress proxy |
| Supabase REST endpoint | ⚠️ INCONCLUSIVE | 403 `host_not_allowed` — sandbox egress proxy |
| HTTPS redirect (HTTP→HTTPS) | ⚠️ INCONCLUSIVE | HTTP also returned 403; redirect behavior unverifiable from sandbox |
| SSL certificate | ⚠️ WARN | TLS handshake completed. Proxy cert CN=`cacaofrutabrutal.com` expires **2026-05-20** (~30 days). Real cert unverifiable through TLS inspection proxy. |
| /fund route | ⚠️ INCONCLUSIVE | 403 `host_not_allowed` — sandbox egress proxy |

---

## Issues Found

### 1. ⚠️ WARN — SSL Certificate Expiry in ~30 Days
- **What:** The TLS certificate (as seen through the Anthropic TLS-inspection proxy, which mirrors the real domain CN) expires **May 20, 2026** — 30 days from today.
- **Action:** Verify from a browser or run `openssl s_client -connect cacaofrutabrutal.com:443 2>/dev/null | openssl x509 -noout -dates` locally. On Vercel, auto-renewal triggers ~30 days before expiry, so renewal should be in progress now — confirm it is not blocked.

### 2. ℹ️ INFO — Sandbox Egress Policy Prevents Health Checks from Claude Code
- **Root cause:** `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA` intercepts all HTTPS; a deny rule blocks non-allowlisted hosts.
- **This is NOT a production site failure.** No evidence of a real outage.
- **Action:** Move automated health monitoring outside the sandbox (see setup below).

---

## Raw curl Evidence

```
# Site availability
$ curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://cacaofrutabrutal.com
403 0.441091s

# Security headers
$ curl -sI https://cacaofrutabrutal.com | grep -iE 'x-frame-options|...'
(no output — proxy returns 403 before app headers)

# Supabase auth endpoint
$ curl ... https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings
403

# Supabase REST endpoint
$ curl ... 'https://kjygovuiphbxcdxeduco.supabase.co/rest/v1/user_profiles?limit=1'
403

# HTTP→HTTPS redirect
$ curl -s -o /dev/null -w '%{http_code}' http://cacaofrutabrutal.com
403

# SSL certificate (verbose)
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
* Server certificate:
*  subject: CN=cacaofrutabrutal.com
*  expire date: May 20 22:08:38 2026 GMT          ← ~30 days
*  issuer: O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
*  SSL certificate verify ok.
< HTTP/2 403
< x-deny-reason: host_not_allowed

# /fund route
$ curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com/fund
403
```

---

## Recommended Monitoring Setup

**Option A — GitHub Actions cron** (free, runs on real internet):
```yaml
# .github/workflows/health.yml
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Site availability
        run: |
          CODE=$(curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com)
          [ "$CODE" = "200" ] || (echo "FAIL: $CODE" && exit 1)
      - name: Supabase auth
        run: |
          CODE=$(curl -s -o /dev/null -w '%{http_code}' \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings)
          [ "$CODE" = "200" ] || (echo "FAIL: $CODE" && exit 1)
```

**Option B — External uptime service:** UptimeRobot or BetterStack (free tier covers basic availability + HTTPS + cert expiry alerts).

---

## Quick Local Health Check Commands

Run these from your local terminal or any non-sandbox environment:

```bash
# 1. Site availability (expect: 200, < 3s)
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://cacaofrutabrutal.com

# 2. Security headers (expect: X-Frame-Options + Strict-Transport-Security present)
curl -sI https://cacaofrutabrutal.com | grep -iE 'x-frame-options|x-content-type|strict-transport|content-security'

# 3. Supabase auth endpoint (expect: 200)
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU' \
  https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings

# 4. Supabase REST endpoint (expect: 200 or 401)
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU' \
  'https://kjygovuiphbxcdxeduco.supabase.co/rest/v1/user_profiles?limit=1'

# 5. HTTPS redirect (expect: 301 or 302)
curl -s -o /dev/null -w '%{http_code}\n' http://cacaofrutabrutal.com

# 6. SSL cert expiry
openssl s_client -connect cacaofrutabrutal.com:443 2>/dev/null | openssl x509 -noout -dates

# 7. /fund route (expect: 200)
curl -s -o /dev/null -w '%{http_code}\n' https://cacaofrutabrutal.com/fund
```
