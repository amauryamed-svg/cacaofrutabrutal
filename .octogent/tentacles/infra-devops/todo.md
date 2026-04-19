# todo — infra-devops

## P1 — Q2 Meaningful Experience

- [ ] [P1] Write Playwright E2E test: full adoption flow — login → navigate to /adoptar → select Guardian → confirm adoption → verify tree appears in dashboard → verify +10 beans awarded
- [ ] [P1] Write Playwright E2E test: ritual flow — login → navigate to /ritual → draw card → verify token reward animation → verify beans_balance incremented
- [ ] [P1] Create `.env.example` in project root: list all required env variable names with no values and one-line comment explaining each — reference the env var table in CONTEXT.md

## P2 — Q3–Q4 Scale

- [ ] [P2] Set up GitHub Actions CI workflow (`.github/workflows/ci.yml`): run `npm run build`, `tsc --noEmit`, `npm run lint`, `python -m pytest api/` on every push to main and every PR
- [ ] [P2] Add GitHub Actions Claude code review: `claude -p "/review"` on every PR — non-interactive mode
- [ ] [P2] Configure CSP headers in `vercel.json` `headers` array and in `netlify.toml` `[[headers]]` block — align to `vite.config.security-headers.ts` definitions
- [ ] [P2] Add Vercel Analytics event tracking: wrap `useEffect` to call `track('page_view', { page })` on route changes (already installed via `@vercel/speed-insights`)
- [ ] [P2] Add Supabase DB backup documentation: document how to trigger manual backup via Supabase dashboard and how to restore from backup
- [ ] [P2] Update `scripts/health.py` to add Octogent-specific checks: verify all 8 tentacle CONTEXT.md files exist, warn if any NOTES.md hasn't been updated in > 30 days
- [ ] [P2] Add Python code quality to pre-commit hook: run `flake8 api/` and check max function line count (≤20 lines) on Python files
