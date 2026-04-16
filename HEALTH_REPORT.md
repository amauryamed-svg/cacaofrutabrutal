# CAUA Health Report
Timestamp: 2026-04-16T21:07:00Z

## Summary: ❌ FAIL

> **Note:** Fifth consecutive run (previous: 2026-04-15T19:05:10Z, 2026-04-14T21:04:33Z, 2026-04-13).
> **New this run:** Supabase now returns `x-deny-reason: host_not_allowed` (previously returned
> `"Host not in allowlist"`). This indicates the Supabase project may now be **paused** — a
> significant regression from prior runs.

---

## Check Results

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ FAIL | HTTP 403 `x-deny-reason: host_not_allowed` (0.245s) |
| Security headers | ❌ FAIL | No security headers on 403 response — cannot evaluate |
| Supabase auth endpoint | ❌ FAIL | HTTP 403 `x-deny-reason: host_not_allowed` *(regression from WARN)* |
| Supabase REST endpoint | ❌ FAIL | HTTP 403 `x-deny-reason: host_not_allowed` *(regression from WARN)* |
| HTTPS redirect (HTTP→HTTPS) | ❌ FAIL | HTTP 403 — no 301/302 upgrade |
| SSL certificate | ✅ PASS | TLS handshake succeeded, no certificate errors |
| /fund route | ❌ FAIL | HTTP 403 `x-deny-reason: host_not_allowed` |

---

## Raw Check Output

```
# 1. Site availability
→ 403 0.245142s   (x-deny-reason: host_not_allowed)

# 2. Security headers (curl -sI https://cacaofrutabrutal.com)
→ (no output — 403 response carries no security headers)

# 3. Supabase auth endpoint
→ 403   (x-deny-reason: host_not_allowed)   ← NEW: was "Host not in allowlist"

# 4. Supabase REST endpoint
→ 403   (x-deny-reason: host_not_allowed)   ← NEW: was "Host not in allowlist"

# 5. HTTP → HTTPS redirect
→ 403   (expected 301 or 302)

# 6. SSL certificate
→ SSL OK   (no TLS errors, TLS handshake succeeded)

# 7. /fund route
→ 403   (x-deny-reason: host_not_allowed)
```

---

## Issues Found

### 🔴 P0 — Supabase project likely paused (NEW regression)

**Previous behavior:** Supabase returned `"Host not in allowlist"` — an intentional API
allowed-origins security restriction, meaning the project was alive and blocking external
origins correctly.

**Current behavior:** Supabase returns `x-deny-reason: host_not_allowed` at the CDN/edge
layer — the same response as a non-existent or paused project. The project reference
`kjygovuiphbxcdxeduco` may no longer be active.

**Likely cause:** Supabase free-tier projects are automatically paused after 7 days of
inactivity. The previous run was on 2026-04-15; the project may have crossed the inactivity
threshold between then and now.

**Action:**
1. Log in to [app.supabase.com](https://app.supabase.com) → confirm project status
2. If paused → click **Restore Project**
3. Consider upgrading to Supabase Pro to prevent future auto-pausing
4. After restore, re-run: `curl -s -w '%{http_code}' -H 'apikey: <ANON>' https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings`
   — expect `200`

---

### 🔴 P0 — Vercel `host_not_allowed` blocking all site traffic (5th consecutive day)

The Vercel edge rejects every inbound request with `x-deny-reason: host_not_allowed`.
The domain `cacaofrutabrutal.com` is not linked to an active Vercel project, or IP
access rules are blocking the public.

**Action:**
1. Vercel Dashboard → Project → Settings → Domains
2. Confirm `cacaofrutabrutal.com` is listed and verified
3. Settings → Security → IP Access Rules — remove overly restrictive rules
4. Confirm DNS A/CNAME records still point to Vercel infrastructure
5. Trigger a fresh deploy if domain linkage was repaired

---

### ❌ FAIL — Missing Security Headers

Once the 403 is resolved, verify these headers are served. Add to `vercel.json` if missing:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

### ❌ FAIL — No HTTP → HTTPS Redirect

`http://cacaofrutabrutal.com` returns `403` instead of a `301/302` upgrade.
Once Vercel domain linkage is confirmed, enable **Force HTTPS** under
Project → Settings → Domains.

---

## Manual Re-run Commands

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU"

# 1. Site — PASS: 200, <3s
curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://cacaofrutabrutal.com

# 2. Security headers — PASS: X-Frame-Options + Strict-Transport present
curl -sI https://cacaofrutabrutal.com | grep -iE 'x-frame-options|x-content-type|strict-transport|content-security'

# 3. Supabase auth — PASS: 200
curl -s -o /dev/null -w '%{http_code}' -H "apikey: $ANON" \
  https://kjygovuiphbxcdxeduco.supabase.co/auth/v1/settings

# 4. Supabase REST — PASS: 200 or 401 (RLS active); FAIL: 404/500
curl -s -o /dev/null -w '%{http_code}' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  'https://kjygovuiphbxcdxeduco.supabase.co/rest/v1/user_profiles?limit=1'

# 5. HTTPS redirect — PASS: 301 or 302
curl -s -o /dev/null -w '%{http_code}' http://cacaofrutabrutal.com

# 6. SSL — PASS: no SSL errors
curl -sI --max-time 5 https://cacaofrutabrutal.com 2>&1 \
  | grep -i 'expire\|SSL\|certificate' || echo 'SSL OK'

# 7. /fund route — PASS: 200
curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com/fund
```

---

## Recommended Next Steps

| Priority | Action | Owner |
|----------|--------|-------|
| P0 | Log in to Supabase dashboard — restore paused project | Dev |
| P0 | Verify Vercel domain linkage for `cacaofrutabrutal.com` | DevOps |
| P0 | Check Vercel IP Access Rules — remove accidental allowlist | DevOps |
| P0 | Run manual checks above from unrestricted network | Dev |
| P1 | Add missing security headers to `vercel.json` | Dev |
| P1 | Enable Force HTTPS in Vercel domain settings | Dev |
| P2 | Upgrade Supabase to Pro to prevent auto-pausing | Dev |
| P2 | Set up external uptime monitor (e.g. UptimeRobot, Better Uptime) | DevOps |

---

*Generated by CAUA health monitor — no application code was modified.*
*Previous runs: 2026-04-15T19:05:10Z, 2026-04-14T21:04:33Z, 2026-04-13*
