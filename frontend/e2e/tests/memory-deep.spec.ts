import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Memory Persistence - Deep Testing', () => {
  test.beforeEach(async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.completeOnboardingViaStorage();
  });

  test('should remember facts across browser sessions', async ({ page, context }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Store a unique fact
    const uniqueId = Date.now();
    await dashboard.sendMessage(`Remember this unique code: TESTCODE${uniqueId}`);
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText(/./i, { timeout: 30000 });

    // Close and reopen (simulating new session)
    await page.close();
    
    const newPage = await context.newPage();
    const newDashboard = new DashboardPage(newPage);
    await newDashboard.completeOnboardingViaStorage();
    await newDashboard.goto();

    await newDashboard.sendMessage('What unique code did I ask you to remember?');
    await newDashboard.waitForAssistantResponse();
    await expect(newDashboard.assistantMessages.last()).toContainText(`TESTCODE${uniqueId}`, { timeout: 30000 });
  });

  test('should handle memory updates (corrections)', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Initial fact
    await dashboard.sendMessage('My favorite color is blue.');
    await dashboard.waitForAssistantResponse();

    // Correction
    await dashboard.sendMessage('Actually, I changed my mind. My favorite color is now green.');
    await dashboard.waitForAssistantResponse();

    // Verify update
    await page.reload();
    await dashboard.sendMessage('What is my favorite color?');
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText('green', { timeout: 30000 });
  });
});
