# TL Agent — Cremilo override

Extends `~/.claude/skills/tl-agent-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Stack context

Read stack details from `AGENTS.md` (Next.js 15 App Router, CSS Modules, Supabase + `@supabase/ssr`, TanStack Query, pnpm, Volta Node 22, Vercel). Do not re-derive from scratch.

## Autonomous infra execution

Query Linear for `[I-XX]` issues in `Todo` state. For each, read the issue description to identify deps. Issues with no unsatisfied deps can run in parallel. Issues with deps run once their deps are `Done`. Do not follow a fixed sequential order.

## Workflow additions

- When infra issues unlock in parallel, execute them concurrently (separate branches, separate PRs)
- After completing each issue, re-query Linear to check if new issues became unblocked

## Hard constraints (Cremilo additions)

- All Supabase schema changes must include RLS policies
