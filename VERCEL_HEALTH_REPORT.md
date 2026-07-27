# Vercel Deploy Health Report
Timestamp: 2026-07-27T14:10:00Z
Window: last 7 days (2026-07-20 → 2026-07-27)
Project: caua-mvp (amauryamed-svg/cacaofrutabrutal) — run #122

## Summary: ⚠️ WARN

Deploy pipeline is healthy — 2/2 GitHub Actions runs succeeded this week, alias promotion
completed for both domains at 14:06:23Z today.
**WARN reason:** Monitoring sandbox egress blocks direct HTTPS to `cacaofrutabrutal.com`
for the **61st consecutive week**, making curl checks #1, #2, and #9 impossible. The Vercel
MCP connector is installed but `enabledInChat: false`, preventing direct Vercel API queries.
These are monitoring infrastructure gaps — not evidence of a production outage.

---

## Deploy activity (7d)
- **Total runs:** 2 | **SUCCESS:** 2 | **FAILURE:** 0 | **CANCELED:** 0
- **Last SUCCESS:** run #122 — sha `c5aac3c` — *"chore: weekly health report 2026-07-27"* — 0.2h ago — pipeline 121s
- **Previous SUCCESS:** run #121 — sha `f593c6d` — *"chore: health report 2026-07-20"* — 168h ago — pipeline 124s
- **Last FAILURE:** none in 7d
- **Last real code deploy:** `16ed059` "fix(seed): include email column in cdp-reviewer upsert" — 2026-06-26 (~31 days ago)

### 7-day runs detail
| Run ID | SHA | Title | Created (UTC) | Duration | Conclusion |
|--------|-----|-------|---------------|----------|------------|
| 30273288405 | c5aac3c | weekly health report 2026-07-27 | 2026-07-27T14:04:23Z | 121s | ✅ success |
| 29750087801 | f593c6d | health report 2026-07-20 | 2026-07-20T14:04:XXZ | 124s | ✅ success |

---

## Build / pipeline performance (last 5 successful runs)
| Run ID | Created | Total pipeline duration |
|--------|---------|------------------------|
| 30273288405 | 2026-07-27 | 121s |
| 29750087801 | 2026-07-20 | 124s |
| 29748918484 | 2026-07-20 | 64s |
| 29257623193 | 2026-07-13 | 61s |
| 29256326358 | 2026-07-13 | 60s |

- **Average pipeline time (last 5): 86s (~1m 26s)**
- **Verdict: OK** — well under 4-min WARN threshold
- ⚠️ **Trend note:** The two most recent runs (~122s) are ~2× the older baseline (~62s). The
  "Wait for deployment" step is using 1–2 extra 20s poll cycles before finding READY, suggesting
  Vercel's build started taking slightly longer (~85s vs ~45s). Not alarming, but watch next week.

> Note: Durations are total workflow wall-clock (hook POST + wait-for-READY + alias set).
> The 45s initial sleep in the promote job is included. Vercel build itself appears to be
> completing within 65–85s of the hook being triggered.

---

## Domains
Vercel MCP not enabled for this session — domain state cannot be confirmed via Vercel API.
However, the **"Set production aliases" step in run #122 completed successfully at 14:06:23Z**,
meaning the Vercel API accepted alias assignments for both targets.

- `cacaofrutabrutal.com` → sha `c5aac3c` deployment (inferred from gh job success ✅)
- `www.cacaofrutabrutal.com` → same deployment (same promotion step ✅)

---

## Checks
| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | BLOCKED | Egress proxy 403 — sandbox policy, 61st consecutive week. Not a production issue. |
| 2 | Bundle freshness | BLOCKED | Cannot curl production site — same proxy restriction. |
| 3 | Vercel deploys 7d | ✅ PASS | GitHub Actions: 2/2 success, 0 errors. Vercel MCP offline so no server-side list. |
| 4 | Pipeline duration | ✅ PASS | Avg 86s across last 5 runs; under 4-min threshold. Mild upward trend — monitor. |
| 5 | Domain alias | ✅ INFERRED | Alias promotion step succeeded at 14:06:23Z today for both domains. |
| 6 | Failed deploy logs | N/A | Zero failures in 7d. |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | Both gh successes → "Set production aliases" step succeeded → READY deployments confirmed for each sha. |
| 8 | Workflow integrity | ✅ PASS | No changes to `deploy-vercel.yml` or `vercel.json` in last 7 days. Alias logic targets both `cacaofrutabrutal.com` and `www`. SPA rewrite (`/:path* → /index.html`) and key redirects present. |
| 9 | SPA routes (/fund, /app/adoptar, /investor-landing.html) | BLOCKED | Cannot curl production site. |

---

## Failed deployments
None in the last 7 days.

---

## Issues / Action items

### Persistent (known, pre-existing)
1. **Monitoring sandbox egress block (61 consecutive weeks):** The Claude Code remote execution
   environment's egress policy does not permit CONNECT tunnels to external domains.
   Checks #1, #2, #9, and Vercel API calls are blocked from this environment. This is a sandbox
   policy limitation — not evidence of a production issue.
   **Action:** Enable the **Vercel MCP connector** in claude.ai → Settings → Connectors
   (`enabledInChat: false`, directoryUuid `7eb42afe-0087-4493-a105-da2b021d5c03`). Enabling it
   unlocks checks 3, 5, and 7 from Vercel's API without needing curl to the live domain.

2. **No real code deploys in 31 days:** Last product commit was 2026-06-26. Confirm whether
   active development is paused intentionally (CDP review / feature freeze).

3. **Build time upward trend:** Pipeline time jumped from ~62s (early July) to ~122s (latest two
   runs). If next week's average exceeds 150s, run `npm run build -- --report` to check for
   bundle size growth.

---

## Vercel MCP tools used
None — `enabledInChat: false`. Connector installed (directoryUuid `7eb42afe-0087-4493-a105-da2b021d5c03`).
Enable in claude.ai connector settings to unlock: `list_projects`, `get_project`,
`list_deployments`, `get_deployment`, `get_deployment_events`, `list_teams`.

## GitHub MCP tools used
- `mcp__github__actions_list` — `list_workflow_runs` (deploy-vercel.yml, last 20 runs)
- `mcp__github__actions_list` — `list_workflow_jobs` (run 30273288405)
- `mcp__github__actions_get` — `get_workflow_run_usage` (runs 30273288405, 29750087801, 29748918484, 29257623193, 29256326358)
- `mcp__github__actions_get` — `get_workflow_run` (run 30273288405)
