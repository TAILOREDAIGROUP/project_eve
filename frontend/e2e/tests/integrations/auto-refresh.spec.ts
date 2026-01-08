import { test, expect } from '@playwright/test';

test.describe('Integrations Auto-Refresh', () => {
  test('should show "Connected" status after simulated OAuth completion', async ({ page }) => {
    // 1. Navigate to integrations page
    await page.goto('/dashboard/integrations');
    
    // 2. Mock the initial state (no integrations)
    await page.route('/api/integrations?tenant_id=*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: [] })
      });
    });
    
    await page.reload();
    
    // Verify "Connect" button exists for Google
    const connectBtn = page.getByRole('button', { name: 'Connect' }).first();
    await expect(connectBtn).toBeVisible();
    
    // 3. Mock the "session" and "integrations" API for when it updates
    let connected = false;
    await page.route('/api/integrations?tenant_id=*', async route => {
      if (connected) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            integrations: [{
              id: '1',
              provider_id: 'google',
              status: 'connected',
              account_info: { email: 'test@example.com' }
            }] 
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ integrations: [] })
        });
      }
    });

    // 4. Intercept the window.open call to simulate popup behavior
    await page.evaluate(() => {
      window.open = (() => {
        const mockPopup = {
          closed: false,
          close: function() { this.closed = true; }
        };
        (window as any).lastPopup = mockPopup;
        return mockPopup;
      }) as any;
    });

    // 5. Click connect
    await connectBtn.click();
    
    // 6. Simulate the callback happening in the background (e.g. by a webhook)
    // In our test, we just flip the 'connected' flag
    setTimeout(() => {
      connected = true;
    }, 1000);

    // 7. Simulate popup closing after 3 seconds
    await page.evaluate(() => {
      setTimeout(() => {
        if ((window as any).lastPopup) {
          (window as any).lastPopup.close();
        }
      }, 3000);
    });

    // 8. Wait for UI to update to "Connected"
    // The polling takes 2 seconds after closure, so we wait enough time
    await expect(page.getByText('Connected', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('test@example.com')).toBeVisible();
  });
});
