# CAUA Health Report
Timestamp: 2026-04-16T19:03:11Z

## Summary: ❌ FAIL / ❓ INCONCLUSIVE

All 7 `curl` checks were executed. Every request to `cacaofrutabrutal.com` and
`kjygovuiphbxcdxeduco.supabase.co` returned HTTP 403 with header
`x-deny-reason: host_not_allowed`.

> **Note:** This is the **third consecutive run** (previous: 2026-04-15T19:05:10Z and
> 2026-04-14T21:04:33Z) with identical results. The sandbox egress IP is consistently
> blocked by the Vercel edge and/or Supabase Network Restrictions. This is now a
> persistent issue requiring manual verification from an unrestricted network.

---

## Check Results

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ FAIL | HTTP 403 — `x-deny-reason: host_not_allowed` (0.32s) |
| Security headers | ❌ FAIL | Cannot audit — 403 returns no security headers |
| Supabase auth endpoint | ❌ FAIL | HTTP 403 — `host_not_allowed` |
| Supabase REST endpoint | ❌ FAIL | HTTP 403 — `host_not_allowed` |
| HTTPS redirect (HTTP→HTTPS) | ❌ FAIL | HTTP 403 instead of 301/302 |
| SSL certificate | ✅ PASS | TLS handshake succeeded, no certificate errors |
| /fund route accessible | ❌ FAIL | HTTP 403 — same block as root |

SSL is the only clean PASS — the TLS layer resolves and the certificate is valid.

---

## Raw Check Output

```
# 1. Site availability
→ 403 0.322740s

# 2. Security headers (curl -sI https://cacaofrutabrutal.com)
→ (no output — 403 response carries no security headers)
  Response headers observed: x-deny-reason: host_not_allowed, content-type, date

# 3. Supabase auth endpoint
→ 403

# 4. Supabase REST endpoint
→ 403

# 5. HTTP → HTTPS redirect
→ 403  (expected 301 or 302)

# 6. SSL certificate
→ SSL OK  (no certificate errors)

# 7. /fund route
→ 403
```

---

## Issues Found

### 🔴 P0 — Persistent `x-deny-reason: host_not_allowed` (3 consecutive days)

The Vercel edge is rejecting every inbound request from this monitoring environment.
This pattern has now been observed on 2026-04-14, 2026-04-15, and 2026-04-16.

**Two root causes to rule out:**

1. **Vercel IP Access Rules** — The project may have an IP allowlist configured under
   Settings → Security → IP Access Rules. The monitoring sandbox egress IP is not in the
   allowlist. This would be a misconfiguration if external monitoring or real user traffic
   is expected.

2. **Domain not linked to Vercel project** — `x-deny-reason: host_not_allowed` is also the
   exact Vercel edge error when a custom domain is not attached to any project (e.g. domain
   added to a deleted project, or DNS records drifted).

**Action:**
1. Log in to Vercel Dashboard → Project → Settings → Domains
2. Confirm `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` are listed and verified
3. Check Settings → Security → IP Access Rules — remove any rule blocking public access
4. If domain is missing, re-add and trigger a redeploy
5. Confirm DNS A/CNAME records still point to Vercel

### 🔴 P0 — Supabase network restrictions blocking external checks

Both `/auth/v1/settings` and `/rest/v1/user_profiles` return 403.

**Two interpretations:**
- **Security positive:** Supabase Network Restrictions are intentionally enabled (limits
  API surface to known CIDR ranges). This is a good security posture for production.
- **Project paused:** If Network Restrictions are NOT intentionally configured, the Supabase
  free-tier project may be **auto-paused** (Supabase pauses free projects after 7 days of
  inactivity and returns 403).

**Action:**
1. Go to Supabase Dashboard → Project `kjygovuiphbxcdxeduco`
2. If paused, click **Restore project** (~2 min)
3. If intentionally restricted: add monitoring egress IP to the allowlist, or accept that
   Supabase health checks must run from inside the allowed CIDR
4. Consider upgrading to Supabase Pro to prevent auto-pause in production

### 🔴 P0 — No HTTP→HTTPS redirect observable

`http://cacaofrutabrutal.com` returns `403` instead of `301/302 → https://`.
The edge block fires before any redirect logic. Once the 403 is resolved, verify that
HTTP redirects to HTTPS (Vercel enforces this by default, but must be re-confirmed).

### 🟡 P1 — Security headers not auditable

Once the site returns 200, verify these headers are present (add to `vercel.json` if missing):

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

## Manual Re-run Commands

Run these from any machine with unrestricted internet access:

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU"

# 1. Site availability — PASS: 200, <3s
curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://cacaofrutabrutal.com

# 2. Security headers — PASS: X-Frame-Options + Strict-Transport present; WARN: no CSP
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

# 6. SSL validity — PASS: no SSL errors
curl -sI --max-time 5 https://cacaofrutabrutal.com 2>&1 \
  | grep -i 'expire\|SSL\|certificate' || echo 'SSL OK'

# 7. /fund route — PASS: 200
curl -s -o /dev/null -w '%{http_code}' https://cacaofrutabrutal.com/fund
```

---

## Recommended Next Steps

| Priority | Action | Owner |
|----------|--------|-------|
| P0 | Verify Vercel domain linkage for `cacaofrutabrutal.com` | DevOps |
| P0 | Check Vercel IP Access Rules (remove accidental allowlist) | DevOps |
| P0 | Restore Supabase project if paused | DevOps |
| P0 | Run manual checks above from unrestricted network | Dev |
| P1 | Add missing security headers to `vercel.json` | Dev |
| P2 | Upgrade Supabase to Pro (prevent auto-pause in production) | Product |
| P2 | Set up external uptime monitor (e.g. UptimeRobot, Better Uptime) | DevOps |

---

*Generated by CAUA health monitor — no application code was modified.*
*Previous runs: 2026-04-15T19:05:10Z, 2026-04-14T21:04:33Z (same results observed each time)*
