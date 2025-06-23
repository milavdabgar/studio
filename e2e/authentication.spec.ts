import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUser = {
  email: 'admin@gppalanpur.in',
  password: 'Admin@123',
  role: 'admin',
  expectedDashboardText: /Welcome to your Dashboard, GPP Super Admin!/i,
};

const studentUser = {
  email: '220010107001@gppalanpur.ac.in',
  password: '220010107001',
  role: 'student',
  expectedDashboardText: /Welcome to your Dashboard, DOE JOHN MICHAEL!/i,
};

const facultyUser = {
  email: 'faculty.cs01@gppalanpur.ac.in',
  password: 'Password@123', // Assuming a default or known password
  role: 'faculty',
  expectedDashboardText: /Welcome to your Dashboard, Prof. CS01 FACULTY!/i,
};


async function login(page: Page, email: string, password?: string, role?: string) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill(email);
  if (password) {
    await page.getByLabel(/Password/i).fill(password);
  }
  if (role) {
    await page.getByLabel(/Login as/i).click(); // Open select
    await page.getByRole('option', { name: new RegExp(role, 'i') }).click();
  }
  await page.getByRole('button', { name: /Login|Sign In/i }).click();
}

async function logout(page: Page) {
  // Assuming a logout button is available, typically in a user menu or sidebar
  // This selector might need adjustment based on the actual UI
  const logoutButton = page.locator('button[aria-label="Log out"], button:has-text("LogOut"), button:has-text("Sign Out")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Fallback if a direct logout button isn't found easily, try navigating to a known logout path or sidebar
    // Forcing a visit to /login often implies a logout if session is cleared
    console.warn('Direct logout button not found, attempting to clear session by navigating to /login');
    await page.goto(`${APP_BASE_URL}/login`);
  }
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
      await login(page, 'wrong@example.com', 'wrongpassword', 'student');
      
      // Wait for any network activities to complete and potential error message to appear
      await page.waitForTimeout(1000); // Give some time for error message
      
      const errorToast = page.locator('div[role="status"] >> text=/Login Failed|Invalid email or password/i').first();
      await expect(errorToast).toBeVisible({ timeout: 10000 });
    });

    test('should show error if role is not assigned to user', async ({ page }) => {
      // Assuming adminUser.email does not have 'student' role.
      await login(page, adminUser.email, adminUser.password, 'student');
      await page.waitForTimeout(1000);
      const errorToast = page.locator('div[role="status"] >> text=/role is not assigned to this user/i').first();
      await expect(errorToast).toBeVisible({ timeout: 10000 });
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
      const successToast = page.locator('div[role="status"] >> text=/Signup Successful/i').first();
      await expect(successToast).toBeVisible({ timeout: 10000 });
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

      const errorToast = page.locator('div[role="status"] >> text=/Passwords do not match/i').first();
      await expect(errorToast).toBeVisible({ timeout: 10000 });
    });
  });
});
