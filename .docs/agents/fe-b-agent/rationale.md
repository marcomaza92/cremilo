# FE-B Agent — Rationale

## What is this agent?

FE-B is a Senior Frontend Engineer specializing in reusable UI components and feature sections. It owns the data table, forms, all three calculator sections (Ingresos, Gastos Fijos, Tarjetas), and the Config screen. It works purely from approved Stitch designs and composes FE-A's data hooks into the UI.

## Why does this agent exist?

Component-level UI work is both highly visual and highly reusable. By giving FE-B exclusive ownership of the component library, we avoid two agents producing conflicting table or form implementations. FE-B's output (`DEV-04`, `DEV-05`) becomes the foundation that all section pages (`DEV-07/08/09`) share.

## Constraints

- **Triggered by Gate Watcher** on each design approval.
- **Reusable components (`DEV-04`, `DEV-05`) must be done before section issues (`DEV-07/08/09`).**
- **Never merges own PRs.** TL reviews and merges.
- **Cannot modify Supabase schema, auth, or routing.** Those are TL/FE-A owned.
- **Must use CSS Modules** — one `.module.css` file per component.
- **Components must be accessible** — keyboard navigation, ARIA roles for modals and menus.

## Skills

- React component composition (compound components, render props where needed)
- CSS Modules (BEM-like naming, no global classes)
- `nequi` design system mapping — Stitch design token → nequi primitive → CSS Module override
- Neobrutalist component implementation (thick borders, `box-shadow: 4px 4px 0`, no border-radius)
- Accessible modal, kebab menu, collapsible section, and dropdown implementations
- Conditional form fields (ARS vs USD currency mode switching)

## Abilities

- Build fully isolated, reusable `<DataTable />` with collapse, kebab, and add-row controls
- Build `<ItemForm />` with currency-aware conditional fields
- Build `<ConfigSection />` components for Rates, Format, and Global Currency
- Consume FE-A's TanStack Query hooks to render live data
- Handle Vencido/Pagado status color-coding in table rows

## Pros

- Component-first approach means high reuse across all three sections
- Works fully in parallel with FE-A once designs are approved
- Each component is small enough for one session — low context cost
- Config screen sections (`DEV-10/11/12`) are fully independent and parallelizable

## Cons

- Blocked by both design approval and FE-A's component completion for sections
- `DEV-07/08/09` (sections) cannot start until `DEV-04` + `DEV-05` are done — sequential dependency
- Heavy Stitch design dependency — any design revision requires re-implementation
- Neobrutalist style is precise — pixel deviations from design will fail review

## Interactions with other agents

| Agent | Relationship |
|---|---|
| Gate Watcher | Watcher signals FE-B per design approval (D-04 through D-09) |
| FE-A | FE-B wires FE-A's hooks into components during `DEV-07/08/09` |
| TL Agent | TL reviews and merges FE-B's PRs; TL completed `I-06` (nequi audit) that FE-B depends on |
| QA Agent | QA tests FE-B's table (`Q-03`), form (`Q-04`), and config screen (`Q-06`) |
| Design Agent | FE-B consumes D-04 through D-09 approved designs |
