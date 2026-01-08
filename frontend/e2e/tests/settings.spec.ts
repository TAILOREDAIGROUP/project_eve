import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should load settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByText('Settings', { exact: true })).toBeVisible();
  });

  test('should display engagement options', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByText('Sounding Board')).toBeVisible();
    await expect(page.getByText('Co-Worker')).toBeVisible();
    await expect(page.getByText('Personal Assistant')).toBeVisible();
  });

  test('should be able to update engagement level', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    // Select Sounding Board (Level 1)
    await page.getByText('Sounding Board').click();
    
    // Check for success message
    await expect(page.getByText('Settings saved!')).toBeVisible();
    await expect(page.getByText(/Eve will now behave as your Sounding Board/i)).toBeVisible();
    
    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('.border-purple-500').getByText('Sounding Board')).toBeVisible();
  });

  test('should link to memory management', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.getByRole('link', { name: /Manage Memories/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/intelligence/);
  });
});
