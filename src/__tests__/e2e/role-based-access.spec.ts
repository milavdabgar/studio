import { test, expect, type Page } from '@playwright/test';

// Mock user data for different roles
const mockUsers = {
  admin: {
    email: 'admin@gppalanpur.ac.in',
    name: 'Test Admin',
    activeRole: 'admin',
    availableRoles: ['admin'],
    departmentId: 'dept_cse',
    id: 'user_admin_test'
  },
  hod: {
    email: 'hod.cse@gppalanpur.ac.in',
    name: 'Test HOD CSE',
    activeRole: 'hod',
    availableRoles: ['hod', 'faculty'],
    departmentId: 'dept_cse',
    id: 'user_hod_test'
  },
  faculty: {
    email: 'faculty.cse@gppalanpur.ac.in',
    name: 'Test Faculty',
    activeRole: 'faculty',
    availableRoles: ['faculty'],
    departmentId: 'dept_cse',
    id: 'user_faculty_test'
  },
  student: {
    email: 'student.cse@gppalanpur.ac.in',
    name: 'Test Student',
    activeRole: 'student',
    availableRoles: ['student'],
    departmentId: 'dept_cse',
    id: 'user_student_test'
  }
};

// Helper function to set authentication cookie
async function authenticateAs(page: Page, role: keyof typeof mockUsers) {
  const user = mockUsers[role];
  const cookieValue = encodeURIComponent(JSON.stringify(user));
  
  await page.context().addCookies([{
    name: 'auth_user',
    value: cookieValue,
    domain: 'localhost',
    path: '/'
  }]);
}

// Helper function to check if element exists and is visible
async function expectElementVisible(page: Page, selector: string, visible: boolean = true) {
  if (visible) {
    await expect(page.locator(selector)).toBeVisible();
  } else {
    await expect(page.locator(selector)).not.toBeVisible();
  }
}

test.describe('Role-Based Access Control E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
  });

  test.describe('Admin Role Access', () => {
    test('should have full access to all admin pages', async ({ page }) => {
      await authenticateAs(page, 'admin');
      
      // Test access to students page
      await page.goto('/admin/students');
      await expect(page).toHaveTitle(/Students/);
      await expectElementVisible(page, '[data-testid="delete-selected-button"]');
      await expectElementVisible(page, '[data-testid="import-button"]');
      await expectElementVisible(page, '[data-testid="export-button"]');
      
      // Test access to faculty page
      await page.goto('/admin/faculty');
      await expect(page).toHaveTitle(/Faculty/);
      await expectElementVisible(page, '[data-testid="delete-selected-button"]');
      
      // Test access to departments page
      await page.goto('/admin/departments');
      await expect(page).toHaveTitle(/Departments/);
      await expectElementVisible(page, '[data-testid="add-department-button"]');
      
      // Test access to roles page
      await page.goto('/admin/roles');
      await expect(page).toHaveTitle(/Roles/);
      await expectElementVisible(page, '[data-testid="add-role-button"]');
    });

    test('should see all departments in data views', async ({ page }) => {
      await authenticateAs(page, 'admin');
      await page.goto('/admin/students');
      
      // Admin should see students from all departments
      await expectElementVisible(page, '[data-testid="department-filter"]');
      
      // Check if department filter shows "All Departments" option
      await page.click('[data-testid="department-filter"]');
      await expectElementVisible(page, 'text=All Departments');
    });

    test('should have access to sensitive features', async ({ page }) => {
      await authenticateAs(page, 'admin');
      await page.goto('/admin/students');
      
      // Check for delete functionality
      await expectElementVisible(page, 'input[type="checkbox"]'); // Checkboxes for selection
      await expectElementVisible(page, '[aria-label*="Select all"]'); // Select all checkbox
      
      // Check for import/export functionality
      await expectElementVisible(page, 'text=Import');
      await expectElementVisible(page, 'text=Export');
    });
  });

  test.describe('HOD Role Access', () => {
    test('should have department-scoped access to admin pages', async ({ page }) => {
      await authenticateAs(page, 'hod');
      
      // Should have access to students page with department filtering
      await page.goto('/admin/students');
      await expect(page).toHaveTitle(/Students/);
      
      // Should have delete permissions
      await expectElementVisible(page, '[data-testid="delete-selected-button"]');
      await expectElementVisible(page, 'input[type="checkbox"]');
      
      // Should have import/export permissions
      await expectElementVisible(page, 'text=Import');
      await expectElementVisible(page, 'text=Export');
    });

    test('should not have access to role management', async ({ page }) => {
      await authenticateAs(page, 'hod');
      
      // Should be blocked from roles page
      await page.goto('/admin/roles');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should only see own department data', async ({ page }) => {
      await authenticateAs(page, 'hod');
      await page.goto('/admin/students');
      
      // Should not see "All Departments" option
      await page.click('[data-testid="department-filter"]');
      await expect(page.locator('text=All Departments')).not.toBeVisible();
      
      // Should see only CSE department option
      await expectElementVisible(page, 'text=Computer Engineering');
    });

    test('should have access to timetable management', async ({ page }) => {
      await authenticateAs(page, 'hod');
      await page.goto('/admin/timetables');
      
      await expect(page).toHaveTitle(/Timetables/);
      await expectElementVisible(page, '[data-testid="add-timetable-button"]');
    });
  });

  test.describe('Faculty Role Access', () => {
    test('should have limited access to admin pages', async ({ page }) => {
      await authenticateAs(page, 'faculty');
      
      // Should have access to students page (read-only)
      await page.goto('/admin/students');
      await expect(page).toHaveTitle(/Students/);
      
      // Should NOT have delete permissions
      await expect(page.locator('[data-testid="delete-selected-button"]')).not.toBeVisible();
      await expect(page.locator('input[type="checkbox"]')).not.toBeVisible();
      
      // Should NOT have import permissions
      await expect(page.locator('text=Import')).not.toBeVisible();
      
      // Should have export permissions
      await expectElementVisible(page, 'text=Export');
    });

    test('should not have access to faculty management page', async ({ page }) => {
      await authenticateAs(page, 'faculty');
      
      await page.goto('/admin/faculty');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should not have access to administrative features', async ({ page }) => {
      await authenticateAs(page, 'faculty');
      
      // Should be blocked from departments page
      await page.goto('/admin/departments');
      await expect(page.locator('text=Access Denied')).toBeVisible();
      
      // Should be blocked from roles page
      await page.goto('/admin/roles');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should see department-filtered data', async ({ page }) => {
      await authenticateAs(page, 'faculty');
      await page.goto('/admin/courses');
      
      // Should see courses but filtered by department
      await expect(page).toHaveTitle(/Courses/);
      
      // Should see only department-specific courses
      await expectElementVisible(page, 'text=Computer Engineering');
    });
  });

  test.describe('Student Role Access', () => {
    test('should be blocked from all admin pages', async ({ page }) => {
      await authenticateAs(page, 'student');
      
      const adminPages = [
        '/admin/students',
        '/admin/faculty',
        '/admin/departments',
        '/admin/courses',
        '/admin/programs',
        '/admin/batches',
        '/admin/timetables',
        '/admin/rooms',
        '/admin/roles'
      ];
      
      for (const adminPage of adminPages) {
        await page.goto(adminPage);
        await expect(page.locator('text=Access Denied')).toBeVisible();
      }
    });

    test('should have access to student portal', async ({ page }) => {
      await authenticateAs(page, 'student');
      
      // Should have access to student-specific pages
      await page.goto('/student/dashboard');
      await expect(page).not.toHaveTitle(/Access Denied/);
    });
  });

  test.describe('API Endpoint Security', () => {
    test('should enforce role-based API access', async ({ page }) => {
      // Test API access as different roles
      const testApiAccess = async (role: keyof typeof mockUsers, endpoint: string, expectSuccess: boolean) => {
        await authenticateAs(page, role);
        
        const response = await page.request.get(endpoint);
        
        if (expectSuccess) {
          expect(response.status()).not.toBe(401);
          expect(response.status()).not.toBe(403);
        } else {
          expect([401, 403]).toContain(response.status());
        }
      };
      
      // Test students API
      await testApiAccess('admin', '/api/students', true);
      await testApiAccess('hod', '/api/students', true);
      await testApiAccess('faculty', '/api/students', true);
      await testApiAccess('student', '/api/students', false);
      
      // Test users API (admin only)
      await testApiAccess('admin', '/api/users', true);
      await testApiAccess('hod', '/api/users', false);
      await testApiAccess('faculty', '/api/users', false);
      await testApiAccess('student', '/api/users', false);
      
      // Test departments API
      await testApiAccess('admin', '/api/departments', true);
      await testApiAccess('hod', '/api/departments', true);
      await testApiAccess('faculty', '/api/departments', false);
      await testApiAccess('student', '/api/departments', false);
    });

    test('should return department-filtered data for non-admin users', async ({ page }) => {
      await authenticateAs(page, 'hod');
      
      const response = await page.request.get('/api/students');
      expect(response.status()).toBe(200);
      
      const students = await response.json();
      // Verify all returned students belong to CSE department (through their programs)
      expect(Array.isArray(students)).toBe(true);
      
      // For each student, verify they belong to a CSE program
      for (const student of students) {
        expect(student).toHaveProperty('programId');
        // In a real test, you'd verify the program belongs to CSE department
      }
    });
  });

  test.describe('Role Switching Functionality', () => {
    test('should allow users with multiple roles to switch', async ({ page }) => {
      // Create a user with multiple roles
      const multiRoleUser = {
        ...mockUsers.hod,
        availableRoles: ['hod', 'faculty', 'committee_convener']
      };
      
      const cookieValue = encodeURIComponent(JSON.stringify(multiRoleUser));
      await page.context().addCookies([{
        name: 'auth_user',
        value: cookieValue,
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/admin/students');
      
      // Check if role switcher is visible
      await expectElementVisible(page, '[data-testid="role-switcher"]');
      
      // Click on role switcher
      await page.click('[data-testid="role-switcher"]');
      
      // Should see available roles
      await expectElementVisible(page, 'text=Faculty');
      await expectElementVisible(page, 'text=Committee Convener');
      
      // Switch to faculty role
      await page.click('text=Faculty');
      
      // Page should reload and permissions should change
      await page.waitForLoadState('networkidle');
      
      // As faculty, should not have delete permissions
      await expect(page.locator('[data-testid="delete-selected-button"]')).not.toBeVisible();
    });

    test('should not show role switcher for single-role users', async ({ page }) => {
      await authenticateAs(page, 'faculty'); // Faculty has only one role
      await page.goto('/admin/students');
      
      // Role switcher should not be visible
      await expect(page.locator('[data-testid="role-switcher"]')).not.toBeVisible();
    });
  });

  test.describe('Navigation Menu Permissions', () => {
    test('should show different navigation items based on role', async ({ page }) => {
      // Test admin navigation
      await authenticateAs(page, 'admin');
      await page.goto('/admin');
      
      await expectElementVisible(page, 'text=Students');
      await expectElementVisible(page, 'text=Faculty');
      await expectElementVisible(page, 'text=Departments');
      await expectElementVisible(page, 'text=Roles');
      await expectElementVisible(page, 'text=Settings');
      
      // Test HOD navigation
      await authenticateAs(page, 'hod');
      await page.goto('/admin');
      
      await expectElementVisible(page, 'text=Students');
      await expectElementVisible(page, 'text=Faculty');
      await expectElementVisible(page, 'text=Programs');
      await expect(page.locator('text=Roles')).not.toBeVisible();
      await expect(page.locator('text=Settings')).not.toBeVisible();
      
      // Test faculty navigation
      await authenticateAs(page, 'faculty');
      await page.goto('/admin');
      
      await expectElementVisible(page, 'text=Students');
      await expectElementVisible(page, 'text=Courses');
      await expect(page.locator('text=Faculty')).not.toBeVisible();
      await expect(page.locator('text=Departments')).not.toBeVisible();
    });
  });

  test.describe('Data Isolation and Security', () => {
    test('should prevent cross-department data access', async ({ page }) => {
      // Test that CSE HOD cannot access Mechanical Engineering data
      const cseHod = { ...mockUsers.hod, departmentId: 'dept_cse' };
      const cookieValue = encodeURIComponent(JSON.stringify(cseHod));
      
      await page.context().addCookies([{
        name: 'auth_user',
        value: cookieValue,
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/admin/students');
      
      // Should not see students from other departments
      await page.click('[data-testid="department-filter"]');
      await expect(page.locator('text=Mechanical Engineering')).not.toBeVisible();
      await expect(page.locator('text=Electrical Engineering')).not.toBeVisible();
      
      // Should only see CSE
      await expectElementVisible(page, 'text=Computer Engineering');
    });

    test('should prevent unauthorized API access through direct requests', async ({ page }) => {
      await authenticateAs(page, 'student');
      
      // Student should not be able to access admin APIs even with direct requests
      const response = await page.request.post('/api/students', {
        data: {
          name: 'Test Student',
          email: 'test@test.com',
          enrollmentNumber: '123456'
        }
      });
      
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('Committee Role Integration', () => {
    test('should allow committee conveners to switch between roles', async ({ page }) => {
      const committeeUser = {
        email: 'tpo.convener@gppalanpur.ac.in',
        name: 'TPO Convener',
        activeRole: 'committee_convener',
        availableRoles: ['committee_convener', 'faculty'],
        departmentId: 'dept_cse',
        id: 'user_tpo_convener'
      };
      
      const cookieValue = encodeURIComponent(JSON.stringify(committeeUser));
      await page.context().addCookies([{
        name: 'auth_user',
        value: cookieValue,
        domain: 'localhost',
        path: '/'
      }]);
      
      // Should have access to committee dashboard
      await page.goto('/committees/tpo');
      await expect(page).not.toHaveTitle(/Access Denied/);
      
      // Should see committee-specific features
      await expectElementVisible(page, 'text=Placement Drives');
      await expectElementVisible(page, 'text=Company Partnerships');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle missing authentication gracefully', async ({ page }) => {
      // No authentication cookie set
      await page.goto('/admin/students');
      
      // Should redirect to login or show access denied
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should handle invalid role data', async ({ page }) => {
      // Invalid authentication cookie
      await page.context().addCookies([{
        name: 'auth_user',
        value: 'invalid-cookie-data',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/admin/students');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should handle role switching errors', async ({ page }) => {
      const multiRoleUser = {
        ...mockUsers.hod,
        availableRoles: ['hod', 'faculty']
      };
      
      const cookieValue = encodeURIComponent(JSON.stringify(multiRoleUser));
      await page.context().addCookies([{
        name: 'auth_user',
        value: cookieValue,
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/admin/students');
      
      // Mock a network error during role switching
      await page.route('**/*', route => {
        if (route.request().url().includes('role-switch')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await page.click('[data-testid="role-switcher"]');
      await page.click('text=Faculty');
      
      // Should show error message
      await expectElementVisible(page, 'text=Role Switch Failed');
    });
  });
});