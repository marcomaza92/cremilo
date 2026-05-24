# QA Agent — Rationale

## What is this agent?

The QA Agent is a Senior QA Engineer. It sets up the E2E test framework immediately after Gate 0, then writes and executes test scripts as each feature is completed. It uses Claude in Chrome for browser automation and is the gatekeeper for the staging deploy.

## Why does this agent exist?

Quality assurance cannot be an afterthought. By giving QA a dedicated agent that starts its framework setup in parallel with infra and design, the team avoids the common anti-pattern of "we'll test at the end." The QA agent's `Q-07` (full regression) is a hard dependency for `DEV-14` (staging deploy).

## Constraints

- **Cannot modify source code.** Strictly a consumer of deployed features.
- **Cannot approve gates.** Can only signal readiness (`Q-07` → `Done`).
- **All test scripts must be reproducible.** No flaky selectors, no timing-dependent assertions.
- **Bug issues must include** steps to reproduce, expected vs actual outcome, and a screenshot.
- **`Q-07` (full regression) must pass** before `DEV-14` (staging deploy) can be triggered.
- **Test scripts must target the Vercel preview URL**, not localhost.

## Skills

- Claude in Chrome browser automation (`mcp__Claude_in_Chrome__*`)
- Claude Preview for screenshot and network inspection
- E2E test script writing (navigate, fill, click, assert)
- Bug report writing with reproduction steps
- Regression suite composition and execution

## Abilities

- Automate auth flow (register → login → logout)
- Automate CRUD operations in Ingresos, Gastos Fijos, Tarjetas tables
- Verify currency switching behavior (ARS ↔ USD mode in forms)
- Verify tax calculation output (1.49% Impuesto de Sellos)
- Verify config screen rate persistence across page reloads
- Capture and attach screenshots to Linear bug reports

## Pros

- Framework (`Q-01`) is set up before any feature exists — no setup delay when features arrive
- Each test script is scoped to one feature — easy to isolate failures
- Browser automation removes human error from regression testing
- `Q-07` as staging gate prevents broken code reaching production

## Cons

- Entirely dependent on features being deployed to a testable URL (Vercel preview)
- Sequential dependency on feature completion — cannot test what doesn't exist
- Claude in Chrome test stability can be affected by DOM structure changes mid-sprint
- Cannot catch logic bugs that don't manifest in the UI (e.g., wrong DB writes — those need unit tests)

## Interactions with other agents

| Agent | Relationship |
|---|---|
| Gate Watcher | Watcher moves QA issues to `Todo` as features complete |
| TL Agent | TL provides the Vercel preview URL that QA tests against |
| FE-A | QA tests auth flow and logic after FE-A completes `DEV-01`, `DEV-13` |
| FE-B | QA tests table, form, config after FE-B completes `DEV-04/05/06/10/11/12` |
| PO Agent | QA creates Bug issues that PO triages and prioritizes |
