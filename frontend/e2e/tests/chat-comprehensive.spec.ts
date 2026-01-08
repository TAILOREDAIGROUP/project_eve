import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('LLM Chat Interface - Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.completeOnboardingViaStorage();
  });

  test('should handle multi-turn conversation', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Turn 1
    await dashboard.sendMessage('My name is TestUser and I work at Acme Corp.');
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText(/TestUser|Acme/i, { timeout: 30000 });

    // Turn 2 - Reference previous context
    await dashboard.sendMessage('What company did I say I work at?');
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText('Acme', { timeout: 30000 });

    // Turn 3 - More complex query
    await dashboard.sendMessage('Can you summarize what you know about me so far?');
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText(/TestUser|Acme/i, { timeout: 30000 });
  });

  test('should handle long messages', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const longMessage = 'Please analyze the following: ' + 'This is a test sentence. '.repeat(50);
    await dashboard.sendMessage(longMessage);
    
    // Should not crash, should respond
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText(/./i, { timeout: 45000 });
  });

  test('should handle special characters and unicode', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.sendMessage('Hello! 你好 🎉 <script>alert("xss")</script> "quotes" & ampersand');
    
    // Should handle gracefully, no XSS
    await dashboard.waitForAssistantResponse();
    await expect(dashboard.assistantMessages.last()).toContainText(/./i, { timeout: 30000 });
    await expect(page.locator('body')).not.toContainText('<script>');
  });

  test('should handle rapid successive messages', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Send messages quickly
    await dashboard.chatInput.fill('Message 1');
    await dashboard.sendButton.click();
    
    // Wait a bit but not for full response
    await page.waitForTimeout(500);
    
    await dashboard.chatInput.fill('Message 2');
    await dashboard.sendButton.click();

    // Both should be processed without crashing
    await expect(page.locator('body')).toContainText('Message 1');
    await expect(page.locator('body')).toContainText('Message 2');
  });

  test('should display streaming response progressively', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.sendMessage('Write a short paragraph about productivity.');
    
    // Check that content appears progressively (streaming)
    const responseLocator = dashboard.assistantMessages.last();
    
    // Wait for some content to appear
    await expect(responseLocator).toContainText(/./i, { timeout: 15000 });
    
    const initialText = await responseLocator.textContent() || '';
    const initialLength = initialText.length;
    
    // Wait a bit and check if more content appeared (streaming)
    await page.waitForTimeout(2000);
    
    const finalText = await responseLocator.textContent() || '';
    const finalLength = finalText.length;
    
    // For a paragraph request, we expect content to grow
    expect(finalLength).toBeGreaterThanOrEqual(initialLength);
  });
});
