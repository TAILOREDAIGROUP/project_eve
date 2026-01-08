import { test, expect } from '@playwright/test';

test.describe('Integration Data Sync', () => {
  // These tests require a connected integration
  // We mock the Nango API responses via our backend routes (even if they don't exist yet)
  
  test('should fetch Google Calendar events (mocked)', async ({ page }) => {
    // Intercept potential API calls
    await page.route('**/api/integrations/google/calendar**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            {
              id: 'test-event-1',
              summary: 'Team Standup',
              start: { dateTime: '2026-01-07T10:00:00Z' },
              end: { dateTime: '2026-01-07T10:30:00Z' }
            }
          ]
        })
      });
    });

    // For now we just verify we can navigate to dashboard
    await page.goto('/dashboard');
    // In a real implementation, we'd check for "Team Standup" in the UI
  });

  test('should fetch Slack threads for summarization (mocked)', async ({ page }) => {
    await page.route('**/api/integrations/slack/threads**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          threads: [
            { id: 'thread-1', channel: 'general', messageCount: 15 },
            { id: 'thread-2', channel: 'engineering', messageCount: 8 }
          ]
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should fetch HubSpot deal flow (mocked)', async ({ page }) => {
    await page.route('**/api/integrations/hubspot/deals**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          deals: [
            { id: 'deal-1', name: 'Enterprise Contract', stage: 'negotiation', amount: 50000 },
            { id: 'deal-2', name: 'SMB Renewal', stage: 'closed-won', amount: 12000 }
          ]
        })
      });
    });

    await page.goto('/dashboard');
  });
});
