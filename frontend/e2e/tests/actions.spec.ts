import { test, expect } from '@playwright/test';

test.describe('Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should load actions page', async ({ page }) => {
    await page.goto('/dashboard/actions');
    await expect(page).toHaveURL(/\/dashboard\/actions/);
    await expect(page.getByText('Action History')).toBeVisible();
  });

  test('should display action logs', async ({ page }) => {
    await page.goto('/dashboard/actions');
    // The page has demo data if API fails, so we expect some actions to be visible
    // Based on demo data in page.tsx
    await expect(page.getByText(/Send Email/i).first()).toBeVisible();
    await expect(page.getByText(/Create Deal/i).first()).toBeVisible();
  });

  test('should filter actions by status', async ({ page }) => {
    await page.goto('/dashboard/actions');
    
    // Switch to Failed tab
    await page.getByRole('tab', { name: /Failed/i }).click();
    
    // Based on demo data, there is one failed action (create_ticket)
    await expect(page.getByText(/Create Ticket/i)).toBeVisible();
    await expect(page.getByText(/Send Email/i)).not.toBeVisible();
  });

  test('should refresh actions list', async ({ page }) => {
    await page.goto('/dashboard/actions');
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    // After refresh it should still show actions
    await expect(page.getByText(/Action History/i)).toBeVisible();
  });
});
