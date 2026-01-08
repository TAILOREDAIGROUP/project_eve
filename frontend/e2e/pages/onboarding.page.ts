import { Page, Locator } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly completeButton: Locator;
  readonly welcomeText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.completeButton = page.getByRole('button', { name: 'Get Started', exact: true });
    this.welcomeText = page.getByText('Meet Eve, Your AI Assistant');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async next() {
    await this.nextButton.click();
  }

  async selectDepartment(name: string) {
    await this.page.locator('role=dialog').getByText(name).click();
  }

  async complete() {
    await this.completeButton.click();
  }
}
