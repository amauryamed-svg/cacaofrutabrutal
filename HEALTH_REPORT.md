# CAUA Health Report
Timestamp: 2026-08-10T14:03:10Z

## Summary: BLOCKED — Network Policy Prevented All Checks

All health checks failed to complete because the remote execution environment's outbound network policy blocks HTTPS connections to external hosts (including `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co`). This is a sandbox network restriction — **not a site outage**.

| Check | Status | Detail |
|-------|--------|--------|
| Site availability | ❌ BLOCKED | Proxy 403 — CONNECT tunnel to `cacaofrutabrutal.com:443` denied by gateway policy |
| Security headers | ❌ BLOCKED | Could not reach host |
| Supabase auth endpoint | ❌ BLOCKED | Proxy 403 — CONNECT to `kjygovuiphbxcdxeduco.supabase.co:443` denied |
| Supabase REST endpoint | ❌ BLOCKED | Proxy 403 — same policy denial |
| HTTPS redirect (HTTP→HTTPS) | ❌ BLOCKED | HTTP also returned proxy 403 (not a site 301/302) |
| SSL certificate validity | ⚠️ INCONCLUSIVE | No TLS errors in curl output, but tunnel never established |
| /fund route accessible | ❌ BLOCKED | Proxy 403 — CONNECT tunnel denied |

## Root Cause

The Claude Code remote execution environment uses an outbound proxy (`http://127.0.0.1:34039`) with a **selective allow-list policy**. Connections to `cacaofrutabrutal.com` and `supabase.co` are not on the allow-list and were rejected at the gateway level:

```
connect_rejected: gateway answered 403 to CONNECT (policy denial or upstream failure)
host: cacaofrutabrutal.com:443
host: kjygovuiphbxcdxeduco.supabase.co:443
```

## Issues Found

1. **BLOCKED — All external health checks**: The remote execution environment's network policy blocks access to `cacaofrutabrutal.com` and `supabase.co`. No actual site health data was collected.

## Recommended Actions

- **To run these checks**: Execute them from a local machine or CI environment (GitHub Actions, Vercel preview job) that has unrestricted outbound access to these hosts.
- **To enable checks in this environment**: The network policy for the Claude Code remote execution environment would need to allowlist `cacaofrutabrutal.com` and `kjygovuiphbxcdxeduco.supabase.co`. See [Claude Code remote execution docs](https://code.claude.com/docs/en/claude-code-on-the-web) for environment configuration options.
- **Alternative**: Add this health check script to a GitHub Actions workflow (`infra-devops` tentacle) that runs on a schedule with full outbound access.

## All Clear
No — checks could not run. Revisit from an environment with unrestricted outbound HTTPS.
