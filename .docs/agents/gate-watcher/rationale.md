# Gate Watcher Agent — Rationale

## What is this agent?

The Gate Watcher is a lightweight polling agent that runs on a 5-minute cron cycle. It reads the Linear board, detects status transitions (especially design approvals moving issues from `In Review` to `Todo`), and propagates those transitions to downstream issues — effectively acting as the automated nervous system of the pipeline.

## Why does this agent exist?

Without the Gate Watcher, a human would need to manually move every DEV issue to `Todo` after each design approval, and every QA issue after each feature completion. That's error-prone, slow, and doesn't scale. The Gate Watcher automates all dependency propagation, making the pipeline self-driving between human approval moments.

## Constraints

- **Never moves issues to `Done`.** Only `Todo` or `In Progress`. Done is always a human or explicit agent action.
- **Never creates new issues.** Only updates existing ones.
- **Never approves gates.** It propagates approvals; it doesn't grant them.
- **Minimum poll interval: 5 minutes.** Token budget constraint — more frequent is wasteful.
- **Must validate dependencies before propagating.** A DEV issue only moves to `Todo` if ALL its dependencies are `Done`.
- **Must log every action** (including no-ops) to `.docs/gate-watcher.log` for auditability.

## Skills

- Linear issue listing and status updates (`mcp__linear-server__list_issues`, `save_issue`)
- State diffing (compare current Linear state to previous cycle state)
- Dependency resolution (checking multi-dep conditions before triggering)
- Log writing

## Abilities

- Detect all 9 design approval transitions (D-01 through D-09)
- Detect all infra issue completions (I-01 through I-06)
- Detect all dev issue completions (DEV-01 through DEV-13)
- Validate composite dependencies (e.g., `DEV-07` requires both `DEV-04` AND `DEV-05` Done)
- Propagate QA triggers as features complete
- Detect Gate 0 full clearance (all 4 `[G0]` items Done)
- Write structured log entries for every cycle

## Pros

- Extremely token-cheap — only reads Linear + writes a log line per cycle
- Fully autonomous between human approval moments
- Prevents agents from self-starting based on wrong assumptions
- Audit log provides a full history of pipeline progression
- Can be paused and resumed without losing state (re-reads Linear on each cycle)

## Cons

- 5-minute polling means up to 5 minutes of delay between approval and agent trigger
- Depends entirely on Linear status accuracy — if an agent forgets to update an issue, Watcher won't propagate
- No push notification capability — purely reactive
- State stored in `/tmp/` — lost on system restart (Watcher re-syncs from Linear on next cycle, so not catastrophic)
- Cannot handle circular dependencies (not expected in this pipeline, but worth noting)

## Interactions with other agents

| Agent | Relationship |
|---|---|
| PO Agent | PO creates all issues; Watcher reads and propagates them |
| Design Agent | Watcher detects design approvals and triggers DEV issues |
| TL Agent | Watcher detects infra completions and validates DEV pre-conditions |
| FE-A / FE-B | Watcher moves their issues to `Todo` when triggered; they self-move to `In Progress` |
| QA Agent | Watcher triggers QA issues as features complete |
| Human | Human approval is the only event Watcher cannot generate — it only propagates it |
