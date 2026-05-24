---
# Session-start state. Edit at end of each session.
# Strategic context: see POST-MORTEM-AND-PLAN.md
active_phase: A
active_phase_label: "Phase A — Cremilo thin slice"
active_substage: "Week 1 — Auth"
active_sub_app: "Monthly Calculator (thin slice — auth only this week)"
active_linear_issue: CRE-15
active_linear_status: "In Progress"
last_session_date: 2026-05-23
next_action: |
  Approve CRE-15 (D-01 Auth) OR send back with one specific fixable comment.
  Goal: Vercel preview URL with a working login by end of session.
  Fallback if pipeline blocks: hand-code login from existing Stitch references.
blockers:
  - "Stitch edit_screens does not persist (verified 2026-05-20) — treat Stitch as create-only"
  - "UserPromptSubmit hook is not firing for real prompts — invoke gate-watcher manually each session"
  - "mcp__scheduled-tasks MCP blocked in unsupervised mode — user must trigger tasks manually from UI"
team_size: 1
roadmap_doc_version: 2
---

# Cremilo Agentic Roadmap

> **What this is**: the living operational tracker. Updated every session — items get crossed as they ship.
> **What this is not**: the strategic plan. For *why* the phases exist and *how* they sequence → [POST-MORTEM-AND-PLAN.md](./POST-MORTEM-AND-PLAN.md).
> **How to use at session start**: read the YAML frontmatter (current state), check `next_action`, scan the active phase's checklist, glance at blockers.
> **How to update at session end**: tick completed checkboxes, refresh frontmatter (`active_substage`, `next_action`, `last_session_date`, any new `blockers`), append to [.docs/ANNOY.md](./ANNOY.md) if applicable.

---

## Phase 0 — Foundation (pre-Phase A) — ✅ done

These landed before Phase A formally started. Captured as historical context.

- [x] **Design rubric written** — 18 predicates (9 must, 9 nice), grouped by Resolutions / Functional / Accessibility, each with predicate + fail mode. Lives in [DESIGN.md § Design Rubric](../.prds/0001-monthly-calculator/DESIGN.md).
- [x] **CRE-15 rejection patterns absorbed** — covered by rubric predicates #1 (resolutions), #3 (error/filled replicas), #6–#9 (accessibility); operational quirks codified in [design-agent SKILL](../.claude/skills/design-agent.md).
- [x] **design-agent SKILL upgraded** — self-check loop (N=3 cap), In-Review comment template with Accessibility + Manual checklists, operational rules from CRE-15 history.
- [x] **Two-checklist split** — Accessibility review (predicates #6–#9) + Manual review (predicates #2, #4, #5) — both required ticked before approval.
- [x] **Gate-watcher enforces both checklists** — `check_review_approved()` parses latest Linear comment for unticked boxes under either heading. Fails closed.
- [x] **Auto-attach on approval** — `attach_screens_on_approval()` parses "Screens delivered" table on D-XX → Done transition, creates Linear attachments deduped against existing.
- [x] **Mondrian Neobrutalism DS reconciled** — full design_md (tokens + prose) promoted from Stitch into DESIGN.md. design-agent binds `assets/f7ec1a75b48d4b5985962fbe7074ce76` explicitly.
- [x] **Pre-approval attachment ban** — agent posts URLs in comment body only; attachments happen at approval time via gate-watcher.
- [x] **POST-MORTEM-AND-PLAN.md** — strategic doc written 2026-05-20, revised 2026-05-21 (scope corrections) and 2026-05-23 (team ramp-up).

---

## Phase A — Cremilo thin slice  [← CURRENT]

**Definition of done:** a Vercel URL where the user can log in, see a dashboard, log a single daily expense, and see it persist. No multi-currency, no Impuesto Sellos, no ROI math, no Tarjetas, no insights overlay.

### Week 1 — Auth

- [ ] Decide on CRE-15: approve as-is OR send back with one specific fix
- [ ] If approved → tick Accessibility + Manual checklists → move CRE-15 to Done
- [ ] If sent back → write one specific fixable comment, trigger gate-watcher manually, then re-trigger cremilo-design-agent
- [x] Verify gate-watcher auto-attaches the approved screens to CRE-15 (2026-05-23 — required two bug fixes in attach_screens_on_approval, see annoy log)
- [ ] Unblock I-04 (TanStack Query setup) — TL agent or manual
- [ ] Ship DEV-01 to a Vercel preview URL with working login
- [ ] **Milestone**: paste the Vercel preview URL into this checklist

### Week 2 — Shell

- [ ] Approve D-02 (app shell — main layout, navigation, route groups)
- [ ] Ship DEV-02 — empty dashboard renders with one card slot
- [ ] **Milestone**: dashboard renders after login

### Week 3 — Add daily expense flow

- [ ] Adapt D-05 (ItemForm) prompt for "daily expense" instead of full Monthly Calculator items
- [ ] Adapt D-04 (DataTable) prompt for a simple expense list
- [ ] Ship the combined "log + see expenses" sub-app
- [ ] Deploy to Vercel production
- [ ] **Milestone**: log one real expense for one real day, see it persist

### Phase A scope guard — explicitly deferred (NOT in Phase A)

- [ ] ~~Multi-currency ARS/USD switching~~ → Phase C or later
- [ ] ~~Impuesto Sellos tax calc~~ → Phase C or later
- [ ] ~~ROI on savings~~ → Phase C or later
- [ ] ~~Tarjetas with installment tracking~~ → Phase C or later
- [ ] ~~Recommended actions overlay~~ → Phase C or later
- [ ] ~~3-resolution support (relaxed to desktop + mobile only for Phase A)~~ → Phase C+

---

## Phase B — Extract reusable patterns

Triggers when Phase A ships. Three concrete outputs, in order.

- [ ] **ANNOY.md triage** — pick at most 3 annoyances to actually fix. Ignore the rest.
- [ ] **SKILL split: generic + project-specific**
  - [ ] Pull rubric self-check loop + In-Review comment template + operational rules + hard constraints into `~/.claude/skills/design-agent-generic.md`
  - [ ] Leave Cremilo-specific items (Mondrian DS asset, project ID, screen roster) in `.claude/skills/design-agent.md` that *extends* the generic
  - [ ] Same split for other SKILLs as needed
- [ ] **Session-start script** — Python that reads this ROADMAP.md frontmatter + Linear state + gate-watcher log, prints a one-page "you are here" summary on each new session

---

## Phase C — Cremilo sub-app #2 (likely Configuration)

Triggers when Phase B completes. The test is not "does it ship" — it's **how much new work was needed vs. Phase A**. Measure and record.

- [ ] Pick sub-app — recommended: Configuration screens (currency setting, categories). Lowest complexity, most reuse, unlocks downstream sub-apps.
- [ ] Approve PRD scope (this is where PM/PO joiner would help if available)
- [ ] Ship through full pipeline using extracted generic SKILLs
- [ ] **Measurement** — record in this file:
  - Hours spent end-to-end: ___
  - Number of SKILL changes needed: ___
  - Number of design-rubric predicates that needed adjustment: ___
  - Number of components reused as-is from Phase A: ___
- [ ] **Pipeline-on-probation verdict** — if effort ≈ Phase A's, cut back to 2–3 agents

---

## Phase D — zao-jun thin slice (cross-project + cross-stack validation)

Triggers when Phase C ships. Stack is Vite + React 19 + TanStack + Storybook + vitest + i18next + Sass — significantly different from Cremilo's Next.js stack.

- [ ] Bootstrap `zao-jun/.claude/skills/` from generic SKILLs
- [ ] Add zao-jun-specific overrides (different DS, different Stitch project if used, different deployment)
- [ ] Parameterize `gate-watcher.py` to accept project context as input (currently hardcoded to Cremilo IDs)
- [ ] Ship zao-jun's thin slice (auth or skip if not needed + shell + 1 meaningful screen — likely "log a planned meal")
- [ ] **Honest expectation**: budget 1–2 weeks of "this didn't transfer" debugging

---

## Phase E — Add roles (one at a time, indefinite cadence)

Only after Phase D ships. Each role addition is its own mini-project.

- [ ] **Critic agent** — first addition. Reads PRs / comments / commits, surfaces "this isn't aligned with X" against the rubric. Cheap, immediately useful.
- [ ] **Analyst agent** — when Cremilo or zao-jun has real event data. Reads analytics, proposes hypotheses.
- [ ] **InfoSec agent** — when handling real PII / money. Dependency scans, RLS audits, Sentry-equivalent monitoring.
- [ ] **Content / i18n agent** — when shipping in 2+ languages. zao-jun (i18next) makes this concrete.
- [ ] **DevOps split** — only if infra complexity outgrows the TL agent's bandwidth. Probably never for personal projects.

Roles 6+ on the original 24-role wishlist (Sales, Marketing, Support, etc.) only become real if a project gets paying users.

---

## Known issues / external limitations

- **Stitch `edit_screens` does not persist** (2026-05-20 verified, 3 attempts, 5+ min polling, md5 unchanged). Workaround: treat Stitch as create-only; list superseded screens in Linear comment for manual deletion. Worth reporting upstream if a Stitch contact path exists.
- **UserPromptSubmit hook not firing** for real user prompts (works when invoked directly with synthetic input). Workaround: invoke `python3 .docs/gate-watcher.py` manually at session start.
- **`mcp__scheduled-tasks` MCP** gated in "unsupervised mode" — user must trigger scheduled tasks manually from the Claude Code UI.

---

## Manual cleanup pending

- [ ] Delete test fixture "Baseline Test Page" from Stitch UI: https://stitch.withgoogle.com/projects/9329790636631148728?node-id=1f3ef1fb51d541a09138f96b5674556b

---

## Team ramp-up tracker

When a 2nd human is confirmed for week N, the following move *up* the priority order (target: completed in the week before they start). Until then, untouched.

- [ ] Write thin `ONBOARDING.md` (1-pager, not the polished doc)
- [ ] Create `.docs/DECISIONS.md` (append-only markdown decisions log)
- [ ] Codify conflict-resolution policy (scope→PM/PO, tech→Marco, a11y→QA, design→PM/PO+Marco)
- [ ] Write the session-start script (was Phase B; pull forward to before any joiner)

Recommended order of arrival: PM/PO/stakeholder → Manual QA → FE dev. Minimum 1 week between ramps.

---

## Deferred indefinitely

These remain off the radar until concrete justification arises. Listed here so we don't accidentally rebuild them from scratch later.

- **PRD-0002 — cloud pipeline migration** — triggers when team grows to require 24/7 autonomous execution. Already correctly flagged as deferred in its own PRD.
- **Shared world model (full Supabase tables)** — light markdown decisions log first; Supabase only if data outgrows it.
- **Conflict resolution policy beyond the basic split** — fancier policies wait until we observe actual conflicts in logs.
- **Rubrics for other stages (dev, QA, deploy, post-ship)** — write each one when that stage becomes the bottleneck.
- **MCP audit** — trigger when adding a new role that needs a new MCP. Currently 3 active (Linear, Stitch, Supabase).
- **24-role wishlist beyond core 4** — Sales, Marketing, Support, Data Entry, etc. Only if a project gets paying users.
- **Custom orchestration improvements** — keep using Claude Code's scheduled-tasks + current Python gate-watcher. Don't rebuild.
- **Switching design tools (Stitch → Figma+plugins)** — only if Stitch becomes a structural blocker.

---

## Annoy log

Moved to [.docs/ANNOY.md](./ANNOY.md). Append there during phase work; triaged at start of Phase B.
