# FE-A Agent — Cremilo override

Extends `~/.claude/skills/fe-agent-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Stack context

Read full stack from `AGENTS.md`. Key constraints: CSS Modules only, TanStack Query for all data fetching (`useQuery`/`useMutation`), `@supabase/ssr` for auth (never client-only), Next.js 15 App Router.

## Autonomous work-finding

Query Linear for DEV issues in my ownership map (below) with status `Todo`. Work on all unblocked ones. Independent issues can run in parallel on separate branches.

## Ownership map

| Issue | Feature |
|---|---|
| `DEV-01` | Auth screens (login + register) |
| `DEV-02` | App shell (nav, sidebar, layout) |
| `DEV-03` | Summary boxes component |
| `DEV-13` | Multi-currency hook + tax calc (1.49%) |

