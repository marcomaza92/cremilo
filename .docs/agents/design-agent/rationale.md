# Design Agent — Rationale

## What is this agent?

The Design Agent generates high-fidelity UI/UX designs for each approved work unit using Stitch. It works strictly one unit at a time — submits, moves the issue to `In Review`, and immediately picks up the next unit. It never holds context waiting for approval.

## Why does this agent exist?

Design is the primary trigger for all dev work in this pipeline. Without a dedicated design agent, the design-to-dev chain would be uncontrolled — developers would make visual decisions that should belong to a design review. By separating design into its own agent, we enforce the gate and keep the style system consistent.

## Constraints

- **One unit at a time.** Never holds two in-flight designs simultaneously.
- **Never self-approves.** Always moves to `In Review`, never `Done`.
- **Must follow DESIGN.md.** Style guidelines (Mondrian palette, neobrutalism, two fonts, negative space) are non-negotiable.
- **Must attach Stitch link to Linear issue** before moving to `In Review`.
- **Cannot start a unit that isn't in `Todo`** — only approved-to-start units are valid inputs.
- **Cannot write code.** Any implementation is FE-B's responsibility.

## Skills

- Stitch design generation (`mcp__stitch__*`)
- Neobrutalist UI composition (thick borders, hard shadows, Mondrian color blocks)
- Financial dashboard layout (high-density tables, KPI boxes, form modals)
- Component-level design (table, form, modal, nav, config sections)
- Linear issue update with design artifacts

## Abilities

- Generate full screen designs from text prompts
- Generate component variants (e.g., ARS vs USD form mode)
- Link Stitch designs to Linear issues
- Process up to 9 design units sequentially (D-01 through D-09)

## Pros

- Never blocked by infra or dev — works fully in parallel
- Freed immediately after each submission — minimal idle time
- Style consistency enforced by following DESIGN.md on every unit
- Each unit is small enough to be designed and submitted in one session

## Cons

- Sequential within its own track (one unit at a time) — can't parallelize designs
- Depends on Stitch availability and quality of generated output
- Design quality relies heavily on prompt quality — garbage in, garbage out
- Any design rejection (human sends back from `In Review` to `Backlog`) requires a full redo cycle

## Interactions with other agents

| Agent | Relationship |
|---|---|
| PO Agent | PO creates design issues; Design Agent picks them up from `Todo` |
| Gate Watcher | Watcher detects design approval (`In Review → Todo`) and triggers DEV |
| FE-B | FE-B consumes approved designs as implementation spec |
| FE-A | FE-A uses designs for auth/shell screens |
| TL Agent | No dependency — parallel tracks |
| QA Agent | No direct dependency — QA uses the implemented feature, not the design |
