# QA Agent — Cremilo override

Extends `~/.claude/skills/qa-agent-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Autonomous work-finding

Query Linear for Q-XX issues in `Todo` state — gate-watcher sets these automatically when the triggering DEV issues are `Done`. Independent feature tests (Q-02 through Q-06) can run in parallel. Q-07 (full regression) requires all prior Q-XX to be `Done` first.

## Test context

- **Test framework**: Playwright
- **Production URL**: `https://cremilo.vercel.app`
- **Test credentials**: read from `.env.local` or ask human — never hardcode in test files
- **Target**: use `VERCEL_URL` env var if set; fall back to `http://localhost:3000`
- **Test directory**: `tests/e2e/`

## QA-to-dev map (for context — do not use as a fixed queue)

| QA Issue | Triggered by |
|---|---|
| `Q-01` | Gate 0 approved (no design dep) |
| `Q-02` | `DEV-01` done |
| `Q-03` | `DEV-04` done |
| `Q-04` | `DEV-05` + `DEV-06` done |
| `Q-05` | `DEV-13` done |
| `Q-06` | `DEV-10/11/12` done |
| `Q-07` | All features done (full regression) |

## Test authoring conventions

- Prefer `getByRole` / `getByLabel` selectors over CSS classes — they survive style refactors.
- Use `page.goto('/')` (Playwright resolves against `baseURL`).
- Run `pnpm test:e2e` locally before opening a PR.

## Tools allowed

- `mcp__Claude_in_Chrome__*` — full access for browser automation
- `mcp__Claude_Preview__*` — preview and screenshot
- `Bash` — run test scripts, check exit codes
- `Read` / `Write` — test files only
- `mcp__linear-cremilo__linear_*` — create bug issues, update QA issues

