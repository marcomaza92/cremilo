# CLAUDE.md — Cremilo working agreement

## Posture

- Default to critical analysis. Verify before claiming. No sycophancy.
- Push back on premature optimization and scope creep. The pipeline is on probation — see `.docs/POST-MORTEM-AND-PLAN.md` § 5.4.
- When the user gives a premise that affects the plan, test it before acting on it.
- When codifying a workaround, prove the underlying limitation first. Don't accept "it doesn't work" as the basis for a rule without testing.

## Orientation (read these first)

- `.docs/ROADMAP.md` — current state (YAML frontmatter), active phase + checklist, blockers, next_action. This is the session-start doc.
- `.docs/POST-MORTEM-AND-PLAN.md` — strategic context. Phases A–E. The "why" behind the plan.
- `.prds/0001-monthly-calculator/DESIGN.md` — Style guidelines (Mondrian Neobrutalism design system, full tokens) + Design Rubric (18 predicates with verification classes).
- `.claude/skills/design-agent.md` — design-agent SKILL, operational rules, In-Review comment template.

## Project shape (one paragraph)

Cremilo is a multi-app finance *suite* (Monthly Calculator + Credit Cards + Investments + Daily Expenses + Dashboards + Planning + Config + more). Stack: Next.js 15 (App Router) · CSS Modules · Supabase (auth + DB) · Vercel. Pipeline: a Python `gate-watcher.py` that polls Linear and queues agents through `pending-agents.json`, fired via Claude Code scheduled-tasks. Seven agents (PO, TL, FE-A, FE-B, QA, design-agent, gate-watcher). A second project, [zao-jun](https://github.com/marcomaza92/zao-jun) (Vite + React 19 + TanStack stack), is on the roadmap as the cross-stack validation in Phase D.

## Known broken / brittle tools — do not re-discover

- **`mcp__stitch__edit_screens` does not persist** (verified 2026-05-20, three attempts, md5 unchanged after 5+ min polling). Treat Stitch as **create-only**. List superseded screens in the In-Review Linear comment under "Manual cleanup needed" — the human deletes manually in the Stitch UI.
- **`mcp__stitch__*` deletion is unsupported.** Same workaround as above.
- **`UserPromptSubmit` hook is not firing** for real user prompts (verified by direct synthetic invocation working). Run `python3 .docs/gate-watcher.py` manually at session start when needed.
- **`mcp__scheduled-tasks__update_scheduled_task` is blocked in "unsupervised mode"** despite `allow: ["*"]` in settings. The user must trigger scheduled tasks manually from the Claude Code UI.

## Project conventions

- **Package manager**: pnpm (Volta-pinned Node 22).
- **No Tailwind. No inline styles.** CSS Modules only.
- **Linear**: team `Cremilo`, project `Monthly Calculator`. Status flow: Backlog → Todo → In Progress → In Review → Done. Maximum priority is High (2); never set Urgent (1) — reserved for production hotfixes.
- **Stitch project ID**: `9329790636631148728`. Design system asset: `assets/f7ec1a75b48d4b5985962fbe7074ce76`.
- **Gates**: Gate 0 (PRD approval) → Gate 1 (Design approval, per D-XX) → Gate 2 (Deploy). Gate-watcher enforces both Accessibility + Manual review checklists are fully ticked before propagating D-XX → DEV.

## What this session should and shouldn't do

- ✅ Ship the active Phase A milestone (see `next_action` in ROADMAP.md frontmatter).
- ✅ Update ROADMAP.md frontmatter at session end.
- ✅ Append to the annoy log if something slowed you down.
- ❌ Don't refactor the pipeline.
- ❌ Don't add new agents.
- ❌ Don't improve SKILLs beyond what's needed to unblock today's milestone.
- ❌ Don't consider PRD-0002, cloud migration, or the deferred role wishlist.
