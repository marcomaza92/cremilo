# AGENTS.md — Cremilo

Plugs the global generic skills (`~/.claude/skills/`) into this project's context. Project-specific skill files at `.claude/skills/` override or extend the generics.

## Project

- **Name**: Cremilo
- **Repo**: github.com/marcomaza92/cremilo
- **Stack**: Next.js 15 (App Router) · TypeScript · CSS Modules · Supabase (auth + DB) · Vercel
- **Package manager**: pnpm (Volta-pinned Node 22)
- **No Tailwind. No inline styles.** CSS Modules only.
- **Design system**: `nequi` (local symlink at `~/www/personal/nequi`)
- **Design tool**: Stitch — project ID `9329790636631148728`, design system asset `assets/f7ec1a75b48d4b5985962fbe7074ce76` (Mondrian Neobrutalism)

## Issue tracker

- **Tool**: Linear
- **Team**: `Cremilo`
- **Active project**: `Monthly Calculator`
- **Status flow**: `Backlog → Todo → In Progress → In Review → Done`
- **Max priority**: High (2) — Urgent (1) reserved for production hotfixes only

## Issue prefix map

| Prefix | Role | Description |
|---|---|---|
| `[G0]` | PO | Gate 0 planning issues |
| `[D-XX]` | design-agent | Design units |
| `[I-XX]` | TL | Infra issues |
| `[DEV-XX]` | FE-A / FE-B | Dev issues |
| `[Q-XX]` | QA | Test issues |

## Agent → skill mapping

| Role | Generic skill | Project override |
|---|---|---|
| PO | `~/.claude/skills/po-agent-generic.md` | `.claude/skills/po-agent.md` |
| TL | `~/.claude/skills/tl-agent-generic.md` | `.claude/skills/tl-agent.md` |
| FE-A | `~/.claude/skills/fe-agent-generic.md` | `.claude/skills/fe-a-agent.md` |
| FE-B | `~/.claude/skills/fe-agent-generic.md` | `.claude/skills/fe-b-agent.md` |
| QA | `~/.claude/skills/qa-agent-generic.md` | `.claude/skills/qa-agent.md` |
| design-agent | `~/.claude/skills/design-agent-generic.md` | `.claude/skills/design-agent.md` |
| gate-watcher | `~/.claude/skills/gate-watcher-generic.md` | `.docs/gate-watcher.py` |

Project overrides take precedence. Always read the override first; fall back to the generic for any behavior not specified.

## FE-A ownership map (Monthly Calculator)

| Issue | Feature |
|---|---|
| `DEV-01` | Auth screens (login + register) |
| `DEV-02` | App shell (nav, sidebar, layout) |
| `DEV-03` | Summary boxes component |
| `DEV-13` | Multi-currency hook + tax calc (1.49%) |

## FE-B ownership map (Monthly Calculator)

| Issue | Feature |
|---|---|
| `DEV-04` | Reusable collapsible table component |
| `DEV-05` | Add/edit form (ARS mode) |
| `DEV-06` | Add/edit form (USD extension) |
| `DEV-07` | Ingresos section |
| `DEV-08` | Gastos Fijos section |
| `DEV-09` | Tarjetas section |
| `DEV-10` | Config — Rates |
| `DEV-11` | Config — Format |
| `DEV-12` | Config — Global Currency |

## QA coverage map (Monthly Calculator)

| QA Issue | Tests | Triggered by |
|---|---|---|
| `Q-01` | E2E framework setup | Gate 0 approved |
| `Q-02` | Auth flow | `DEV-01` done |
| `Q-03` | Table: render, collapse, kebab | `DEV-04` done |
| `Q-04` | Form: ARS/USD mode, save, validation | `DEV-05` + `DEV-06` done |
| `Q-05` | Currency conversion + 1.49% tax | `DEV-13` done |
| `Q-06` | Config screen: rates, format, currency | `DEV-10/11/12` done |
| `Q-07` | Full regression | All features done |

## FE-A ownership map (Config — Phase C)

| Issue | CRE | Feature |
|---|---|---|
| `DEV-18` | CRE-75 | Config data layer (TanStack Query hooks, 5 entities) |
| `DEV-19` | CRE-76 | Deep link handler (section scroll + highlight animation) |

## FE-B ownership map (Config — Phase C)

| Issue | CRE | Feature |
|---|---|---|
| `DEV-20` | CRE-77 | Config main page layout (4 sections, collapsible) |
| `DEV-21` | CRE-78 | Payment Methods section + form modal |
| `DEV-22` | CRE-79 | Categories section + form modal + deletion flow |
| `DEV-23` | CRE-80 | Grouping Categories form |
| `DEV-24` | CRE-81 | Rates section + form modal + deletion flow |
| `DEV-25` | CRE-82 | Preferences section |
| `DEV-26` | CRE-90 | Staging deploy + smoke test |
| `DEV-27` | CRE-91 | Production deploy |

## QA coverage map (Config — Phase C)

| QA Issue | CRE | Tests | Triggered by |
|---|---|---|---|
| `Q-09` | CRE-83 | Config main render + section navigation | `DEV-20` done |
| `Q-10` | CRE-84 | Payment methods CRUD | `DEV-21` done |
| `Q-11` | CRE-85 | Categories CRUD + deletion flow | `DEV-22` done |
| `Q-12` | CRE-86 | Rates CRUD + deletion flow | `DEV-24` done |
| `Q-13` | CRE-87 | Preferences: number/date format + global currency | `DEV-25` done |
| `Q-14` | CRE-88 | Deep link navigation | `DEV-19` done |
| `Q-15` | CRE-89 | Full regression (Config + Monthly Calculator) | All Q-09..Q-14 done |

## Design + Infra map (Config — Phase C)

| Issue | CRE | Description |
|---|---|---|
| `G0-C-1` | CRE-63 | Gate 0: PTS Config approval |
| `G0-C-2` | CRE-64 | Gate 0: Data model approval |
| `G0-C-3` | CRE-65 | Gate 0: Issue map approval |
| `G0-C-4` | CRE-66 | Gate 0: Acceptance criteria sign-off |
| `I-07` | CRE-67 | DB migrations (5 tables + RLS) |
| `I-08` | CRE-68 | Seed data on account creation |
| `I-09` | CRE-69 | Config routing + deep link query param handler |
| `D-11` | CRE-70 | Design: Config main screen (4 sections) |
| `D-12` | CRE-71 | Design: Rate form modal + deletion flow |
| `D-13` | CRE-72 | Design: Category form modal + deletion flow |
| `D-14` | CRE-73 | Design: Grouping category form modal |
| `D-15` | CRE-74 | Design: Payment method form modal |

## Gate structure

- **Gate 0**: PRD + plan (4 issues) → unlocks D-XX, I-XX, Q-01
- **Gate 1** (per D-XX): design approved (Accessibility + Manual checklists ticked) → unlocks DEV-XX
- **Gate 2 (Monthly Calculator)**: Q-07 full regression done → unlocks DEV-14 (staging) + DEV-15 (production)
- **Gate 2 (Config)**: Q-15 full regression done → unlocks DEV-26 (staging) + DEV-27 (production)

## Orchestration

- `gate-watcher.py` at `.docs/gate-watcher.py` — run manually at session start: `python3 .docs/gate-watcher.py`
- `pending-agents.json` at `.docs/pending-agents.json` — agent queue
- Summon phrase: "summon the team" — triggers orchestrator hook
- Scheduled tasks: `cremilo-{role}-agent` (managed via Claude Code UI)

## Docs

**Linear (single source of truth):**
- [Roadmap](https://linear.app/cremilo/document/roadmap-6012a41bde5e) — active phase, next_action, blockers
- [Post-Mortem & Plan](https://linear.app/cremilo/document/post-mortem-and-plan-95c68e233294) — strategic context, phases A–E
- [Annoy Log](https://linear.app/cremilo/document/annoy-log-1d283e89442d) — append-only pipeline annoyances

**Local private (outside repo) at `~/www/personal/docs/cremilo/`:**
- `USAGE.md` — running history of Claude turns + token usage
- `SESSIONS.md` — aggregated session durations
- `AGENTIC-SYSTEM.md` — full agentic system reference

## Team

| Person | Role | Linear assignment |
|---|---|---|
| Marco (marcoagustinmaza@gmail.com) | Lead dev + pipeline owner | All issues |
| guadapadinrojas@gmail.com | QA joiner (planned ramp after Phase B) | Q-01..Q-08, BUG-0001..BUG-0005 |

See ramp-up rules in `~/www/personal/docs/cremilo/POST-MORTEM-AND-PLAN.md` § 4.7 before adding this person.

## Deferred artifacts

- [PTS: Cloud Pipeline Migration](https://linear.app/cremilo/document/pts-cloud-pipeline-migration-6a88a43ec064) — cloud pipeline migration spec. Intentionally deferred until team grows to 24/7 need. Do not re-propose this work.

## Current state (as of 2026-06-07)

Phase B complete (2026-06-07). Production live at https://cremilo.vercel.app (SHA f63f55b, 2026-05-28).
Phase C active: Config sub-app. Gate 0 next — PO agent reads PTS: Config and creates I-XX, D-XX, DEV-XX, Q-XX issues.
