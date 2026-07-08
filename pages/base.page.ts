import { type Page, type Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  get sidebar() {
    return {
      partners: this.page.locator('#partners-menu-item').locator('..'),
      requests: this.page.locator('#requests-menu-item').locator('..'),
      dashboard: this.page.locator('#dashboard-menu-item').locator('..'),
    };
  }

  async gotoPartners() {
    await this.sidebar.partners.click();
    await this.page.waitForURL(/\/partners/);
  }

  get errorToast(): Locator {
    return this.page.locator('.ant-message, .ant-notification').first();
  }

  async expectErrorToast(expectedTextPattern?: RegExp) {
    await expect(this.errorToast).toBeVisible();
    if (expectedTextPattern) {
      await expect(this.errorToast).toHaveText(expectedTextPattern);
    }
  }

  /**
   * AntD Select fields render a hidden ARIA-only listbox (raw enum values)
   * plus the real, clickable list as plain divs with a `label` attribute.
   * Always scope to `:visible` since AntD keeps previously-opened popups
   * mounted (hidden) in the DOM.
   */
  async selectAntOption(fieldLocator: Locator, labelPattern: RegExp) {
    await fieldLocator.click();
    await this.page.locator('.ant-select-item-option:visible').filter({ hasText: labelPattern }).first().click();
  }

  /** Scopes to the currently-open modal, since AntD can leave closed modals mounted. */
  get activeModal(): Locator {
    return this.page.locator('.ant-modal-content').last();
  }
}
