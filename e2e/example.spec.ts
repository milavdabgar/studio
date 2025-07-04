
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
    const heading = page.getByRole('heading', { name: /Streamline Your College Management/i });
    await expect(heading).toBeVisible();
  });

  test('should have a login button', async ({ page }) => {
    const loginButton = page.getByRole('link', { name: /Login/i });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should have a sign up button', async ({ page }) => {
    const signupButton = page.getByRole('link', { name: /Sign Up/i });
    await expect(signupButton).toBeVisible();
    await expect(signupButton).toBeEnabled();
  });

  test('login button should navigate to /login', async ({ page }) => {
    await page.getByRole('link', { name: /Login/i }).click();
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
    await page.getByRole('link', { name: /Sign Up/i }).click();
    await expect(page).toHaveURL(/.*\/signup/);
    
    // Wait for page to load and then check for signup content
    await page.waitForLoadState('networkidle');
    
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

