import { test, expect } from '@playwright/test';

test.describe('Learning', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should load learning page', async ({ page }) => {
    await page.goto('/dashboard/learning');
    await expect(page).toHaveURL(/\/dashboard\/learning/);
    await expect(page.getByText('How Eve Learns Your Business')).toBeVisible();
  });

  test('should display learning statistics', async ({ page }) => {
    await page.goto('/dashboard/learning');
    await expect(page.getByText('Tasks Executed')).toBeVisible();
    await expect(page.getByText('Satisfaction Rate')).toBeVisible();
    await expect(page.getByText('Patterns Learned')).toBeVisible();
  });

  test('should switch between tabs in learning page', async ({ page }) => {
    await page.goto('/dashboard/learning');
    
    // Switch to Glossary tab
    await page.getByRole('tab', { name: /Business Glossary/i }).click();
    await expect(page.getByText('Business Glossary', { exact: true })).toBeVisible();
    
    // Switch to Usage tab
    await page.getByRole('tab', { name: /Usage Analytics/i }).click();
    await expect(page.getByText('Most Used Tasks')).toBeVisible();
  });

  test('should be able to add a glossary term', async ({ page }) => {
    await page.goto('/dashboard/learning');
    await page.getByRole('tab', { name: /Business Glossary/i }).click();
    
    await page.getByRole('button', { name: /Add Term/i }).click();
    
    const term = `TEST-${Date.now()}`;
    const definition = 'Test definition';
    
    await page.getByPlaceholder(/Term/i).fill(term);
    await page.getByPlaceholder(/Definition/i).fill(definition);
    await page.getByRole('button', { name: /Save Term/i }).click();
    
    await expect(page.getByText(term)).toBeVisible();
  });
});
