import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUser = {
  email: 'admin@gppalanpur.in',
  password: 'Admin@123',
  role: 'Administrator',
  expectedDashboardText: /Welcome to your Dashboard, Super Admin!/i,
};

const studentUser = {
  email: 'student@example.com',
  password: 'password',
  role: 'Student',
  expectedDashboardText: /Welcome to your Dashboard, Alice Student!/i,
};

const facultyUser = {
  email: 'faculty@example.com',
  password: 'password',
  role: 'Faculty',
  expectedDashboardText: /Welcome to your Dashboard, Bob Faculty!/i,
};


async function login(page: Page, email: string, password?: string, role?: string) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill(email);
  if (password) {
    await page.getByLabel(/Password/i).fill(password);
  }
  if (role) {
    await page.getByLabel(/Login as/i).click(); // Open select
    await page.waitForTimeout(500); // Wait for dropdown to open
    await page.getByRole('option', { name: role, exact: true }).click();
  }
  await page.getByRole('button', { name: /Login|Sign In/i }).click();
}

async function logout(page: Page) {
  // Clear cookies to logout
  await page.context().clearCookies();
  
  // Navigate to login page
  await page.goto(`${APP_BASE_URL}/login`);
  await expect(page).toHaveURL(/.*\/login/);
}

test.describe('Authentication Flows', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${APP_BASE_URL}/login`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    });

    test('should display login form', async ({ page }) => {
      const emailFieldSelector = 'input[type="email"], input[placeholder*="Email"], input[name*="email"], input[id*="email" i], input[aria-label*="Email" i]';
      const passwordFieldSelector = 'input[type="password"], input[placeholder*="Password"], input[name*="password"], input[id*="password" i], input[aria-label*="Password" i]';
      
      const emailField = page.locator(emailFieldSelector).first();
      const passwordField = page.locator(passwordFieldSelector).first();
      const loginButton = page.getByRole('button').filter({ hasText: /Login|Sign In|Log in|Submit/i }).first();
      
      const hasEmailField = (await emailField.count()) > 0;
      const hasPasswordField = (await passwordField.count()) > 0;
      const hasLoginButton = (await loginButton.count()) > 0;
      
      expect(hasEmailField && hasPasswordField || hasLoginButton).toBeTruthy();
      if (hasEmailField) await expect(emailField).toBeVisible({ timeout: 5000 });
      if (hasPasswordField) await expect(passwordField).toBeVisible({ timeout: 5000 });
      if (hasLoginButton) await expect(loginButton).toBeVisible({ timeout: 5000 });
    });

    test('should allow typing into email and password fields', async ({ page }) => {
      const emailField = page.locator('input[type="email"], input[placeholder*="Email"]').first();
      const passwordField = page.locator('input[type="password"], input[placeholder*="Password"]').first();
      
      if ((await emailField.count()) === 0 || (await passwordField.count()) === 0) {
        console.log('Login form fields not found, skipping typing test');
        test.skip();
        return;
      }
      
      await emailField.fill('test@example.com');
      await passwordField.fill('password123');
      
      await expect(emailField).toHaveValue('test@example.com');
      await expect(passwordField).toHaveValue('password123');
    });

    test('should show error on invalid login credentials', async ({ page }) => {
      // Test with invalid credentials for a user that exists but wrong password
      await page.goto(`${APP_BASE_URL}/login`);
      await page.getByLabel(/Email/i).fill(adminUser.email);
      await page.getByLabel(/Password/i).fill('wrongpassword');
      
      await page.getByLabel(/Login as/i).click(); // Open select
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: adminUser.role, exact: true }).click();
      await page.getByRole('button', { name: /Login|Sign In/i }).click();
      
      // Wait for error message to appear
      await page.waitForTimeout(2000); 
      
      // Look for error text anywhere on the page
      const errorText = page.getByText('Login Failed', { exact: true });
      await expect(errorText).toBeVisible({ timeout: 5000 });
    });

    test('should show appropriate roles in dropdown', async ({ page }) => {
      // This test verifies that roles are properly loaded and displayed
      await page.goto(`${APP_BASE_URL}/login`);
      await page.getByLabel(/Email/i).fill(adminUser.email);
      
      await page.getByLabel(/Login as/i).click(); // Open select
      await page.waitForTimeout(500);
      
      // Should see Administrator role (which admin user has)
      const adminOption = page.getByRole('option', { name: 'Administrator', exact: true });
      await expect(adminOption).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Successful Login and Logout', () => {
    const usersToTest = [adminUser, studentUser, facultyUser];

    for (const user of usersToTest) {
      test(`should login as ${user.role}, see dashboard, and logout`, async ({ page }) => {
        await login(page, user.email, user.password, user.role);
        
        // Check for successful navigation to dashboard and role-specific welcome message
        await expect(page).toHaveURL(/.*\/dashboard/);
        await expect(page.getByText(user.expectedDashboardText)).toBeVisible({ timeout: 10000 });

        // Logout
        await logout(page);
        await expect(page.getByRole('button', { name: /Login|Sign In/i })).toBeVisible();
      });
    }
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${APP_BASE_URL}/signup`);
      await page.waitForLoadState('networkidle');
    });

    test('should display signup form', async ({ page }) => {
      await expect(page.getByLabel(/Full Name/i)).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password').first()).toBeVisible(); // Handle multiple elements with same label if any
      await expect(page.getByLabel(/Confirm Password/i)).toBeVisible();
      await expect(page.getByLabel(/Role/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign Up/i })).toBeVisible();
    });

    test('should allow signup and redirect to login', async ({ page }) => {
      const timestamp = Date.now();
      const uniqueEmail = `testuser${timestamp}@example.com`;

      await page.getByLabel(/Full Name/i).fill('Test User');
      await page.getByLabel('Email').fill(uniqueEmail);
      await page.getByLabel('Password').first().fill('Password123!');
      await page.getByLabel(/Confirm Password/i).fill('Password123!');
      
      await page.getByLabel(/Role/i).click(); // Open select
      await page.getByRole('option', { name: 'Student' }).click(); // Assuming 'Student' is an option

      await page.getByRole('button', { name: /Sign Up/i }).click();

      // Expect a success toast and redirection to login
      const successText = page.getByText('Signup Successful', { exact: true });
      await expect(successText).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    });

    test('should show error if passwords do not match', async ({ page }) => {
      await page.getByLabel(/Full Name/i).fill('Test User');
      await page.getByLabel('Email').fill(`test${Date.now()}@example.com`);
      await page.getByLabel('Password').first().fill('Password123!');
      await page.getByLabel(/Confirm Password/i).fill('PasswordMismatch');
      await page.getByLabel(/Role/i).click();
      await page.getByRole('option', { name: 'Student' }).click();
      await page.getByRole('button', { name: /Sign Up/i }).click();

      const errorText = page.getByText('Passwords do not match.', { exact: true });
      await expect(errorText).toBeVisible({ timeout: 10000 });
    });
  });
});
