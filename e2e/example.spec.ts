
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should have the correct title', async ({ page }) => {
    // Wait for the title to be "GP Palanpur"
    await expect(page).toHaveTitle(/GP Palanpur/);
  });

  test('should display the main heading', async ({ page }) => {
    // Check for the main heading text
    const heading = page.getByRole('heading', { name: /Premier Government Polytechnic/i });
    await expect(heading).toBeVisible();
  });

  test('should have a portal button', async ({ page }) => {
    const portalButton = page.getByRole('link', { name: 'Portal', exact: true });
    await expect(portalButton).toBeVisible();
    await expect(portalButton).toBeEnabled();
  });

  test('should have apply now button', async ({ page }) => {
    const applyButton = page.getByRole('link', { name: /Apply Now/i });
    await expect(applyButton).toBeVisible();
    await expect(applyButton).toBeEnabled();
  });

  test('portal button should navigate to /login', async ({ page }) => {
    await page.getByRole('link', { name: 'Portal', exact: true }).click();
    await expect(page).toHaveURL(/.*\/login/);
    
    // Look for any heading on the login page with flexible matchers
    const loginHeading = page.getByRole('heading').filter({ hasText: /Login|Sign In|Welcome|Authentication/i }).first();
    
    // If it exists, expect it to be visible, otherwise check for login form elements
    if ((await loginHeading.count()) > 0) {
      await expect(loginHeading).toBeVisible();
    } else {
      // If there's no heading, check for login form elements like email/password fields
      const emailField = page.locator('input[type="email"], input[placeholder*="Email"], input[name*="email"]').first();
      await expect(emailField).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to signup from login page', async ({ page }) => {
    // Go to login page first
    await page.getByRole('link', { name: 'Portal', exact: true }).click();
    await expect(page).toHaveURL(/.*\/login/);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click the signup link
    const signupLink = page.getByRole('link', { name: /Sign Up/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    
    await expect(page).toHaveURL(/.*\/signup/);
    
    // Look for the signup heading or form
    const signupHeading = page.getByRole('heading', { name: /Create an Account/i });
    const signupForm = page.locator('form').filter({ has: page.getByLabel(/Full Name/i) });
    
    // Either the heading should be visible or the signup form should be present
    try {
      await expect(signupHeading).toBeVisible({ timeout: 5000 });
    } catch {
      await expect(signupForm).toBeVisible({ timeout: 5000 });
    }
  });
});

