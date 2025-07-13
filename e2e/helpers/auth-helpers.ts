// e2e/helpers/auth-helpers.ts
import { Page } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  studentId?: string;
}

export interface TestStudentProfile {
  id: string;
  userId: string;
  enrollmentNumber: string;
  firstName: string;
  lastName: string;
  programId: string;
  batchId?: string;
  status: string;
}

/**
 * Create a test user and corresponding student profile for E2E testing
 */
export async function createTestUser(role: 'student' | 'faculty' | 'admin' = 'student'): Promise<TestUser> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const testUser: TestUser = {
    id: `test_user_${role}_${timestamp}_${random}`,
    email: `test.${role}.${timestamp}.${random}@example.com`,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${timestamp}`,
    password: 'testpassword123',
    role: role
  };

  return testUser;
}

/**
 * Create a test student profile in the database
 */
async function createTestStudentProfile(page: Page, testUser: TestUser): Promise<TestStudentProfile> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const enrollmentNumber = `TST${timestamp}${random}`;
  
  // Use unique email based on enrollment number to avoid conflicts
  const uniqueEmail = `test.student.${timestamp}.${random}@example.com`;
  
  // Get first available program and department to use as test data
  const [programsResponse, departmentsResponse] = await Promise.all([
    page.request.get('/api/programs'),
    page.request.get('/api/departments')
  ]);
  
  const programs = await programsResponse.json();
  const departments = await departmentsResponse.json();
  
  const firstProgram = programs[0];
  const firstDepartment = departments[0];
  
  if (!firstProgram) {
    throw new Error('No programs available for test student creation');
  }
  
  if (!firstDepartment) {
    throw new Error('No departments available for test student creation');
  }

  // Use the department from the program if available, otherwise use first department
  const departmentId = firstProgram.departmentId || firstDepartment.id;

  const studentData = {
    enrollmentNumber,
    firstName: testUser.name.split(' ')[1] || 'Test',
    lastName: testUser.name.split(' ')[2] || 'Student',
    fullNameGtuFormat: testUser.name,
    personalEmail: uniqueEmail,
    programId: firstProgram.id,
    department: departmentId,
    batchId: firstProgram.batchId || null,
    status: 'active',
    currentSemester: 1,
    creditsEarned: 0,
    totalCredits: 240,
    cpi: 0.0
  };

  const createResponse = await page.request.post('/api/students', {
    data: studentData
  });

  if (!createResponse.ok()) {
    const error = await createResponse.text();
    throw new Error(`Failed to create test student: ${error}`);
  }

  const createdStudent = await createResponse.json();
  
  return {
    id: createdStudent.id,
    userId: createdStudent.userId,
    enrollmentNumber: createdStudent.enrollmentNumber,
    firstName: createdStudent.firstName,
    lastName: createdStudent.lastName,
    programId: createdStudent.programId,
    batchId: createdStudent.batchId,
    status: createdStudent.status
  };
}

/**
 * Clean up test user and student profile after tests
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // For comprehensive cleanup, we'd need to call delete APIs
  // For now, test students will be cleaned up through database reset
  console.log(`Cleaning up test user: ${userId}`);
}

/**
 * Login as a student user with actual database records
 */
export async function loginAsStudent(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || await createTestUser('student');
  
  try {
    // Create actual student profile in database
    const studentProfile = await createTestStudentProfile(page, testUser);
    
    // Use the real user ID from the created student profile
    const authCookie = {
      email: testUser.email,
      name: testUser.name,
      activeRole: 'student',
      availableRoles: ['student'],
      id: studentProfile.userId
    };

    // Clear any existing cookies first
    await page.context().clearCookies();

    // Set the auth cookie with real user ID
    await page.context().addCookies([{
      name: 'auth_user',
      value: encodeURIComponent(JSON.stringify(authCookie)),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }]);

    // Update testUser with the real IDs
    testUser.id = studentProfile.userId;
    testUser.studentId = studentProfile.id;

    // Wait a moment for cookie to be set
    await page.waitForTimeout(500);
    
    return testUser;
  } catch (error) {
    console.error('Failed to create test student profile:', error);
    
    // Fallback to mock authentication if database creation fails
    const authCookie = {
      email: testUser.email,
      name: testUser.name,
      activeRole: 'student',
      availableRoles: ['student'],
      id: testUser.id
    };

    await page.context().clearCookies();
    await page.context().addCookies([{
      name: 'auth_user',
      value: encodeURIComponent(JSON.stringify(authCookie)),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }]);

    await page.waitForTimeout(100);
    return testUser;
  }
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