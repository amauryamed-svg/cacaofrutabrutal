# CAUA Health Report
Timestamp: 2026-05-11T14:04:20Z
Previous run: 2026-05-04T14:16:00Z

## Summary: ⚠️ INCONCLUSIVE — Sandbox Egress Block

> **All HTTP checks were blocked by the Anthropic sandbox egress proxy.** Every request to `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co` returned **HTTP 403 `x-deny-reason: host_not_allowed`** — issued by the proxy, not by the real servers. This is a network-level sandbox restriction, **not a production outage**. Results below cannot confirm or deny real site health. Re-run from an external environment (local terminal, CI runner, or uptime monitor).

---

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⚠️ INCONCLUSIVE | 403 `host_not_allowed` — sandbox egress proxy, **0.39s** response time |
| Security headers | ⚠️ INCONCLUSIVE | No app-layer headers returned; blocked at proxy |
| Supabase auth endpoint | ⚠️ INCONCLUSIVE | 403 — body: "Host not in allowlist" |
| Supabase REST endpoint | ⚠️ INCONCLUSIVE | 403 — body: "Host not in allowlist" |
| HTTPS redirect (HTTP→HTTPS) | ⚠️ INCONCLUSIVE | HTTP also returned 403; redirect behavior unverifiable from sandbox |
| SSL certificate | ✅ PASS | TLS 1.3 handshake succeeds; proxy cert via `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA` (not real site cert) |
| /fund route | ⚠️ INCONCLUSIVE | 403 `host_not_allowed` — sandbox egress proxy |

---

## Issues Found

### 1. ✅ SSL Healthy — No Certificate Errors
- **What:** `curl -sI --max-time 5 https://cacaofrutabrutal.com` returned no SSL/certificate error strings. TLS 1.3 handshake succeeded.
- **Note:** The cert shown is issued by `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA` — that is the proxy's interception cert, not the real origin cert. To verify real expiry, run locally: `openssl s_client -connect cacaofrutabrutal.com:443 2>/dev/null | openssl x509 -noout -dates`

### 2. ℹ️ INFO — Sandbox Egress Policy Prevents Health Checks from Claude Code
- **Root cause:** The Anthropic sandbox intercepts all HTTPS and blocks non-allowlisted hosts. `x-deny-reason: host_not_allowed` is a sandbox policy response, not a Vercel or production error.
- **This is NOT a production site failure.** No evidence of a real outage across any of the prior runs.
- **Action:** Move automated health monitoring outside the sandbox (see setup below).
- Run count: **51st consecutive blocked run** (first blocked: 2026-04-20T22:08:41Z).

---

## Raw curl Evidence

### 2026-05-11T14:04:20Z run (current)
```
# Site availability
403 0.338306s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 11 May 2026 14:04:02 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 11 May 2026 14:04:11 GMT

# Body: "Host not in allowlist"

# TLS/SSL verbose (Supabase endpoint)
TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
cert subject:  CN=*.supabase.co
cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
cert start:    May 11 14:03:51 2026 GMT
cert expiry:   Jun 10 14:03:50 2026 GMT  ← proxy cert, ~30 days; not real Supabase cert
IPs resolved:  172.64.149.246, 104.18.38.10 (Cloudflare)

# Security headers: none (blocked at proxy)
# Supabase auth: 403 — x-deny-reason: host_not_allowed
# Supabase REST: 403 — host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-05-04T14:16:00Z run (previous)
```
# Site availability
403 0.350169s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 04 May 2026 14:15:55 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 04 May 2026 14:15:56 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — x-deny-reason: host_not_allowed (verbose confirmed)
# Supabase REST: 403 — host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-27T14:12:30Z run (previous)
```
# Site availability
403 0.394338s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 27 Apr 2026 14:12:19 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 27 Apr 2026 14:12:20 GMT

# Security headers: none (blocked at proxy)
# Supabase auth: 403 — x-deny-reason: host_not_allowed (verbose confirmed)
# Supabase REST: 403 — host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-27T03:35:47Z run (previous)
```
# Site availability
403 0.492897s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 27 Apr 2026 03:35:44 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 27 Apr 2026 03:35:47 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-27T00:06:36Z run (previous)
```
# Site availability
403 0.259961s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 27 Apr 2026 00:06:36 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Mon, 27 Apr 2026 00:06:36 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T15:15:31Z run (previous)
```
# Site availability
403 0.728847s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 15:15:28 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 15:15:29 GMT

# Supabase auth (verbose)
TLSv1.3 handshake succeeded — "Host not in allowlist" → 403
cert subject: CN=*.supabase.co (via proxy)

# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T14:15:00Z run (previous)
```
# Site availability
403 0.253113s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 14:14:58 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 14:14:59 GMT

# TLS/SSL details (verbose)
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* cert expiry:   May 26 14:14:58 2026 GMT  ← proxy cert, not real site cert
* HTTP/2 accepted (ALPN: h2)

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — host_not_allowed (same proxy block pattern)
# Supabase REST: 403 — host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect, no 301/302 visible)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
# Control: --resolve cacaofrutabrutal.com:443:76.76.21.21 → still 403 host_not_allowed
```

### 2026-04-26T13:08:30Z run (previous)
```
# Site availability
403 0.389530s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 13:07:55 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 13:07:56 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T12:04:38Z run (previous)
```
# Site availability
403 0.341120s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 12:04:37 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 12:04:38 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T11:14:00Z run (previous)
```
# Site availability
403 0.416s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 11:13:45 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed  (blocked before redirect)

# TLS/SSL verbose
* TLSv1.3 handshake succeeded (TLS_AES_256_GCM_SHA384 / X25519)
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* HTTP/2 accepted (ALPN: h2)

# Security headers: none (blocked at proxy)
# Supabase auth endpoint: 403 host_not_allowed
# Supabase REST endpoint: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# Control (example.com): 403 host_not_allowed (confirms sandbox egress block)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T10:11:07Z run (previous)
```
# Site availability
403 0.485s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 10:11:06 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 10:11:07 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — body: "Host not in allowlist"
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T09:10:00Z run (previous)
```
# Site availability
403 0.280s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 09:09:51 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 09:09:51 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — verbose body: "Host not in allowlist" (confirmed via -sv)
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: TLS 1.3 handshake succeeds; proxy cert via O=Anthropic; CN=sandbox-egress-production TLS Inspection CA; SSL OK
# /fund route: 403 host_not_allowed
```

### 2026-04-26T08:18:00Z run (previous)
```
# Site availability
403 0.402s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 08:17:54 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 08:17:55 GMT

# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T07:03:00Z run (previous)
```
# Site availability
403 0.732910s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 07:02:45 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 07:02:52 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T06:17:40Z run (previous)
```
# Site availability
403 0.399429s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 06:17:40 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T05:19:44Z run (previous)
```
# Site availability
403 0.361992s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 05:19:44 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 05:19:44 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T04:19:50Z run (previous)
```
# Site availability
403 0.258265s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 04:19:47 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 04:19:48 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL error strings)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T03:05:47Z run (previous)
```
# Site availability
403 0.369869s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 03:05:47 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 03:05:47 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL error strings)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T02:02:15Z run (previous)
```
# Site availability
403 0.272423s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 02:02:11 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 02:02:14 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL error strings)
# /fund route: 403 host_not_allowed
```

### 2026-04-26T01:14:35Z run (previous)
```
# Site availability
403 0.244390s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 01:14:11 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sun, 26 Apr 2026 01:14:12 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL error strings)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T14:23:10Z run (previous)
```
# Site availability
403 0.249623s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 14:23:08 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 14:23:10 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL error strings)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T13:20:11Z run (previous)
```
# Site availability
403 0.334620s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 13:20:11 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T12:07:30Z run (previous)
```
# Site availability
403 0.496527s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 12:07:26 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 12:07:27 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — body: "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T11:04:15Z run (previous)
```
# Site availability
403 0.286378s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 11:04:12 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 11:04:13 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist" (verbose body confirmed)
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T10:19:28Z run (previous)
```
# Site availability
403 0.442730s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 10:19:01 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 10:19:03 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T09:22:37Z run (previous)
```
# Site availability
403 0.486738s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 09:22:33 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 09:22:37 GMT

# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T08:03:00Z run (previous)
```
# Site availability
403 0.489379s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 08:03:35 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 08:03:38 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: TLS 1.3 handshake OK; proxy cert issuer: O=Anthropic; CN=sandbox-egress-production TLS Inspection CA; start: Apr 25 08:03:58 2026 GMT; expire: May 25 08:03:57 2026 GMT
# /fund route: 403 host_not_allowed
```

### 2026-04-25T07:14:30Z run (previous)
```
# Site availability
403 0.284406s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 07:14:27 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T06:25:49Z run (previous)
```
# Site availability
403 0.272835s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 06:25:49 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed ("Host not in allowlist")
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeded, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T02:20:10Z run (previous)
```
# Site availability
403 0.279263s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 02:19:30 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 02:19:32 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed ("Host not in allowlist")
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-25T01:15:30Z run (previous)
```
# Site availability
403 0.395266s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 01:14:33 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 01:15:04 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
# Control: curl https://httpbin.org → 403 host_not_allowed (confirms sandbox egress block, run #23)
```

### 2026-04-25T00:26:30Z run (previous)
```
# Site availability
403 0.251873s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 00:25:57 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Sat, 25 Apr 2026 00:25:59 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T13:25:23Z run (previous)
```
# Site availability
403 0.442514s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 13:25:23 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 13:25:24 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T12:25:40Z run (previous)
```
# Site availability
403 0.335926s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 12:25:34 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 12:25:36 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T11:05:00Z run (previous)
```
# Site availability
403 0.289213s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 11:04:55 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 11:04:57 GMT

# Body: "Host not in allowlist"

# TLS/SSL details (verbose)
* Connected to cacaofrutabrutal.com (216.198.79.1) port 443
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* cert start:    Apr 24 11:04:41 2026 GMT
* cert expiry:   May 24 11:04:40 2026 GMT ← proxy cert, not real site cert
* HTTP/2 accepted (ALPN: h2)

# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed ("Host not in allowlist")
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T10:02:51Z run (previous)
```
# Site availability
403 0.299276s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 10:02:49 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 10:02:51 GMT

# TLS/SSL details (verbose)
* Connected to cacaofrutabrutal.com (216.198.79.1) port 443
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* cert start:    Apr 24 10:02:25 2026 GMT
* cert expiry:   May 24 10:02:24 2026 GMT ← proxy cert, not real site cert

# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T09:09:41Z run (previous)
```
# Site availability
403 0.450707s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 09:09:41 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 09:09:42 GMT

# Body: "Host not in allowlist"
# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed ("Host not in allowlist")
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds via sandbox-egress-production TLS Inspection CA)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T08:05:57Z run (previous)
```
# Site availability
403 0.284760s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 08:05:56 GMT

# Full headers (HTTP — port 80)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 08:05:57 GMT

# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeded, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T07:21:40Z run
```
# Site availability
403 1.544450s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 07:21:33 GMT

# Full headers (HTTP — port 80)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 07:21:37 GMT

# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeded, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T06:27:00Z run
```
# Site availability
403 0.509033s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 06:26:34 GMT

# Full headers (HTTP — port 80)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 06:26:56 GMT

# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS handshake succeeded, no curl SSL errors)
# /fund route: 403 host_not_allowed
# Control: curl https://example.com → 403 host_not_allowed (confirms sandbox egress block)
```

### 2026-04-24T05:07:00Z run (previous)
```
# Site availability
403 0.396262s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 05:05:43 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 05:06:39 GMT

# Security headers: none (blocked at proxy)

# TLS/SSL details (verbose)
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* cert expiry:   May 24 05:06:02 2026 GMT  ← proxy cert, not real site cert

# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T04:07:23Z run (previous)
```
# Site availability
403 0.254061s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 04:07:23 GMT

# Security headers: none (blocked at proxy)
# Supabase auth body: "Host not in allowlist" → 403
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked before redirect)
# SSL check: SSL OK (no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T03:15:00Z run (previous)
```
# Site availability
403 0.317745s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 03:15:09 GMT

# TLS/SSL details
* Connected to cacaofrutabrutal.com (216.198.79.1) port 443
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* cert start:    Apr 24 03:14:41 2026 GMT
* cert expiry:   May 24 03:14:40 2026 GMT  ← proxy cert, not real site cert

# Security headers: none (blocked at proxy)
# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no curl SSL errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T02:08:00Z run (previous)
```
# Site availability
403 0.295596s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 02:07:59 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 02:08:01 GMT

# Body: "Host not in allowlist"
# Supabase auth: 403 host_not_allowed ("Host not in allowlist")
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl — TLS layer healthy)
# Security headers: none (blocked at proxy)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T01:17:00Z run
```
# Site availability
403 0.337196s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 01:17:27 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 01:17:31 GMT

# Body: "Host not in allowlist"
# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl — TLS layer healthy)
# Security headers: none (blocked at proxy)
# /fund route: 403 host_not_allowed
```

### 2026-04-24T00:35:00Z run (previous)
```
# Site availability
403 0.289563s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 00:34:52 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Fri, 24 Apr 2026 00:34:54 GMT

# Supabase auth body: "Host not in allowlist"
# Supabase auth: 403
# Supabase REST: 403
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl — TLS layer healthy)
# Security headers: none (blocked at proxy)
# /fund route: 403 host_not_allowed
```

### 2026-04-23T23:10:43Z run
```
# Site availability
403 0.293582s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 23:10:13 GMT

# Body: "Host not in allowlist"

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed

# TLS/SSL verbose
* Connected to cacaofrutabrutal.com (216.198.79.1) port 443
* TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519
* cert subject:  CN=cacaofrutabrutal.com
* cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
* cert expiry:   May 23 23:09:57 2026 GMT  ← proxy cert, not real site cert
* HTTP/2 403

# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (TLS 1.3 handshake succeeds, no cert errors)
# /fund route: 403 host_not_allowed
```

### 2026-04-23T22:07:51Z run
```
# Site availability
403 0.293581s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 22:07:51 GMT

# Body: "Host not in allowlist"

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed

# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-23T21:17:20Z run (previous)
```
# Site availability
403 0.373333s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 21:17:14 GMT

# Body: "Host not in allowlist"

# HTTP verbose (port 80)
Resolved IP: 216.198.79.1 (Vercel edge)
HTTP/1.1 403 Forbidden — x-deny-reason: host_not_allowed

# Security headers: none (blocked at proxy)
# Supabase auth: 403 — "Host not in allowlist"
# Supabase REST: 403 — "Host not in allowlist"
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl — TLS layer healthy)
# /fund route: 403 host_not_allowed
```

### 2026-04-23T20:11:38Z run (previous)
```
# Site availability
403 0.390395s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 20:11:38 GMT

# Body: "Host not in allowlist"

# Security headers: none (blocked at proxy)
# Supabase auth: 403 x-deny-reason: host_not_allowed ("Host not in allowlist")
# Supabase REST: 403 x-deny-reason: host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl — TLS handshake succeeds)
# /fund route: 403 host_not_allowed
```

### 2026-04-23T19:13:23Z run (previous)
```
# Site availability
403 0.357756s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 19:13:18 GMT

# Body: "Host not in allowlist"

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed

# TLS/SSL: SSL OK (no error strings from curl — TLS handshake succeeds)
# Supabase auth: 403 host_not_allowed ("Host not in allowlist")
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# /fund route: 403 host_not_allowed
```

### 2026-04-23T18:21:10Z run (previous)
```
# Site availability
403 0.325954s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 18:21:05 GMT

# Full headers (HTTP)
HTTP 403 (host_not_allowed — no redirect issued)

# SSL check: SSL OK (no error strings from curl)
# Supabase auth endpoint: 403 host_not_allowed
# Supabase REST endpoint: 403 host_not_allowed
# /fund route: 403 host_not_allowed
```

### 2026-04-23T17:02:30Z run (previous)
```
# Site availability
403 0.372360s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 17:02:30 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed

# TLS/SSL details (from Supabase verbose)
TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
cert subject:  CN=*.supabase.co
cert issuer:   O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
cert start:    Apr 23 17:02:15 2026 GMT
cert expiry:   May 23 17:02:14 2026 GMT (30 days, proxy cert only)
Supabase IPs: 172.64.149.246, 104.18.38.10 (Cloudflare)

# Supabase auth: 403 host_not_allowed
# Supabase REST: 403 host_not_allowed
# HTTP→HTTPS: 403 (blocked before redirect)
# SSL check: SSL OK (no error strings)
# /fund route: 403
```

### 2026-04-23T16:24:35Z run (previous)
```
# Site availability
403 0.397282s

# Full headers (HTTPS)
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 21
content-type: text/plain
date: Thu, 23 Apr 2026 16:24:31 GMT

# Full headers (HTTP)
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed

# TLS/SSL details
TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 — handshake succeeds
cert subject:  CN=cacaofrutabrutal.com
cert issuer:   CN=Egress Gateway Subordinate CA  ← proxy TLS inspection cert
cert start:    Apr 23 16:23:19 2026 GMT
cert expiry:   May 23 16:24:19 2026 GMT (30 days, proxy cert only)

# Supabase (kjygovuiphbxcdxeduco.supabase.co)
Resolved IPs:  104.18.38.10, 172.64.149.246 (Cloudflare)
Auth endpoint: 403 host_not_allowed
REST endpoint: 403 host_not_allowed

# HTTP→HTTPS redirect: 403 (blocked at egress before redirect)
# SSL check: SSL OK (no error strings from curl)
# /fund route: 403
```

### 2026-04-23T15:04:00Z run
```
403 0.305140s
SSL OK
(all other endpoints: 403 host_not_allowed)
```

### 2026-04-23T14:09:00Z run
```
403 0.408932s
SSL OK
(all other endpoints: 403 host_not_allowed)
```

### 2026-04-23T13:30:22Z run
```
403 1.012178s
SSL OK
(all other endpoints: 403 host_not_allowed)
```

### 2026-04-21T02:18:21Z run
```
403 0.340401s
SSL OK
(all other endpoints: 403 host_not_allowed)
```

### 2026-04-20T22:08:41Z run
```
403 0.441091s
*  subject: CN=cacaofrutabrutal.com
*  expire date: May 20 22:08:38 2026 GMT   ← proxy cert, not real site cert
*  issuer: O=Anthropic; CN=sandbox-egress-production TLS Inspection CA
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

# 6. Real SSL cert expiry (run locally, not from Claude Code sandbox)
openssl s_client -connect cacaofrutabrutal.com:443 2>/dev/null | openssl x509 -noout -dates

# 7. /fund route (expect: 200)
curl -s -o /dev/null -w '%{http_code}\n' https://cacaofrutabrutal.com/fund
```
