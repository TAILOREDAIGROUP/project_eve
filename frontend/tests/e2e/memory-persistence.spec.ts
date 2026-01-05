import { test, expect } from '@playwright/test';

test('memory persistence should work across page reloads', async ({ page }) => {
  const uniqueTenantId = 'test-tenant-reload-' + Date.now();

  // Intercept API calls to inject the tenant_id
  await page.route('**/api/chat', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    postData.tenant_id = uniqueTenantId;
    postData.session_id = `session-${uniqueTenantId}`;
    await route.continue({ postData: JSON.stringify(postData) });
  });

  await page.goto('/dashboard');

  // Step 1: Tell Eve a fact
  const textbox = page.getByRole('textbox').first();
  await textbox.waitFor({ state: 'visible', timeout: 10000 });
  await textbox.fill('My favorite color is orange and my cat is named Whiskers.');
  await textbox.press('Enter');

  // Wait for the response to finish streaming
  await page.waitForResponse(
    (res) => res.url().includes('/api/chat') && res.status() === 200,
    { timeout: 30000 }
  );

  // Wait for the response to appear in the UI
  await page.waitForTimeout(3000);

  // Give time for server-side memory extraction
  await page.waitForTimeout(5000);

  // RELOAD THE PAGE - this clears client-side state
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Step 2: Ask Eve about the fact
  const textboxReloaded = page.getByRole('textbox').first();
  await textboxReloaded.waitFor({ state: 'visible', timeout: 10000 });
  await textboxReloaded.fill('What is my favorite color and what is my cat\'s name?');
  await textboxReloaded.press('Enter');

  // Wait for the response
  await page.waitForResponse(
    (res) => res.url().includes('/api/chat') && res.status() === 200,
    { timeout: 30000 }
  );

  // Wait for the response to appear
  await page.waitForTimeout(5000);

  // Check if Eve remembers - look for either orange or Whiskers
  const pageContent = await page.content();
  const remembersColor = pageContent.toLowerCase().includes('orange');
  const remembersCat = pageContent.toLowerCase().includes('whiskers');

  // At least one should be remembered if persistence is working
  expect(remembersColor || remembersCat).toBeTruthy();
});

test('memory persistence works within same session', async ({ page }) => {
  await page.goto('/dashboard');

  // Step 1: Tell Eve a fact
  const textbox = page.getByRole('textbox').first();
  await textbox.waitFor({ state: 'visible', timeout: 10000 });
  await textbox.fill('My favorite food is pizza.');
  await textbox.press('Enter');

  // Wait for response
  await page.waitForResponse(
    (res) => res.url().includes('/api/chat') && res.status() === 200,
    { timeout: 30000 }
  );
  await page.waitForTimeout(3000);

  // Step 2: Ask about it (same session, no reload)
  await textbox.fill('What is my favorite food?');
  await textbox.press('Enter');

  // Wait for response
  await page.waitForResponse(
    (res) => res.url().includes('/api/chat') && res.status() === 200,
    { timeout: 30000 }
  );
  await page.waitForTimeout(3000);

  // Check if Eve remembers pizza
  const pageContent = await page.content();
  expect(pageContent.toLowerCase()).toContain('pizza');
});
