# Vercel Deploy Health Report
Timestamp: 2026-09-21T14:16:18Z
Window: last 7 days (2026-09-14 → 2026-09-21)
Project: caua-mvp (id: prj_Fc5Rbha3hlIRAXrevMIoIaBeXWoz)
Team: amauryamed-1073s-projects (id: team_aVPGjM9P30YNoCQKEvdBp4UQ)

## Summary: WARN

Pipeline healthy — 1 READY / 0 ERROR in 7d, both domains permanently attached and
verified, build times healthy at ~54s avg, workflow unchanged, GH Actions matched.
Single persistent WARN: egress proxy in remote execution environment blocks all
outbound HTTPS to cacaofrutabrutal.com, making curl checks #1, #2, and #9
inconclusive (structural sandbox limitation, not a production issue).

**Resolution vs last week**: Previous WARN about `www.cacaofrutabrutal.com not in
permanent domain list` is **RESOLVED** — confirmed present as permanent verified
project domain (createdAt ~2026-04-23, verified: true).

## Deploy activity (7d)
- Total: 2 | READY: 1 | CANCELED: 1 | ERROR: 0
  _(The CANCELED entry is a Vercel-side concurrent-trigger cancel — same sha,
  harmless double-fire from the deploy hook; one supersedes the other immediately.)_
- Last READY: `dpl_FYjeBKb9oMv58aDfJpWu1UX52cHJ` — `f4e5950` — "chore: update HEALTH_REPORT.md — scheduled health check 2026-09-21" — ~13 min ago — build **64s**
- Last ERROR: none in 7d ✅

## Build performance
| # | Deployment | Date | Duration |
|---|-----------|------|----------|
| 1 | dpl_FYjeBKb9oMv58aDfJpWu1UX52cHJ | 2026-09-21 | 64s |
| 2 | dpl_Ei5owcESZdpzTwWYuacfrR5QbRfa  | 2026-09-07 | 52s |
| 3 | dpl_AQGfuxMVxFi7YEeDQJkeCud62ZNP  | 2026-09-07 | 51s |
| 4 | dpl_GFMzJ87TrWYQvqPJmz7GbuKxt5oH  | 2026-08-31 | 51s |
| 5 | dpl_AsT3hmwDp58x9qSWtPGLWyMESziL  | 2026-08-31 | 50s |

- Last 5 READY avg build time: **54s**
- Verdict: **OK** (well under 4-minute WARN threshold; consistent with ~90s historical — these are health-report-only commits with minimal code change)

## Domains
- `cacaofrutabrutal.com` → project `caua-mvp` (verified: true, no redirect) ✅
- `www.cacaofrutabrutal.com` → project `caua-mvp` (verified: true, 308 → cacaofrutabrutal.com) ✅
  - **Status change**: Confirmed as permanent project domain since ~2026-04-23. Previous reports incorrectly flagged this as missing — **WARN resolved**.

Both domains served by latest READY production deployment `dpl_FYjeBKb9oMv58aDfJpWu1UX52cHJ`
(alias promotion confirmed by GH Actions run #136 conclusion: success).

## Checks
| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ INCONCLUSIVE | Egress proxy blocks HTTPS to cacaofrutabrutal.com (connect_rejected). Vercel READY + GH success imply site is live. |
| 2 | Bundle freshness | ⚠️ INCONCLUSIVE | Cannot curl production HTML — same proxy policy. |
| 3 | Vercel deploys 7d | ✅ PASS | READY=1, ERROR=0, CANCELED=1 (harmless double-fire) |
| 4 | Build duration | ✅ PASS | avg 54s — OK, under 4-min threshold |
| 5 | Domain alias | ✅ PASS | Both cacaofrutabrutal.com and www permanently attached, verified. Previous www-gap WARN resolved. |
| 6 | Failed deploy logs | ✅ PASS | No ERROR deployments in 7d |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | Run #136 (sha f4e5950, success) → dpl_FYjeBKb9oMv58aDfJpWu1UX52cHJ (READY). Matched. |
| 8 | Workflow integrity | ✅ PASS | No changes in last 7 days. Both domain aliases present in promote-alias step. |
| 9 | SPA routes | ⚠️ INCONCLUSIVE | Proxy blocks /fund, /app/adoptar, /investor-landing.html checks |

## Failed deployments (if any)
None in 7d. ✅

## Issues / Action items
1. **[PERSISTENT] Egress proxy blocks curl checks** — The remote execution sandbox denies outbound CONNECT to `cacaofrutabrutal.com:443`. Checks #1, #2, #9 have been inconclusive for 68+ consecutive weekly runs. This is a structural monitoring limitation, not a production outage. All Vercel MCP–based checks pass.
   - Recommendation: Move live-site checks to GitHub Actions (runs outside the sandbox) or an external uptime service (e.g., Better Uptime, Checkly).

2. **[RESOLVED] www domain gap** — `www.cacaofrutabrutal.com` is now confirmed as a permanent verified project domain (createdAt ~2026-04-23). Previous reports flagged this as a per-deploy alias only. No action needed.

## Vercel MCP tools used
- `list_teams`
- `list_projects`
- `list_project_domains` (×2: cacaofrutabrutal + caua-mvp projects)
- `list_deployments`
- `get_deployment` (×5: last 5 READY production deployments for build timing)

---
_OVERALL: WARN_
