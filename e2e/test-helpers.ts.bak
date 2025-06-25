import { test, expect } from '@playwright/test';

/**
 * Authentication Helper for Protected Routes Testing
 * This helper enables testing of protected routes by handling login flows
 */

export async function loginAsAdmin(page: any) {
  await page.goto('/login');
  
  // Wait for login form to load
  await page.waitForSelector('#email', { timeout: 10000 });
  
  // Fill login credentials with actual test data
  await page.fill('#email', 'admin@gppalanpur.in');
  await page.fill('#password', 'Admin@123');
  
  // Handle role selection - wait for role dropdown to be enabled
  await page.waitForSelector('#role', { timeout: 5000 });
  await page.click('#role');
  
  // Wait for dropdown options and select admin (shadcn/ui Select)
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  await page.click('[role="option"]:has-text("Administrator")');
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login and redirect
  await page.waitForURL('/dashboard', { timeout: 15000 });
  
  // Verify we're logged in by checking for dashboard content (use more specific selector)
  await expect(page.locator('h1').filter({ hasText: 'Welcome to your Dashboard' })).toBeVisible();
}

export async function loginAsFaculty(page: any) {
  await page.goto('/login');
  
  await page.waitForSelector('#email', { timeout: 10000 });
  
  // Use faculty credentials from the mock users
  await page.fill('#email', 'faculty@example.com');
  await page.fill('#password', 'password');
  
  // Select faculty role
  await page.waitForSelector('#role', { timeout: 5000 });
  await page.click('#role');
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  await page.click('[role="option"]:has-text("Faculty")');
  
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/dashboard', { timeout: 15000 });
  
  // Faculty will also redirect to dashboard, but with faculty role active
  await expect(page.locator('h1').filter({ hasText: 'Welcome to your Dashboard' })).toBeVisible();
}

export async function loginAsStudent(page: any) {
  await page.goto('/login');
  
  await page.waitForSelector('#email', { timeout: 10000 });
  
  // Use student credentials from the mock users
  await page.fill('#email', 'student@example.com');
  await page.fill('#password', 'password');
  
  // Select student role
  await page.waitForSelector('#role', { timeout: 5000 });
  await page.click('#role');
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  await page.click('[role="option"]:has-text("Student")');
  
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/dashboard', { timeout: 15000 });
  
  // Student will also redirect to dashboard, but with student role active
  await expect(page.locator('h1').filter({ hasText: 'Welcome to your Dashboard' })).toBeVisible();
}

/**
 * Test data helpers for creating test entities
 */
export const testData = {
  admin: {
    email: 'admin@gppalanpur.in',
    password: 'Admin@123',
    role: 'admin'
  },
  faculty: {
    email: 'faculty@example.com',
    password: 'password',
    role: 'faculty'
  },
  student: {
    email: 'student@example.com',
    password: 'password',
    role: 'student'
  },
  hod: {
    email: 'hod@example.com',
    password: 'password',
    role: 'hod'
  },
  jury: {
    email: 'jury@example.com',
    password: 'password',
    role: 'jury'
  },
  multiRole: {
    email: 'multi@example.com',
    password: 'password',
    roles: ['student', 'jury']
  },
  newUser: {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'testpass123',
    confirmPassword: 'testpass123',
    role: 'student'
  }
};

/**
 * Common test utilities
 */
export async function waitForPageLoad(page: any, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}

export async function fillForm(page: any, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    // Use ID selectors for our forms
    await page.fill(`#${field}`, value);
  }
}

export async function submitForm(page: any, submitSelector = 'button[type="submit"]') {
  await page.click(submitSelector);
  await page.waitForLoadState('networkidle');
}

/**
 * Signup helper for testing user registration
 */
export async function signupNewUser(page: any, userData = testData.newUser) {
  await page.goto('/signup');
  
  // Wait for signup form to load
  await page.waitForSelector('#name', { timeout: 10000 });
  
  // Fill signup form
  await page.fill('#name', userData.name);
  await page.fill('#email', userData.email);
  await page.fill('#password', userData.password);
  await page.fill('#confirmPassword', userData.confirmPassword);
  
  // Select role (shadcn/ui Select)
  await page.waitForSelector('#role', { timeout: 5000 });
  await page.click('#role');
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  await page.click(`[role="option"]:has-text("${userData.role === 'student' ? 'Student' : 'Faculty'}")`);
  
  // Submit signup form
  await page.click('button[type="submit"]');
  
  // Wait for successful signup and redirect to login
  await page.waitForURL('/login', { timeout: 15000 });
}
