# Deploy Setup — single Vercel project (caua-mvp)

This repo deploys to **one** Vercel project: `caua-mvp`. Production deploys
are triggered exclusively by `.github/workflows/deploy-vercel.yml` calling a
Vercel deploy hook, on every push to `main` or via manual dispatch.

No other Vercel project should be connected to this repository. If you see
other projects auto-deploying when you push, follow Step 3 below to
disconnect them.

---

## One-time setup

### Step 1 — Create a deploy hook in Vercel

1. Open Vercel dashboard → project **caua-mvp**
2. **Settings** → **Git** → scroll to **Deploy Hooks**
3. **Create Hook**:
   - Hook Name: `github-main`
   - Git Branch: `main`
4. Copy the URL (looks like `https://api.vercel.com/v1/integrations/deploy/prj_.../...`)

### Step 2 — Add the hook URL as a GitHub secret

1. GitHub → repo **cacaofrutabrutal** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**:
   - Name: `VERCEL_DEPLOY_HOOK_URL`
   - Value: <the URL from Step 1>
3. **Add secret**

### Step 3 — Disconnect every OTHER Vercel project from this repo

For each Vercel project (other than caua-mvp) that points at
`amauryamed-svg/cacaofrutabrutal`:

1. Open the project in Vercel
2. **Settings** → **Git** → **Disconnect from Git Repository**

This prevents duplicate or competing deploys. The known offender as of
2026-04-26 was a project whose deploy URL pattern is
`caua-<random>-amauryamed-1073s-projects.vercel.app` (not caua-mvp). Verify
the project name in its Settings → General before disconnecting.

### Step 4 — Verify

After Steps 1–3:

1. Push a small commit to `main` (or run **Actions** → **Deploy to caua-mvp
   (Vercel)** → **Run workflow** for a manual trigger)
2. Check that the Action succeeds: GitHub → **Actions** tab
3. Check Vercel → caua-mvp → **Deployments** for the new build
4. Curl the production URL once the build succeeds

---

## Operational notes

- **Manual deploys**: GitHub → Actions → "Deploy to caua-mvp (Vercel)" → "Run workflow"
- **Rollback**: redeploy a prior commit via Vercel UI; the GitHub workflow
  is fire-and-forget (it triggers, doesn't track build status)
- **Build still runs on Vercel side**: this workflow only triggers; the
  actual build (npm run build) runs in Vercel using the project's settings
- **TypeScript --noUnusedLocals**: enabled by default; unused locals/imports
  fail the build. The deploy on 2026-04-26 was unblocked by removing 3 such
  errors. Keep the lint clean before merging to main.

---

## Why a deploy hook instead of Vercel's GitHub integration?

Multiple Vercel projects had been auto-deploying from this repo via Vercel's
native GitHub integration. They were getting auto-canceled from the Vercel
dashboard, blocking production updates. A single deploy hook from a single
GitHub Actions workflow eliminates the ambiguity: one source of truth,
explicit log of every deploy in the Actions tab.

## Project framework setting

Vercel project `caua-mvp` should have `framework: vite` or `framework: null`,
**NOT** `create-react-app`. The CRA preset auto-applies a `* → /index.html`
SPA catch-all that overrides the `vercel.json` rewrite `/ → /investor-landing.html`,
making the apex serve the SPA shell instead of the pitch (visible as a
black screen because `BRAND.bgDeep #040C06` shows while React fails to mount).

If you ever see the apex serve the SPA instead of the pitch, check:

```
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/prj_Fc5Rbha3hlIRAXrevMIoIaBeXWoz?teamId=team_aVPGjM9P30YNoCQKEvdBp4UQ" \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['framework'])"
```

To fix:

```
curl -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d '{"framework":null}' \
  "https://api.vercel.com/v9/projects/prj_Fc5Rbha3hlIRAXrevMIoIaBeXWoz?teamId=team_aVPGjM9P30YNoCQKEvdBp4UQ"
```

Then trigger a new deploy with a fresh git sha (Vercel dedupes redeploys of
the same sha so re-running the hook doesn't pick up the new framework setting
until a new commit lands).
