# NOTES — infra-devops

## Architectural Decisions

**[2026-04-18] Vercel is primary deployment, Netlify is backup**
Both `vercel.json` and `netlify.toml` are maintained. Vercel is the active production deployment. Netlify exists as a fallback in case of Vercel outage or account issues. Changes to SPA rewrites, security headers, or build commands must be made in both config files.

**[2026-04-18] Environment variables set only in Vercel dashboard — never committed**
Production secrets are configured via the Vercel UI under Project Settings → Environment Variables. The `.env.local` file is gitignored and is for local development only. Never commit `.env`, `.env.local`, or any file containing actual secret values. The `.env.example` file (to be created) documents required variable names only.

**[2026-04-18] Pre-commit hook blocks console.log in src/ — intentional**
`scripts/health.py` blocks commits that include `console.log` calls in `src/`. This prevents production debug logging. Use `console.error` or structured logging for legitimate error reporting. To bypass in genuine emergencies: `git commit --no-verify`.

**[2026-04-18] Playwright is installed but zero tests exist**
`@playwright/test` is in devDependencies but no test files have been written. The adoption flow and ritual flow are the two highest-priority E2E tests — they exercise the core user journey and both payment-adjacent token award paths. These should be written before the Q2 2026 production batch.

**[2026-04-18] No GitHub Actions CI configured**
The SRS v1 (2026-04-13) referenced GitHub Actions with Claude review. This has not been implemented. There is no `.github/workflows/` directory. Until CI is set up, TypeScript errors and lint failures will only be caught locally.

## Known Risks

- No E2E tests exist. The adoption flow, ritual flow, and lot investment flow are untested outside of manual QA.
- No GitHub Actions CI means TypeScript regressions can slip into main undetected.
- No `.env.example` exists. A new developer setting up the project has no documentation on required environment variables.
- The Python functions in `api/` are not tested via `pytest`. The health.py pre-commit hook doesn't check Python yet.
- CSP headers are documented in `SECURITY-HEADERS-GUIDE.md` but not configured in `vercel.json` production headers. The app runs without CSP in production.
