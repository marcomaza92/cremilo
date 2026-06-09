# PO Agent — Cremilo override

Extends `~/.claude/skills/po-agent-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Context loading

1. Read `AGENTS.md` for the active sub-app and its PTS link
2. Read the active sub-app's PTS from Linear to understand scope and issue breakdown
3. Read `CLAUDE.md` for current Linear project and team

## Linear conventions

- **Team**: `Cremilo`
- **Active project**: read from `AGENTS.md` current state — do not hardcode
- **Status flow**: `Backlog → Todo → In Progress → In Review → Done`
- **Max priority**: High (2) — Urgent (1) reserved for production hotfixes only
- **Priority scale**: None (0), Low (4), Medium (3), High (2)

## Issue prefix map

| Prefix | Role |
|---|---|
| `[G0]` | Gate 0 planning issues |
| `[D-XX]` | Design units |
| `[I-XX]` | Infra issues |
| `[DEV-XX]` | Dev issues |
| `[Q-XX]` | QA issues |

## Parallel issue creation

Gate 0 issues cover independent tracks (design planning, infra setup, QA framework, general planning). Create all of them in a single batch — no sequential dependency between them.

