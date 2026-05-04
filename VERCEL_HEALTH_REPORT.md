# Vercel Deploy Health Report
Timestamp: 2026-05-04T14:50:00Z
Window: last 7 days (2026-04-27 → 2026-05-04)
Project: caua-mvp (alias: caua-mvp-amauryamed-1073s-projects.vercel.app)
Run: **#50**

---

> **⚠️ PERSISTENT SANDBOX EGRESS BLOCK — RUN #50**
>
> Every outbound HTTP/HTTPS request from this Claude Code sandbox is intercepted by the
> **Anthropic sandbox egress proxy**, which returns `HTTP 403 x-deny-reason: host_not_allowed`
> before the packet ever reaches the real server. This has occurred on **every single health run
> since Run #1**. The 403s seen below are **proxy artifacts, not production failures**.
>
> **This is not a production outage.** This is a structural monitoring environment limitation.
>
> **Permanent fix required:** Move this health check to an environment with real egress:
> - GitHub Actions scheduled workflow (`schedule: cron`)
> - Vercel cron function hitting an external status endpoint
> - Local terminal / dedicated monitoring server
>
> Until then, all HTTP-based checks (site, routes, headers, bundle, domains) are marked
> **INCONCLUSIVE** and must not be treated as pass or fail signals.

---

## Summary: ⚠️ WARN

**Why WARN and not PASS:**
- Vercel MCP unavailable → cannot confirm deployment states, build durations, or domain alias bindings
- `promote-alias` job in the workflow is silently skippable when `VERCEL_TOKEN` secret is absent/expired — if the secret has lapsed, `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` may not be pointing to the latest READY deployment
- No external confirmation that any of the 36 commits' deploy hooks actually fired (gh CLI not available in sandbox; GitHub Actions run API is blocked)

**Why not FAIL:**
- All sandbox-blocked 403s are proxy artifacts — site could be fully healthy
- Workflow file (`deploy-vercel.yml`) and `vercel.json` are **unchanged** in the last 7 days (confirmed via git log)
- The alias promotion logic in the workflow correctly targets both `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com`
- Active development (36 commits, 9 PRs merged) signals team is pushing to main regularly, which triggers deploys

---

## Deploy activity (7d)

| Metric | Value |
|--------|-------|
| Git commits pushed to `main` | **36** |
| Expected Vercel deploy hook triggers | **36** (one per push) |
| Distinct PRs merged | **9** (#34–#42) |
| Direct pushes to main | **~3** (health commits + wip) |
| Vercel MCP available this session | ❌ Not connected |
| GitHub Actions API reachable from sandbox | ❌ Blocked |

**Commits in window (newest → oldest):**

| SHA | Date (UTC) | Title |
|-----|-----------|-------|
| `04427b3` | 2026-05-04T14:17Z | chore(health): add 2026-05-04 run — 50th consecutive sandbox-blocked check |
| `b586c2c` | 2026-05-01T23:28Z | wip: switch context |
| `cad3f33` | 2026-05-01T20:41Z | fix(web3): wrap Ed25519 seed in PKCS8 for Web Crypto private-key import (#42) |
| `d6cd8cc` | 2026-05-01T20:07Z | feat(web3): CDP Onramp ready for review (Ed25519 + $5 preset + Base App) (#41) |
| `37e8d91` | 2026-05-01T05:02Z | feat(lab): chocolate-making minigame — liofilizado + refinado + conchado (#40) |
| `c3b5982` | 2026-05-01T03:27Z | feat(labranza): lineage regeneration loop — slice dead → mint regen badge (#39) |
| `524e71b` | 2026-05-01T01:13Z | feat(harvest): SVG colored pods + tree backdrop + physics-based fall (#38) |
| `8e05c02` | 2026-05-01T00:51Z | feat(ux): post-harvest CTAs + 4-tier vital states + Labranza arena CTA (#37) |
| `ed8abaa` | 2026-05-01T00:24Z | feat: Fruit-Ninja harvest + recurring lifecycle + CDP JWT + landing copy (#36) |
| `e5d7c47` | 2026-04-29T23:21Z | feat: SPA + investor landing rebuild — death mechanic, new UE, 60/30/10, fiat+web3 mockups |
| `eb30b80` | 2026-04-29T19:04Z | copy(investor-landing): simplify s015_body |
| `14e886` | 2026-04-29T18:12Z | Merge PR #35 web3/sprint-2-tokenization |
| `f29143` | 2026-04-29T18:01Z | docs(cdp): personalize Onramp application response |
| `ea26053` | 2026-04-29T17:53Z | feat(web3): CDP-compliant Onramp session token flow (skeleton) |
| `db6dbdb` | 2026-04-29T17:42Z | chore(web3): wire CHAINALYSIS + WalletConnect Project ID |
| `9dfa321` | 2026-04-29T15:42Z | feat(sprint-2): wire faucets + CauaBonga MVP loop + Sepolia bridge + mainnet prep |
| `d55eaa4` | 2026-04-28T21:43Z | Merge PR #34 web3/phases-1-7-wiring |
| `400c6e6` | 2026-04-28T21:41Z | feat: implement CauaBonga core economy and planting system |
| `fb51b21` | 2026-04-28T21:37Z | feat(asset): cacao-heart-morph.svg — Fear-5 criollo pod |
| …+17 more | 2026-04-27–28 | Various feature, fix, chore commits |

---

## Build performance

**INCONCLUSIVE** — Vercel MCP not connected; cannot query deployment records or build durations.

*Baseline for reference:* Historical builds have averaged ~90s. WARN threshold is >4 min average.

---

## Domains

**INCONCLUSIVE** — Both `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` return
`403 x-deny-reason: host_not_allowed` from the sandbox proxy. This is **not** a real domain failure.

**Verified structurally:**
- `vercel.json` is unchanged — SPA rewrites, redirects, and headers are intact
- Workflow `promote-alias` job aliases both `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` on every READY deploy
- **Risk:** If `VERCEL_TOKEN` secret is absent/expired, the `promote-alias` job silently skips (`skip=true`) and domains may be stale

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ INCONCLUSIVE | Sandbox proxy returns `403 x-deny-reason: host_not_allowed` — not a real failure |
| 2 | Bundle freshness | ⚠️ INCONCLUSIVE | curl blocked before reaching origin; no asset hash extractable |
| 3 | Vercel deploys 7d | ⚠️ INCONCLUSIVE | Vercel MCP not connected — cannot query deployment states |
| 4 | Build duration | ⚠️ INCONCLUSIVE | Vercel MCP not connected — cannot fetch build times |
| 5 | Domain alias | ⚠️ INCONCLUSIVE | Cannot verify from sandbox; structurally correct per workflow + vercel.json |
| 6 | Failed deploy logs | ⚠️ INCONCLUSIVE | Vercel MCP not connected |
| 7 | gh ↔ Vercel cross-check | ⚠️ INCONCLUSIVE | `gh` CLI not installed in sandbox; GitHub Actions API blocked |
| 8 | Workflow integrity | ✅ PASS | No changes to `deploy-vercel.yml` or `vercel.json` in last 7 days (git log confirmed) |
| 9 | SPA routes | ⚠️ INCONCLUSIVE | All routes (`/fund`, `/app/adoptar`, `/investor-landing.html`) return `403` from sandbox proxy |

---

## Failed deployments

Cannot determine — Vercel MCP not available.

---

## Issues / Action items

### 🔴 P0 — Fix the monitoring environment (blocks all meaningful health data)

This is run **#50** of a health monitor that has never produced real HTTP data. The sandbox
egress block is permanent for this Claude Code environment. **Every weekly run produces zero
actionable deployment health signal.** Immediate options:

1. **GitHub Actions scheduled workflow** — Add a `schedule: cron('0 8 * * 1')` job to
   `.github/workflows/health-check.yml` that runs `curl -fsS https://cacaofrutabrutal.com`
   and reports status to Slack/Discord.
2. **Vercel cron** — Add a `/api/health` serverless function + Vercel cron that pings itself
   and posts results to a webhook.
3. **Run from local terminal or CI** — Execute the curl/gh commands directly; they work fine
   outside the sandbox.

### 🟡 P1 — Verify VERCEL_TOKEN secret is still valid

The `promote-alias` job silently skips when `VERCEL_TOKEN` is absent or expired:
```yaml
echo "::warning::VERCEL_TOKEN not configured — skipping alias promotion"
echo "skip=true" >> "$GITHUB_OUTPUT"
exit 0
```
If this secret has expired (Vercel tokens have a max 1-year TTL per token config), every deploy
since expiry has **built successfully but NOT been aliased** — the custom domain would serve the
last aliased deployment, not the latest code.

**Action:** GitHub → repo Settings → Secrets and variables → Actions → check `VERCEL_TOKEN`
expiry, and Vercel Dashboard → Account Settings → Tokens → verify `github-actions-cfb` token
is still active.

### 🟡 P2 — Connect Vercel MCP for future runs

If a Vercel MCP server is available (e.g., via `@vercel/mcp-adapter` or similar), configure
it in `.claude/settings.json` so future health runs can query actual deployment states, build
durations, and domain alias bindings without needing network egress from the sandbox.

---

## Vercel MCP tools used

**None** — Vercel MCP server was not connected in this session. Tool discovery (`ToolSearch`)
found only GitHub MCP (`mcp__github__*`) and shadcn MCP (`mcp__shadcn__*`) as available
MCP servers. Vercel deployment data could not be queried programmatically.

**GitHub MCP tools called:** `mcp__github__list_commits`

**Direct tools used:**
- `curl` (site availability, headers, SPA routes, bundle — all blocked by sandbox proxy)
- `git log` (workflow integrity check — no changes confirmed)
- `git log --oneline` with `--since` (commit activity — 36 commits in window confirmed)
