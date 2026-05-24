# PRD-0002 — Cloud Pipeline Migration

## Overview

Migrate the Cremilo automation pipeline from local execution to Anthropic CCR (Cloud Claude Routines) so agents run without the app open. Currently the pipeline is anchored to the local machine due to file system and script dependencies — not MCP, which is already cloud-compatible since it proxies remote APIs.

## Status

**Deferred** — revisit when the project adds team members or requires 24/7 autonomous execution.

## Why not now

The pipeline is intentionally on-demand ("summon the team for review"). Since the trigger requires the app to be open anyway, running agents in the cloud provides no practical benefit at the current scale.

---

## Current architecture

```
Local machine
├── gate-watcher.py          # Python pipeline script (Linear GraphQL + state diffing)
├── .docs/pending-agents.json  # Agent work queue
├── /tmp/gate-watcher-state.json  # Issue status state
├── .env.local               # LINEAR_API_KEY + other secrets
└── ~/.claude/scheduled-tasks/
    ├── cremilo-orchestrator   # Trigger: "summon the team for review"
    ├── cremilo-design-agent   # On-demand
    ├── cremilo-tl-agent       # On-demand
    ├── cremilo-fe-a-agent     # On-demand
    ├── cremilo-fe-b-agent     # On-demand
    └── cremilo-qa-agent       # On-demand
```

## What is NOT a blocker

- **Linear MCP** — just a thin HTTP proxy to Linear's cloud API. Works fine from CCR if hosted at an accessible URL.
- **Stitch MCP** — same: proxies Google's Stitch cloud API. No fundamental local dependency.
- **GitHub access** — one-time setup (install Claude GitHub App on the repo).

## Actual blockers

| Blocker | Why | Solution |
|---|---|---|
| `pending-agents.json` | Local file system | Supabase table |
| `gate-watcher-state.json` | Local file system | Supabase table |
| `gate-watcher.py` | Local Python script | Cloud function or rewrite as agent instructions |
| `.env.local` secrets | Not accessible from cloud | Supabase env config or CCR secrets |
| Inter-agent triggering | Uses `mcp__scheduled-tasks__update_scheduled_task` | Replace with `RemoteTrigger {action: "run"}` |

---

## Migration plan

### Phase 1 — Supabase storage (~3-4 hours)

Replace local files with two Supabase tables:

**`agent_queue`**
```sql
create table agent_queue (
  id          uuid primary key default gen_random_uuid(),
  task_id     text unique not null,
  type        text not null,         -- 'design-agent' | 'tl-agent' | etc.
  description text,
  prompt      text not null,
  status      text default 'pending', -- 'pending' | 'done'
  queued_at   timestamptz default now(),
  done_at     timestamptz
);
```

**`pipeline_state`**
```sql
create table pipeline_state (
  key    text primary key,
  value  text not null,
  updated_at timestamptz default now()
);
```

Update `gate-watcher.py` to use `supabase-py` instead of local JSON reads/writes.

### Phase 2 — Secrets (~1 hour)

- Move `LINEAR_API_KEY` to Supabase secrets or CCR environment config
- Agents using MCP tools (Linear, Stitch) don't need raw keys — MCP handles auth

### Phase 3 — gate-watcher as cloud function (~1 day)

Two options:

**Option A — Vercel function (recommended)**
- Deploy `gate-watcher.py` as a Vercel Python serverless function
- CCR orchestrator calls it via `curl` / Bash
- Pros: keeps Python logic intact, reliable
- Cons: new infrastructure to maintain

**Option B — Rewrite as CCR agent instructions**
- Convert gate-watcher logic into a detailed CCR prompt
- Pros: no extra infrastructure
- Cons: less reliable than Python, harder to debug

### Phase 4 — Inter-agent triggering (~2 hours)

Replace `mcp__scheduled-tasks__update_scheduled_task` calls in the orchestrator with:
```
RemoteTrigger { action: "run", trigger_id: "<ccr-routine-id>" }
```

Requires knowing CCR routine IDs upfront — hardcode them in the orchestrator prompt after creation.

### Phase 5 — GitHub access (~15 min)

Install the Claude GitHub App on `marcomaza92/cremilo` via:
https://claude.ai/code/onboarding?magic=github-app-setup

---

## Effort summary

| Phase | Effort |
|---|---|
| Phase 1 — Supabase storage | ~3-4 hours |
| Phase 2 — Secrets | ~1 hour |
| Phase 3 — Cloud function | ~1 day |
| Phase 4 — Inter-agent triggering | ~2 hours |
| Phase 5 — GitHub access | ~15 min |
| **Total** | **~2 days** |

## What you gain

- Pipeline runs 24/7 without the app open
- Team members can share and trigger agents
- No dependency on local machine uptime

## Trigger conditions to revisit

- Project adds collaborators who need pipeline access
- "Summon the team" frequency increases to the point where always-on is valuable
- gate-watcher needs to react to Linear webhooks in real time
