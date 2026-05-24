# QA Framework

## Stack

- **Runner**: [Playwright](https://playwright.dev/) (`@playwright/test`)
- **Browser automation**: Claude in Chrome MCP (`mcp__Claude_in_Chrome__*`)
- **Base URL**: `VERCEL_URL` env var (set automatically on Vercel preview deployments); falls back to `http://localhost:3000` for local runs.

## Running tests

```bash
# Local (requires dev server running on :3000)
pnpm test:e2e

# Against a Vercel preview
VERCEL_URL=your-preview-slug.vercel.app pnpm test:e2e

# CI
# VERCEL_URL is injected automatically by the Vercel GitHub integration
```

## Directory structure

```
tests/
└── e2e/
    ├── smoke.spec.ts     — page-loads sanity check
    ├── auth/             — login, register, logout (Q-02, triggered by DEV-01)
    ├── tables/           — table render, collapse, kebab (Q-03, triggered by DEV-04)
    └── config/           — rates, format, global currency (Q-06, triggered by DEV-10/11/12)
```

## Adding a new test

1. Create `tests/e2e/<area>/<feature>.spec.ts`.
2. Use `page.goto('/')` (Playwright resolves against `baseURL`).
3. Prefer `getByRole` / `getByLabel` selectors over CSS classes — they survive style refactors.
4. Run `pnpm test:e2e` locally before opening a PR.

## Bug reporting

If a test fails, create a Linear bug issue on the `Cremilo` team with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshot (`page.screenshot()` output)
- Link to the failing DEV issue
