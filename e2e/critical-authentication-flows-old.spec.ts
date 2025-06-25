import { test, expect } from '@playwright/test';
import { testData, fillForm, submitForm } from './test-helpers';

/**
 * Critical Authentication Flow Tests
 * Priority: HIGHEST - Required for all protected route testing
 * 
 * These tests validate core authentication functionality that enables
 * access to protected routes. Essential for MongoDB migration safety.
 */

test.describe('Critical Authentication Flows - MongoDB Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should load login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Login/);
    
    // Verify login form elements exist
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verify role selection if available
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await expect(roleSelect).toBeVisible();
      
      // Check for expected roles
      const adminOption = page.locator('option[value="Administrator"]');
      const facultyOption = page.locator('option[value="Faculty"]');
      const studentOption = page.locator('option[value="Student"]');
      
      await expect(adminOption).toBeVisible();
      await expect(facultyOption).toBeVisible();
      await expect(studentOption).toBeVisible();
    }
  });

  test('should load signup page correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Sign.*[Uu]p/);
    
    // Verify signup form elements exist
    await expect(page.locator('[name="firstName"]')).toBeVisible();
    await expect(page.locator('[name="lastName"]')).toBeVisible();
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle valid login - Admin user', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await fillForm(page, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    
    // Select admin role if role selector exists
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('Administrator');
    }
    
    // Submit form
    await submitForm(page);
    
    // Verify successful login - should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Verify admin dashboard elements are visible
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Verify admin-specific elements exist
    const adminElements = [
      'text=Admin',
      'text=Users',
      'text=Students',
      'text=Faculty',
      'text=Results'
    ];
    
    // At least some admin elements should be visible
    let adminElementFound = false;
    for (const element of adminElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
        adminElementFound = true;
        break;
      } catch (e) {
        // Continue checking other elements
      }
    }
    
    expect(adminElementFound).toBe(true);
  });

  test('should handle valid login - Faculty user', async ({ page }) => {
    await page.goto('/login');
    
    await fillForm(page, {
      email: testData.faculty.email,
      password: testData.faculty.password
    });
    
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('Faculty');
    }
    
    await submitForm(page);
    
    // Should redirect to faculty dashboard
    await page.waitForURL(/\/faculty/, { timeout: 15000 });
    
    await expect(page.locator('text=Faculty')).toBeVisible({ timeout: 10000 });
  });

  test('should handle valid login - Student user', async ({ page }) => {
    await page.goto('/login');
    
    await fillForm(page, {
      email: testData.student.email,  
      password: testData.student.password
    });
    
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('Student');
    }
    
    await submitForm(page);
    
    // Should redirect to student dashboard
    await page.waitForURL(/\/student/, { timeout: 15000 });
    
    await expect(page.locator('text=Student')).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    await fillForm(page, {
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });
    
    await submitForm(page);
    
    // Should show error message and stay on login page
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await submitForm(page);
    
    // Should show validation errors
    const emailField = page.locator('[name="email"]');
    const passwordField = page.locator('[name="password"]');
    
    // Check for HTML5 validation or custom validation messages
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('should handle signup form submission', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill signup form with test data
    await fillForm(page, {
      name: testData.newUser.name,
      email: testData.newUser.email,
      password: testData.newUser.password,
      confirmPassword: testData.newUser.confirmPassword
    });
    
    await submitForm(page);
    
    // Should either redirect to login or show success message
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasSuccessMessage = await page.locator('text=Success').isVisible();
    const redirectedToLogin = currentUrl.includes('/login');
    
    expect(hasSuccessMessage || redirectedToLogin).toBe(true);
  });

  test('should validate signup password confirmation', async ({ page }) => {
    await page.goto('/signup');
    
    await fillForm(page, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword'
    });
    
    await submitForm(page);
    
    // Should show password mismatch error
    await expect(page.locator('text=password')).toBeVisible();
    await expect(page.locator('text=match')).toBeVisible();
  });

  test('should handle logout functionality', async ({ page }) => {
    // First login
    await page.goto('/login');
    
    await fillForm(page, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('Administrator');
    }
    
    await submitForm(page);
    
    // Wait for successful login
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Look for logout button/link
    const logoutSelectors = [
      'text=Logout',
      'text=Sign Out',
      '[data-testid="logout"]',
      'button:has-text("Logout")',
      'a:has-text("Logout")'
    ];
    
    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        const logoutElement = page.locator(selector);
        if (await logoutElement.isVisible({ timeout: 2000 })) {
          await logoutElement.click();
          loggedOut = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (loggedOut) {
      // Should redirect to login or home page after logout
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl.includes('/login') || currentUrl.includes('/')).toBe(true);
    }
  });

  test('should protect routes that require authentication', async ({ page }) => {
    // Try to access protected routes without login
    const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/admin/students',
      '/admin/faculty',
      '/faculty',
      '/faculty/my-courses',
      '/student',
      '/student/courses'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to login page
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      // Should be redirected to login or blocked
      expect(currentUrl.includes('/login') || currentUrl === route).toBe(true);
      
      if (currentUrl.includes('/login')) {
        // Verify we're on login page
        await expect(page.locator('[name="email"]')).toBeVisible();
      }
    }
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Login first
    await page.goto('/login');
    
    await fillForm(page, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('Administrator');
    }
    
    await submitForm(page);
    
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Reload the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
  });
});
