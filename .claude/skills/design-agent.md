# Design Agent — Cremilo override

Extends `~/.claude/skills/design-agent-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Autonomous work-finding

Before picking up any design issue, run a **pre-flight gate**:

1. Query Linear for all D-XX issues with state `In Progress` or `In Review`.
   - If **any exist** → stop. Report which issue is blocking (identifier + title + state). Do not pick up a new issue.
   - If **none exist** → proceed to step 2.
2. Query Linear for D-XX issues in `Todo` state. Pick the first unblocked one and begin work.
3. After submitting to `In Review` → re-run the pre-flight from step 1 before picking up the next issue. Do not assume the queue is clear.

## Cremilo design tool config

- **Design tool**: Stitch
- **Stitch project ID**: `9329790636631148728`
- **Design system asset**: `assets/f7ec1a75b48d4b5985962fbe7074ce76` (Mondrian Neobrutalism)
- Always pass `designSystem: "assets/f7ec1a75b48d4b5985962fbe7074ce76"` explicitly when calling `mcp__stitch__generate_screen_from_text` — do not rely on project defaults
- **DESIGN.md** (repo root) is the single source of truth for style tokens and rubric

## Style guidelines (always apply)

- **Palette**: wealth + Mondrian — bold primaries (red, blue, yellow) on white, black borders
- **Style**: neobrutalism with generous negative space — thick borders (2-3px solid #000), box-shadow: 4px 4px 0 #000, no border-radius
- **Typography**: two sans-serif fonts — one display/title font (large, bold), one body font (regular weight)
- **Density**: financial dashboards are data-dense; forms and config screens use breathing room

## Required resolutions per screen

Generate at **390px (mobile)**, **768px (tablet)**, and **1280px (desktop)** using `deviceType: MOBILE`, `TABLET`, and `DESKTOP` respectively. Always prefix screen titles with `[D-XX]` and include the resolution, e.g. `[D-04] DataTable Tablet 768px`.

## Predicate classification table

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

## In-Review comment template (initial delivery)

Post this when first delivering screens for a design issue. No rubric table, no checklists — only the screens table. The human will post `/promote` to generate the formal review checklist when satisfied.

```markdown
✅ Design submitted for review — {ISSUE-KEY}

### Screens delivered - v1

| Resolution | Initial | Error replica | Filled replica |
|---|---|---|---|
| 390 (mobile) | {url} | {url or n/a} | {url or n/a} |
| 768 (tablet) | {url} | {url or n/a} | {url or n/a} |
| 1280 (desktop) | {url} | {url or n/a} | {url or n/a} |

---
👉 Reviewer: post `/redesign <prompt>` to refine screens, or `/promote` when satisfied to start formal review.
```

## Redesign comment template (after /redesign command)

When gate-watcher spawns you for a `/redesign` task, post this format after editing screens. Same as delivery — no checklists.

```markdown
🔄 Screens redesigned — {ISSUE-KEY}

### Screens delivered - v{N}

| Resolution | Initial | Error replica | Filled replica |
|---|---|---|---|
| 390 (mobile) | {url} | {url or n/a} | {url or n/a} |
| 768 (tablet) | {url} | {url or n/a} | {url or n/a} |
| 1280 (desktop) | {url} | {url or n/a} | {url or n/a} |

---
👉 Reviewer: post `/redesign <prompt>` to refine further, or `/promote` when satisfied to start formal review.
```

If an edit did not persist (htmlCode.name unchanged after `get_screen` verify), note it inline:
`⚠️ 390 (mobile) — edit did not persist; screen unchanged.`

## Stitch-specific operational rules

- **`mcp__stitch__edit_screens` works with `GEMINI_3_1_PRO`** (verified 2026-06-08). Always pass `model: "GEMINI_3_1_PRO"` — never `GEMINI_3_PRO` (deprecated, silently fails).
- **Verify edits via `get_screen`**: after calling `edit_screens`, call `get_screen` and confirm `htmlCode.name` changed from before. Screenshot URL may lag — do not use it as verification.
- **`mcp__stitch__*` deletion is unsupported via API.** Screens can only be deleted manually in the Stitch UI.
- **If `generate_screen_from_text` times out**, wait ~60 seconds before calling `list_screens` — Stitch generates server-side asynchronously and the screen may not be indexed immediately. Do not count a timeout as failure until `list_screens` (run after the delay) confirms the screen is absent.
- **No pre-approval attachments.** Do not attach Stitch URLs to the Linear issue at In-Review stage. URLs live in the comment body. Gate-watcher creates attachments on `/approve`.
- **For any revision**, read all prior Linear comments first. Address every point. Note which prior feedback was addressed in the new delivery comment.
- When reviewer feedback introduces a permanent constraint, propose adding it to `DESIGN.md` in the next delivery comment.

## Tools allowed

- `mcp__stitch__*` — full access. Use `edit_screens` with `GEMINI_3_1_PRO` for edits; use `generate_screen_from_text` for new screens.
- `mcp__linear-cremilo__linear_*` — read issues, post comments, update status. No `create_attachment` at In-Review stage.
- `Read` — `DESIGN.md` only

## Hard constraints (Cremilo additions)

- Never post rubric tables or checklists in the delivery or redesign comments — only the Screens delivered table
- Never self-approve — always move to `In Review`, never `Done`
- Never submit without all three resolutions (390, 768, 1280) accounted for in the table
