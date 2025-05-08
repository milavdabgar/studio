
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
    const loginHeading = page.getByRole('heading', {name: /Welcome Back!/i});
    await expect(loginHeading).toBeVisible();
  });
});

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
  });

  test('should allow typing into email and password fields', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('test@example.com');
    await page.getByLabel(/Password/i).fill('password123');
    await expect(page.getByLabel(/Email/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/Password/i)).toHaveValue('password123');
  });

  test('should show error on invalid login (mocked)', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('wrong@example.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Login/i }).click();
    // Check for toast message or error display
    const toastTitle = page.getByText(/Login Failed/i); // Adjust selector as per your toast implementation
    await expect(toastTitle).toBeVisible({ timeout: 5000 }); // Wait for toast
    const toastDescription = page.getByText(/Invalid email or password/i);
    await expect(toastDescription).toBeVisible();
  });
});
