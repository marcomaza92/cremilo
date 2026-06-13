import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const HAS_AUTH = Boolean(TEST_EMAIL && TEST_PASSWORD);

/**
 * Log in and land on /dashboard. Reused by every test that needs auth.
 */
async function loginAndGoToDashboard(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

/**
 * Scope all DataTable interactions to a named section to avoid
 * ambiguity when multiple tables are on the page.
 */
function getSection(page: Page, title: 'INGRESOS' | 'GASTOS FIJOS') {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: title }),
  });
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

test.describe('DataTable — render', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('renders Ingresos table with expected column headers', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    await expect(section).toBeVisible();
    await expect(section.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(section.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
    await expect(section.getByRole('columnheader', { name: 'Due Date' })).toBeVisible();
    await expect(section.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('renders Gastos Fijos table with expected column headers', async ({ page }) => {
    const section = getSection(page, 'GASTOS FIJOS');
    await expect(section).toBeVisible();
    await expect(section.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  });

  test('shows "No items yet." empty state when there are no rows', async ({ page }) => {
    // The table may have existing rows; skip if not empty.
    const section = getSection(page, 'INGRESOS');
    const emptyCell = section.getByText('No items yet.');
    const rowCount = await section.getByRole('row').count();
    // rowCount includes the header row; >1 means data rows exist
    if (rowCount > 1) {
      test.skip(true, 'Table has existing rows — empty-state test skipped');
    }
    await expect(emptyCell).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Collapse / expand
// ---------------------------------------------------------------------------

test.describe('DataTable — collapse / expand', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('collapses Ingresos table when the header button is clicked', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    // The collapse button wraps the h2 title
    const collapseBtn = section.locator('button[aria-expanded]').first();

    // Initially expanded
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'true');

    await collapseBtn.click();

    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'false');
    // The content div becomes hidden
    const contentId = await collapseBtn.getAttribute('aria-controls');
    if (contentId) {
      await expect(page.locator(`#${contentId}`)).toBeHidden();
    }
  });

  test('expands Ingresos table after collapsing', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const collapseBtn = section.locator('button[aria-expanded]').first();

    // Collapse first
    await collapseBtn.click();
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'false');

    // Re-expand
    await collapseBtn.click();
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'true');

    const contentId = await collapseBtn.getAttribute('aria-controls');
    if (contentId) {
      await expect(page.locator(`#${contentId}`)).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Kebab menu
// ---------------------------------------------------------------------------

test.describe('DataTable — kebab menu', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('opens kebab menu with Edit and Delete actions when a row exists', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const kebabTrigger = section.getByRole('button', { name: 'Row actions' }).first();

    // Skip if there are no rows to interact with
    const triggerCount = await kebabTrigger.count();
    test.skip(triggerCount === 0, 'No rows in Ingresos — skipping kebab test');

    // Menu is initially closed
    await expect(kebabTrigger).toHaveAttribute('aria-expanded', 'false');

    await kebabTrigger.click();

    await expect(kebabTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menuitem', { name: 'Edit' }).first()).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).first()).toBeVisible();
  });

  test('closes kebab menu when Escape is pressed', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const kebabTrigger = section.getByRole('button', { name: 'Row actions' }).first();

    const triggerCount = await kebabTrigger.count();
    test.skip(triggerCount === 0, 'No rows in Ingresos — skipping kebab test');

    await kebabTrigger.click();
    await expect(kebabTrigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(kebabTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('menu')).not.toBeVisible();
  });

  test('closes kebab menu when clicking outside', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const kebabTrigger = section.getByRole('button', { name: 'Row actions' }).first();

    const triggerCount = await kebabTrigger.count();
    test.skip(triggerCount === 0, 'No rows in Ingresos — skipping kebab test');

    await kebabTrigger.click();
    await expect(kebabTrigger).toHaveAttribute('aria-expanded', 'true');

    // Click elsewhere on the page
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(kebabTrigger).toHaveAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------------------------------------
// Add item
// ---------------------------------------------------------------------------

test.describe('DataTable — add item', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('opens the Add Item form when "+ ADD ITEM" is clicked', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const addBtn = section.getByRole('button', { name: 'Add item to Ingresos' });
    await expect(addBtn).toBeVisible();

    await addBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'ADD ITEM' })).toBeVisible();
  });

  test('closes the Add Item form when Cancel is clicked', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('closes the Add Item form when Escape is pressed', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    // At least the name and amount error alerts should appear
    const alerts = dialog.getByRole('alert');
    await expect(alerts.first()).toBeVisible();
  });

  test('adds a new item and it appears in the table', async ({ page }) => {
    const uid = String(Date.now()).slice(-6);
    const itemName = `QA Add ${uid}`;
    const section = getSection(page, 'INGRESOS');
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(itemName);
    await dialog.getByLabel(/Real value/).fill('500');
    await dialog.getByLabel('Due Date').fill('2026-12-31');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(section.getByText(itemName)).toBeVisible();

    // --- Cleanup: delete the item we just created ---
    const row = section.getByRole('row').filter({ hasText: itemName });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(section.getByText(itemName)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edit item
// ---------------------------------------------------------------------------

test.describe('DataTable — edit item', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('opens Edit Item form pre-filled via kebab > Edit', async ({ page }) => {
    const uid = String(Date.now()).slice(-6);
    const itemName = `QA EditTarget ${uid}`;
    const section = getSection(page, 'INGRESOS');

    // Add a temporary item first
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(itemName);
    await dialog.getByLabel(/Real value/).fill('100');
    await dialog.getByLabel('Due Date').fill('2026-11-01');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Open via kebab — unique name ensures exactly one match
    const row = section.getByRole('row').filter({ hasText: itemName });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: 'EDIT ITEM' })).toBeVisible();
    await expect(editDialog.getByLabel('Name')).toHaveValue(itemName);

    // Close without saving
    await editDialog.getByRole('button', { name: 'CANCEL', exact: true }).click();

    // --- Cleanup ---
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
  });

  test('saves edited name and reflects it in the table', async ({ page }) => {
    const uid = String(Date.now()).slice(-6);
    const beforeName = `QA BeforeEdit ${uid}`;
    const afterName = `QA AfterEdit ${uid}`;
    const section = getSection(page, 'INGRESOS');

    // Add a temporary item — unique name ensures exactly one match
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(beforeName);
    await dialog.getByLabel(/Real value/).fill('200');
    await dialog.getByLabel('Due Date').fill('2026-10-01');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Edit it
    const row = section.getByRole('row').filter({ hasText: beforeName });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Name').fill(afterName);
    await editDialog.getByRole('button', { name: 'SAVE CHANGES' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(section.getByText(afterName)).toBeVisible();
    await expect(section.getByText(beforeName)).not.toBeVisible();

    // --- Cleanup ---
    const editedRow = section.getByRole('row').filter({ hasText: afterName });
    await editedRow.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
  });
});

// ---------------------------------------------------------------------------
// Delete item
// ---------------------------------------------------------------------------

test.describe('DataTable — delete item', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('removes a row from the table when Delete is selected from kebab', async ({ page }) => {
    const uid = String(Date.now()).slice(-6);
    const itemName = `QA Delete ${uid}`;
    const section = getSection(page, 'INGRESOS');

    // Add an item to delete — unique name ensures exactly one match
    await section.getByRole('button', { name: 'Add item to Ingresos' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(itemName);
    await dialog.getByLabel(/Real value/).fill('50');
    await dialog.getByLabel('Due Date').fill('2026-09-15');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Confirm item is in the table
    await expect(section.getByText(itemName)).toBeVisible();

    // Delete it
    const row = section.getByRole('row').filter({ hasText: itemName });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    // Row should be gone
    await expect(section.getByText(itemName)).not.toBeVisible();
  });
});
