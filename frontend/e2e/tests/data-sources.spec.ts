import { test, expect } from '@playwright/test';

test.describe('Data Sources', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should load data sources page', async ({ page }) => {
    await page.goto('/dashboard/data-sources');
    await expect(page).toHaveURL(/\/dashboard\/data-sources/);
    await expect(page.getByText('Data Sources', { exact: true })).toBeVisible();
    await expect(page.getByText('Manage your documents')).toBeVisible();
  });

  test('should display upload section and knowledge base', async ({ page }) => {
    await page.goto('/dashboard/data-sources');
    await expect(page.getByText(/Upload Files/i)).toBeVisible();
    await expect(page.getByText(/Knowledge Base/i)).toBeVisible();
  });

  test('should display knowledge graph', async ({ page }) => {
    await page.goto('/dashboard/data-sources');
    // The graph might take a bit to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
  });
});
