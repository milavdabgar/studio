
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have the correct title', async ({ page }) => {
    // Wait for the title to be "PolyManager"
    await expect(page).toHaveTitle(/PolyManager/);
  });

  test('should display the main heading', async ({ page }) => {
    // Check for the main heading text
    const heading = page.getByRole('heading', { name: /Streamline Your College Management/i });
    await expect(heading).toBeVisible();
  });

  test('should have a login button', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /Login/i });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should have a sign up button', async ({ page }) => {
    const signupButton = page.getByRole('button', { name: /Sign Up/i });
    await expect(signupButton).toBeVisible();
    await expect(signupButton).toBeEnabled();
  });

  test('login button should navigate to /login', async ({ page }) => {
    await page.getByRole('button', { name: /Login/i }).click();
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

  test('signup button should navigate to /signup', async ({ page }) => {
    await page.getByRole('button', { name: /Sign Up/i }).click();
    await expect(page).toHaveURL(/.*\/signup/);
    const signupHeading = page.getByRole('heading', { name: /Create an Account/i });
    await expect(signupHeading).toBeVisible();
  });
});

