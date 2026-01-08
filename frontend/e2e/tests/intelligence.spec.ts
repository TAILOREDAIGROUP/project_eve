import { test, expect } from '@playwright/test';

test.describe('Intelligence / AI Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should load intelligence page', async ({ page }) => {
    await page.goto('/dashboard/intelligence');
    await expect(page).toHaveURL(/\/dashboard\/intelligence/);
    await expect(page.getByText('Your AI Assistant')).toBeVisible();
    await expect(page.getByText('See what Eve knows')).toBeVisible();
  });

  test('should display AI profile information', async ({ page }) => {
    await page.goto('/dashboard/intelligence');
    // Check for the tabs
    await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /What Eve Knows/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Your Goals/i })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/dashboard/intelligence');
    
    // Switch to Memory tab
    await page.getByRole('tab', { name: /What Eve Knows/i }).click();
    await expect(page.getByText('What Eve Remembers About You')).toBeVisible();
    
    // Switch to Goals tab
    await page.getByRole('tab', { name: /Your Goals/i }).click();
    await expect(page.getByPlaceholder('What do you want to achieve?')).toBeVisible();
  });

  test('should be able to add a new goal', async ({ page }) => {
    await page.goto('/dashboard/intelligence');
    await page.getByRole('tab', { name: /Your Goals/i }).click();
    
    const goalTitle = `Test Goal ${Date.now()}`;
    await page.getByPlaceholder('What do you want to achieve?').fill(goalTitle);
    await page.getByRole('button', { name: /Add Goal/i }).click();
    
    await expect(page.getByText(goalTitle)).toBeVisible();
  });
});
