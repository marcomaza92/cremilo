# Design

## Prompts

- Create a mobile configuration screen for the monthly calculator with rates, format, and advanced global currency sections
- Create a desktop Agregar Ítem modal with a two-column form layout over a dimmed dashboard background

---

## Summary Boxes

- There should be a box with the total incomes, total outcomes and the net balance in the

## Main Content

- Create a table for each section (Ingresos, Gastos Fijos, Tarjetas) that can be collapsible
- Add a add/edit form for each item for each section, where you can fill in the item's name, currency, is payed? and payment method.
  - When currency is set to USD, show "Real value" and "Rate". Rate should be prefilled with the info from a global configuration screen and freezed AFTER the due date is past
  - When currency is set to ARS, show only "Real value"
- On each table show Item, Value, is Payed?, Payment Method, action buttons inside a kebab

## Configuration Screen

- It should have a section called Rates, with USD, Dolar Tarjeta, EUR and YEN rates. Those will applied globally. You can also add custom rates (name and rates)
- It should have a section called Format for date and value number. Each one should be a dropdown with 5 of the most common options
- In an advanced zone section, it should have an option called "Global Currency". Default is ARS and options are ARS, USD and EUR.
  - When USD or EUR are selected, a new field should appear to be filled with the global rate value
  - This change will affect the add/edit form of Items in the Main Content. Now, the global currency should be the one by default in the currency field, and changing it, will show the global currency rate that can be updated manually for each item

## Style Guidelines

Canonical design system: **Mondrian Neobrutalism**. This section is the single source of truth — propagate any changes back into Stitch via `mcp__stitch__upload_design_md` followed by `mcp__stitch__apply_design_system`. The design-agent must reference the Stitch DS asset `assets/f7ec1a75b48d4b5985962fbe7074ce76` when calling `generate_screen_from_text`.

### Design tokens

```yaml
name: Mondrian Neobrutalism
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5c403d'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#906f6b'
  outline-variant: '#e5bdb9'
  surface-tint: '#bd1119'
  primary: '#b20112'
  on-primary: '#ffffff'
  primary-container: '#d62828'
  on-primary-container: '#fff1ef'
  inverse-primary: '#ffb4ab'
  secondary: '#1d54c7'
  on-secondary: '#ffffff'
  secondary-container: '#3f6ee1'
  on-secondary-container: '#fefcff'
  tertiary: '#745b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#d0a600'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  # Brand override colors (used for high-contrast UI)
  brand-red: '#D62828'
  brand-blue: '#0047BB'
  brand-yellow: '#F5C400'
  brand-black: '#111111'
typography:
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 100%
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 100%
    letterSpacing: 0.02em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 100%
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 150%
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 150%
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 120%
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 120%
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  card-padding: 24px
```

### Brand & Style

This design system utilizes a "Mondrian Neobrutalism" aesthetic to transform personal finance from a chore into a bold, architectural experience. The brand personality is unapologetic, structured, and high-energy. It rejects the soft, "safe" aesthetics of traditional fintech in favor of raw honesty and radical clarity.

The target audience consists of financially conscious individuals who value transparency and distinctive design. The UI evokes a sense of "Constructivist Control" — using heavy strokes and primary colors to categorize complex financial data into digestible, high-impact blocks. Everything is deliberate, sharp, and structural.

### Colors

The palette is strictly limited to the primary colors of the De Stijl movement, set against a stark white background and anchored by heavy black strokes.

- **Primary Red (#D62828)**: urgent financial alerts, negative balances, primary call-to-action surfaces.
- **Accent Blue (#0047BB)**: growth indicators, interactive elements, focused states.
- **Accent Yellow (#F5C400)**: structural accents, secondary highlights, signature top border on cards.
- **Neutral Black (#111111)**: the "ink" of the system — all borders, shadows, high-contrast text.

### Typography

A study in contrast. **Bebas Neue** provides a vertical, cinematic authority for headlines. **Space Grotesk** offers technical, geometric legibility for data and body copy.

- All headlines must be set in **uppercase**.
- For mobile, `headline-lg` scales down to 40px to preserve impact within layout constraints.
- Numeric data (currency, percentages) must use **Space Grotesk Medium** for technical clarity.

### Layout & Spacing

Rigid, grid-based, inspired by geometric modernism. **Fixed Grid** of 12 columns on desktop; fluid 4-column model on mobile (see also Rubric predicates #11/#12/#13).

Spacing is built on a 4px base unit. Visual rhythm comes from generous whitespace balanced against thick dividers. Elements are often "locked" together sharing a 3px border, creating a mosaic of financial information.

### Elevation & Depth

Depth is **not** communicated through light physics or blur. It's communicated through **Hard Offset Shadows**.

- All interactive or elevated elements (Cards, Buttons, Modals) must use `box-shadow: 6px 6px 0px #111111`.
- There are no Z-axis gradients. Depth is binary: flat, or pushed forward with the hard black shadow.
- On press, the shadow transitions to `0px 0px 0px` and the element translates 6px down and right to simulate a physical click.

### Shapes

Strictly orthogonal. **No border-radii anywhere in the system.** Buttons, input fields, cards, even progress bars — all `border-radius: 0`. This reinforces the architectural, Neobrutalist nature.

### Components

- **Buttons**: high-contrast background (Red or Blue), 3px black border, 6px hard shadow. Text is Bebas Neue, uppercase.
- **Cards**: white background, 3px black border. Every card features a signature 8px solid Yellow (#F5C400) strip at the very top, flush with the top border. 24px internal padding.
- **Input Fields**: completely square containers with 3px black border. Labels above the field in `label-bold` typography. Active state: very light gray background or secondary shadow.
- **Lists**: separated by 3px horizontal lines. No rounded separators. Icons within lists are thick-stroked and geometric.
- **Chips/Badges**: small square boxes with 2px borders for categorizing expenses (e.g. "Food", "Rent"). Used by Rubric predicates #7/#8 for transaction status pills (Vencido/Pagado/etc.).
- **Progress Bars**: solid blocks of color within a 3px black-bordered container. No rounded ends. Filled portion uses a high-contrast primary color.

---

## Design Rubric

Every screen submitted to `In Review` must satisfy all **Must-have** predicates. **Nice-to-have** predicates are annotated in the review comment but do not block submission. The design-agent self-reports against each predicate; the human QA reviewer is the verification authority for the Accessibility must-haves (see A11y review checklist in the In-Review comment template).

### Must-have

#### Resolutions and layout

**1. Resolutions**
- *Predicate*: All defined screens must be implemented in three resolutions: 320px (mobile), 820px (tablet), 1440px (desktop).
- *Fail*: Any screen rendered outside these resolutions.

**2. Above-the-fold information**
- *Predicate*: Three cards (Total income, Total outcome, Current remaining) are visible above the fold. Stacked on mobile (320–819px); single row of 3, no wrap, on tablet (820–1439px) and desktop (1440px+).
- *Fail*: One or more cards not visible above the fold at any defined resolution.

#### Functional

**3. Error and filled states**
- *Predicate*: All screens with form elements include two replicas per resolution: one showing the error state, one showing the filled-but-not-submitted state. The original shows the initial empty state.
- *Fail*: Main screen missing one or both replicas at any resolution.

**4. Currency display**
- *Predicate*: All money values display the currency as `ARS` or `USD` text label (per global config) instead of a sign. Per-entry overrides are allowed via the entry detail screen.
- *Fail*: Any currency value shown with a sign, or rendered without a text label.

**5. Action distance**
- *Predicate*: No critical flow exceeds 3 taps/clicks from the main content. Critical flows:
  - Add new item to Income
  - Add new item to Outcome
  - Filter items in the main-content table
  - Open the details drawer of any item in a table
  - Edit a list item
  - Delete a list item
- *Fail*: Any listed flow requires more than 3 taps/clicks.

#### Accessibility

**6. Color contrast**
- *Predicate*: WCAG 2.2 AA — 4.5:1 for normal text (<18px non-bold AND <14px bold); 3:1 for large text (≥18px OR ≥14px bold); 3:1 for icons and UI component borders.
- *Fail*: Any text/background or icon/background pair below threshold.

**7. ARIA label match**
- *Predicate*: All transaction status pills have an aria-label matching their visible text content.
- *Fail*: Any pill missing or mismatching its aria-label.

**8. Color-independent state**
- *Predicate*: All transaction status pills convey their state via at least one non-color cue (icon, border pattern, label) in addition to background or border color.
- *Fail*: Any pill identifiable only by color.

**9. Target size**
- *Predicate*: Every interactive element is at least 48px × 48px. Width may exceed 48px to fit content.
- *Fail*: Any interactive element smaller than 48px × 48px.

### Nice-to-have

#### Resolutions and layout

**10. Filters**
- *Predicate*: Maximum 5 filter items on the main-content data display; last 2 are customizable (user-selected from the configuration screen). Desktop (1440px+): 1 row, no wrap. Tablet (820–1439px) and mobile (320–819px): up to 2 rows.
- *Fail*: Filter count or layout deviates.

**11. Mobile stacking**
- *Predicate*: On mobile (320–819px), all main components are stacked vertically.
- *Fail*: Any main component not stacked.

**12. Tablet columns**
- *Predicate*: On tablet (820–1439px), main elements fit within a maximum 4 equal-width column grid.
- *Fail*: Component overflows or breaks the 4-column grid.

**13. Desktop columns**
- *Predicate*: On desktop (1440px+), use a 12 equal-width column grid. Across all resolutions, header and footer span full page width independently; aside+main together span full page width.
- *Fail*: Component breaks the 12-column grid or layout band rule.

#### Functional

**14. Summary cards content**
- *Predicate*: Each summary card corresponds to exactly one of {Total income, Total outcome, Current remaining} and contains only {amount, currency, title}.
- *Fail*: Card category mismatch or contains additional elements.

**15. Recommended actions**
- *Predicate*: The main section shows at least 3 actionable insight icons overlaid at the top-right of the corresponding element of interest, derived from the user's income/outcome data over the last 90 days. If data is unavailable, replace with a full-width banner (at all three resolutions) below the main title encouraging the user to load more data.
- *Fail*: Icons shown despite missing or under-90-day data, or banner shown when data exists.

**16. Number format**
- *Predicate*: Numbers follow the currency locale — ARS uses `.` thousand and `,` decimal separators; USD uses `,` thousand and `.` decimal separators.
- *Fail*: Any number using the wrong locale for its currency.

**17. Cognitive load**
- *Predicate*: No main content has more than 3 main sections or more than 5 main action elements.
- *Fail*: Either threshold exceeded.

#### Accessibility

**18. Borders and focus**
- *Predicate*: Borders on interactive elements are 2px wide; focus state outline is 2px wider than the border (4px total).
- *Fail*: Border or focus outline deviates from the spec.
