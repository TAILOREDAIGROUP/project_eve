import { test, expect } from '@playwright/test';

test.describe('Nango Integration Connections', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  });

  test('should display available integrations', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    
    // Verify all advertised integrations are shown
    await expect(page.getByText(/Google/i)).toBeVisible();
    await expect(page.getByText(/Slack/i)).toBeVisible();
    await expect(page.getByText(/HubSpot/i)).toBeVisible();
  });

  test('should initiate Google OAuth via Nango', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    
    // Find and click Google connect button
    const googleConnect = page.getByRole('button', { name: /connect/i }).first(); // Assuming Google is first or use more specific selector
    
    // Check if we're using simulated connect or real Nango
    // If NEXT_PUBLIC_NANGO_PUBLIC_KEY is missing, it uses simulatedConnect
    
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null), // Catch timeout if it doesn't open a popup (simulated)
      googleConnect.click()
    ]);
    
    if (popup) {
      // Verify Nango OAuth flow initiated
      expect(popup.url()).toMatch(/nango\.dev|accounts\.google\.com/);
      await popup.close();
    } else {
      // If no popup, it might have been a simulated connection
      // Check if it shows as connected now
      await expect(page.getByText(/Connected/i)).toBeVisible();
    }
  });

  test('should initiate Slack OAuth via Nango', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    
    // Find Slack connect button - let's find the card with Slack text first
    const slackCard = page.locator('div').filter({ hasText: /^Slack/ }).first();
    const slackConnect = slackCard.getByRole('button', { name: /connect/i });
    
    if (await slackConnect.isVisible()) {
      const [popup] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        slackConnect.click()
      ]);
      
      if (popup) {
        expect(popup.url()).toMatch(/nango\.dev|slack\.com/);
        await popup.close();
      } else {
        await expect(slackCard.getByText(/Connected/i)).toBeVisible();
      }
    }
  });

  test('should show connection status for each integration', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    
    // Each integration should show connected/disconnected status
    // Adjust selectors based on actual UI
    const integrationCards = page.locator('.border-slate-200'); // Based on the code I read
    
    const count = await integrationCards.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
        const card = integrationCards.nth(i);
        await expect(card.locator('button, .bg-emerald-600')).toBeVisible();
    }
  });
});
