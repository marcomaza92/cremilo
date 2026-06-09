# Gate Watcher — Cremilo override

Extends `~/.claude/skills/gate-watcher-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Implementation

The polling logic runs as a Python script: `python3 .docs/gate-watcher.py`

Issue key→LinearID map: `.docs/gate-watcher-map.json`
Sub-app config (trigger map, issue catalogues, prompts): `.docs/gate-watcher-config.json`

To support a new sub-app, the PO agent writes a new `gate-watcher-config.json` — no Python changes needed.

## Linear context

- **Team**: `Cremilo`
- **Team ID**: `5c088e06-e8e8-4311-9da8-19c178bbbba7`
- **Active project ID**: read from `gate-watcher-config.json`

## Trigger map (loaded from config)

The trigger map (D-XX → DEV-XX deps, DEV-XX → Q-XX deps) lives in `gate-watcher-config.json`. The gate-watcher.py loads it at startup. Do not maintain a separate hardcoded copy here.

## Batch queuing rule

When multiple issues unlock in the same cycle, write all of them to `pending-agents.json` in a single batch before exiting the cycle. This prevents partial-state issues where the next cycle sees some unlocked issues as already processed.

## Checklist requirement

Gate-watcher blocks D-XX → DEV-XX propagation until BOTH the Accessibility review checklist AND the Manual review checklist on the design issue's latest In-Review comment are fully ticked.

## Known broken tools

- `mcp__scheduled-tasks__update_scheduled_task` blocked in unsupervised mode — user triggers manually from Claude Code UI
- `UserPromptSubmit` hook not firing for real prompts — run gate-watcher manually at session start

## Tools allowed

- `mcp__linear-cremilo__linear_search_issues` — read all issues
- `mcp__linear-cremilo__linear_bulk_update_issues` — update issue status only
- `Write` / `Read` — `.docs/gate-watcher.log`, `.docs/gate-watcher-config.json`, `/tmp/gate-watcher-state.json`
