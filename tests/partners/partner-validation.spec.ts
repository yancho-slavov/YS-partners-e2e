import { test, expect } from '../fixtures/base-fixtures';
import { LOGO_FIXTURE_PATH } from '../../test-data/constants';
import type { RequiredField } from '../../pages/partner-form.page';

// Every required field discovered during live inspection (docs/inspection-notes.md)
// gets its own case: fill everything else correctly, omit just this one field,
// and confirm the form refuses to submit.
const REQUIRED_FIELDS: RequiredField[] = [
  'name',
  'type',
  'services',
  'subscriptionTier',
  'address',
  'phone',
  'contactPerson',
  'description',
  'logo',
];

test.describe('Partner form required-field validation @negative', () => {
  for (const field of REQUIRED_FIELDS) {
    test(`requires ${field}`, async ({ partnersListPage, partnerFormPage, partnerData }) => {
      await test.step(`Fill every required field except ${field}, then submit`, async () => {
        await partnersListPage.goto();
        await partnersListPage.openCreateForm();
        await partnerFormPage.fillFormOmitting(partnerData, LOGO_FIXTURE_PATH, field);
        await partnerFormPage.save();
      });

      await test.step('Confirm an inline validation error and that the form did not submit', async () => {
        await expect(partnerFormPage.validationErrors.first()).toBeVisible();
        // The create form is a modal over /partners, not a routed page - a
        // successful save closes it, so it staying open is the real
        // "submission was blocked" signal (the URL never changes either way).
        await expect(partnerFormPage.activeModal).toBeVisible();
      });

      await test.step('Close the form and confirm no partner was actually created', async () => {
        await partnerFormPage.cancel();
        await partnersListPage.searchFor(partnerData.name);
        await expect(partnersListPage.rowByName(partnerData.name)).toHaveCount(0);
      });
    });
  }
});
