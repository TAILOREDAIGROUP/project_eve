import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;
  readonly assistantMessages: Locator;
  readonly onboardingWizard: Locator;
  readonly onboardingCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatInput = page.getByPlaceholder('Ask Eve anything or describe what you need help with...');
    this.sendButton = page.locator('button:has(svg.lucide-send)');
    this.messages = page.locator('.space-y-6 > div');
    this.assistantMessages = page.locator('.bg-slate-100 p');
    this.onboardingWizard = page.locator('text=Welcome to Project EVE');
    // The onboarding wizard might have a close button or complete button
    this.onboardingCloseButton = page.locator('button:has-text("Next"), button:has-text("Complete")');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async sendMessage(content: string) {
    await this.chatInput.fill(content);
    await this.sendButton.click();
  }

  async waitForAssistantResponse() {
    // Wait for the typing indicator to disappear or for a new assistant message to be full
    await this.page.waitForResponse(
      (res) => res.url().includes('/api/chat') && res.status() === 200,
      { timeout: 30000 }
    );
    // Add a small buffer for streaming to finish
    await this.page.waitForTimeout(2000);
  }

  async skipOnboarding() {
    // If onboarding is visible, try to complete it or just set localStorage in a before hook
    if (await this.onboardingWizard.isVisible()) {
      while (await this.onboardingCloseButton.isVisible()) {
        await this.onboardingCloseButton.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  async completeOnboardingViaStorage() {
    await this.page.addInitScript(() => {
      window.localStorage.setItem('eve-onboarding-complete', 'true');
    });
  }
}
