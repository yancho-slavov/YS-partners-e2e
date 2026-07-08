import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { PartnersListPage } from '../../pages/partners-list.page';
import { PartnerFormPage } from '../../pages/partner-form.page';
import { PartnerDetailPage } from '../../pages/partner-detail.page';
import { makePartner, type Partner } from '../../test-data/partner-factory';

interface Fixtures {
  loginPage: LoginPage;
  partnersListPage: PartnersListPage;
  partnerFormPage: PartnerFormPage;
  partnerDetailPage: PartnerDetailPage;
  partnerData: Partner;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  partnersListPage: async ({ page }, use) => {
    await use(new PartnersListPage(page));
  },
  partnerFormPage: async ({ page }, use) => {
    await use(new PartnerFormPage(page));
  },
  partnerDetailPage: async ({ page }, use) => {
    await use(new PartnerDetailPage(page));
  },
  // Fresh, unique data per test invocation - no cross-test collisions.
  partnerData: async ({}, use) => {
    await use(makePartner());
  },
});

export { expect } from '@playwright/test';
