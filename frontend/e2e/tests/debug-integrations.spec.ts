import { test } from '@playwright/test';

test('screenshot integrations page', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('eve-onboarding-complete', 'true');
  });
  await page.goto('/dashboard/integrations', { timeout: 60000 });
  await page.waitForTimeout(3000); // Let it fully render
  await page.screenshot({ path: 'integrations-page.png', fullPage: true });
  console.log('Screenshot saved to integrations-page.png');
});
