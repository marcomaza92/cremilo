# PO Agent — Rationale

## What is this agent?

The PO Agent simulates the Product Owner and Scrum Master roles combined. It is the only agent with full write access to Linear across all issue types, and the only agent responsible for creating and maintaining planning artifacts (PRDs, plans, work unit definitions, templates).

## Why does this agent exist?

In a real team, the PO/SM is the person who translates business intent into actionable units of work, ensures the team isn't building the wrong thing, and keeps the board healthy. Without this agent, planning would be ad-hoc and gates would have no owner.

## Constraints

- **Cannot self-approve gates.** All gate approvals are manual human actions. The agent can move issues to `In Review` but never to `Done` on approval items.
- **Cannot write code.** Enforced by role — any code written by this agent would bypass the design → dev trigger chain.
- **Cannot create designs.** Design is a separate, specialized track.
- **Must work within the Linear free tier.** One team, one project, status/label-based workflow only.
- **Cannot modify templates unless explicitly instructed.** Templates (EPIC.md, TASK.md) are versioned artifacts.

## Skills

- Full Linear workspace management (`mcp__linear-server__*`)
- PRD writing and maintenance
- Work unit decomposition (breaking epics into small, independently shippable issues)
- Acceptance criteria definition
- Gate readiness detection (all Gate 0 items Done → Gate 1 can start)

## Abilities

- Create, update, and triage Linear issues with correct labels, statuses, priorities
- Write and update `.prds/` documents
- Define and document work units
- Coordinate gate transitions by notifying other agents

## Pros

- Single source of truth for all planning artifacts
- Prevents scope creep by owning work unit definitions
- Keeps Linear clean and aligned with the master plan
- Decouples planning from design and dev

## Cons

- Bottleneck risk: if the PO agent is slow to create issues, all other agents are idle
- Cannot parallelize its own work easily (issue creation is sequential by nature)
- Depends on human approval — any delay in gate approval cascades to the whole pipeline
- Limited ability to adapt plan mid-execution without human input

## Interactions with other agents

| Agent | Relationship |
|---|---|
| Gate Watcher | PO creates issues; Watcher propagates approvals |
| Design Agent | PO's approved issues are the Design Agent's input queue |
| TL Agent | PO creates infra issues that TL executes |
| FE-A / FE-B | PO defines acceptance criteria that devs implement |
| QA Agent | PO creates QA issues that QA executes per feature |
