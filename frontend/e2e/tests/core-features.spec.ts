import { test, expect } from '../fixtures/auth.fixture';

test.describe('Core Features', () => {
  test('should be able to send a message and receive a response', async ({ authenticatedPage }) => {
    const fact = 'My favorite productivity tool is Zencoder.';
    await authenticatedPage.sendMessage(fact);
    
    // Verify the message appears in the chat
    const lastResponse = authenticatedPage.assistantMessages.last();
    await expect(lastResponse).toContainText('Zencoder', { timeout: 30000 });
  });

  test('should remember information from previous messages', async ({ authenticatedPage }) => {
    // We rely on the AI memory persistence
    await authenticatedPage.sendMessage('Remember that my favorite fruit is Mango.');
    await authenticatedPage.waitForAssistantResponse();

    await authenticatedPage.page.reload();
    await authenticatedPage.completeOnboardingViaStorage(); // Re-apply if reload cleared it

    await authenticatedPage.sendMessage('What is my favorite fruit?');

    // Wait for the text to actually appear in the UI and contain "mango"
    // This handles streaming naturally because toHaveText retries
    const lastResponse = authenticatedPage.assistantMessages.last();
    await expect(lastResponse).toContainText('mango', { timeout: 30000 });
  });
});
