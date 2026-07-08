import { BasePage } from './base.page';

export class PartnersListPage extends BasePage {
  readonly searchInput = this.page.locator('#search-partners');
  readonly addPartnerButton = this.page.getByRole('button', { name: /Нов партньор|New Partner/i });

  async goto() {
    await this.page.goto('/partners');
  }

  async searchFor(name: string) {
    await this.searchInput.fill(name);
    // Search is debounced client-side. Deliberately no explicit wait here -
    // `waitForLoadState('networkidle')` was tried but proved unreliable on
    // this app (confirmed live: it can hang well past the debounce, likely
    // due to persistent background network activity elsewhere on the page).
    // Callers already use Playwright's own auto-retrying locator actions/
    // assertions (`.click()`, `toHaveCount()`), which tolerate the debounce
    // delay without needing a manual wait here.
  }

  rowByName(name: string) {
    return this.page.locator('tr', { hasText: name }).first();
  }

  async openPartner(name: string) {
    await this.searchFor(name);
    await this.rowByName(name).click();
    await this.page.waitForURL(/\/partners\/details\/pId:/);
  }

  async openCreateForm() {
    await this.addPartnerButton.click();
  }
}
