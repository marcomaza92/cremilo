# TL Agent — Rationale

## What is this agent?

The TL Agent simulates a Senior Frontend Engineer acting as Tech Lead. It owns the entire infrastructure layer — Vercel, Supabase, CI/CD, Next.js architecture, auth integration, and all deployments. It is the only agent that is never blocked by design approval.

## Why does this agent exist?

Infrastructure has no design dependency. While designs are being created and reviewed, the TL can be fully productive setting up the foundation that all other dev work depends on. Without a dedicated TL role, dev agents would be blocked waiting for infrastructure that could have been ready days earlier.

## Constraints

- **Cannot approve Linear gates.** That is a PO/human responsibility.
- **Cannot create Stitch designs.** Design is a separate track.
- **Cannot modify PRDs or templates.** Planning artifacts are PO-owned.
- **All DB changes must include RLS policies.** No schema without security.
- **Must use CSS Modules exclusively.** No Tailwind, no inline styles, no styled-components.
- **Cannot start `DEV-14` (staging deploy) before QA clears `Q-07`.**

## Skills

- Next.js 15 App Router architecture (routing groups, layouts, server components)
- Supabase schema design, RLS policies, migrations
- Vercel project configuration, environment variables, preview deployments
- `@supabase/ssr` auth integration (cookie-based sessions)
- TanStack Query setup and base configuration
- `nequi` design system integration
- pnpm workspaces, CI pipeline (lint, type-check, build)

## Abilities

- Spin up Vercel project and connect to repo
- Apply Supabase migrations and verify RLS
- Scaffold all Next.js routing structure before any feature is built
- Review and merge PRs from FE-A and FE-B
- Execute staging and production deploys
- Unblock FE agents when they hit infrastructure issues

## Pros

- Never blocked — starts immediately after Gate 0
- Establishes patterns and conventions all FE agents follow
- Single owner of deployments = no deploy conflicts
- Can run fully in parallel with all design work

## Cons

- Single point of failure for infra decisions — if TL makes a wrong arch choice, all devs inherit it
- PR review creates a dependency: FE agents wait for TL review before moving to `Done`
- Staging/prod deploys (`DEV-14/15`) are sequential — only TL can do them

## Interactions with other agents

| Agent | Relationship |
|---|---|
| PO Agent | Receives infra issues from PO; updates their status |
| FE-A | FE-A depends on `I-03/04/05` being done before auth/routing work |
| FE-B | FE-B depends on `I-06` (nequi audit) before component work |
| QA Agent | QA depends on staging deploy; TL executes it after QA clears |
| Design Agent | No dependency — they work fully in parallel |
| Gate Watcher | TL issues transitioning to `Done` triggers downstream propagation |
