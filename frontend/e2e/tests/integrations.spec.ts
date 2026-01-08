import { test, expect } from '@playwright/test';

test.describe('Integrations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should load integrations page', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    await expect(page).toHaveURL(/\/dashboard\/integrations/);
    await expect(page.getByText('Connect Your Tools')).toBeVisible();
  });

  test('should display available integrations', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    // Check for some common providers that should be listed
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('Slack')).toBeVisible();
    await expect(page.getByText('HubSpot')).toBeVisible();
  });

  test('should be able to initiate connection', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    
    // We expect "Connect" buttons for unconnected providers
    const connectButtons = page.getByRole('button', { name: 'Connect' });
    await expect(connectButtons.first()).toBeVisible();
    
    // Click connect on the first one
    // Note: We might want to mock the API response if we don't want to actually trigger Nango/OAuth
    await page.route('**/api/integrations/connect', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // If getNango() returns null, it calls simulatedConnect
    // Let's try to click one
    await connectButtons.first().click();
    
    // Check if it shows "Connecting" state if it takes time, or just verify success
    // In our mock it should be fast
  });
});
