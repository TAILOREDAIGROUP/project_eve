import { test, expect } from '@playwright/test';
import { OnboardingPage } from '../pages/onboarding.page';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure onboarding shows
    await page.addInitScript(() => {
      window.localStorage.removeItem('eve-onboarding-complete');
    });
  });

  test('should complete the onboarding wizard', async ({ page }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.goto();

    // Check if onboarding is visible
    await expect(onboardingPage.welcomeText).toBeVisible();

    // Step through the wizard
    // Step 1: Welcome
    await onboardingPage.next();

    // Step 2: Engagement
    await onboardingPage.next();

    // Step 3: Departments (Need to select one)
    await onboardingPage.selectDepartment('Operations');
    await onboardingPage.next();

    // Step 4: Connect
    await onboardingPage.next();

    // Step 5: Ready
    await onboardingPage.complete();

    // Verify onboarding is closed and dashboard is visible
    await expect(onboardingPage.welcomeText).not.toBeVisible({ timeout: 10000 });
    
    // Check if localStorage is updated
    await page.waitForFunction(() => localStorage.getItem('eve-onboarding-complete') === 'true', { timeout: 5000 });
    const isComplete = await page.evaluate(() => localStorage.getItem('eve-onboarding-complete'));
    expect(isComplete).toBe('true');
  });
});
