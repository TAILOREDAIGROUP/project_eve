import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/dashboard.page';

test.describe('EVE Integration Awareness', () => {
  test.beforeEach(async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.completeOnboardingViaStorage();
  });

  test('should respond about connected integrations', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.sendMessage('What integrations do I have connected?');
    await dashboard.waitForAssistantResponse();
    
    // EVE should be aware of integration status
    // Note: This might fail if EVE isn't currently fetching this info for the prompt
    await expect(dashboard.assistantMessages.last()).toContainText(/integration|connect|google|slack|hubspot/i, { timeout: 30000 });
  });

  test('should offer to help connect integrations', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.sendMessage('Can you check my calendar for today?');
    await dashboard.waitForAssistantResponse();
    
    // If Google not connected, EVE should offer to help connect
    await expect(dashboard.assistantMessages.last()).toContainText(/calendar|connect|google/i, { timeout: 30000 });
  });

  test('should summarize Slack threads when asked', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.sendMessage('Summarize my Slack threads from today.');
    await dashboard.waitForAssistantResponse();
    
    // Should either show summaries or prompt to connect Slack
    await expect(dashboard.assistantMessages.last()).toContainText(/slack|thread|connect/i, { timeout: 30000 });
  });
});
