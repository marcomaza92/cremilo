# Cremilo Post-Mortem & Realistic Plan

> Written 2026-05-20 (Marco's request). **Revised 2026-05-21** after Marco supplied two critical context corrections: Cremilo is a *suite* of multiple sub-apps (not a single calculator), and zao-jun is a second project also intended to ship through the same pipeline. See **Part 0** for the scope reframe and the revision history at the bottom for what changed.
>
> Sources: the May 11–18 session transcript on disk (`f3779a37-65a1-41e6-ba08-6de69591a4b6.jsonl`, ~4.76 MB), what's been observed in this conversation, and outside industry references on agentic SDLC. No mercy as requested.

---

## TL;DR (revised)

1. The **Async Gate-Driven Master Plan** was a competent design on paper but built on three assumptions that turned out false: that Stitch's tooling is reliable enough to automate end-to-end, that gate-watcher state can be trusted across runs, and that a single developer can sustain a multi-agent pipeline while *also* delivering a product. None of those held.
2. **PRD-0001 still isn't shipped after 10 days** of pipeline work — and PRD-0001 is just the *first sub-app* of a planned multi-app suite (see Part 0). The pipeline is sized for the destination, not for ship #1.
3. The right move now is to **stop improving the pipeline** and ship a **thin slice** of the suite — auth + one minimal sub-app — through it, however rough. *Then* generalize.
4. The 24-role team idea, the cloud migration, the Critic and Analyst agents, the conflict policy — still premature *for ship #1*. Some of them become justified later in the multi-app + multi-project sequence; the difference is when, not if.
5. A realistic plan, given 2–3 hrs/day intermittent: **2–3 weeks to ship the thin slice** → 1 week patterns extraction → 2–3 weeks for sub-app #2 inside Cremilo → 3–4 weeks for zao-jun as the first cross-project validation. Roughly **8–10 weeks of part-time work** to validate the full multi-project agentic workflow.

---

## Part 0 — Scope Context (added in revision)

The original document was written under the wrong assumption that Cremilo's deliverable was the Monthly Calculator as a single product. **Cremilo is actually a *suite* of sub-apps inside one shell**, of which Monthly Calculator is sub-app #1. Confirmed sub-apps on the roadmap:

- Monthly Calculator (in flight)
- Credit Cards dashboard + timeline
- Investments panel
- Daily expenses registry
- Dashboards by year / month / type (Ingresos, gastos, ahorros, tarjetas)
- Planning timeline for big-expense / holiday speculation
- Configuration screens
- (more)

Marco also pointed at **[zao-jun](https://github.com/marcomaza92/zao-jun)** as a second project that should ship through the same pipeline. zao-jun is a culinary planning assistant (different domain, similar shape: a hub with multiple sub-views). Stack already on disk: Vite + React 19 + TanStack (Router/Query/Form/Table) + Storybook + vitest + i18next + Sass — significantly different from Cremilo's Next.js + CSS Modules + Supabase stack.

This changes the analysis materially:

| Claim in v1 | Reality with v2 context |
|---|---|
| "37 tasks for one screen" | 37 tasks for one *sub-app*. Still too many for ship #1, but not as absurd as v1 framed it. |
| "Pipeline over-elaborate for a personal calculator" | Pipeline is appropriately elaborate for a multi-app suite + cross-project use. **Wrong-sized for ship #1, right-sized for the destination.** |
| "Two products to validate generalization" | Three steps now: (a) ship 1 sub-app of Cremilo, (b) ship a 2nd sub-app of Cremilo (validates internal reuse), (c) ship zao-jun (validates cross-project + cross-stack reuse). |
| "24-role team is premature" | Still premature *for the first sub-app*. Will be progressively justified as the suite grows. Sequence matters; the wish-list isn't wrong, just front-loaded. |

What v2 framing **does not** change:

- The failure pattern analysis in Part 3 — every observed failure mode (premature orchestration, unmeasured tool reliability, context exhaustion, granularity trap) still applies.
- The forensic timeline in Part 2 — those events happened regardless of destination.
- The "ship something this week" imperative — sharper than ever now, because there are two distinct projects' worth of work ahead.

The revised plan in Part 4 is rewritten with this scope in mind. Parts 1–3 stay essentially as v1 wrote them.

---

## Part 1 — What was the Async Gate-Driven Master Plan?

Reconstructed from the assistant's response on May 11 (the consolidated plan after three options were presented):

**Core principles:**
1. **Design triggers code.** No dev work without an approved Stitch design.
2. **Three sequential manual gates.** Gate 0 (PRD/Plan review) → Gate 1 (Design review) → Gate 2 (deployment review).
3. **Max parallelism within gates.** Everything that *can* run in parallel, does.
4. **Token-cheap polling.** Agents freed on submission, re-triggered on approval. A scheduled-task gate-watcher watches Linear for status transitions.
5. **Small work units.** Each Linear issue = one independently designable + buildable + testable thing.
6. **Infra and QA setup never blocked.** They run alongside the design track.

**Team encoded in SKILLs:** `PO`, `TL`, `FE-A`, `FE-B`, `QA`, `gate-watcher`, plus `design-agent`. Seven agents total.

**Pipeline shape:**
```
G0 (PRD/Plan approval) ─┬─► D-01..D-09 (design)     ─► DEV-01..DEV-13 (code) ─► Q-02..Q-07 (QA) ─► DEV-14/15 (deploy)
                        ├─► I-01..I-06 (infra)
                        └─► QA framework setup
```

The plan was internally coherent. The fault was not in the design — it was in the assumptions about reality.

---

## Part 2 — Forensic Timeline (no mercy)

Direct quotes from the user (timestamps from the transcript):

**Day 1 — May 11 — Setup phase:**

- `02:28` "are you sure this is tailwind?, is it not SCSS Modules?" — stack confusion at the start
- `02:31` "can we remove pencil from the MCP lists?" — environment fiddling
- `02:55` "some duplicates from the prompts are like creating 'feedback' and being register in the USAGE.md. Can we fix how prompt is handle so this don't happen any more?" — the auto-logging hook misfires
- `17:04` "where is the 'Run Now' button?, I don't see any sidebar either." — basic UI affordance missing
- `17:09` "what should I do next regarding all the tasks you've created?" — the plan produced tasks faster than the user could absorb them
- `17:12` "can we autogenerate and execute automatically, in sub-agents or similar, those prompts from the moment of the Gate 0 is clear out?" — **scope creep #1: automation added before the plan was tested**
- `17:24` "can we make the design agent to work in multiple tasks at the same time so we have a complete design to review and approve?" — **scope creep #2: parallelism added Day 1**
- `18:20` "can we move this to a Claude Cowork project?" — **scope creep #3: platform migration considered Day 1**

**Day 2 — May 12 — First cracks:**

- `01:55` "let's update the links from Stitch in all the design tasks since they are broken" — first tool reliability surprise
- `02:03` "why there are some designs in todo and others in review?" — state drift visible
- `02:06` "can we try to regenerate the designs from the failed ones?" — first regeneration loop
- `02:16` "why some of the tasks have Urgent Priority?, can you normalize that... never use Urgent unless is a hotfix" — agent generating wrong metadata
- `02:31` "how can I add feedback to a design task?" — workflow gap

**Day 3 — May 13:**

- `18:13` "I did move D-01 to In Progress but it didn't update the Stitch project at all. Should I move it to Todo based on the comment I left as feedback?" — **the feedback loop didn't fire as expected**

**Day 5 — May 15 — The pipeline mostly stops working:**

- `14:00` "mmm, no sight that the watcher triggered, can you diagnose, please?" — watcher silently failing
- `14:18` "can we try again?, i've connected and desconnected the MCP" — manual MCP cycling
- `14:43` "are we still using the Gate Watcher on the flow?, why this issue happened if everything was working right when creating issues in Linear and designs in Stitch?" — **the user is now questioning whether the design holds**
- `14:49` "I don't see the changes I left on the Linear task reflected on Stitch, why is this?" — Stitch ignoring updates (the bug we re-discovered five days later)
- `15:29` "it seems the watcher is not working since any design has been updated"
- `15:49` "are we on the right track using Stitch MCP on the sub-agent?, Deletion is not permited from the MCP, how can we handle that?" — **fundamental tool capability gap discovered Day 5**
- `15:53` "can we add the feature to all agents to leave comments on the Linear tickets when finishing or awaiting for review/re-review?, also, is there a way to add the deletion functionality, maybe through an API?" — **patching the pipeline mid-flight**

**Day 8 — May 18 — Context exhaustion + meta-questioning:**

The day starts at 01:30 with "agents will have enough time to finish their tasks before triggering the next one?" — agent timing concerns. Then a chain of debugging questions about cron, on-demand triggers, queue re-entrancy, token usage, then:
- `01:40` "great, let's leave it as is now. Now, how can we integrate Claude Cowork to this project?" — **second platform consideration, eight days into a project that hasn't shipped**
- `01:46` "are we using the any MCP for Linear/Stitch?, I thought we got rid of them" — the user has lost track of what tools are wired in
- `02:15` "how can I start a new session?" — context window exhausted

Three separate "session continued from previous context" markers appear in the transcript. The plan caused enough back-and-forth to blow through context windows three times in a single setup.

**Days 9–10 (today and yesterday):**

This conversation's content: rubric drafting (4 rounds), SKILL hardening (multiple passes), discovery that `edit_screens` doesn't persist, discovery that hooks no longer fire, discovery that `scheduled-tasks` MCP is gated in "unsupervised mode", agent dodging predicates with ⚠️, cache staleness when agents move state between gate-watcher runs.

---

## Part 3 — Pattern Analysis (no mercy)

Five distinct failure modes, in decreasing order of severity:

### 3.1 The plan optimized for orchestration before validating delivery

By Day 1, 17:12, before any design was approved or any line of code was written, **automation of agent spawning** was being added. By 17:24, **agent parallelism**. By 18:20, **platform migration to Cowork** was on the table.

None of these were on the original plan. All three came from the same instinct: "If only the pipeline were faster/smoother/more autonomous, it would deliver." It wouldn't have. The pipeline never had a delivery problem; it had a *no-delivery-yet* problem. Speeding up an empty pipeline produces more empty.

This is the classic "premature optimization at the orchestration layer" trap. Cremilo isn't unusual here — it's the most common failure mode in agentic SDLC adoption.

### 3.2 Tool reliability was assumed, not measured

The plan treated Stitch, Linear, and the scheduled-tasks daemon as **black-box reliable APIs**. None of them are:

| Tool | Failure modes discovered | When |
|---|---|---|
| Stitch MCP | Cannot delete screens | Day 5 (May 15) |
| Stitch MCP | Cannot edit screens (claims success, doesn't persist) | Day 10 (May 20) |
| Linear MCP | 401 auth errors on every gate-watcher run | Day 4–5 (May 14–15) |
| `mcp__scheduled-tasks__*` | Gated in "unsupervised mode" — bypasses `allow: ["*"]` | Day 10 (May 20) |
| `UserPromptSubmit` hook | Stopped firing for real prompts (works on manual input) | Day 10 (May 20) |
| gate-watcher state cache | Goes stale when agents move state between runs | Day 10 (May 20) |
| Stitch project default DS | Embeds a richer design_md than DESIGN.md had | Day 10 (May 20) |

Each of these required pipeline patches mid-flight. Every patch added complexity. None of these were anticipated.

The right response in retrospect: **invest in a tool reliability inventory before relying on any tool in a multi-step pipeline.** Five minutes of "what can this MCP actually do, and what does it lie about?" saves five hours of debugging downstream.

### 3.3 The plan assumed sustained context across sessions

The transcript shows **three context window exhaustions** in eight days. Each one forced a "session continued" summary, each summary lossy, each lossy summary leading to re-litigation of decisions ("are we using MCP for Linear/Stitch?, I thought we got rid of them").

A pipeline that requires a 4.7 MB session transcript to track its own state is a pipeline that doesn't fit human working memory. The decisions store this conversation talked about would have helped — but only if it had existed from Day 1.

### 3.4 The plan assumed the developer had unlimited attention

A solo developer with intermittent attention spends most of their cognitive budget on *figuring out where they were*. The transcript shows this explicitly: roughly 30–40% of user messages are status questions ("what should I do next?", "are we still using the Gate Watcher?", "why this is X status?"). That's the cost of a complex pipeline with a single operator.

The plan needed a **session-start protocol**: a single command that prints "here's where you are, here's the one thing to do next." That doesn't exist.

### 3.5 The plan never defined "done"

Look at the artifact: 9 design tasks (D-01..D-09), 6 infra tasks (I-01..I-06), 13 dev tasks (DEV-01..DEV-13), 7 QA tasks (Q-02..Q-07), 2 deploy tasks (DEV-14/15) — **37 tasks for one sub-app** of the Cremilo suite (Monthly Calculator). After 10 days of work, **zero are in `Done`**. Every D-XX is at "In Review" or sent back. Every I-XX is at "Todo." Every DEV-XX is "Backlog."

This isn't a sign of slow progress. It's a sign that the **definition of "done" is too coarse**. There's no smaller increment than "D-XX approved." Approval is binary, and we don't approve because the design isn't right, so nothing ever ships. There's no concept of "partial approval" or "ship a minimum viable auth and revisit polish later" — and critically no concept of "ship a thin vertical slice of the *suite* first, then deepen sub-app #1."

Industry calls this *the granularity trap*. Cremilo has it badly. In multi-app context the trap doubles: you can't even validate the suite's *shell* until one sub-app is done, and one sub-app won't be done until every D-XX is approved.

---

## Part 4 — A Realistic Plan (revised for multi-app + multi-project scope)

### 4.1 Acknowledged constraints

- **Time budget:** 2–3 hours per session, not every day. ~4–6 sessions/week max. Effective hours: ~10–15/week.
- **Cognitive budget:** every session starts cold. Need bootstrapping to remember where we were.
- **Tool reliability:** treat every MCP as flaky until proven otherwise.
- **Solo decision-making:** no one to escalate to; every "should we?" is a self-debate.
- **The pipeline isn't the deliverable.** The shipped sub-apps are. The pipeline is infrastructure that must be amortized across many sub-apps and projects.

### 4.2 Goal restated (now with the right scope)

> *Build a workflow where AI agents handle the mechanical steps of full-cycle product delivery (idea → design → code → test → deploy → measure) while a single human is responsible only for gate approvals and judgment calls. Validate this workflow by shipping (a) two distinct sub-apps inside Cremilo and (b) a thin slice of zao-jun — three end-to-end ships across two projects on two different stacks.*

Three ships, two projects. The validation triangle:
- Ship 1 (Cremilo sub-app A) → proves the pipeline ships *anything*.
- Ship 2 (Cremilo sub-app B) → proves the pipeline *reuses* what ship 1 produced.
- Ship 3 (zao-jun thin slice) → proves the pipeline is *portable* across stacks and domains.

### 4.3 Footprint principle

Marco's explicit ask: **"minimum footprint at the beginning so we can evolve this little by little."** The phased plan honors that with three rules:

1. **Each phase ships something usable.** Not a checkpoint — actual running software.
2. **Each phase adds at most one new piece of infrastructure to the pipeline.** Not three at once.
3. **Each phase's output is the input to the next phase's reuse test.** If ship 2 can't reuse ship 1's SKILLs/components, the pipeline isn't real yet.

### 4.4 Phased plan

#### Phase A — **Ship the Cremilo thin slice** (2–3 weeks of part-time work)

**Definition of done:** A user (you) can navigate to a Vercel URL, log in, see a dashboard, log a single daily expense, and see that expense persist. That's it. No analytics, no multi-currency math, no Impuesto Sellos, no Tarjetas with installments, no charts.

| Week | Focus | Sub-app outcome |
|---|---|---|
| 1 | Auth | Approve D-01 (already mostly done). Ship DEV-01. Login + register work. |
| 2 | Shell + 1 entry | Approve D-02. Ship DEV-02. Empty dashboard renders with one card slot. |
| 3 | Add expense flow | Reuse D-04 (DataTable) + D-05 (ItemForm). Adapt prompts to "daily expense" instead of full Monthly Calculator. Ship the DEV-XX equivalent. Deploy to Vercel. |

What gets **deferred** from the original Monthly Calculator scope (recoverable later, not lost):
- Multi-currency ARS/USD switching → deferred
- Impuesto Sellos tax calc → deferred
- ROI on savings → deferred
- Tarjetas installment tracking → deferred
- Recommended actions overlay → deferred
- 3-resolution support for every screen → relaxed to "desktop + mobile only" for ship 1

If a design needs more than 1 revision iteration to be approvable, **ship the previous one as v1** and put the polish in the backlog. The threshold is "could a real user log an expense with this?" — not "is this the cleanest possible UI?"

**Allowed during Phase A:**
- Bug fixes in the pipeline that *block* shipping
- Adjustments to the rubric only when they *blocked an approval that morning*
- Adding to `.docs/ANNOY.md` for later

**NOT allowed during Phase A:**
- Adding agents
- Refactoring gate-watcher
- Investigating Stitch alternatives
- Cloud migration (PRD-0002) thinking
- Critic/Analyst/InfoSec/any new role
- Touching zao-jun
- Generalizing SKILLs (premature — wait for Phase B)

#### Phase B — **Extract reusable patterns** (1 week, 2–3 sessions)

Right after Phase A ships, before starting sub-app #2. Three concrete outputs, in this order:

1. **`ANNOY.md` triage** — which annoyances actually slowed you down? Each one a candidate for pipeline improvement. *Most should be ignored*; pick at most 3 to fix.
2. **SKILL split: generic + project-specific.** The current `design-agent.md` has both. Pull the generic skeleton (rubric self-check loop, In-Review comment template, operational rules, hard constraints) into `~/.claude/skills/design-agent-generic.md`. Leave Cremilo-specific things (Mondrian DS asset ID, project ID, screen-unit roster) in `cremilo/.claude/skills/design-agent.md` that *extends* the generic. This is the prerequisite for zao-jun in Phase D.
3. **Session-start protocol** — one Python script that reads Linear + ROADMAP.md + gate-watcher state and prints a one-page "you are here." Cost: ~30 min to write. Value: every session start is 5 minutes shorter and your context window stays cleaner.

No new agents in Phase B. No new tools. No grand refactors. Just learning capture.

#### Phase C — **Ship Cremilo sub-app #2** (2–3 weeks)

Pick **the second-simplest sub-app** from the suite roadmap. Candidates by ascending complexity:

| Candidate sub-app | Complexity | Reuse from sub-app #1 |
|---|---|---|
| Configuration screens | Low | Auth, shell, ItemForm |
| Credit Cards dashboard (read-only first) | Medium | Auth, shell, DataTable |
| Investments panel | Medium-high | + new chart components |
| Monthly Calculator (full, with math) | High | + tax/ROI logic |

Recommendation: **Configuration screens.** Smallest, most reuse, gives you the currency setting + categories that other sub-apps will need anyway.

The test of Phase C is not "does it ship" — it's "**how much new work was needed?**". If sub-app #2 takes the same effort as sub-app #1, the pipeline isn't compounding. If it takes 50% less, the pipeline is real.

**Measure and write down:**
- Total time spent
- Number of SKILL changes needed
- Number of design predicates that needed adjustment
- Number of components reused as-is vs. rebuilt

This is your first **quantitative** signal about pipeline value. Without it, you'll keep iterating on instinct.

#### Phase D — **Ship zao-jun thin slice** (3–4 weeks)

zao-jun is the cross-project + cross-stack validation. Its stack:
- Vite + React 19 + TanStack (Router/Query/Form/Table)
- Storybook + vitest
- i18next + Sass
- Different from Cremilo's Next.js + CSS Modules + Supabase

This phase tests whether the generic SKILLs from Phase B actually transfer across stacks. Three sub-deliverables:

1. **Bootstrap zao-jun's `.claude/skills/` from generic templates.** Copy the generic SKILLs from `~/.claude/skills/`. Add zao-jun-specific overrides (different design system, different project ID if Stitch is used, different deployment target).
2. **Run the same gate-watcher logic** against zao-jun's Linear team/project. The `gate-watcher.py` is currently hardcoded to Cremilo's team/project IDs — this is the first real test of whether it can parameterize cleanly.
3. **Ship the equivalent thin slice** for zao-jun: auth (if applicable) + shell + one meaningful screen (probably "log a planned meal").

Honest expectation: this phase will surface **bugs** in your generic SKILLs. That's the point. You can't write a portable agent until you've tried to port it once.

#### Phase E — **Add roles, one at a time** (3–4 weeks per role, indefinite cadence)

Only after Phase D ships. The 24-role list isn't wrong — it's just front-loaded. Sequence by demonstrated need:

1. **Critic agent** — cheap, immediately useful. Job: read PRs / comments / commits and surface "this isn't aligned with X" against the rubric. The rubric is the perfect substrate.
2. **Analyst agent** — once Cremilo has real event data flowing. Job: read analytics, propose hypotheses about user behavior, write summary for the PO/stakeholder role.
3. **InfoSec agent** — when at least one project handles real PII or money. Job: scan dependencies, propose RLS audits, monitor Sentry-equivalent.
4. **Content/i18n agent** — when shipping in 2+ languages. zao-jun already has i18next; this becomes the first justified addition for it specifically.
5. **DevOps split** — only when infra complexity outgrows TL agent's bandwidth. Probably never for personal projects.

Roles 6+ on Marco's wishlist (Sales, Marketing, Support, etc.) only become real if Cremilo or zao-jun gets paying users. Until then they're cosplay.

### 4.5 What this plan deliberately does NOT include

- **Cloud migration (PRD-0002)** — the existing PRD already says "defer until team grows or 24/7 needed." Honor that.
- **Decisions store** — solve onboarding with a doc and Linear hygiene first; tables later if needed.
- **Conflict resolution policy** — wait until you observe a real conflict in the log.
- **A 24-role team** — every role added is a SKILL to maintain. Maintainability degrades fast past ~8 roles. The phased plan caps at ~7 active roles even at Phase E.
- **Custom orchestration improvements** — keep using Claude Code's scheduled-tasks + the current Python gate-watcher. Even when annoying.
- **Switching design tools** — Stitch has bugs, but Figma+plugins is its own swamp. Live with Stitch's limitations until something is clearly worse *or* until Phase B/D reveals a structural blocker.
- **Multi-project parallel work** — finish Cremilo's two sub-apps before touching zao-jun. Don't run them concurrently; switching costs are high for solo intermittent attention.

### 4.6 Schedule realism check

Total: ~8–10 weeks of part-time work to reach end-of-Phase D. With 10–15 hours/week effective and assuming Cremilo's existing pipeline inertia, the *realistic* window is closer to **10–12 weeks** (~3 months). Anything claimed shorter is optimism; anything claimed longer means it's time to simplify ship 1, not extend the calendar.

### 4.7 Team ramp-up considerations

The default plan assumes Marco solo throughout. Reality: Marco has mentioned a team of **4 humans total** — Marco + 1 Manual QA + 1 FE dev + 1 PM/PO/stakeholder. The plan needs to handle ramp-up.

#### 4.7.1 The fundamental rule

> **Ramps happen at phase boundaries, not mid-phase. One person at a time. Minimum one week apart. First-day deliverable for every joiner.**

Phase boundaries are the natural seam: a fresh joiner reads a *finished* artifact (a shipped sub-app, a stabilized rubric, an extracted SKILL) instead of trying to absorb an in-flight mess. Ramping mid-phase, mid-design-iteration, mid-rubric-revision is the worst possible timing — the joiner sees a half-shaped thing, asks "why is it like this?", and Marco has to context-switch out of execution to explain. Twice. With confidence dropping each time.

#### 4.7.2 Three timing options, ranked

| When | Risk | Recommended? |
|---|---|---|
| **After Phase A ships** (best) | Low. Joiner sees one shipped artifact, the pipeline has produced evidence, the rubric has been exercised. | ✅ Default |
| **After Phase B** (acceptable) | Low-medium. SKILLs are split generic/specific, onboarding doc exists, joiner can start clean. | ✅ If Phase A slips |
| **After Phase C** (also fine) | Low. Two ships in. Pipeline ROI is measured. The pipeline-on-probation question is settled. | ✅ Strong baseline |
| **Mid-phase** (avoid) | High. Joiner gets a partial mental model, distracts Marco from execution, often re-litigates settled decisions. | ❌ Only if calendar forces it |
| **During Phase A pre-ship** (worst) | Catastrophic. Marco is debugging the pipeline AND now teaching it. | ❌ Hard no |

If a ramp must happen mid-phase, the rule is: **finish the current vertical slice first** (one design through to one shipped DEV ticket), THEN absorb the new joiner into the next slice. Don't pause delivery to onboard.

#### 4.7.3 Recommended order of arrival

Sequence the team by **onboarding cost (ascending)** and **immediate value (descending)**:

1. **PM/PO/stakeholder first.** Onboarding cost: low (Linear hygiene + PRD reading + a one-page pipeline overview). Immediate value: high (frees Marco from solo decision-making, takes over scope discipline, owns the "ship or polish?" call that Marco has been losing daily). Their first deliverable: review PRD-0001's *remaining* scope and explicitly approve what stays in Phase A vs. what defers to Phase C+. That single decision saves Marco a week of waffling.

2. **Manual QA second.** Onboarding cost: very low (reads DESIGN.md § Design Rubric + In-Review template section of `design-agent.md`). Immediate value: high (CRE-15 has been sitting in In Review for days; QA's first hour is reviewing it). They become the authority for the Accessibility and Manual review checklists — gate-watcher already enforces their verdict. Their first deliverable: tick or reject the boxes on the next In Review design.

3. **FE dev last.** Onboarding cost: high (needs codebase context, design system understanding, Supabase + Vercel setup, the gate-watcher mental model, the FE-A vs FE-B split). Immediate value: medium initially, high after ramp. They want the pipeline *mature*, not in flux. Their first deliverable: pick an unblocked DEV-XX from Linear and ship it through to a Vercel preview URL.

Minimum spacing: **one full week between each ramp**, ideally two. Compressing ramps overlaps onboarding overhead — the most expensive cost in a small team.

#### 4.7.4 What gets promoted from "deferred" once people start joining

The original plan deferred several things until "team grows or 24/7 needed." Once a second human is confirmed for week N, the following move *up* the priority order, to be done in the week *before* their start:

- **`ONBOARDING.md` (thin version).** Not the polished doc the original plan deferred — a 1-pager that says: "Here's what we're building. Here's the pipeline in 5 bullet points. Here's your first deliverable. Here's where to ask questions." Iterate after each joiner's first week.

- **Decisions log (lightweight).** A single `.docs/DECISIONS.md` markdown file with date-stamped entries: "On YYYY-MM-DD we decided X because Y. Alternatives considered: Z." Append-only. Not Supabase tables — that's still premature. The point is to capture *why* a decision was made so newcomers don't re-litigate it.

- **Conflict resolution policy (explicit).** Write it once, post in ONBOARDING.md:
  - **Scope conflicts** → PM/PO decides.
  - **Technical conflicts** → Marco (until TL agent is human-backed) decides.
  - **Accessibility / manual-review conflicts** → QA's verdict is final on rubric items in their checklist.
  - **Design conflicts** → design-agent generates, PM/PO + Marco approve. No designer human in this team for now.
  - **Tie-breaker for unresolved cases** → defer to the next session, don't argue in real-time.

- **Session-start protocol.** What I previously put in Phase B becomes urgent once 2+ humans are working — anyone who didn't attend yesterday's session needs to read "you are here" in 30 seconds. Write the Python "where are we" script before the second joiner starts.

What stays deferred even with humans joining:
- Cloud migration (still no 24/7 need)
- Critic / Analyst / InfoSec agents (still phase-E territory)
- 24-role wishlist beyond the core 4
- Custom orchestration improvements

#### 4.7.5 First-day deliverable rule

Every new joiner produces **one concrete artifact in their first session**. Examples:

| Role | First-session deliverable |
|---|---|
| PM/PO | One Linear comment on a PRD with explicit "in scope for Phase A" / "deferred to Phase C+" annotations |
| Manual QA | One ticked-or-rejected review checklist on a real In Review issue |
| FE dev | One PR (even tiny) merged to main, deployed to a Vercel preview |

The first-day deliverable rule is non-negotiable. It does three things at once:
1. Forces the joiner to actually use the pipeline, not just read about it.
2. Surfaces broken steps in onboarding (if they can't ship by EoD-1, the docs are wrong).
3. Gives them a sense of progress on day one — protects motivation.

#### 4.7.6 Pair-the-first-cycle rule

For the first **full vertical slice** after a joiner arrives, Marco pairs with them. One full cycle = idea → PRD → design → code → QA → deploy. Even if it's a tiny slice. Even if Marco does most of the typing. Purpose: catch misunderstandings about the pipeline in real time, before the joiner builds wrong mental models. After the first paired cycle, they go independent.

#### 4.7.7 What changes structurally with each ramp

**+1 person (Marco + PM/PO):**
- Daily async sync via one Linear comment thread (no meetings yet)
- PM/PO owns scope; Marco owns execution
- Gate approvals split: PM/PO approves Gate 0 (PRD), both approve Gate 1 (design)

**+2 people (Marco + PM/PO + QA):**
- QA owns rubric checklist verdicts (already enforced by gate-watcher)
- One weekly 30-min sync — short, written agenda
- ONBOARDING.md kept current

**+3 people (full 4-human team):**
- FE dev needs git/PR review process — Marco reviews FE dev's PRs initially
- Two weekly 30-min syncs maximum
- Decisions log becomes table-stakes
- Critic agent (Phase E) starts making sense — second pair of eyes on PRs

#### 4.7.8 Plan elasticity

If ramps slip into mid-phase anyway (calendar realities), follow this protocol:

1. **Lock the current vertical slice.** No new work added to it. Finish what's in flight.
2. **Pause new sub-app work for one session.** Use that session to onboard.
3. **Joiner's first task is on the *next* slice, not the in-flight one.** They get a clean start.
4. **Re-baseline the schedule.** A ramp mid-phase adds ~1 week to that phase. Update ROADMAP.md.

A ramp during Phase A specifically: **drop one Phase A goal** to make room. Don't try to onboard *and* keep the original Phase A scope. The math doesn't work.

#### 4.7.9 Honest red flags

Things that look like ramp-up problems but are actually plan problems:

- **"The new person is asking too many questions"** → docs are too thin; not their fault.
- **"They keep doing it the wrong way"** → "the right way" isn't documented; not their fault.
- **"They're slower than I expected"** → onboarding is a real cost; estimate higher.
- **"They're rebuilding things from scratch"** → reuse contracts aren't clear; Phase B was rushed.

The first ramp will be 2–3× more expensive than later ramps. Plan for it. The fourth person should be much cheaper to onboard than the second — if not, the pipeline is more fragile than it looks.

---

## Part 5 — Self-Challenge (revised)

### 5.1 Are we on the right track so far?

Honest answer: **mostly yes on architecture, mostly no on sequencing.**

- ✅ **The gates concept is correct.** Checkpoint-gated execution between human reviews is exactly the pattern the industry is converging on ([Augment Code on agentic SDLC](https://www.augmentcode.com/guides/agentic-sdlc), [Beam's 2026 guide](https://getbeam.dev/blog/agentic-sdlc-complete-guide.html)).
- ✅ **The rubric is a real asset.** Forcing predicates to be binary + thresholded + classified by verification class is good craft. It's reusable for any project.
- ✅ **The SKILL discipline is correct.** Hard constraints, mandatory sections, no ⚠️ for must-haves — these will scale across multi-app + multi-project.
- ✅ **The pipeline size is appropriate for the destination.** Given Cremilo = multi-app suite + zao-jun as second project, 7 agents + Python orchestrator + Linear gate-watcher is *roughly the right amount of infrastructure* to amortize across 8+ ships. v1 of this doc was wrong to call it "over-elaborate."
- ❌ **The sequencing is wrong.** All that infrastructure was built before any sub-app shipped. The correct order would have been: ship a tiny vertical slice first (auth + 1 trivial screen), *then* build the multi-agent pipeline once you knew which parts were actually needed.
- ❌ **Ship #1 still hasn't happened.** This is the strongest signal that the sequencing was wrong. Industry comparison: a solo developer using Claude Code typically ships their first useful screen in 1–2 sessions. Cremilo took 10+ days because we built the orchestra before writing a single song.
- ⚠️ **Tool reliability is fragile.** Every patch session uncovers another broken MCP. This will continue. The plan needs to expect it. Generic SKILLs in Phase B should bake in tool-failure handling, not assume success.

### 5.2 Is the plan above plausible?

Honest answer: **plausible if the discipline holds; optimistic otherwise.**

Stress-test Phase A: "ship a Cremilo thin slice in 2–3 weeks of part-time work" (10–15 hr/week × 3 weeks = 30–45 hours).
- D-01 (auth) is already mostly designed and one approval away from shipping. ~5 hours.
- D-02 (shell) is partially designed. ~5–10 hours.
- A simplified "add expense" sub-app reusing D-04/D-05 with adapted prompts. ~10–15 hours.
- Wiring + Supabase setup + Vercel deploy. ~10–15 hours.

That's 30–45 hours of focused work. Plausible in 3 weeks at 10–15 hr/week, *if* you keep refusing to widen scope. The single biggest risk: scope creep within Phase A itself ("just add multi-currency, it's small"). Pre-commit to deferring all of it.

Phase C ("ship sub-app #2") plausibility depends entirely on Phase B's SKILL split working. If Phase B is rushed, Phase C will rediscover everything Phase A discovered. **Phase B is the load-bearing phase.** Don't skip it. Don't rush it. Don't skip the measurement step in Phase C.

Phase D ("ship zao-jun thin slice") plausibility depends on the generic SKILLs being actually portable. Probably some will be; some won't. The first stack mismatch (Next.js → Vite) will surface most of the issues. Budget for 1–2 weeks of "this didn't transfer" debugging inside Phase D's 3–4 weeks.

Total realistic window: **10–12 weeks of part-time work**. That feels right for "validate the workflow across 3 ships on 2 stacks." Anything claiming less is optimism.

### 5.3 Do we need a smaller plan first?

Honest answer: **yes — there's a Phase A-zero that takes one session.**

The smallest possible plan is **"approve CRE-15 and ship DEV-01 to a Vercel preview URL"** — auth-only, no dashboard yet. One session, 2–3 hours. The output: a URL where you can log in.

If that single session succeeds, Phase A is credible. If it doesn't succeed (designs still not approvable, infra still missing, Vercel not configured), then the pipeline isn't ready to ship anything and we need to simplify further:

- Drop Stitch for ship 1 — generate the auth UI directly in CSS Modules from the existing accessible designs as reference. Manual transcription, ~1 hour.
- Drop the design-agent for ship 1 — design exists, just code it.
- Drop the gate-watcher for ship 1 — single human approves manually.

In other words: if the pipeline can't ship auth in 1 session, **fall back to no-pipeline for ship 1**, prove the destination works, *then* re-introduce the pipeline for ship 2. The pipeline is supposed to make ships easier, not block them.

### 5.4 New question: does this plan actually justify the pipeline investment?

Worth asking explicitly given how much has been built.

Three sub-apps in Cremilo + zao-jun = 4+ ships. Amortizing 7 agents + the gate-watcher across 4 ships means ~1.5 ships per agent's "cost." That ratio is reasonable IF and only IF reuse actually happens. If sub-app #2 takes the same effort as sub-app #1 (Phase C measurement), reuse isn't happening and the agent infrastructure is sunk cost. At that point: cut back to 2–3 agents and re-evaluate.

The pipeline is on probation. Phase C is its evaluation date.

---

## Part 6 — Outside Reference Points

What the industry is doing in 2026 that's relevant:

**Checkpoint-gated agent execution is the consensus pattern.** Cremilo's gates model matches what [CodeRabbit's agentic SDLC guide](https://www.coderabbit.ai/guides/agentic-sdlc), [Beam's 2026 complete guide](https://getbeam.dev/blog/agentic-sdlc-complete-guide.html), and [CIO's analysis](https://www.cio.com/article/4134741/how-agentic-ai-will-reshape-engineering-workflows-in-2026.html) describe. So the architecture isn't wrong — it's the *operationalization* that's wrong.

**Two-layer review (agent + human) is the canonical model.** Agents do mechanical compliance checks; humans handle judgment. Cremilo's rubric + checklist split (Accessibility + Manual review) already encodes this. Direct match.

**40% of enterprise software is projected to be specified primarily through natural language by end of 2026** ([CodeRabbit](https://www.coderabbit.ai/guides/agentic-sdlc), [Beam](https://getbeam.dev/blog/agentic-sdlc-complete-guide.html)). This is the strategic bet Cremilo is making at micro-scale. The bet is reasonable; the execution needs to be smaller.

**Claude Code Agent Teams (Opus 4.6, Feb 2026)** ([LaoZhang AI](https://blog.laozhang.ai/en/posts/claude-code-agent-teams), [Developers Digest](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026)) introduced built-in 2–16 agent support with a mailbox-style communication system, file-locking, and auto-claiming. **Cremilo built its own version of this in Python before the native feature existed.** The Python orchestrator (gate-watcher + pending-agents.json + scheduled-tasks) is now an alternative to a thing Claude Code does natively. Worth evaluating in Phase B whether to migrate.

**Solo developer guidance ([Atomic Object](https://spin.atomicobject.com/ai-powered-solo-developer/), [Tim De Schryver's "Keep Agentic AI Simple"](https://timdeschryver.dev/blog/keep-agentic-ai-simple-a-practical-workflow-for-software-development), [Indie Hackers solo dev shipping in 30 days](https://www.indiehackers.com/post/i-shipped-a-productivity-saas-in-30-days-as-a-solo-dev-heres-what-ai-actually-changed-and-what-it-didn-t-15c8876106)) converges on:
- **Story refinement is where solo devs spend most time** — not code. PRDs and rubrics are the right work.
- **AI is great for boilerplate, scaffolding, tests. Architecture, data modeling, and product decisions stay human.** Cremilo's split is roughly right.
- **Speed has a comprehension cost.** Cremilo has felt this — the user has lost track of the toolchain twice.
- **"Most tasks don't need five agents."** Cremilo has 7. This is the most direct critique from the industry.

**EPAM's "Agentic Development Lifecycle (ADLC)"** ([EPAM blog](https://www.epam.com/insights/ai/blogs/agentic-development-lifecycle-explained)) — *(403 on direct fetch, but the framing exists in the public materials)* — argues that the traditional SDLC needs replacement, not augmentation, when agents are first-class participants. Worth following.

**Salesforce's engineering org going agentic** ([Salesforce](https://www.salesforce.com/news/stories/how-engineering-became-agentic/)) — case study of a *large* org. Direction matches Cremilo's; scale doesn't.

**Microsoft's end-to-end agentic SDLC on Azure + GitHub** ([techcommunity.microsoft.com](https://techcommunity.microsoft.com/blog/appsonazureblog/an-ai-led-sdlc-building-an-end-to-end-agentic-software-development-lifecycle-wit/4491896)) — full enterprise reference architecture. Useful as a target shape, not as a starting point.

The takeaways for Cremilo specifically:
1. The *what* (gates, two-layer review, agent specialization) is correct.
2. The *how much* (7 agents, custom orchestrator) is too ambitious for a solo project.
3. Phase B is the moment to consider whether to migrate to native Claude Code Agent Teams.

---

## Part 7 — Action for the Next Session

A single, narrow, unambiguous next move. No more meta-planning until this succeeds:

> **Approve CRE-15 (D-01 Auth) and ship DEV-01 to a Vercel preview URL.**

Concretely:

1. **Look at the 4 screens currently attached to CRE-15.** Decide: are they *good enough to ship*? Not "would I prefer them prettier" — *good enough to log into a finance app*. The cross-screen consistency issues you spotted yesterday don't all need to be fixed for ship 1. Decide which are blockers and which are "nice if there's time."
   - If yes → tick the Accessibility and Manual checklists. Move CRE-15 → Done. Gate-watcher auto-attaches. DEV-01 unlocks (pending I-04).
   - If no → write *one specific*, *one-iteration-fixable* feedback comment focused on **must-fix-to-ship** items only. Send back. New design-agent run. Re-evaluate.
2. **Unblock I-04** (TanStack Query setup). It's blocking DEV-01. Have TL-agent do it next, or do it manually if the pipeline stalls again.
3. **Ship DEV-01** to a Vercel preview URL. The CRE-15 approved screens, rendered as actual React components, with Supabase auth wired.

The session is successful if you can `git push` and have a Vercel preview URL with a working login page by end-of-session. Not before. Nothing else matters until that's true.

**Fallback if the pipeline blocks you:** drop the pipeline for this one ship. Hand-code the login screens from the existing accessible Stitch references. Set up Supabase auth directly. Ship in a single session. Use the pipeline again starting with sub-app shell (Phase A week 2). The pipeline is your servant for ship 1, not your master.

**Everything you've built in the pipeline since Day 1 is meant to make that one outcome possible. If the pipeline can't do it, ship without it and re-evaluate.**

---

## Part 8 — On the Critic Role

This document is what a Critic agent should be doing on a recurring schedule: read transcripts, find recurring failure patterns, write them down, no mercy. The reason it took 10 days to surface the patterns above is that *no agent in the team has this job*. Every agent in the current pipeline is execution-oriented; none is reflective.

When Phase D arrives, Critic should be the first additional role. Its prompt structure: read the past N sessions, identify failure patterns by topic frequency, write a brief doc, escalate the top-3 patterns to the human. Cost: low. Value: visible only after weeks of operation.

For now: this document is the manual one-shot version.

---

## Sources

- [Agentic SDLC: How AI agents are changing SDLC — CodeRabbit](https://www.coderabbit.ai/guides/agentic-sdlc)
- [The Complete Guide to Agentic Software Development in 2026 — Beam](https://getbeam.dev/blog/agentic-sdlc-complete-guide.html)
- [How agentic AI will reshape engineering workflows in 2026 — CIO](https://www.cio.com/article/4134741/how-agentic-ai-will-reshape-engineering-workflows-in-2026.html)
- [Agentic SDLC: What Changes When Agents Run Development — Augment Code](https://www.augmentcode.com/guides/agentic-sdlc)
- [How the Salesforce Engineering Organization Became Truly Agentic — Salesforce](https://www.salesforce.com/news/stories/how-engineering-became-agentic/)
- [An AI led SDLC: Building an End-to-End Agentic SDLC with Azure and GitHub — Microsoft](https://techcommunity.microsoft.com/blog/appsonazureblog/an-ai-led-sdlc-building-an-end-to-end-agentic-software-development-lifecycle-wit/4491896)
- [Agentic Development Lifecycle (ADLC): A New Model for AI Systems Beyond SDLC — EPAM](https://www.epam.com/insights/ai/blogs/agentic-development-lifecycle-explained)
- [Claude Code Agent Teams: The Practical Guide to Multi-Agent Development (2026) — LaoZhang AI](https://blog.laozhang.ai/en/posts/claude-code-agent-teams)
- [Claude Code Agent Teams, Subagents, and MCP: The 2026 Playbook — Developers Digest](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026)
- [An AI-Powered Development Workflow for the Solo Developer — Atomic Object](https://spin.atomicobject.com/ai-powered-solo-developer/)
- [Keep Agentic AI Simple: A Practical Workflow for Software Development — Tim De Schryver](https://timdeschryver.dev/blog/keep-agentic-ai-simple-a-practical-workflow-for-software-development)
- [I shipped a productivity SaaS in 30 days as a solo dev — Indie Hackers](https://www.indiehackers.com/post/i-shipped-a-productivity-saas-in-30-days-as-a-solo-dev-heres-what-ai-actually-changed-and-what-it-didn-t-15c8876106)

---

## Revision History

**v3 — 2026-05-23**: Added section 4.7 — Team ramp-up considerations. Covers: timing options ranked by risk, recommended order of arrival (PM/PO → QA → FE dev), what gets promoted from "deferred" when humans join (ONBOARDING.md, lightweight decisions log, explicit conflict resolution policy, session-start protocol), first-day deliverable rule, pair-the-first-cycle rule, structural changes per +1 person, plan elasticity for mid-phase ramps, honest red flags. No other sections changed.

**v2 — 2026-05-21**: Reframed after Marco supplied scope corrections.
- Added Part 0 (scope context: Cremilo is a multi-app suite; zao-jun is a second project on a different stack)
- Adjusted TL;DR points 2, 3, 4, 5 to reflect multi-app + multi-project reality
- Updated Part 3.5 (granularity trap) — "one screen" → "one sub-app"
- Rewrote Part 4 entirely: thinner Phase A (auth + 1 trivial sub-app, not full Monthly Calculator); new phases C (sub-app #2 inside Cremilo) and D (zao-jun) replace old "second product" phase; explicit "footprint principle" added (4.3); explicit schedule realism check (4.6)
- Rewrote Part 5 entirely: re-evaluated the pipeline as right-sized for the destination but wrong-sequenced for ship 1; added new question 5.4 about pipeline ROI break-even (Phase C)
- Updated Part 7 (next action) to add explicit fallback if the pipeline blocks ship 1

**v1 — 2026-05-20**: Initial post-mortem under wrong assumption that Cremilo = single calculator. Critique was right in direction but oversized in severity. Preserved sections (Parts 1, 2, 3, 6, 8) remain accurate.
