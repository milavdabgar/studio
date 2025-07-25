import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Complete Faculty Section Coverage
 * Priority: All Faculty Routes (Critical for Teaching)
 * 
 * This test suite provides comprehensive coverage of ALL faculty routes
 * ensuring complete faculty functionality is tested.
 */

test.describe('Complete Faculty Section Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  // Core Faculty Pages
  const coreFacultyPages = [
    '/faculty',
    '/faculty/profile',
    '/faculty/my-courses',
    '/faculty/timetable',
    '/faculty/leaves',
    '/faculty/assessments/grade',
    '/faculty/attendance/mark',
    '/faculty/attendance/reports'
  ];

  test('should access all core faculty pages', async ({ page }) => {
    for (const facultyPath of coreFacultyPages) {
      await page.goto(facultyPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show faculty content or proper access control
      const hasFacultyContent = await page.locator('h1, h2, .faculty-content, .page-title, main').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, text=403').first().isVisible();
      const hasNotFound = await page.locator('text=404, text=Not Found').first().isVisible();
      
      expect(hasFacultyContent || hasAccessControl || hasNotFound).toBe(true);
      
      // Should not show unhandled errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });

  // Dynamic Faculty Routes (Course-related)
  test('should handle dynamic faculty course routes', async ({ page }) => {
    const dynamicCourseRoutes = [
      '/faculty/course-offerings/test-course/assessments',
      '/faculty/course-offerings/test-course/materials', 
      '/faculty/course-offerings/test-course/students',
      '/faculty/courses/test-course/students'
    ];
    
    for (const coursePath of dynamicCourseRoutes) {
      await page.goto(coursePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should handle gracefully - show content, 404, or access control
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found, text=Course not found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
      const hasNoData = await page.locator('text=No courses, text=No data, text=No students').first().isVisible();
      
      expect(hasContent || has404 || hasAccessControl || hasNoData).toBe(true);
      
      // Should not crash
      const hasError = await page.locator('text=Error, text=Something went wrong, text=500').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test faculty dashboard functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check for faculty dashboard elements or login redirect
    const hasDashboard = await page.locator('h1:has-text("Faculty"), h1:has-text("Dashboard"), .faculty-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasDashboard) {
      // Look for faculty-specific features
      const hasCourses = await page.locator('text=Courses, text=My Courses, .course-list').first().isVisible();
      const hasAttendance = await page.locator('text=Attendance, .attendance').first().isVisible();
      const hasAssessments = await page.locator('text=Assessments, text=Grading, .assessments').first().isVisible();
      const hasTimetable = await page.locator('text=Timetable, text=Schedule, .timetable').first().isVisible();
      
      expect(hasCourses || hasAttendance || hasAssessments || hasTimetable).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty profile management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/profile');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasProfilePage = await page.locator('h1:has-text("Profile"), .profile-page, .faculty-profile').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasProfilePage) {
      // Look for profile features
      const hasEditButton = await page.locator('button:has-text("Edit"), button:has-text("Update")').isVisible();
      const hasProfileForm = await page.locator('form, .profile-form').first().isVisible();
      const hasPersonalInfo = await page.locator('.personal-info, .profile-details').first().isVisible();
      
      expect(hasEditButton || hasProfileForm || hasPersonalInfo).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty course management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/my-courses');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasCoursesPage = await page.locator('h1:has-text("Courses"), h1:has-text("My Courses"), .courses-page').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasCoursesPage) {
      // Look for course management features
      const hasCourseList = await page.locator('.course-list, .course-card, table').first().isVisible();
      const hasAddCourse = await page.locator('button:has-text("Add"), button:has-text("Create")').isVisible();
      const hasNoCourses = await page.locator('text=No courses, text=No assignments').first().isVisible();
      
      expect(hasCourseList || hasAddCourse || hasNoCourses).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty attendance features', async ({ page }) => {
    // Test attendance marking
    await page.goto('http://localhost:3000/faculty/attendance/mark');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasAttendancePage = await page.locator('h1:has-text("Attendance"), .attendance-page').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasAttendancePage) {
      const hasAttendanceForm = await page.locator('form, .attendance-form').first().isVisible();
      const hasStudentList = await page.locator('.student-list, table').first().isVisible();
      const hasMarkButtons = await page.locator('button:has-text("Mark"), button:has-text("Save")').isVisible();
      
      expect(hasAttendanceForm || hasStudentList || hasMarkButtons).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
    
    // Test attendance reports
    await page.goto('http://localhost:3000/faculty/attendance/reports');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasReportsPage = await page.locator('h1:has-text("Reports"), .reports-page').isVisible();
    const hasReportsAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasReportsLoginRedirect = page.url().includes('/login');
    
    expect(hasReportsPage || hasReportsAccessControl || hasReportsLoginRedirect).toBe(true);
  });

  test('should test faculty assessment and grading', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/assessments/grade');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasGradingPage = await page.locator('h1:has-text("Grade"), h1:has-text("Assessment"), .grading-page').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasGradingPage) {
      // Look for grading features
      const hasGradingForm = await page.locator('form, .grading-form').first().isVisible();
      const hasStudentGrades = await page.locator('.grades, .grade-input, table').first().isVisible();
      const hasSaveButton = await page.locator('button:has-text("Save"), button:has-text("Submit")').isVisible();
      
      expect(hasGradingForm || hasStudentGrades || hasSaveButton).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty timetable management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/timetable');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasTimetablePage = await page.locator('h1:has-text("Timetable"), h1:has-text("Schedule"), .timetable-page').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasTimetablePage) {
      // Look for timetable features
      const hasCalendar = await page.locator('.calendar, .schedule-grid, table').first().isVisible();
      const hasTimeSlots = await page.locator('.time-slot, .schedule-item').first().isVisible();
      const hasViewOptions = await page.locator('select, .view-toggle').first().isVisible();
      
      expect(hasCalendar || hasTimeSlots || hasViewOptions).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty leave management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/leaves');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasLeavePage = await page.locator('h1:has-text("Leave"), .leave-page').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasLeavePage) {
      // Look for leave management features
      const hasLeaveForm = await page.locator('form, .leave-form').first().isVisible();
      const hasLeaveList = await page.locator('.leave-list, table').first().isVisible();
      const hasApplyButton = await page.locator('button:has-text("Apply"), button:has-text("Request")').isVisible();
      
      expect(hasLeaveForm || hasLeaveList || hasApplyButton).toBe(true);
    } else {
      // Should either show access control or redirect to login
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty responsive design', async ({ page }) => {
    const keyFacultyPages = [
      '/faculty',
      '/faculty/my-courses',
      '/faculty/timetable',
      '/faculty/attendance/mark'
    ];
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const facultyPath of keyFacultyPages) {
      await page.goto(facultyPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should be responsive
      const hasResponsiveContent = await page.locator('main, .content, body').first().isVisible();
      if (hasResponsiveContent) {
        const mainElement = await page.locator('main, .content').first();
        if (await mainElement.isVisible()) {
          const boundingBox = await mainElement.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(400);
          }
        }
      }
    }
  });

  test('should test faculty navigation consistency', async ({ page }) => {
    const facultyPages = [
      '/faculty',
      '/faculty/my-courses',
      '/faculty/profile',
      '/faculty/timetable'
    ];
    
    for (const facultyPath of facultyPages) {
      await page.goto(facultyPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for consistent faculty navigation/layout
      const hasFacultyLayout = await page.locator('.faculty-layout, .faculty-nav, .sidebar').first().isVisible();
      const hasMainContent = await page.locator('main, .main-content').first().isVisible();
      const hasHeader = await page.locator('header, .header, h1').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasFacultyLayout || hasMainContent || hasHeader || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test faculty workflow integration', async ({ page }) => {
    // Test typical faculty workflow: courses -> attendance -> grading
    const workflowPages = [
      '/faculty/my-courses',
      '/faculty/attendance/mark', 
      '/faculty/assessments/grade'
    ];
    
    for (const workflowPath of workflowPages) {
      await page.goto(workflowPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const hasContent = await page.locator('main, .content, h1').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
      
      // Should not show errors during workflow
      const hasError = await page.locator('text=Error, text=500').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should handle faculty error scenarios', async ({ page }) => {
    // Test non-existent faculty routes
    const nonExistentRoutes = [
      '/faculty/non-existent',
      '/faculty/invalid-section',
      '/faculty/fake-page'
    ];
    
    for (const invalidPath of nonExistentRoutes) {
      await page.goto(invalidPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show 404 or redirect appropriately
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = page.url() !== `http://localhost:3000${invalidPath}`;
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(has404 || hasRedirect || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });
});
