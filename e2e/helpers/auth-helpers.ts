// e2e/helpers/auth-helpers.ts
import { Page } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
}

/**
 * Create a test user for E2E testing
 */
export async function createTestUser(role: 'student' | 'faculty' | 'admin' = 'student'): Promise<TestUser> {
  const timestamp = Date.now();
  const testUser: TestUser = {
    id: `test_user_${role}_${timestamp}`,
    email: `test.${role}.${timestamp}@example.com`,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${timestamp}`,
    password: 'testpassword123',
    role: role
  };

  // In a real implementation, this would make API calls to create the user
  // For now, we'll use the existing test patterns from the codebase
  return testUser;
}

/**
 * Clean up test user after tests
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // In a real implementation, this would make API calls to clean up the user
  // For now, we'll use the existing test patterns from the codebase
  console.log(`Cleaning up test user: ${userId}`);
}

/**
 * Login as a student user
 */
export async function loginAsStudent(page: Page, user?: TestUser): Promise<void> {
  const testUser = user || await createTestUser('student');
  
  // Set auth cookie directly for E2E tests
  // This matches the authentication pattern used in the codebase
  const authCookie = {
    email: testUser.email,
    name: testUser.name,
    activeRole: 'student',
    availableRoles: ['student'],
    id: testUser.id
  };

  await page.context().addCookies([{
    name: 'auth_user',
    value: encodeURIComponent(JSON.stringify(authCookie)),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false
  }]);
}

/**
 * Login as a faculty user
 */
export async function loginAsFaculty(page: Page, user?: TestUser): Promise<void> {
  const testUser = user || await createTestUser('faculty');
  
  const authCookie = {
    email: testUser.email,
    name: testUser.name,
    activeRole: 'faculty',
    availableRoles: ['faculty'],
    id: testUser.id
  };

  await page.context().addCookies([{
    name: 'auth_user',
    value: encodeURIComponent(JSON.stringify(authCookie)),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false
  }]);
}

/**
 * Login as an admin user
 */
export async function loginAsAdmin(page: Page, user?: TestUser): Promise<void> {
  const testUser = user || await createTestUser('admin');
  
  const authCookie = {
    email: testUser.email,
    name: testUser.name,
    activeRole: 'admin',
    availableRoles: ['admin'],
    id: testUser.id
  };

  await page.context().addCookies([{
    name: 'auth_user',
    value: encodeURIComponent(JSON.stringify(authCookie)),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false
  }]);
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'auth_user');
}

/**
 * Get current user from cookies
 */
export async function getCurrentUser(page: Page): Promise<any | null> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(cookie => cookie.name === 'auth_user');
  
  if (!authCookie) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(authCookie.value));
  } catch {
    return null;
  }
}