import { type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput = this.page.locator('input[autocomplete="email"]');
  readonly passwordInput = this.page.locator('input[autocomplete="current-password"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly requiredFieldErrors = this.page.locator('.ant-form-item-explain-error');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
