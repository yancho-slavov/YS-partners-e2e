import { type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { PARTNER_TYPE_PATTERN } from '../test-data/constants';
import type { Partner } from '../test-data/partner-factory';

const SAVE_BUTTON_PATTERN = /Запази|Save/i;
// Text-based matching was tried first (the visible "Моля, ..." prefix) but
// proved unreliable: this app's rendered UI language flips between
// Bulgarian and English unpredictably, sometimes within seconds on the same
// account (confirmed live - see docs/inspection-notes.md), and the actual
// English wording for these specific messages could not be captured at all
// in one such run. There's no data-testid/ARIA role on these error nodes
// either. The one thing that stayed consistent across repeated runs in
// both languages is the error element's CSS class - a build-hash class
// name, which is a real tradeoff (could change on redeploy) but is more
// reliable here than text that silently changes language mid-session.
const VALIDATION_ERROR_SELECTOR = '.svY0B';

export type RequiredField =
  | 'name'
  | 'type'
  | 'services'
  | 'subscriptionTier'
  | 'address'
  | 'phone'
  | 'contactPerson'
  | 'description'
  | 'logo';

export class PartnerFormPage extends BasePage {
  readonly nameField = this.page.locator('#name-field');
  readonly typeField = this.page.locator('#partner-type-field');
  readonly serviceTypesField = this.page.locator('#service-types-field');
  readonly subscriptionTierField = this.page.locator('#subscription-tier-field');
  readonly addressField = this.page.locator('#address-field');
  readonly phoneField = this.page.locator('#phone-field');
  readonly contactPersonField = this.page.locator('#contact-person-field');
  readonly descriptionField = this.page.locator('#description-field');
  readonly logoInput = this.page.locator('input[type="file"]');
  readonly validationErrors = this.page.locator(VALIDATION_ERROR_SELECTOR);

  private get saveButton(): Locator {
    return this.activeModal.locator('button:visible').filter({ hasText: SAVE_BUTTON_PATTERN }).last();
  }

  /** Selects the first real (visible) option of an AntD Select field - used
   * where the assignment doesn't mandate a specific value (Services, Plan). */
  private async selectFirstOption(field: Locator) {
    await field.click();
    await this.activeSelectDropdown.locator('.ant-select-item-option').first().click();
  }

  private async fillAddress(address: string) {
    await this.addressField.click();
    await this.addressField.fill(address);
    const suggestion = this.page.locator('.pac-item, [class*="autocomplete"] li, [class*="suggestion"]').first();
    await expect(suggestion).toBeVisible();
    await suggestion.click();
  }

  private async uploadLogo(filePath: string) {
    const modalCountBefore = await this.page.locator('.ant-modal-content').count();
    await this.logoInput.setInputFiles(filePath);
    // Uploading opens a nested "edit photo" crop modal with its own Save button.
    await expect(this.page.locator('.ant-modal-content')).toHaveCount(modalCountBefore + 1);
    await this.page.waitForTimeout(1000); // let the crop canvas finish processing before confirming
    await this.activeModal.locator('button:visible').filter({ hasText: SAVE_BUTTON_PATTERN }).last().click();
    await expect(this.page.locator('.ant-modal-content')).toHaveCount(modalCountBefore);
  }

  async fillForm(partner: Partner, logoPath: string) {
    await this.nameField.fill(partner.name);
    await this.selectAntOption(this.typeField, PARTNER_TYPE_PATTERN);
    await this.selectFirstOption(this.serviceTypesField);
    await this.page.keyboard.press('Escape');
    await this.selectFirstOption(this.subscriptionTierField);
    await this.fillAddress(partner.address);
    await this.phoneField.fill(partner.phoneDigits);
    await this.contactPersonField.fill(partner.contactPerson);
    await this.descriptionField.fill(partner.description);
    await this.uploadLogo(logoPath);
  }

  async save() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.activeModal.locator('button:visible').filter({ hasText: /Отказ|Cancel/i }).last().click();
  }

  /** Fills every required field except `omit` - used to prove each required
   * field independently triggers validation, one at a time, while the rest
   * of the form is otherwise valid. */
  async fillFormOmitting(partner: Partner, logoPath: string, omit: RequiredField) {
    if (omit !== 'name') await this.nameField.fill(partner.name);
    if (omit !== 'type') await this.selectAntOption(this.typeField, PARTNER_TYPE_PATTERN);
    if (omit !== 'services') {
      await this.selectFirstOption(this.serviceTypesField);
      await this.page.keyboard.press('Escape');
    }
    if (omit !== 'subscriptionTier') await this.selectFirstOption(this.subscriptionTierField);
    if (omit !== 'address') await this.fillAddress(partner.address);
    if (omit !== 'phone') await this.phoneField.fill(partner.phoneDigits);
    if (omit !== 'contactPerson') await this.contactPersonField.fill(partner.contactPerson);
    if (omit !== 'description') await this.descriptionField.fill(partner.description);
    if (omit !== 'logo') await this.uploadLogo(logoPath);
  }

  /**
   * Edit reuses this same modal, pre-filled with existing values (confirmed
   * live - e.g. #phone-field already shows the fully-formatted
   * "+359 88 812 3456", not raw digits). Only touch the fields being
   * changed rather than reusing fillForm(), which assumes empty
   * create-mode fields and would needlessly re-touch the address
   * autocomplete/logo crop-modal for data that's already correct.
   */
  async updateNameAndDescription(name: string, description: string) {
    await this.nameField.fill(name);
    await this.descriptionField.fill(description);
    await this.save();
  }
}
