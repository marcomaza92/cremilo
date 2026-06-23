# CLAUDE.md — Cremilo working agreement

## Posture

- Default to critical analysis. Verify before claiming. No sycophancy.
- Push back on premature optimization and scope creep. The pipeline is on probation — see Post-Mortem & Plan in Linear (https://linear.app/cremilo/document/post-mortem-and-plan-95c68e233294) § 5.4.
- When the user gives a premise that affects the plan, test it before acting on it.
- When codifying a workaround, prove the underlying limitation first. Don't accept "it doesn't work" as the basis for a rule without testing.

## Orientation (read these first)

Business and operational docs live in **Linear** (single source of truth) and in `~/www/personal/docs/cremilo/` (private local, outside repo):

**Linear docs (https://linear.app/cremilo):**
- [Roadmap](https://linear.app/cremilo/document/roadmap-6012a41bde5e) — current state (YAML frontmatter), active phase + checklist, blockers, next_action. Read by `session-start.py` via Linear API.
- [Post-Mortem & Plan](https://linear.app/cremilo/document/post-mortem-and-plan-95c68e233294) — strategic context. Phases A–E. The "why" behind the plan.
- [Annoy Log](https://linear.app/cremilo/document/annoy-log-1d283e89442d) — append-only annoy log, triaged at start of each Phase B.
- [PA: Crémilo](https://linear.app/cremilo/document/pa-cremilo-0058df0d215c) — full product architecture (9 sub-apps, data flows, shared entities).
- [PTS: Monthly Calculator](https://linear.app/cremilo/document/pts-monthly-calculator-ab1a3c40fb3a), [PTS: Config](https://linear.app/cremilo/document/pts-config-733abe4893f1), [PTS: Cloud Pipeline Migration](https://linear.app/cremilo/document/pts-cloud-pipeline-migration-6a88a43ec064) — product technical specs.
- [Glossary](https://linear.app/cremilo/document/glossary-9740fffad32d) — Linear concepts, issue structure, conventions.

**Local private (outside repo) at `~/www/personal/docs/cremilo/`:**
- `USAGE.md` — running history of Claude turns + token usage (written by `record-usage.py` hook).
- `SESSIONS.md` — aggregated session durations (run `session-stats.py --append` to refresh).
- `AGENTIC-SYSTEM.md` — full agentic system reference: four pillars, agent roster, pipeline mechanics, phase history, broken tools.

**In-repo specs:**
- `DESIGN.md` — Style guidelines (Mondrian Neobrutalism design system, full tokens) + Design Rubric (18 predicates with verification classes).
- `.claude/skills/design-agent.md` — design-agent SKILL, operational rules, In-Review comment template.

## Project shape (one paragraph)

Cremilo is a multi-app finance *suite* (Monthly Calculator + Credit Cards + Investments + Daily Expenses + Dashboards + Planning + Config + more). Stack: Next.js 15 (App Router) · CSS Modules · Supabase (auth + DB) · Vercel. Pipeline: a Python `gate-watcher.py` that polls Linear and queues agents through `pending-agents.json`, fired via Claude Code scheduled-tasks. Seven agents (PO, TL, FE-A, FE-B, QA, design-agent, gate-watcher). A second project, [zao-jun](https://github.com/marcomaza92/zao-jun) (Vite + React 19 + TanStack stack), is on the roadmap as the cross-stack validation in Phase D.

## Known broken / brittle tools — do not re-discover

- **`mcp__stitch__edit_screens` works with `GEMINI_3_1_PRO`** (verified 2026-06-08). Always pass `model: "GEMINI_3_1_PRO"` explicitly — `GEMINI_3_PRO` is deprecated and silently fails. Verify edits via `get_screen`: confirm `htmlCode.name` changed from before the call. Screenshot URL may lag; do not use it as the verification signal.
- **`mcp__stitch__*` deletion is unsupported.** Screens cannot be deleted via API — only via the Stitch UI manually.
- **`UserPromptSubmit` hook is not firing** for real user prompts (verified by direct synthetic invocation working). Run `python3 .docs/gate-watcher.py` manually at session start when needed.
- **`mcp__scheduled-tasks__update_scheduled_task` is blocked in "unsupervised mode"** despite `allow: ["*"]` in settings. The user must trigger scheduled tasks manually from the Claude Code UI.

## Project conventions

- **Package manager**: pnpm (Volta-pinned Node 22).
- **No Tailwind. No inline styles.** CSS Modules only.
- **Linear**: team `Cremilo`, project `Monthly Calculator`. Status flow: Backlog → Todo → In Progress → In Review → Done. Maximum priority is High (2); never set Urgent (1) — reserved for production hotfixes.
- **Stitch project ID**: `9329790636631148728`. Design system asset: `assets/f7ec1a75b48d4b5985962fbe7074ce76`.
- **Gates**: Gate 0 (PRD approval) → Gate 1 (Design approval, per D-XX) → Gate 2 (Deploy). Gate-watcher enforces both Accessibility + Manual review checklists are fully ticked before propagating D-XX → DEV.

## Git workflow

- **Every change goes through a PR.** No direct commits to `main` — not even for one-line doc edits, typo fixes, or convention updates. The discipline applies to every change.
- **Conventional commits required.** Format: `type(scope?): subject`, where type is one of `feat | fix | chore | docs | refactor | test | ci | perf | style | build | revert`. Subject in imperative mood, no trailing period.
- **PR merge strategy: rebase + delete branch.** Use `gh pr merge <n> --rebase --delete-branch` (or the GitHub UI "Rebase and merge" button). Never squash. Never create merge commits.
- **Rebase the feature branch onto latest `main` before merging.** The PR's own history should be linear — no internal merge commits. Each commit on a feature branch should be reviewable + revertable on its own, since it lands individually on `main`.
- **Shipping signals: `ready-to-merge` label OR `/merge` / `/ship` comment.** When the PR's test plan has been verified, either:
  - Add the `ready-to-merge` label, or
  - Post a PR comment whose *entire body* is exactly `/merge` or `/ship`.
  Both trigger GitHub Actions that call `gh pr merge --auto --rebase --delete-branch` — the PR lands as soon as CI is green. Workflows live at [.github/workflows/auto-merge.yml](.github/workflows/auto-merge.yml) (label trigger) and [.github/workflows/auto-merge-comment.yml](.github/workflows/auto-merge-comment.yml) (slash-command trigger). The comment workflow verifies the commenter has `admin` or `write` permission before queueing the merge. Both signals are *explicit "human verified, ship it"* — distinct from test-plan checkboxes (your *progress tracker*, not a shipping trigger).
- **Workflow-changing PRs always merge manually.** GitHub Actions runs each workflow from `main`, not from the PR branch. A PR that *fixes* the auto-merge workflow will still trigger the *broken* version on `main` when you comment `/ship`. So PRs that touch `.github/workflows/auto-merge*.yml` need `gh pr merge <n> --rebase --delete-branch` directly. The next PR after merging can use the label / slash command flow normally.

## Where feedback on a PR lives

| Case | Where | Definition |
|---|---|---|
| Defect against the PR's spec (ticket + linked design) | PR comment + fix in same PR | "It's in scope and we didn't ship it correctly" |
| New work outside the spec | New Linear issue | "Design didn't cover this; ticket didn't mention it" |
| Context / decisions / deferrals | Linear comment on parent | Not actionable yet |

**Design is spec.** When DEV-XX implements D-XX, the approved design (Stitch screens + DESIGN.md tokens) is the contract — even when the Linear ticket only links to the design rather than listing every UI behavior individually. Gate-watcher enforces this implicitly: D-XX must be approved (Accessibility + Manual review checklists ticked) before DEV-XX moves forward. So if behavior X is in the approved design, X is required for DEV-XX even when the ticket text doesn't echo it.

**The [Annoy Log](https://linear.app/cremilo/document/annoy-log-1d283e89442d) is for *pipeline annoyances***, not for feature requests against the app. Don't conflate.

## Pipeline operations

**Adding a new D-XX issue:** update all three local files or the gate-watcher will silently ignore the issue:
1. `gate-watcher-config-<sub-app>.json` — add entry to `design_issues` array
2. `gate-watcher-map-<sub-app>.json` — add `"D-XX": "CRE-XX"` key→Linear ID mapping
3. `gate-watcher-state-<sub-app>.json` — add `"D-XX": "Backlog"` (or actual current status)

Missing any one of the three makes `st("D-XX")` return `None`, causing the slash command loop to skip the issue entirely.

**Gate-watcher requires `--sub-app` flag** to target the right sub-app: `python3 .docs/gate-watcher.py --sub-app monthly-calc`. Running without the flag defaults to the Config sub-app.

## What this session should and shouldn't do

- ✅ Ship the active phase milestone (see `next_action` in [Roadmap](https://linear.app/cremilo/document/roadmap-6012a41bde5e) frontmatter, or run `python3 .docs/session-start.py`).
- ✅ Update [Roadmap](https://linear.app/cremilo/document/roadmap-6012a41bde5e) frontmatter at session end.
- ✅ Append to [Annoy Log](https://linear.app/cremilo/document/annoy-log-1d283e89442d) if something slowed you down.
- ✅ Run `python3 ~/www/personal/docs/cremilo/session-stats.py --append` at session end to log net session time to `SESSIONS.md`.
- ❌ Don't refactor the pipeline.
- ❌ Don't add new agents.
- ❌ Don't improve SKILLs beyond what's needed to unblock today's milestone.
- ❌ Don't consider PRD-0002, cloud migration, or the deferred role wishlist.
