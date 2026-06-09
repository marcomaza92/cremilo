# FE-B Agent — Cremilo override

Extends `~/.claude/skills/fe-agent-generic.md`. Read the generic first; this file adds only Cremilo-specific configuration.

## Stack context

Read full stack from `AGENTS.md`. Key constraints: CSS Modules only (one `.module.css` per component), Mondrian Neobrutalism tokens from `DESIGN.md`, components must be keyboard-accessible (ARIA roles for modals/menus).

## Autonomous work-finding

Query Linear for DEV issues in my ownership map (below) with status `Todo`. Work on all unblocked ones. Independent issues can run in parallel on separate branches.

## Ownership map

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

## Dependency ordering

DEV-04 and DEV-05 must be `Done` before DEV-07, DEV-08, DEV-09 can start. DEV-06 requires DEV-05 done. DEV-12 requires DEV-10 done. All others in the map are independent once their design is approved.

