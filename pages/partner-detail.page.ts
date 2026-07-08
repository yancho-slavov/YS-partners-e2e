import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import type { Partner } from '../test-data/partner-factory';

export class PartnerDetailPage extends BasePage {
  readonly nameValue = this.page.locator('#partner-name-value');
  readonly typeValue = this.page.locator('#service-value');
  readonly phoneValue = this.page.locator('#phone-number-value');
  readonly contactPersonValue = this.page.locator('#user-name-value');
  readonly addressValue = this.page.locator('#address-value');
  readonly locationValue = this.page.locator('#location-value');
  readonly descriptionValue = this.page.locator('#description-value');
  readonly actionsMenuTrigger = this.page.locator('#action-button');
  readonly editMenuItem = this.page.locator('#edit-button');
  readonly deleteMenuItem = this.page.locator('#delete-button');

  async reload() {
    await this.page.reload();
    await expect(this.nameValue).toBeVisible();
  }

  /** Independently re-reads persisted values from the DOM - not trusting any
   * prior success toast/optimistic UI state. */
  async expectMatches(partner: Pick<Partner, 'name' | 'address' | 'contactPerson' | 'description'>, expectedPhone: string) {
    await expect(this.nameValue).toHaveText(partner.name);
    await expect(this.addressValue).toHaveText(partner.address);
    await expect(this.phoneValue).toHaveText(expectedPhone);
    await expect(this.contactPersonValue).toHaveText(partner.contactPerson);
    await expect(this.descriptionValue).toHaveText(partner.description);
  }

  async openEdit() {
    await this.actionsMenuTrigger.click();
    await this.editMenuItem.click();
  }

  async openDelete() {
    await this.actionsMenuTrigger.click();
    await this.deleteMenuItem.click();
  }
}
