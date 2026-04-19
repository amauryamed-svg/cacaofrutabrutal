# CAUA Health Report
Timestamp: 2026-04-19T22:17:43Z

## Summary: FAIL

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ FAIL | HTTP 403 `x-deny-reason: host_not_allowed` in 0.30s |
| Security headers | ❌ FAIL | No headers returned — 403 fires before headers apply |
| Supabase auth endpoint | ❌ FAIL | HTTP 403 `"Host not in allowlist"` |
| Supabase REST endpoint | ❌ FAIL | HTTP 403 `"Host not in allowlist"` |
| HTTPS redirect | ⚠️ WARN | HTTP 403 — redirect unverifiable (site-level block) |
| SSL certificate | ✅ PASS | No SSL errors; TLS handshake succeeded |
| /fund route | ❌ FAIL | HTTP 403 (consistent with site-level block) |

---

## Issues Found

### CRITICAL — Site returns 403 to all external requests
- **Symptom:** `curl https://cacaofrutabrutal.com` → `403`, header `x-deny-reason: host_not_allowed`
- **Root cause (likely):** Vercel **Deployment Protection** is enabled on the production domain, blocking non-authenticated/non-browser access. Could also be a WAF or Cloudflare IP-allowlist rule.
- **Impact:** All users unable to reach the site if this applies to browsers too. If Vercel Protection is set to "Vercel Authentication" instead of "Password" it may only block headless requests — verify in Vercel dashboard → Settings → Deployment Protection.
- **Action:** Check Vercel project → Settings → Deployment Protection. Either disable for production domain or confirm "Standard Protection" is off. If using Cloudflare, verify that the production zone is not in "Under Attack" / challenge mode.

### CRITICAL — Supabase API locked to undisclosed origin allowlist
- **Symptom:** Both `/auth/v1/settings` and `/rest/v1/user_profiles` return `403 "Host not in allowlist"`
- **Root cause:** Supabase project → API → Allowed Origins is configured with a restricted list that does not include the calling host (this monitoring server). This may or may not affect the production frontend depending on whether `https://cacaofrutabrutal.com` is in the list.
- **Impact:** If `https://cacaofrutabrutal.com` is missing from the Supabase allowlist, the frontend will be completely broken (all auth and data calls fail). If only external/server IPs are blocked, this is intentional security hardening.
- **Action:** In Supabase dashboard → Project Settings → API → "Allowed Origins (CORS)", verify that `https://cacaofrutabrutal.com` is listed. Also confirm `http://localhost:3000` is present for local dev.

### WARN — Security headers not verifiable
- **Symptom:** No `X-Frame-Options`, `Strict-Transport-Security`, or `Content-Security-Policy` headers observed.
- **Root cause:** Cannot be assessed — the 403 response is served before application headers are applied. Re-run header checks once the site-level block is resolved.
- **Action:** After resolving the 403 issue, re-audit headers. Ensure Vercel adds at minimum: `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and a `Content-Security-Policy`.

### WARN — HTTPS redirect unverifiable
- **Symptom:** `curl http://cacaofrutabrutal.com` → 403 instead of 301/302.
- **Root cause:** Same site-level block prevents redirect verification.
- **Action:** Re-run `curl -Lv http://cacaofrutabrutal.com` after unblocking.

---

## What is passing
- **SSL/TLS:** Certificate is valid; TLS handshake completes without error. ✅
- **Response time:** 0.30s for the 403 — server is reachable and fast. ✅

---

## Recommended next steps (in priority order)
1. **Vercel dashboard** → confirm Deployment Protection settings for `cacaofrutabrutal.com` (production) vs preview URLs.
2. **Supabase dashboard** → confirm `https://cacaofrutabrutal.com` is in Allowed Origins.
3. **Re-run this health check** after fixes to verify site returns 200 and headers are present.
4. Add `X-Frame-Options`, `Strict-Transport-Security`, and `Content-Security-Policy` headers via `vercel.json` if not already configured.
