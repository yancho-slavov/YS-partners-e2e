import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { env } from '../../utils/env';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(env.qaEmail, env.qaPassword);
  await page.waitForURL(/\/requests/);
  await expect(page).toHaveURL(/\/requests/);
  await page.context().storageState({ path: authFile });
});
