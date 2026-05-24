import { test, expect } from '@playwright/test';

// Test credentials from env — fall back to a safe placeholder that will
// never match a real account (used for error-path tests only).
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@cremilo.dev';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'TestPass123!';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form with email, password, and submit button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('shows link to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: 'Create one' });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL('/register');
  });

  test('shows error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Log in' }).click();
    // Server redirects back to /login?error=...
    await expect(page).toHaveURL(/\/login/);
    // Exclude the Next.js route announcer which also carries role="alert"
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Email and password are required.');
  });

  test('shows error when only email is provided', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login/);
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Email and password are required.');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@cremilo.invalid');
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login/);
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    // Supabase returns an error message; we just assert the alert is shown.
    await expect(alert).not.toBeEmpty();
  });
});

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renders register form with email, password, and submit button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows link back to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: 'Log in' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL('/login');
  });

  test('shows error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/register/);
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Email and password are required.');
  });

  test('shows error when only email is provided', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/register/);
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Email and password are required.');
  });
});

test.describe('Login happy path + logout', () => {
  test('logs in with valid credentials and logs out', async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping live auth test',
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should land on /dashboard after successful login
    await expect(page).toHaveURL('/dashboard');

    // Log out
    await page.getByRole('button', { name: 'Log out' }).click();

    // Should redirect back to /login
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Unauthenticated route guard', () => {
  test('redirects /dashboard to /login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
