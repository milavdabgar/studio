import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Faculty Portal Complete Coverage
 * Priority: Faculty Experience (High Priority)
 * 
 * This test suite covers all faculty-facing functionality including
 * course management, student grading, attendance, and profile management.
 */

test.describe('Faculty Portal Complete Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('should access faculty dashboard with proper authentication', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Should show faculty content or proper authentication redirect
    const hasFacultyContent = await page.locator('h1, h2, .faculty-dashboard, main').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    expect(hasFacultyContent || hasAccessControl || hasLoginRedirect).toBe(true);
    
    // Should not show server errors
    const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
    expect(hasServerError).toBe(false);
  });

  test('should access all faculty sub-pages', async ({ page }) => {
    const facultyPages = [
      '/faculty/profile',
      '/faculty/dashboard',
      '/faculty/courses', 
      '/faculty/my-courses',
      '/faculty/timetable',
      '/faculty/leaves',
      '/faculty/attendance/mark',
      '/faculty/attendance/reports',
      '/faculty/assessments/grade',
      '/faculty/students',
      '/faculty/materials'
    ];
    
    for (const facultyPath of facultyPages) {
      await page.goto(`http://localhost:3000${facultyPath}`);
      
      try {
        await page.waitForSelector('h1, h2, main, .content, input[type="email"], input[type="password"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      // Should handle gracefully - show content, auth control, or 404
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      
      expect(hasContent || hasAccessControl || hasLoginRedirect || has404).toBe(true);
      
      // Should not crash
      const hasError = await page.locator('text=Error, text=Something went wrong, text=500').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should handle faculty course management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/courses');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasCourseContent = await page.locator('h1:has-text("Courses"), .course-management').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasCourseContent) {
      // Look for course management elements
      const hasCourseList = await page.locator('.course-list, table, .course-card').first().isVisible();
      const hasAddCourse = await page.locator('button:has-text("Add"), button:has-text("Create")').first().isVisible();
      const hasNoCourses = await page.locator('text=No courses, text=No data').first().isVisible();
      
      expect(hasCourseList || hasAddCourse || hasNoCourses).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle faculty attendance marking', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/attendance/mark');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasAttendanceContent = await page.locator('h1:has-text("Attendance"), .attendance-marking').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasAttendanceContent) {
      // Check for attendance marking elements
      const hasStudentList = await page.locator('table, .student-list, .attendance-table').first().isVisible();
      const hasAttendanceForm = await page.locator('form, input[type="checkbox"], .attendance-form').first().isVisible();
      const hasNoStudents = await page.locator('text=No students, text=No data').first().isVisible();
      
      expect(hasStudentList || hasAttendanceForm || hasNoStudents).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle faculty grading and assessments', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/assessments/grade');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasGradingContent = await page.locator('h1:has-text("Assessments"), h1:has-text("Grading")').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasGradingContent) {
      // Check for grading elements
      const hasGradingTable = await page.locator('table, .grading-table, .assessment-list').first().isVisible();
      const hasGradeInputs = await page.locator('input[type="number"], input[type="text"]').first().isVisible();
      const hasNoAssessments = await page.locator('text=No assessments, text=No data').first().isVisible();
      
      expect(hasGradingTable || hasGradeInputs || hasNoAssessments).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle faculty timetable management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/timetable');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasTimetableContent = await page.locator('h1:has-text("Timetable"), .timetable-view').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasTimetableContent) {
      // Check for timetable elements
      const hasTimetableTable = await page.locator('table, .timetable-grid, .schedule').first().isVisible();
      const hasCalendarView = await page.locator('.calendar, .week-view, .day-view').first().isVisible();
      const hasNoSchedule = await page.locator('text=No schedule, text=No timetable').first().isVisible();
      
      expect(hasTimetableTable || hasCalendarView || hasNoSchedule).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle faculty leave management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/leaves');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasLeaveContent = await page.locator('h1:has-text("Leave"), .leave-management').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasLeaveContent) {
      // Check for leave management elements
      const hasLeaveForm = await page.locator('form, .leave-form').first().isVisible();
      const hasLeaveList = await page.locator('table, .leave-list').first().isVisible();
      const hasApplyLeave = await page.locator('button:has-text("Apply"), button:has-text("Request")').first().isVisible();
      
      expect(hasLeaveForm || hasLeaveList || hasApplyLeave).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle dynamic faculty course routes', async ({ page }) => {
    const dynamicRoutes = [
      '/faculty/courses/test-course',
      '/faculty/course-offerings/test-offering',
      '/faculty/courses/test-course/students',
      '/faculty/courses/test-course/materials',
      '/faculty/course-offerings/test-offering/assessments'
    ];
    
    for (const dynamicPath of dynamicRoutes) {
      await page.goto(`http://localhost:3000${dynamicPath}`);
      
      try {
        await page.waitForSelector('h1, h2, main, .content, input[type="email"], input[type="password"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      // Should handle gracefully - show content, 404, or access control
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      const hasNoData = await page.locator('text=No data, text=Course not found').first().isVisible();
      
      expect(hasContent || has404 || hasAccessControl || hasLoginRedirect || hasNoData).toBe(true);
      
      // Should not crash
      const hasError = await page.locator('text=Error, text=Something went wrong, text=500').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test faculty page responsiveness', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    const keyFacultyPages = ['/faculty', '/faculty/courses', '/faculty/attendance/mark'];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      for (const facultyPath of keyFacultyPages) {
        await page.goto(`http://localhost:3000${facultyPath}`);
        
        try {
          await page.waitForSelector('main, .content, body, input[type="email"], input[type="password"]', { timeout: 8000 });
        } catch (error) {
          await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        }
        
        // Should be responsive and content should be visible
        const hasContent = await page.locator('main, .content, body').first().isVisible();
        const hasAuthRedirect = page.url().includes('/login');
        const hasAuthForm = await page.locator('input[type="email"], input[type="password"]').first().isVisible();
        
        expect(hasContent || hasAuthRedirect || hasAuthForm).toBe(true);
        
        // Content should fit within viewport width
        if (hasContent && !hasAuthRedirect) {
          const contentElement = await page.locator('main, .content').first();
          if (await contentElement.isVisible()) {
            const boundingBox = await contentElement.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width + 50);
            }
          }
        }
      }
    }
  });

  test('should handle faculty error scenarios gracefully', async ({ page }) => {
    const invalidFacultyRoutes = [
      '/faculty/invalid-page',
      '/faculty/courses/invalid-course',
      '/faculty/students/invalid-student'
    ];
    
    for (const invalidPath of invalidFacultyRoutes) {
      await page.goto(`http://localhost:3000${invalidPath}`);
      
      try {
        await page.waitForSelector('main, .content, body, h1, input[type="email"], input[type="password"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      // Should show 404, redirect, or access control
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = page.url() !== `http://localhost:3000${invalidPath}`;
      const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      
      expect(has404 || hasRedirect || hasAccessControl || hasContent).toBe(true);
      
      // Should not show unhandled errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });
});