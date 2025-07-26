import { test, expect, Page } from '@playwright/test';

/**
 * Standardized Authentication Helper for All Tests
 * This helper provides reliable login functionality across all test types
 */

export interface TestUser {
  email: string;
  password: string;
  role: string;
  roleCode: string;
  name: string;
}

export const TEST_USERS = {
  ADMIN: {
    email: 'admin@gppalanpur.in',
    password: 'Admin@123',
    role: 'Super Administrator',
    roleCode: 'admin',
    name: 'Super Admin'
  },
  FACULTY: {
    email: 'faculty@gppalanpur.in',
    password: 'Faculty@123',
    role: 'Faculty',
    roleCode: 'faculty',
    name: 'Dr. Faculty User'
  },
  STUDENT: {
    email: '086260306003@gppalanpur.in',
    password: '086260306003',
    role: 'Student',
    roleCode: 'student',
    name: 'DOE JOHN MICHAEL'
  }
} as const;

/**
 * Standardized login function that works reliably across all tests
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Clear any existing auth
  await page.evaluate(() => {
    document.cookie = 'auth_user=;path=/;max-age=0';
    localStorage.clear();
  });

  // Fill identifier field (single field for email/enrollment/staff code)
  await page.fill('#identifier', user.email);
  
  // Fill password
  await page.fill('#password', user.password);

  // Wait for role validation and options to load
  await page.waitForTimeout(1000);

  // Wait for roles dropdown and select role
  await page.click('#role');
  
  // Wait for dropdown to open and options to be visible
  await page.waitForSelector('[role="listbox"], .select-content', { timeout: 10000 });
  
  // Select the role option
  await page.getByRole('option', { name: user.role, exact: true }).click();

  // Submit login
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for successful redirect to dashboard
  await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Verify login success by checking for user content
  await expect(page.locator('body')).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, TEST_USERS.ADMIN);
}

export async function loginAsFaculty(page: Page) {
  await loginAs(page, TEST_USERS.FACULTY);
}

export async function loginAsStudent(page: Page) {
  await loginAs(page, TEST_USERS.STUDENT);
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
export async function signupNewUser(page: Page, userData = testData.newUser) {
  await page.goto('http://localhost:3000/signup');
  
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

/**
 * Enhanced wait for element with retry logic
 */
export async function waitForElement(page: Page, selector: string, options: { timeout?: number, visible?: boolean } = {}): Promise<void> {
  const { timeout = 10000, visible = true } = options;
  
  if (visible) {
    await expect(page.locator(selector)).toBeVisible({ timeout });
  } else {
    await expect(page.locator(selector)).toBeHidden({ timeout });
  }
}

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[data-loading="true"]',
    '.animate-spin',
    'text=Loading'
  ];
  
  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 5000 });
    } catch {
      // Ignore if loading selector doesn't exist
    }
  }
}

/**
 * Fill date picker with proper handling
 */
export async function fillDatePicker(page: Page, label: string | RegExp, date: string): Promise<void> {
  const input = page.getByLabel(label);
  await input.click();
  
  // Clear existing value and fill new date
  await input.clear();
  await input.fill(date);
  await input.blur(); // Trigger change event
  
  // Wait for any validation or processing
  await page.waitForTimeout(500);
}

/**
 * Handle form submission with loading state
 */
export async function submitFormReliable(page: Page, buttonText: string | RegExp = /submit|save|create|update/i): Promise<void> {
  const submitButton = page.getByRole('button', { name: buttonText });
  await expect(submitButton).toBeEnabled();
  
  await submitButton.click();
  
  // Wait for form processing
  await waitForLoadingComplete(page);
}

/**
 * Navigate through pagination to find item
 */
export async function findItemInPagination(page: Page, itemText: string, maxPages: number = 5): Promise<boolean> {
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    // Check if item exists on current page
    const itemExists = await page.locator(`text=${itemText}`).isVisible();
    if (itemExists) {
      return true;
    }
    
    // Try to go to next page
    const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"], .pagination-next');
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await waitForLoadingComplete(page);
    } else {
      // No more pages
      break;
    }
  }
  
  return false;
}

/**
 * Delete item with confirmation dialog
 */
export async function deleteItemWithConfirmation(page: Page, itemSelector: string): Promise<void> {
  // Click delete button
  await page.locator(itemSelector).click();
  
  // Wait for confirmation dialog
  await waitForElement(page, '[role="dialog"], .modal, .confirmation-dialog');
  
  // Confirm deletion
  const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();
  await confirmButton.click();
  
  // Wait for deletion to complete
  await waitForLoadingComplete(page);
}

/**
 * Create unique test data identifiers
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Verify page has loaded without errors
 */
export async function verifyPageLoaded(page: Page, expectedUrl?: string | RegExp): Promise<void> {
  // Check for any error messages
  const errorElements = await page.locator('text=Error, text=500, text=404, .error-message').count();
  expect(errorElements).toBe(0);
  
  // Verify URL if provided
  if (expectedUrl) {
    await expect(page).toHaveURL(expectedUrl);
  }
  
  // Ensure page content is visible
  await expect(page.locator('body')).toBeVisible();
}

/**
 * Fill form field with proper validation
 */
export async function fillFormField(page: Page, label: string | RegExp, value: string): Promise<void> {
  const field = page.getByLabel(label);
  await expect(field).toBeVisible();
  await field.clear();
  await field.fill(value);
  
  // Trigger validation by blurring
  await field.blur();
  await page.waitForTimeout(100);
}

/**
 * Select dropdown option with retry logic
 */
export async function selectDropdownOption(page: Page, triggerSelector: string, optionText: string): Promise<void> {
  // Click trigger to open dropdown
  await page.locator(triggerSelector).click();
  
  // Wait for dropdown to open
  await waitForElement(page, '[role="listbox"], [role="menu"], .dropdown-content');
  
  // Select option
  await page.getByRole('option', { name: optionText }).click();
  
  // Wait for dropdown to close
  await page.waitForTimeout(500);
}
