import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';

type MyFixtures = {
  authenticatedPage: DashboardPage;
};

export const test = base.extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.completeOnboardingViaStorage();
    await dashboardPage.goto();
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
