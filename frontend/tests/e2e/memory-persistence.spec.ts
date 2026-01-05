import { test, expect } from '@playwright/test';

test('memory persistence should work across page reloads (server-side persistence)', async ({ page }) => {
  const uniqueTenantId = 'test-tenant-reload-' + Date.now();
  
  // Intercept API calls to inject the tenant_id
  await page.route('**/api/chat', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    if (postData) {
      postData.tenant_id = uniqueTenantId;
      await route.continue({ postData: JSON.stringify(postData) });
    } else {
      await route.continue();
    }
  });

  await page.goto('/dashboard');

  // Step 1: Tell Eve a fact
  const textbox = page.getByRole('textbox', { name: 'Ask a question about your' });
  await textbox.fill('My favorite color is orange.');
  await textbox.press('Enter');

  // Wait for the response to finish
  const response1 = await page.waitForResponse(res => res.url().includes('/api/chat') && res.status() === 200);
  await response1.finished();
  
  // Give it some time for server-side processing
  await page.waitForTimeout(10000);
  
  // RELOAD THE PAGE - this clears client-side state
  await page.reload();
  
  // Step 2: Ask Eve about the fact
  const textboxReloaded = page.getByRole('textbox', { name: 'Ask a question about your' });
  await textboxReloaded.fill('What is my favorite color?');
  await textboxReloaded.press('Enter');

  // Expect the response to contain "orange"
  // If server-side persistence is working, Eve should know this from the database
  await expect(page.locator('div').filter({ hasText: /orange/i }).last()).toBeVisible({ timeout: 20000 });
});
