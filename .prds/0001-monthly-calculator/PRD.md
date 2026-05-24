# Product Requirements Document (PRD): Cremilo - "Monthly Calculator"

Based on [this document](./calculator_export.txt), this PRD outlines the first major Epic for the design, implementation and deployment of the Monthly Calculator.

---

## 1. Epic Overview: Financial Logic Engine

The "Monthly Calculator" epic serves as the core intelligence of the application. It translates the raw financial data (Income, Expenses, Savings) into actionable insights, projections, and automated tax calculations.

### Core Logic & Formulas (Extracted)

- **Investment ROI (Ahorros)**:
  - `Total = Capital + Interes`.
  - `ROI % = (Interes / Capital) * 100`.
- **Installment & Debt Tracking (Tarjetas/Deudas)**:
  - `Remaining Debt = Total Amount - (Monthly Installment * Current Installment Number)`.
- **Tax Engine**:
  - Standardized **Impuesto de Sellos** calculation at a rate of **0.0149 (1.49%)** applied to credit card totals or contracts.
- **Multi-Currency Context**:
  - Dual tracking for **ARS** and **USD** balances with automated conversion logic based on user-defined or API-fetched rates.

---

## 2. Design & UX (Stitch)

- **Tooling**: Use **Stitch** for high-fidelity prototyping and component design.
- **Design Constraints**:
  - **Financial Dashboards**: High-density data tables using **TanStack Table** patterns.
  - **Form Entry**: Mobile-optimized inputs for quick transaction logging (especially for "Gastos Diarios").
  - **Visual Indicators**: Color-coded status for "Vencido" (Expired) vs. "Pagado" (Paid) status.

---

## 3. Development Stack

- **Frontend**: **Next.js** (App Router) for SEO and server-side rendering of financial summaries.
- **State & Data**: **TanStack Query** for asynchronous financial data fetching and **TanStack Table** for managing complex grids (e.g., "Cronograma de Vencimientos").
- **Styling**: **CSS Modules** for scoped, maintainable styling following the Stitch design system.
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

- **Task Management**: All tasks for this Epic will be tracked in **Linear.app** under the "Monthly Calculator" Teams.
  - _Linear Workflow_: Backlog -> In Progress -> In Review (Cypress/Jest Check) -> Done.
- **Deployment**: **Vercel** with CI/CD integration.
  - _Pipeline_: Automated Jest/Cypress runs on every PR before merging to production.

---

## 6. Initial Tasks (Linear Backlog)

1.  **[Dev]** Set up Supabase schema for `Transactions` and `Installments`.
2.  **[Design]** Create "Calculator" dashboard wireframes in Stitch.
3.  **[Logic]** Implement `calculateImpuestoSellos()` utility function (1.49%).
4.  **[Test]** Write Jest unit tests for the "Mayo" sheet's interest projection logic.
