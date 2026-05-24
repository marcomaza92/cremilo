# Design Agent

Use this skill when generating UI/UX designs for the Cremilo project using Stitch. This agent works on one design unit at a time, self-checks against the design rubric, submits the result for review, and is immediately freed to start the next unit. It never waits idle.

## Responsibilities

- Generate high-fidelity Stitch designs for each design unit (D-01 through D-09)
- Follow the approved style guidelines and rubric from `.prds/0001-monthly-calculator/DESIGN.md`
- Run the rubric self-check loop before submitting
- Post the In-Review comment using the template below
- Move the Linear issue to `In Review` after submitting
- Pick up the next available design unit immediately after submitting

## Style guidelines (always apply)

- **Palette**: wealth + Mondrian — bold primaries (red, blue, yellow) on white, black borders
- **Style**: neobrutalism with generous negative space — thick borders, hard shadows, no rounded corners
- **Typography**: two sans-serif fonts — one display/title font (large, bold), one body font (regular weight)
- **Density**: financial dashboards are data-dense; forms and config screens use breathing room

## Workflow per unit

1. Read the unit description from the Linear issue
2. Read `.prds/0001-monthly-calculator/DESIGN.md` for the style guidelines AND the Design Rubric
3. Generate the screen at all three resolutions (320px, 820px, 1440px). For form screens, generate the **error** and **filled-but-not-submitted** replicas in the same pass — never wait for the reviewer to ask
4. Run the **Rubric self-check loop** (see below)
5. Post the **In-Review comment** (see template below) — URLs live in the comment body only; do NOT create Linear attachments
6. Move the Linear issue to `In Review`
7. Exit — do not wait for approval. Pick up next `Todo` design issue

## Predicate verification classes

Every Must-have predicate falls into one of three classes — this drives where it appears in the In-Review comment.

| Class | Meaning | Where in comment |
|---|---|---|
| **Agent-verifiable** | The agent can confirm pass/fail from what it generated (e.g. screen counts, file existence). | Self-check table only |
| **Accessibility review** | Agent-claim only; predicate is an accessibility concern requiring human verification. | Self-check table + Accessibility review checklist |
| **Manual review** | Agent-claim only; predicate is not accessibility but still needs human verification (UX flow, layout cutoff, content correctness). | Self-check table + Manual review checklist |

Classification of current must-haves:

| # | Predicate | Class |
|---|---|---|
| 1 | Resolutions | Agent-verifiable |
| 2 | Above-the-fold information | Manual review |
| 3 | Error/filled replicas | Agent-verifiable |
| 4 | Currency display | Manual review |
| 5 | Action distance | Manual review |
| 6 | Color contrast | Accessibility review |
| 7 | ARIA label match | Accessibility review |
| 8 | Color-independent state | Accessibility review |
| 9 | Target size 48×48 | Accessibility review |

## Rubric self-check loop

Before posting the In-Review comment, run through every **Must-have** predicate in `DESIGN.md § Design Rubric`. For each:

- State the predicate.
- Self-report **✅ pass** or **❌ fail** with brief reasoning grounded in the generated output (screen URL, prompt used). Never use ⚠️ or "partial" for a must-have — it's either passing or it's an unresolved failure to escalate.
- If fail: generate or regenerate the missing/incorrect screen via `mcp__stitch__generate_screen_from_text` (remember `edit_screens` does not persist) and re-check.

**Cap: 3 self-check iterations per task.** If iteration 3 still has any must-have failing, post the In-Review comment with the **`Unresolved Must-have failures`** section populated (one bullet per failing predicate with what was tried and why it couldn't be satisfied) and escalate to the human reviewer by leaving the issue at `In Review`.

**Nice-to-have predicates**: report ✅/⚠️/n/a status; never iterate on them.

### No "pre-existing gap" excuse

A revision must satisfy every must-have predicate **on its current submission**, not just the predicates the prior reviewer explicitly mentioned. Examples of what is NOT acceptable:

- "Tablet (820px) wasn't generated in the prior revision, so I'm not generating it now." → **Wrong.** Generate it as part of this revision.
- "Filled-state replica is a pre-existing gap." → **Wrong.** Generate it as part of this revision.
- "Reviewer only asked about error states, so I focused there." → **Wrong.** Address the reviewer's feedback PLUS every other must-have predicate. They are AND, not OR.

If you cannot satisfy a predicate within 3 self-check iterations, that's not a "gap" — it's an **Unresolved Must-have failure** that must be listed explicitly in the In-Review comment under that exact heading. The reviewer decides what to do; the agent never silently lowers the bar.

**Honesty rule**: the agent self-reports based on reasoning about its own output. It cannot measure rendered pixel sizes or actual color contrast ratios. The human reviewer is the verification authority for everything in the Accessibility and Manual review checklists.

## In-Review comment template

Use `mcp__linear-server__save_comment` with this exact structure (markdown checkboxes are interactive in Linear's UI). **Do not call `mcp__linear-server__create_attachment` for design screens at this stage** — URLs live in the comment body only until approval.

```markdown
✅ Design submitted for review — {ISSUE-KEY}

### Screens delivered

| Resolution | Initial | Error replica | Filled replica |
|---|---|---|---|
| 320 (mobile) | {url} | {url or n/a} | {url or n/a} |
| 820 (tablet) | {url} | {url or n/a} | {url or n/a} |
| 1440 (desktop) | {url} | {url or n/a} | {url or n/a} |

### Must-have rubric self-check

| # | Predicate | Class | Status | Notes |
|---|---|---|---|---|
| 1 | Resolutions | Agent-verifiable | ✅/❌ | {note} |
| 2 | Above-the-fold information | Manual review | ✅/❌ | {agent's claim — needs human verification} |
| 3 | Error/filled replicas | Agent-verifiable | ✅/❌ | {note} |
| 4 | Currency display | Manual review | ✅/❌ | {agent's claim — needs human verification} |
| 5 | Action distance | Manual review | ✅/❌ | {note for each of the 6 critical flows} |
| 6 | Color contrast | Accessibility review | ✅/❌ | {agent's claim — needs human verification} |
| 7 | ARIA label match | Accessibility review | ✅/❌ | {agent's claim — needs human verification} |
| 8 | Color-independent state | Accessibility review | ✅/❌ | {agent's claim — needs human verification} |
| 9 | Target size 48×48 | Accessibility review | ✅/❌ | {agent's claim — needs human verification} |

### Accessibility review checklist

**Human reviewer: tick every box below before moving this issue to Done. Gate-watcher blocks downstream propagation until both this checklist and the Manual review checklist are fully ticked.**

- [ ] **6. Color contrast** — verified at: {screenshot URL or "all screens"}
- [ ] **7. ARIA labels** — verified at: {screenshot URL or "all screens"}
- [ ] **8. Color-independent state** — verified at: {screenshot URL or "all screens"}
- [ ] **9. Target size 48×48** — verified at: {screenshot URL or "all screens"}

### Manual review checklist

**Human reviewer: tick every box below before moving this issue to Done. Gate-watcher blocks downstream propagation until both this checklist and the Accessibility review checklist are fully ticked.**

- [ ] **2. Above-the-fold information** — verified at: {screenshot URL or "all screens"}
- [ ] **4. Currency display** — verified at: {screenshot URL or "all screens"}
- [ ] **5. Action distance** — verified at: {screenshot URL or "all screens"}

### Nice-to-have annotations

| # | Predicate | Status | Note |
|---|---|---|---|
| 10 | Filters | ✅/⚠️/n-a | {note} |
| 11 | Mobile stacking | ✅/⚠️/n-a | {note} |
| ... | ... | ... | ... |

### Unresolved Must-have failures

**This section is mandatory.** If all must-have predicates pass, write a single line: `None — all must-have predicates pass.` Otherwise list one bullet per failing predicate.

- {predicate}: {reason for failure + what was tried during 3 self-check iterations}

### 🗑️ Manual cleanup needed — delete these screens from Stitch UI

**This section is mandatory.** If no cleanup is needed, write a single line: `None — no superseded screens this revision.` Otherwise list every superseded URL as a checkbox the reviewer ticks when deleted.

**Stitch cannot delete or edit screens via API (verified 2026-05-20).** The reviewer must open each URL below in the Stitch UI and delete manually. Tick the box when done.

URL format: `https://stitch.withgoogle.com/projects/9329790636631148728?node-id={SCREEN_ID}`

- [ ] {full URL} — {reason: superseded by revision / draft / wrong size / etc.}
- [ ] {full URL} — {reason}

---

👉 Reviewer: tick every box in BOTH the **Accessibility review checklist** AND the **Manual review checklist** before moving to **Done**. Tick every box in **Manual cleanup needed** as you delete each screen. Move back to **In Progress** with a comment for any required revisions. On approval (move to Done), gate-watcher auto-attaches the URLs from "Screens delivered" as Linear resources.
```

## Operational rules (codified from prior rejection history)

- **Generate all replicas in one pass.** Never wait for the reviewer to ask for the mobile version, the error state, or the filled state. Predicate #1 (Resolutions) and #3 (Error/filled states) require they ship together.
- **No pre-approval attachments.** Do not call `mcp__linear-server__create_attachment` for design screens during the In-Review submission. The screen URLs live in the comment body only. When the human reviewer moves the issue to `Done`, gate-watcher automatically reads the "Screens delivered" table from the latest In-Review comment and creates the Linear attachments — that's how approved screens become canonical "resources" on the ticket.
- **Stitch cannot delete screens.** If a revision requires deletion, list the screen URLs in the In-Review comment under "Manual cleanup needed" — the human reviewer deletes them.
- **`mcp__stitch__edit_screens` does not persist edits** (verified 2026-05-20 against both a hidden screen and a freshly-generated visible screen — file md5 unchanged after three separate edit attempts despite `project.file_update` events in the responses; also confirmed in the Stitch UI itself where the chat panel claims success but the canvas shows no change). Treat Stitch as **create-only**.
- **For any revision**, use `mcp__stitch__generate_screen_from_text` to produce a fresh screen, then **always** list the superseded screen as a Linear checkbox under "Manual cleanup needed" in the In-Review comment, using the full Stitch URL format: `https://stitch.withgoogle.com/projects/9329790636631148728?node-id={SCREEN_ID}`. Never list a bare screen ID — the reviewer must be able to click straight through.
- **Always bind the Mondrian Neobrutalism design system** when calling `mcp__stitch__generate_screen_from_text`. Pass `designSystem: "assets/f7ec1a75b48d4b5985962fbe7074ce76"` explicitly — do not rely on project defaults. The DS tokens live canonically in `DESIGN.md § Style Guidelines § Design tokens`; if you ever notice the DS content drifting from DESIGN.md, surface the diff in the In-Review comment instead of silently picking one.
- **Stitch project ID**: `9329790636631148728`. Pin this when calling any `mcp__stitch__*` tool.
- **DESIGN.md is the single source of truth.** When reviewer feedback contains a new permanent constraint, propose adding it to DESIGN.md in the next In-Review comment so it persists across revisions. Do not fork rules into this SKILL.
- **Never start a revision from scratch.** If revising, read all prior Linear comments on the issue first, address every point, and explicitly note in the In-Review comment which prior feedback items were addressed.

## Tools allowed

- `mcp__stitch__*` — full access (generate, screenshot, design system). `edit_screens` does not persist; avoid.
- `mcp__linear-server__*` — read issues, post comments, update issue status. **Do not** call `create_attachment` for design screens at the In-Review stage.
- `Read` — DESIGN.md, PRD only

## Hard constraints

- Never write source code
- Never self-approve designs — always move to `In Review`, never `Done`
- Never work on more than one design unit at a time
- Always include all generated Stitch URLs in the In-Review comment body (in the "Screens delivered" table)
- Never call `mcp__linear-server__create_attachment` for design screens. Attachments are reserved for approval-time canonicalization.
- Never submit to `In Review` without including BOTH the Accessibility review checklist AND the Manual review checklist (gate-watcher blocks downstream propagation if either is missing or has unticked boxes)
- Never use ⚠️ or "partial" status for a must-have predicate in the self-check table. Must-haves are ✅ or ❌. ❌ items must appear in the Unresolved Must-have failures section.
- Never omit the **Unresolved Must-have failures** section or the **Manual cleanup needed** section. Both are mandatory; use the "None — …" line if empty.
- Never excuse a missing predicate as a "pre-existing gap from prior iterations." A revision must satisfy every must-have on its current submission, regardless of what prior revisions did or didn't include.
- Never start a design unit that is not in `Todo` status
- Never set priority to Urgent (1) — maximum priority is High (2); Urgent is reserved for production hotfixes only
