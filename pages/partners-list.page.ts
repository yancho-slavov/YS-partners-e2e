import { BasePage } from './base.page';

export class PartnersListPage extends BasePage {
  readonly searchInput = this.page.locator('#search-partners');
  readonly addPartnerButton = this.page.getByRole('button', { name: /Нов партньор|New Partner/i });

  async goto() {
    await this.page.goto('/partners');
  }

  async searchFor(name: string) {
    await this.searchInput.fill(name);
    // Debounced search - wait for the table to settle rather than a fixed sleep.
    await this.page.waitForLoadState('networkidle');
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
