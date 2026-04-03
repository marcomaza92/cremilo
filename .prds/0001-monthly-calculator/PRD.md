# Product Requirements Document (PRD): Financial Master - "Calculator" Epic

[cite_start]Based on the macro context of the "Economía 2020" spreadsheet and specifically focusing on the financial logic identified in the "Calculator" sheet (GID: 457751859), this document outlines the first major Epic for the development team[cite: 5, 6].

---

## 1. Epic Overview: Financial Logic Engine (Team: Calculator)

The "Calculator" epic serves as the core intelligence of the application. [cite_start]It translates the raw financial data (Income, Expenses, Savings) into actionable insights, projections, and automated tax calculations[cite: 5, 6].

### Core Logic & Formulas (Extracted)

- **Investment ROI (Ahorros)**:
  - [cite_start]`Total = Capital + Interes`[cite: 3].
  - [cite_start]`ROI % = (Interes / Capital) * 100`[cite: 3].
- **Installment & Debt Tracking (Tarjetas/Deudas)**:
  - [cite_start]`Remaining Debt = Total Amount - (Monthly Installment * Current Installment Number)`[cite: 3].
- **Tax Engine**:
  - [cite_start]Standardized **Impuesto de Sellos** calculation at a rate of **0.0149 (1.49%)** applied to credit card totals or contracts[cite: 3].
- **Multi-Currency Context**:
  - [cite_start]Dual tracking for **ARS** and **USD** balances with automated conversion logic based on user-defined or API-fetched rates[cite: 5, 6].

---

## 2. Design & UX (Stitch)

- **Tooling**: Use **Stitch** for high-fidelity prototyping and component design.
- **Design Constraints**:
  - **Financial Dashboards**: High-density data tables using **TanStack Table** patterns.
  - **Form Entry**: Mobile-optimized inputs for quick transaction logging (especially for "Gastos Diarios").
  - [cite_start]**Visual Indicators**: Color-coded status for "Vencido" (Expired) vs. "Pagado" (Paid) status[cite: 1].

---

## 3. Development Stack

- **Frontend**: **Next.js** (App Router) for SEO and server-side rendering of financial summaries.
- [cite_start]**State & Data**: **TanStack Query** for asynchronous financial data fetching and **TanStack Table** for managing complex grids (e.g., "Cronograma de Vencimientos")[cite: 1].
- **Styling**: **SCSS Modules** for scoped, maintainable styling following the Stitch design system.
- **Backend/Database**: **Supabase** for PostgreSQL storage, authentication, and real-time updates to balances across devices.

---

## 4. Testing Strategy

### Unit Testing (Jest)

- **Logic Verification**: Create test suites for the core formulas (`ROI`, `Debt Remaining`, `Tax Calc`).
- **Currency Handling**: Ensure precision in floating-point math for ARS/USD conversions.

### End-to-End (E2E) Testing (Cypress)

- **Critical Path**: Test the flow from "Adding a new installment" to "Dashboard update."
- **Auth Flow**: Verify secure access to private financial data via Supabase.

### Mobile Testing (Appium with Python)

- **Responsive Verification**: Automated scripts to verify the "Daily Entry" form layout on iOS and Android emulators.
- **Touch Interactions**: Ensure the TanStack Tables are scrollable and interactive on mobile devices.

---

## 5. Deployment & Management

- **Task Management**: All tasks for this Epic will be tracked in **Linear.app** under the "Calculator" Team/Epic.
  - _Linear Workflow_: Backlog -> In Progress -> In Review (Cypress/Jest Check) -> Done.
- **Deployment**: **Vercel** with CI/CD integration.
  - _Pipeline_: Automated Jest/Cypress runs on every PR before merging to production.

---

## 6. Initial Tasks (Linear Backlog)

1.  **[Dev]** Set up Supabase schema for `Transactions` and `Installments`.
2.  **[Design]** Create "Calculator" dashboard wireframes in Stitch.
3.  **[Logic]** Implement `calculateImpuestoSellos()` utility function (1.49%).
4.  **[Test]** Write Jest unit tests for the "Mayo" sheet's interest projection logic.
