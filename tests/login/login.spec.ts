import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { env } from '../../utils/env';

// Login itself must stay under test even though every other spec reuses a
// logged-in storageState via the `setup` project — start each test here
// with a clean, unauthenticated context.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login @smoke', () => {
  test('logs in with valid credentials and reaches the authenticated area', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Navigate to login and submit valid credentials', async () => {
      await loginPage.goto();
      await loginPage.login(env.qaEmail, env.qaPassword);
    });

    await test.step('Confirm redirect to the authenticated landing page', async () => {
      await page.waitForURL(/\/requests/);
      await expect(page).toHaveURL(/\/requests/);
    });
  });

  test('shows an error and stays on the login page for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Navigate to login and submit an invalid password', async () => {
      await loginPage.goto();
      await loginPage.login(env.qaEmail, 'definitely-wrong-password');
    });

    await test.step('Confirm the failure notification and that navigation did not proceed', async () => {
      await loginPage.expectErrorToast(/Невалиден|Invalid/i);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test('shows required-field validation when submitting with empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Navigate to login and submit without filling anything', async () => {
      await loginPage.goto();
      await loginPage.submitButton.click();
    });

    await test.step('Confirm inline required-field errors on both inputs and no navigation', async () => {
      // Text is language-dependent on this app (observed both Bulgarian and
      // English UI on the same account) so assert on the AntD error markers
      // presence/count rather than a hardcoded message string.
      await expect(loginPage.requiredFieldErrors).toHaveCount(2);
      await expect(loginPage.emailInput).toHaveClass(/ant-input-status-error/);
      await expect(loginPage.passwordInput).toHaveClass(/ant-input-status-error/);
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
