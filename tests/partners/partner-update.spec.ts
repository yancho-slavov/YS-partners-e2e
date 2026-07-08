import { test, expect } from '../fixtures/base-fixtures';
import { LOGO_FIXTURE_PATH, PARTNER_TYPE_PATTERN } from '../../test-data/constants';
import { makePartner } from '../../test-data/partner-factory';

test.describe('Partner update lifecycle @smoke', () => {
  test('creates, validates, updates, and re-validates a partner end to end', async ({
    partnersListPage,
    partnerFormPage,
    partnerDetailPage,
    partnerData,
    page,
  }) => {
    await test.step('Create the partner', async () => {
      await partnersListPage.goto();
      await partnersListPage.openCreateForm();
      await partnerFormPage.fillForm(partnerData, LOGO_FIXTURE_PATH);
      await partnerFormPage.save();
      await expect(page).toHaveURL(/\/partners$/);
    });

    const expectedPhone = `+359${partnerData.phoneDigits}`;

    await test.step('Independently validate the created partner', async () => {
      await partnersListPage.openPartner(partnerData.name);
      await partnerDetailPage.reload();
      await partnerDetailPage.expectMatches(partnerData, expectedPhone);
      await expect(partnerDetailPage.typeValue).toHaveText(PARTNER_TYPE_PATTERN);
    });

    // A second, clearly distinct factory call for the updated values - keeps
    // create-data and update-data unambiguous rather than mutating in place.
    const updatedValues = makePartner();

    await test.step('Update the partner (name + description only)', async () => {
      await partnerDetailPage.openEdit();
      await partnerFormPage.updateNameAndDescription(updatedValues.name, updatedValues.description);
    });

    await test.step('Independently re-validate: changed fields updated, untouched fields intact', async () => {
      await partnerDetailPage.reload();
      await expect(partnerDetailPage.nameValue).toHaveText(updatedValues.name);
      await expect(partnerDetailPage.descriptionValue).toHaveText(updatedValues.description);
      // Fields not touched by the edit must still hold their original values.
      await expect(partnerDetailPage.addressValue).toHaveText(partnerData.address);
      await expect(partnerDetailPage.phoneValue).toHaveText(expectedPhone);
      await expect(partnerDetailPage.contactPersonValue).toHaveText(partnerData.contactPerson);
    });
  });
});
