import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const HAS_AUTH = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function loginAndGoToDashboard(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/dashboard');
}

function getSection(page: Page, title: 'INGRESOS' | 'GASTOS FIJOS') {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: title }),
  });
}

async function openAddForm(page: Page, section: ReturnType<typeof getSection>) {
  const addBtn = section.getByRole('button', { name: /add item/i });
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

// ---------------------------------------------------------------------------
// Currency toggle — ARS / USD
// ---------------------------------------------------------------------------

test.describe('ItemForm — currency toggle', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('defaults to ARS mode with no rate field visible', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    const arsBtn = dialog.getByRole('radio', { name: 'ARS' });
    const usdBtn = dialog.getByRole('radio', { name: 'USD' });

    await expect(arsBtn).toHaveAttribute('aria-checked', 'true');
    await expect(usdBtn).toHaveAttribute('aria-checked', 'false');
    await expect(dialog.getByLabel(/Rate/i)).not.toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('shows rate field when USD is selected', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByRole('radio', { name: 'USD' }).click();

    await expect(dialog.getByRole('radio', { name: 'USD' })).toHaveAttribute('aria-checked', 'true');
    await expect(dialog.getByRole('radio', { name: 'ARS' })).toHaveAttribute('aria-checked', 'false');
    await expect(dialog.getByLabel(/Rate \(ARS\/USD\)/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('hides rate field when switching back from USD to ARS', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    // Switch to USD
    await dialog.getByRole('radio', { name: 'USD' }).click();
    await expect(dialog.getByLabel(/Rate \(ARS\/USD\)/i)).toBeVisible();

    // Switch back to ARS
    await dialog.getByRole('radio', { name: 'ARS' }).click();
    await expect(dialog.getByLabel(/Rate \(ARS\/USD\)/i)).not.toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('label updates to reflect selected currency', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    await expect(dialog.getByLabel(/Real value \(ARS\)/i)).toBeVisible();

    await dialog.getByRole('radio', { name: 'USD' }).click();
    await expect(dialog.getByLabel(/Real value \(USD\)/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe('ItemForm — validation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('shows name and amount errors when submitting empty form', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    // Name error
    await expect(dialog.getByRole('alert').filter({ hasText: /name is required/i })).toBeVisible();
    // Amount error
    await expect(dialog.getByRole('alert').filter({ hasText: /amount must be greater/i })).toBeVisible();
    // Due date error
    await expect(dialog.getByRole('alert').filter({ hasText: /due date is required/i })).toBeVisible();

    // Form stays open
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('shows rate error when submitting USD item without rate', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByRole('radio', { name: 'USD' }).click();
    await dialog.getByLabel('Name').fill('USD Item No Rate');
    await dialog.getByLabel(/Real value \(USD\)/i).fill('100');
    await dialog.getByLabel('Due Date').fill('2026-12-31');
    // Explicitly clear rate in case globalRate pre-fills it
    await dialog.getByLabel(/Rate \(ARS\/USD\)/i).clear();
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    await expect(dialog.getByRole('alert').filter({ hasText: /rate is required/i })).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('clears validation error when field is corrected', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    // Submit empty to trigger errors
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();
    await expect(dialog.getByRole('alert').filter({ hasText: /name is required/i })).toBeVisible();

    // Fill name — error should clear
    await dialog.getByLabel('Name').fill('Fixed name');
    await expect(dialog.getByRole('alert').filter({ hasText: /name is required/i })).not.toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });
});

// ---------------------------------------------------------------------------
// ARS happy path — add item
// ---------------------------------------------------------------------------

test.describe('ItemForm — ARS happy path', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('saves ARS item and it appears in the Ingresos table', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByLabel('Name').fill('QA ARS Happy Path');
    // ARS is the default — no need to switch
    await dialog.getByLabel(/Real value \(ARS\)/i).fill('1500');
    await dialog.getByLabel('Due Date').fill('2026-06-15');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(section.getByText('QA ARS Happy Path')).toBeVisible();

    // Cleanup
    const row = section.getByRole('row').filter({ hasText: 'QA ARS Happy Path' });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(section.getByText('QA ARS Happy Path')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// USD happy path — add item with rate
// ---------------------------------------------------------------------------

test.describe('ItemForm — USD happy path', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('saves USD item with rate and it appears in the Ingresos table', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByLabel('Name').fill('QA USD Happy Path');
    await dialog.getByRole('radio', { name: 'USD' }).click();
    await dialog.getByLabel(/Real value \(USD\)/i).fill('200');
    await dialog.getByLabel(/Rate \(ARS\/USD\)/i).fill('1200');
    await dialog.getByLabel('Due Date').fill('2026-07-01');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(section.getByText('QA USD Happy Path')).toBeVisible();

    // Cleanup
    const row = section.getByRole('row').filter({ hasText: 'QA USD Happy Path' });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(section.getByText('QA USD Happy Path')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Is Paid toggle
// ---------------------------------------------------------------------------

test.describe('ItemForm — is paid toggle', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('toggle defaults to No and switches to Yes when clicked', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    const toggle = dialog.getByRole('switch', { name: /is paid/i });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(toggle).toContainText('No');

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(toggle).toContainText('Yes');

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('toggle reverts to No when clicked twice', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    const toggle = dialog.getByRole('switch', { name: /is paid/i });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(toggle).toContainText('No');

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });
});

// ---------------------------------------------------------------------------
// Payment method select (Tarjetas form)
// ---------------------------------------------------------------------------

test.describe('ItemForm — payment method', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('payment method defaults to Efectivo', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    const select = dialog.getByLabel('Payment Method');
    await expect(select).toHaveValue('Efectivo');

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('can select Crédito as payment method', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    const select = dialog.getByLabel('Payment Method');
    await select.selectOption('Crédito');
    await expect(select).toHaveValue('Crédito');

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('all payment methods are available as options', async ({ page }) => {
    const section = getSection(page, 'INGRESOS');
    const dialog = await openAddForm(page, section);

    const select = dialog.getByLabel('Payment Method');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Efectivo');
    expect(options).toContain('Débito');
    expect(options).toContain('Crédito');
    expect(options).toContain('Transferencia');
    expect(options).toContain('Otro');

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('saves item with Crédito payment method selected', async ({ page }) => {
    const section = getSection(page, 'GASTOS FIJOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByLabel('Name').fill('QA Crédito Item');
    await dialog.getByLabel(/Real value/i).fill('3000');
    await dialog.getByLabel('Due Date').fill('2026-06-30');
    await dialog.getByLabel('Payment Method').selectOption('Crédito');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(section.getByText('QA Crédito Item')).toBeVisible();

    // Cleanup
    const row = section.getByRole('row').filter({ hasText: 'QA Crédito Item' });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(section.getByText('QA Crédito Item')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Gastos Fijos form — same ItemForm used in a different section
// ---------------------------------------------------------------------------

test.describe('ItemForm — Gastos Fijos section', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('opens ADD ITEM dialog from Gastos Fijos section', async ({ page }) => {
    const section = getSection(page, 'GASTOS FIJOS');
    const dialog = await openAddForm(page, section);

    await expect(dialog.getByRole('heading', { name: 'ADD ITEM' })).toBeVisible();
    await expect(dialog.getByRole('radio', { name: 'ARS' })).toBeVisible();
    await expect(dialog.getByRole('radio', { name: 'USD' })).toBeVisible();

    await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  });

  test('saves ARS item in Gastos Fijos and it appears in the table', async ({ page }) => {
    const uid = String(Date.now()).slice(-6);
    const itemName = `QA GF ARS ${uid}`;
    const section = getSection(page, 'GASTOS FIJOS');
    const dialog = await openAddForm(page, section);

    await dialog.getByLabel('Name').fill(itemName);
    await dialog.getByLabel(/Real value \(ARS\)/i).fill('500');
    await dialog.getByLabel('Due Date').fill('2026-08-01');
    await dialog.getByRole('button', { name: 'ADD ITEM' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(section.getByText(itemName)).toBeVisible();

    // Cleanup
    const row = section.getByRole('row').filter({ hasText: itemName });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(section.getByText(itemName)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edit mode — pre-filled form
// ---------------------------------------------------------------------------

test.describe('ItemForm — edit mode', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await loginAndGoToDashboard(page);
  });

  test('edit dialog shows EDIT ITEM heading and is pre-filled', async ({ page }) => {
    const uid = String(Date.now()).slice(-6);
    const itemName = `QA Edit Source ${uid}`;
    const section = getSection(page, 'INGRESOS');

    // Create a temporary item to edit
    const addDialog = await openAddForm(page, section);
    await addDialog.getByLabel('Name').fill(itemName);
    await addDialog.getByLabel(/Real value \(ARS\)/i).fill('750');
    await addDialog.getByLabel('Due Date').fill('2026-09-01');
    await addDialog.getByRole('button', { name: 'ADD ITEM' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Open via kebab > Edit
    const row = section.getByRole('row').filter({ hasText: itemName });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: 'EDIT ITEM' })).toBeVisible();
    await expect(editDialog.getByLabel('Name')).toHaveValue(itemName);

    await editDialog.getByRole('button', { name: 'CANCEL', exact: true }).click();

    // Cleanup
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(section.getByText(itemName)).not.toBeVisible();
  });
});
