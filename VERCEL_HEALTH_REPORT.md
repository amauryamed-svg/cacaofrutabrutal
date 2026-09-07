# Vercel Deploy Health Report
Timestamp: 2026-09-07T14:10:00Z
Window: last 7 days (2026-08-31 → 2026-09-07)
Project: caua-mvp (id: prj_Fc5Rbha3hlIRAXrevMIoIaBeXWoz)
Team: amauryamed-1073s-projects (id: team_aVPGjM9P30YNoCQKEvdBp4UQ)

## Summary: WARN

Pipeline healthy: 5 READY / 0 ERROR in 7d window, all 3 GH Actions runs succeeded,
workflow unchanged. Two persistent WARNs carried over from last week:
1. **www.cacaofrutabrutal.com** is NOT in the Vercel project's permanent domain list
   (only aliased per-deploy by workflow; needs adding as a permanent domain).
2. **Egress proxy blocks curl checks** — 67th consecutive week; site availability,
   bundle freshness, and SPA route checks are all inconclusive from this environment.

## Deploy activity (7d)
- Total: 7 | READY: 5 | CANCELED: 2 | ERROR: 0
- Last READY (production): `dpl_AQGfuxMVxFi7YEeDQJkeCud62ZNP` — `e80bd6f` — "chore: update HEALTH_REPORT.md for 2026-09-07 health check run" — 0h ago — READY
- Last READY (any): `dpl_4v2PU5BYsB22mnWE4fEp2528vonv` — `28b3b8c` — "chore: weekly dead-code sweep 2026-08-31" (PR #67 preview) — ~19h ago — READY
- Last ERROR: none in 7d ✅

Breakdown:
| Deployment | State | Target | Commit (short) | Timestamp |
|---|---|---|---|---|
| dpl_AQGfuxMV | READY | production | e80bd6f — health report | 2026-09-07T14:03Z |
| dpl_73ELYnif | CANCELED | production | e80bd6f — health report | 2026-09-07T14:03Z |
| dpl_4v2PU5BY | READY | (PR #67 preview) | 28b3b8c — dead-code sweep | 2026-08-31T14:38Z |
| dpl_GFMzJ87T | READY | production | c94d5bf — health report | 2026-08-31T14:18Z |
| dpl_AsT3hmwD | READY | production | c94d5bf — health report | 2026-08-31T14:18Z |
| dpl_9dCFAnT5 | READY | production | d641323 — health report | 2026-08-31T14:02Z |
| dpl_HzZ5TK2V | CANCELED | production | d641323 — health report | 2026-08-31T14:02Z |

*Note: CANCELED deployments are normal — each commit triggers two concurrent hooks; the first one in wins and the duplicate is auto-canceled.*

## Build performance
- Last 5 GH Actions run durations (proxy for Vercel build): 125s, 62s, 127s, 81s, 65s
- Average: ~92s (~1m 32s)
- Verdict: **OK** — well under 4-min threshold; within historical baseline (~62–127s range)

## Domains
- `cacaofrutabrutal.com` → `dpl_AQGfuxMVxFi7YEeDQJkeCud62ZNP` (state: READY) ✅
- `www.cacaofrutabrutal.com` → **NOT in permanent domain list** ⚠️ (per-deploy alias only)
- `caua-mvp.vercel.app` → project default alias ✅
- `caua-mvp-amauryamed-1073s-projects.vercel.app` → project alias ✅

## Checks
| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ INCONCLUSIVE | Egress proxy blocks CONNECT to cacaofrutabrutal.com:443 (67th week) |
| 2 | Bundle freshness | ⚠️ INCONCLUSIVE | Egress proxy blocks curl; cannot verify Vite-hashed assets |
| 3 | Vercel deploys 7d | ✅ PASS | READY=5, ERROR=0, CANCELED=2 (normal duplicate cancels) |
| 4 | Build duration | ✅ OK | avg ~92s (GH Actions proxy); baseline ~62–127s |
| 5 | Domain alias | ⚠️ WARN | cacaofrutabrutal.com attached ✅; www.cacaofrutabrutal.com not permanent ⚠️ |
| 6 | Failed deploy logs | ✅ N/A | No ERROR deployments in 7d |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | 3/3 GH runs matched to READY Vercel deployments |
| 8 | Workflow integrity | ✅ PASS | No changes to deploy-vercel.yml or vercel.json in 7d |
| 9 | SPA routes | ⚠️ INCONCLUSIVE | Egress proxy blocks curl; /fund, /app/adoptar, /investor-landing.html unverifiable |

## Failed deployments (if any)
None in 7d — all production deploys resulted in READY or CANCELED (not ERROR).

## Issues / Action items

1. **[PERSISTENT WARN — Action needed] www.cacaofrutabrutal.com not permanently attached.**
   The domain `www.cacaofrutabrutal.com` is not in the Vercel project's domain list. It is
   only set as an alias per-deploy by the workflow's `vercel alias` step. If a deploy ever
   fails mid-alias-set or the workflow changes, www goes stale. Fix: add
   `www.cacaofrutabrutal.com` as a permanent domain in Vercel project settings → Domains.
   This has been flagged since the 2026-08-31 report.

2. **[PERSISTENT WARN — Environment limitation] Curl checks blocked for 67 consecutive weeks.**
   The remote execution environment's egress proxy denies CONNECT tunnels to
   `cacaofrutabrutal.com:443`. Checks #1, #2, #9 (site availability, bundle freshness, SPA
   routes) cannot be run from this environment. Site health is inferred from Vercel deployment
   state only. To close this gap, consider an external uptime monitor (Better Uptime, UptimeRobot,
   or a GitHub Actions `curl` step on a schedule).

3. **[INFO] No real code deployed in ~73 days** (last code commit: 2026-06-26). All recent
   deploys are automated health report commits. Deploy pipeline is exercised and healthy but
   only carries chore commits. Not a production issue — just context.

4. **[INFO] Dead-code sweep PR #67** (chore/dead-code-sweep-2026-08-31) is open with a READY
   preview deploy. It removes 3 orphaned source files and 4 unused @remotion devDeps.
   Not blocking; merge at owner's discretion.

## Vercel MCP tools used
- `mcp__Vercel__list_teams`
- `mcp__Vercel__list_projects`
- `mcp__Vercel__get_project`
- `mcp__Vercel__list_deployments`
