import { type Page, type Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  get sidebar() {
    return {
      partners: this.page.locator('#partners-menu-item').locator('..'),
      requests: this.page.locator('#requests-menu-item').locator('..'),
      dashboard: this.page.locator('#dashboard-menu-item').locator('..'),
      logout: this.page.locator('#logout-menu-item').locator('..'),
    };
  }

  async gotoPartners() {
    await this.sidebar.partners.click();
    await this.page.waitForURL(/\/partners/);
  }

  async logout() {
    await this.sidebar.logout.click();
    await this.page.waitForURL(/\/login/);
  }

  get errorToast(): Locator {
    // Scope to the actual notice/message card, not the outer placement
    // wrapper (`.ant-notification`/`.ant-message`) - that wrapper persists
    // in the DOM even after the notice auto-dismisses, which previously
    // caused a false-empty match once the toast had already faded.
    return this.page.locator('.ant-notification-notice, .ant-message-notice').first();
  }

  async expectErrorToast(expectedTextPattern?: RegExp) {
    await expect(this.errorToast).toBeVisible();
    if (expectedTextPattern) {
      await expect(this.errorToast).toHaveText(expectedTextPattern);
    }
  }

  /** The most-recently-opened AntD select popup - AntD appends a new
   * `.ant-select-dropdown` after previous ones rather than replacing them,
   * so scoping by DOM order (not just `:visible`) avoids racing against a
   * still-fading-out popup from a field closed moments earlier. */
  get activeSelectDropdown(): Locator {
    return this.page.locator('.ant-select-dropdown').last();
  }

  /**
   * AntD Select fields render a hidden ARIA-only listbox (raw enum values)
   * plus the real, clickable list as plain divs with a `label` attribute.
   */
  async selectAntOption(fieldLocator: Locator, labelPattern: RegExp) {
    await fieldLocator.click();
    await this.activeSelectDropdown.locator('.ant-select-item-option').filter({ hasText: labelPattern }).first().click();
  }

  /** Scopes to the currently-open modal, since AntD can leave closed modals mounted. */
  get activeModal(): Locator {
    return this.page.locator('.ant-modal-content').last();
  }
}
