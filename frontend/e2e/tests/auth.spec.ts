import { test, expect } from '@playwright/test';

test.describe('Authentication & Access', () => {
  test('should redirect from root to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should be able to access the admin prompts page', async ({ page }) => {
    await page.goto('/admin/prompts');
    await expect(page.getByText('Prompt Management')).toBeVisible();
  });
});
