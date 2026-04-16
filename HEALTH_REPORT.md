# CAUA Health Report
Timestamp: 2026-04-16T22:17:00Z

## Summary: ❌ FAIL — 6th consecutive run blocked by allowlist; site unreachable from monitoring IP

> **Run history:** 2026-04-16T21:07Z, 2026-04-15T19:05Z, 2026-04-14T21:04Z, 2026-04-13, and prior.
> **This run:** Supabase 403 body now reads `Host not in allowlist` — same as earlier runs;
> prior report's "paused" diagnosis was a misread. Core issue remains unchanged: Vercel and
> Supabase both reject requests from this monitoring IP via `x-deny-reason: host_not_allowed`.

---

## Check Results

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ FAIL | HTTP 403 `host_not_allowed`, 0.398s — Vercel IP allowlist blocking monitor |
| Security headers | ❌ FAIL | Cannot evaluate — 403 is returned before content headers are set |
| Supabase auth endpoint | ❌ FAIL | HTTP 403 `host_not_allowed` — Supabase API origin allowlist blocking monitor |
| Supabase REST endpoint | ❌ FAIL | HTTP 403 `host_not_allowed` — same origin block |
| HTTPS redirect (HTTP→HTTPS) | ❌ FAIL | HTTP 403 — 301/302 not issued; blocked at Vercel edge before redirect logic |
| SSL certificate | ✅ PASS | TLS handshake succeeded cleanly; no certificate errors |
| /fund route | ❌ FAIL | HTTP 403 `host_not_allowed` |

---

## Raw Check Output

```
# 1. Site availability
→ 403  0.397886s   (x-deny-reason: host_not_allowed)

# 2. Security headers (curl -sI https://cacaofrutabrutal.com)
→ (no output — only header: x-deny-reason: host_not_allowed)

# 3. Supabase auth endpoint
→ 403   body: "Host not in allowlist"

# 4. Supabase REST endpoint
→ 403   body: "Host not in allowlist"

# 5. HTTP → HTTPS redirect
→ 403   (expected 301 or 302)

# 6. SSL certificate
→ SSL OK   (no TLS errors in curl output)

# 7. /fund route
→ 403   (x-deny-reason: host_not_allowed)
```

---

## Issues Found

### 🔴 P0 — Vercel `host_not_allowed` blocking all site traffic (6th consecutive run)

Every request to `cacaofrutabrutal.com` (HTTP and HTTPS, all routes) returns
`HTTP 403` with `x-deny-reason: host_not_allowed`. The TLS handshake succeeds,
confirming the domain is live on Vercel's edge — but IP Access Rules are blocking
all inbound traffic from this monitor's egress IP.

**Possible causes (in order of likelihood):**
1. Vercel IP Access Rules are configured to allow only specific IPs (e.g., office/home IP),
   inadvertently blocking the public internet.
2. The domain is assigned to a Vercel project in Preview mode with protection enabled.
3. The domain's Vercel project has Deployment Protection (password / Vercel auth) enabled.

**Action:**
1. Vercel Dashboard → Project → Settings → Security → **Deployment Protection**
   — disable "Vercel Authentication" or "Password Protection" for the Production environment
2. Vercel Dashboard → Project → Settings → Security → **IP Access Rules**
   — check for an allowlist; either remove it or add `0.0.0.0/0` to allow public access
3. Verify `cacaofrutabrutal.com` is assigned to the correct project under Settings → Domains

---

### 🔴 P0 — Supabase API blocked from monitoring IP (6th consecutive run)

Both `/auth/v1/settings` and `/rest/v1/user_profiles` return 403 `Host not in allowlist`.
This is Supabase's API allowed-origins restriction — the project is alive but only
accepts requests from whitelisted origins (e.g., the production frontend domain).

**This is actually correct security posture** — the anon key should only work from
the app's domain. However, it means external health checks using the anon key will
always fail from an unauthorized IP.

**Action (for monitoring):**
- Use Supabase's built-in health endpoint (no auth required) to check project liveness:
  `curl https://kjygovuiphbxcdxeduco.supabase.co/health`
- Or run the API check from the Vercel deployment environment where the origin is allowed

---

### ❌ FAIL — Security Headers Cannot Be Assessed

Until the Vercel 403 is resolved, security headers cannot be evaluated. Once resolved,
verify these headers are present. Add to `vercel.json` if missing:

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

### ❌ FAIL — HTTP → HTTPS Redirect Unconfirmable

`http://cacaofrutabrutal.com` returns 403 before the redirect fires. Once Vercel access
is restored, confirm **Force HTTPS** is enabled under Project → Settings → Domains.

---

## Recommended Next Steps

| Priority | Action | Owner |
|----------|--------|-------|
| P0 | Vercel → Security → Deployment Protection → disable for Production | DevOps |
| P0 | Vercel → Security → IP Access Rules → remove restrictive allowlist | DevOps |
| P0 | After fix: re-run checks from this monitor to confirm 200 responses | Dev |
| P1 | Add security headers to `vercel.json` (X-Frame-Options, STS, CSP) | Dev |
| P1 | Confirm Force HTTPS is enabled in Vercel domain settings | Dev |
| P2 | Replace anon-key health check with `/health` endpoint for Supabase | Dev |
| P2 | Set up external uptime monitor (UptimeRobot / Better Uptime) from allowed origin | DevOps |

---

## Manual Re-run Commands

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWdvdnVpcGhieGNkeGVkdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODA0NzgsImV4cCI6MjA5MTI1NjQ3OH0.WMlfCLVssh6pAos2vGSx_8aEiOTxb8CUQqG6Zx9npqU"

# 1. Site — PASS: 200, <3s
curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://cacaofrutabrutal.com

# 2. Security headers — PASS: X-Frame-Options + Strict-Transport present
curl -sI https://cacaofrutabrutal.com | grep -iE 'x-frame-options|x-content-type|strict-transport|content-security'

# 3. Supabase liveness (no auth required)
curl -s -w ' %{http_code}' https://kjygovuiphbxcdxeduco.supabase.co/health

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

*Generated by CAUA health monitor — no application code was modified.*
*Run history: 2026-04-16T21:07Z · 2026-04-15T19:05Z · 2026-04-14T21:04Z · 2026-04-13*
