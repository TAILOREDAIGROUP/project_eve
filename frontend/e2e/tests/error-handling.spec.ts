import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  test('should handle API timeout gracefully', async ({ page }) => {
    // Mock a slow/timeout response
    await page.route('**/api/chat', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000)); // Exceed timeout
      route.abort('timedout');
    });
    
    await page.goto('/dashboard');
    // Skip onboarding
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
    await page.reload();
    
    await page.getByPlaceholder('Ask Eve anything').fill('Hello');
    await page.locator('button:has(svg.lucide-send)').click();
    
    // Verify error state is shown to user
    await expect(page.getByText(/error|try again|something went wrong/i)).toBeVisible({ timeout: 40000 });
  });

  test('should handle invalid tenant ID', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
      // Override tenant ID with invalid one
      window.localStorage.setItem('tenant_id', 'invalid-tenant-id');
    });
    
    await page.goto('/dashboard');
    // Verify app handles this gracefully (doesn't crash, shows appropriate message)
    await expect(page.locator('body')).not.toContainText('undefined');
    await expect(page.locator('body')).not.toContainText('null');
  });

  test('should handle network disconnection', async ({ page, context }) => {
    await page.goto('/dashboard');
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
    await page.reload();
    
    // Go offline
    await context.setOffline(true);
    
    await page.getByPlaceholder('Ask Eve anything').fill('Hello');
    await page.locator('button:has(svg.lucide-send)').click();
    
    // Verify offline state is communicated
    await expect(page.getByText(/offline|network|connection/i)).toBeVisible({ timeout: 10000 });
    
    // Go back online
    await context.setOffline(false);
  });
});
