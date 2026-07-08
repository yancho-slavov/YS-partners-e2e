import { test, expect } from '../fixtures/base-fixtures';
import { LOGO_FIXTURE_PATH, PARTNER_TYPE_PATTERN } from '../../test-data/constants';

test.describe('Partner creation @smoke', () => {
  test('creates a partner and independently re-validates the persisted data', async ({
    partnersListPage,
    partnerFormPage,
    partnerDetailPage,
    partnerData,
    page,
  }) => {
    await test.step('Navigate to Partners and open the create form', async () => {
      await partnersListPage.goto();
      await partnersListPage.openCreateForm();
    });

    await test.step('Fill and submit the form', async () => {
      await partnerFormPage.fillForm(partnerData, LOGO_FIXTURE_PATH);
      await partnerFormPage.save();
      await expect(page).toHaveURL(/\/partners$/);
    });

    await test.step('Re-navigate and independently re-read persisted values', async () => {
      await partnersListPage.openPartner(partnerData.name);
      await partnerDetailPage.reload();
      const expectedPhone = `+359${partnerData.phoneDigits}`;
      await partnerDetailPage.expectMatches(partnerData, expectedPhone);
      await expect(partnerDetailPage.typeValue).toHaveText(PARTNER_TYPE_PATTERN);
    });
  });
});
