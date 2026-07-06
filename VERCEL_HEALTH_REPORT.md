# Vercel Deploy Health Report
Timestamp: 2026-07-06T14:20:00Z
Window: last 7 days
Project: caua-mvp (Vercel MCP unavailable — see §Infrastructure Limitations)

## Summary: ⚠️ WARN

GitHub Actions deploy pipeline is **100% green** (30/30 runs, 0 failures). Build durations
are healthy (avg 101s). **However, 5 of 9 checks are unverifiable** this run due to two
persistent infrastructure constraints:

1. **Egress proxy blocks `cacaofrutabrutal.com:443`** — all curl-based site checks fail
   with `connect_rejected / gateway answered 403` (57th consecutive run with this block).
2. **Vercel MCP connector is installed but `enabledInChat: false`** — deployment-level
   queries (deploy list, build logs, domain aliases) are unavailable.

Last real code deploy was **10 days ago** (2026-06-26, sha `16ed059`) and succeeded. No
failed deployments detected via GitHub Actions in the last 7 days.

---

## Deploy activity (7d) — GitHub Actions only

- Total gh runs: 2 | success: 2 | failure: 0
- Last gh run: `d55afb4` — "chore: health report 2026-07-06 — 57th consecutive blocked run" — 0h ago — 125s
- Previous gh run: `24eb235` — "chore(health): weekly health report run #56" — 2026-06-29 — 59s
- **Last real code deploy:** `16ed059` — 2026-06-26T04:23:51Z — 10d 9h ago — 81s
  - Title: fix(seed): include email column in cdp-reviewer upsert + resolve merge
  - URL: https://github.com/amauryamed-svg/cacaofrutabrutal/actions/runs/28217009982
- Last ERROR deployment: none detected via GitHub Actions (all 30 recorded runs = success)

> Note: 7-day window contains only health-report commits (automated weekly chore commits).
> Last substantive feature deploy was 2026-06-26 (two deploys that day: magic-link auth + seed fix).

---

## Build performance — GitHub Actions timing

Last 5 run durations: 125s, 59s, 121s, 81s, 121s

Average: **101s (1.7 min)**

Verdict: **OK** — well under the 4-minute WARN threshold. No regression detected.

> Two outlier runs at ~121–125s correspond to health-report commits (slightly heavier than
> pure feature deploys). Feature deploys cluster at 59–81s.

---

## Domains

**Cannot verify** — Vercel MCP `enabledInChat: false`.

Workflow config review (`.github/workflows/deploy-vercel.yml`) confirms the `promote-alias`
job explicitly sets **both** `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` on every
successful deploy. This logic is intact and unchanged.

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ BLOCKED | Egress proxy rejects CONNECT to cacaofrutabrutal.com:443 — 57th consecutive block |
| 2 | Bundle freshness | ⚠️ BLOCKED | Cannot fetch site HTML — same proxy block |
| 3 | Vercel deploys 7d | ⚠️ UNAVAILABLE | Vercel MCP not enabled in chat; gh data: 2 runs, 0 errors |
| 4 | Build duration | ✅ OK | Last 5 avg 101s — under 4-min threshold |
| 5 | Domain alias | ⚠️ UNAVAILABLE | Vercel MCP not enabled; workflow logic confirmed correct |
| 6 | Failed deploy logs | ✅ N/A | 0 failures in last 7 days (gh); nothing to fetch |
| 7 | gh ↔ Vercel cross-check | ⚠️ PARTIAL | gh: 2 success runs; Vercel side unqueryable — no mismatch evidence |
| 8 | Workflow integrity | ✅ PASS | No changes to deploy-vercel.yml or vercel.json in last 7 days |
| 9 | SPA routes | ⚠️ BLOCKED | Proxy block prevents curl to /fund, /app/adoptar, /investor-landing.html |

---

## Failed deployments (last 7 days)

None detected. All GitHub Actions runs in the window concluded `success`.

---

## Workflow integrity detail

**`.github/workflows/deploy-vercel.yml`** — unchanged in 7 days. Analysis:
- `trigger-vercel-deploy` job: POSTs to `VERCEL_DEPLOY_HOOK_URL` secret ✅
- `promote-alias` job: polls Vercel API (app=`caua-mvp`) up to 8 min (24 × 20s) for a
  READY deployment matching `GITHUB_SHA`, then aliases to **both**
  `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` ✅
- Graceful degradation: if `VERCEL_TOKEN` is missing, alias step is skipped with a warning
  (not a hard failure) — this is intentional.

**`vercel.json`** — unchanged in 7 days. Analysis:
- SPA catch-all rewrite (`/:path* → /index.html`) present ✅
- Security headers (HSTS, CSP, X-Frame-Options, nosniff) present on all routes ✅
- `/fund` and `/adoptar` both have redirects to `/app/*` equivalents ✅
- `/investor-landing.html` has its own CSP header override ✅
- Root `/` redirects to `/investor-landing.html` (non-permanent) ✅
- Daily cron at `0 6 * * *` for `/api/cacao_predictor` ✅

---

## Issues / Action Items

### 🔴 Persistent: Egress proxy blocks cacaofrutabrutal.com (57 weeks)
The egress policy for this Claude Code session has blocked outbound HTTPS to the
production domain every week for at least 57 runs. Site availability, bundle freshness,
and SPA route checks **have never succeeded** from this monitor environment.

**Action required:** Choose one:
1. **Enable Vercel MCP in the chat session** — covers Checks 3–6 without needing
   direct HTTP access to the production site.
2. **Request egress policy allowlist** — add `cacaofrutabrutal.com` to the allowed hosts
   for this Claude Code session via the environment network policy settings.
3. **Move site checks to an external uptime monitor** (e.g. Vercel Analytics, Better
   Uptime, or a Supabase Edge Function cron) that runs outside this proxy.

Until one of these is resolved, the health monitor can only verify the GitHub Actions
deploy pipeline — not actual site health.

### 🟡 Low: Last code deploy 10 days ago
No feature or fix commits since 2026-06-26. Not a failure, but worth noting if a deploy
was expected. Weekly health-report commits do trigger the Vercel deploy hook, keeping
the pipeline exercised.

---

## Vercel MCP tools used

None — Vercel MCP connector is installed (`directoryUuid: 7eb42afe-...`) but
`enabledInChat: false` in this session. Tools that would have been used:
`list_projects`, `list_deployments`, `get_deployment`, `get_deployment_events`.

**To enable:** Go to claude.ai → Connector Settings → Vercel → toggle on for this chat.

---

## GitHub MCP tools used

- `mcp__github__actions_list` (method: `list_workflow_runs`, workflow: `deploy-vercel.yml`, limit: 30)
- `mcp__github__get_file_contents` (`.github/workflows/deploy-vercel.yml`)
- `mcp__github__get_file_contents` (`vercel.json`)
