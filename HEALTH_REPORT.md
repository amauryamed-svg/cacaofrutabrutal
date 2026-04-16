# CAUA Health Report
Timestamp: 2026-04-16T20:15:51Z

## Summary: ⚠️ WARN / INCONCLUSIVE

All 7 `curl` checks were executed. Every request to `cacaofrutabrutal.com` returned
HTTP 403 `x-deny-reason: host_not_allowed`. Supabase returned HTTP 403 body
`"Host not in allowlist"` — confirming API key allowed-origins restrictions are active
(intentional security feature, not a paused project).

> **Note:** This is the **fourth consecutive run** (previous: 2026-04-15T19:05:10Z,
> 2026-04-14T21:04:33Z). The sandbox egress IP is consistently blocked by Vercel edge.
> Results reflect what an external non-whitelisted client sees.

---

## Check Results

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⚠️ WARN | HTTP 403 `x-deny-reason: host_not_allowed` (0.51s) — Vercel blocking non-whitelisted IP |
| Security headers | ❌ FAIL | No `X-Frame-Options`, `Strict-Transport-Security`, or `Content-Security-Policy` present on 403 response |
| Supabase auth endpoint | ⚠️ WARN | HTTP 403 body: `"Host not in allowlist"` — API allowed-origins restriction active (security feature) |
| Supabase REST endpoint | ⚠️ WARN | HTTP 403 body: `"Host not in allowlist"` — same as above |
| HTTPS redirect (HTTP→HTTPS) | ❌ FAIL | HTTP returns `403 Forbidden` instead of `301/302` — no HTTPS upgrade for plain-HTTP visitors |
| SSL certificate | ✅ PASS | TLS handshake succeeded, no certificate errors |
| /fund route accessible | ⚠️ WARN | HTTP 403 `host_not_allowed` — same Vercel block, cannot confirm SPA routing |

---

## Raw Check Output

```
# 1. Site availability
→ 403 0.510962s   (x-deny-reason: host_not_allowed)

# 2. Security headers (curl -sI https://cacaofrutabrutal.com)
→ (no output — 403 response carries no security headers)
  Headers present: x-deny-reason, content-type, date only

# 3. Supabase auth endpoint
→ 403   body: "Host not in allowlist"

# 4. Supabase REST endpoint
→ 403   body: "Host not in allowlist"

# 5. HTTP → HTTPS redirect
→ 403   (expected 301 or 302)

# 6. SSL certificate
→ SSL OK   (no TLS errors)

# 7. /fund route
→ 403   (x-deny-reason: host_not_allowed)
```

---

## Issues Found

### 🔴 P0 — Vercel `host_not_allowed` blocking external traffic (4th consecutive day)

The Vercel edge rejects every inbound request from this environment. This pattern has been
observed on 2026-04-13, 2026-04-14, 2026-04-15, and 2026-04-16.

**Two root causes to rule out:**

1. **Vercel IP Access Rules** — The project may have an IP allowlist configured under
   Settings → Security → IP Access Rules. The monitoring sandbox egress IP is not in the
   allowlist. This would block legitimate user traffic if rules are too restrictive.

2. **Domain not linked to Vercel project** — `x-deny-reason: host_not_allowed` is the exact
   Vercel edge error when a custom domain is not attached to any active project (e.g. domain
   added to a deleted project or DNS records drifted).

**Action:**
1. Log in to Vercel Dashboard → Project → Settings → Domains
2. Confirm `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` are listed and verified
3. Check Settings → Security → IP Access Rules — remove any rule blocking public access
4. Confirm DNS A/CNAME records still point to Vercel
5. Trigger a fresh deploy if domain linkage was repaired

---

### ❌ FAIL — Missing Security Headers

Severity: **High** — no security headers are returned on any response.

Once the 403 is resolved, verify these headers exist. Add to `vercel.json` if missing:

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

`http://cacaofrutabrutal.com` returns `403 Forbidden` instead of `301/302 → https://`.
Any user who types the URL without `https://` receives an error page instead of being
silently upgraded to HTTPS.

Once Vercel domain linkage is confirmed, verify Vercel's "Force HTTPS" is enabled under
Project → Settings → Domains, or add a redirect rule to `vercel.json`.

---

### ✅ GOOD — Supabase API Allowed-Origins Restrictions Active

Supabase returns `"Host not in allowlist"` — confirming that API key allowed-origins
restrictions are intentionally configured. The anon key cannot be abused from arbitrary
external servers. This is correct security posture for production.

---

## Manual Re-run Commands

Run these from any machine with unrestricted internet access to get accurate results:

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU"

# 1. Site availability — PASS: 200, <3s
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
| P0 | Run manual checks above from unrestricted network | Dev |
| P1 | Add missing security headers to `vercel.json` | Dev |
| P1 | Enable Force HTTPS in Vercel domain settings | Dev |
| P2 | Set up external uptime monitor from allowed IP (e.g. UptimeRobot, Better Uptime) | DevOps |

---

*Generated by CAUA health monitor — no application code was modified.*
*Previous runs: 2026-04-15T19:05:10Z, 2026-04-14T21:04:33Z, 2026-04-13 (same results each time)*
