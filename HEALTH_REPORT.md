# CAUA Health Report
Timestamp: 2026-08-24T14:01:30Z

## Summary: ⛔ BLOCKED — Network policy prevented all checks

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ⛔ BLOCKED | Proxy gateway returned 403 (policy denial) for `cacaofrutabrutal.com:443` |
| Security headers | ⛔ BLOCKED | Could not reach host |
| Supabase auth endpoint | ⛔ BLOCKED | Proxy gateway returned 403 for `kjygovuiphbxcdxeduco.supabase.co:443` |
| Supabase REST endpoint | ⛔ BLOCKED | Proxy gateway returned 403 for `kjygovuiphbxcdxeduco.supabase.co:443` |
| HTTP → HTTPS redirect | ⛔ BLOCKED | HTTP returned 403 from proxy (not site redirect) |
| SSL certificate | ⛔ BLOCKED | Could not establish TLS — proxy blocked CONNECT tunnel |
| /fund route | ⛔ BLOCKED | Could not reach host |

## Root Cause

The remote execution environment's outbound network policy **does not allow CONNECT tunnels** to arbitrary external hosts. The proxy at `127.0.0.1:43087` rejected all HTTPS connections to:
- `cacaofrutabrutal.com:443`
- `kjygovuiphbxcdxeduco.supabase.co:443`

The proxy `recentRelayFailures` log confirmed `connect_rejected` with reason: _"gateway answered 403 to CONNECT (policy denial or upstream failure)"_ for every target host.

This is an environment configuration issue — **no application issues were detected**, because no checks could run.

## Recommended Action

1. **Open a network-enabled environment**: re-run this health monitor in an environment whose network policy explicitly permits outbound HTTPS to `cacaofrutabrutal.com` and `*.supabase.co`, or
2. **Run checks from CI**: add this health check script to a GitHub Actions workflow where outbound network is unrestricted, or
3. **Run locally**: execute the curl commands manually from a machine with direct internet access.

## All Clear
None of the 7 checks could execute. Report reflects environment blocker, not application status.
