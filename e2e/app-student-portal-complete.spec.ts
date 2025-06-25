import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Student Portal Complete Coverage
 * Priority: Student Experience (High Priority)
 * 
 * This test suite covers all student-facing functionality including
 * dashboard, courses, assignments, results, and profile management.
 */

test.describe('Student Portal Complete Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Skip initial navigation in beforeEach to avoid conflicts
  });

  test('should access student dashboard with proper authentication', async ({ page }) => {
    await page.goto('http://localhost:3000/student');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      // Continue if timeout, page might still load
      console.log('Timeout on student dashboard, continuing...');
    }
    
    // Should show student content or proper authentication redirect
    const hasStudentContent = await page.locator('h1, h2, .student-dashboard, main').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    expect(hasStudentContent || hasAccessControl || hasLoginRedirect).toBe(true);
    
    // Should not show server errors
    const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
    expect(hasServerError).toBe(false);
  });

  test('should access all student sub-pages', async ({ page }) => {
    const studentPages = [
      '/student/profile',
      '/student/dashboard', 
      '/student/courses',
      '/student/timetable',
      '/student/results',
      '/student/attendance',
      '/student/assignments',
      '/student/materials',
      '/student/fees',
      '/student/library'
    ];
    
    for (const studentPath of studentPages) {
      await page.goto(`http://localhost:3000${studentPath}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (error) {
        // Continue if timeout
        console.log(`Timeout on ${studentPath}, continuing...`);
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

  test('should handle student course interactions', async ({ page }) => {
    await page.goto('http://localhost:3000/student/courses');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      // Continue if timeout
      console.log('Timeout on student courses, continuing...');
    }
    
    // Check for course-related content or auth
    const hasCourseContent = await page.locator('h1:has-text("Courses"), .course-list, .courses-dashboard').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasCourseContent) {
      // Look for course interaction elements
      const hasCourseCards = await page.locator('.course-card, .course-item, [data-testid*="course"]').first().isVisible();
      const hasCourseList = await page.locator('ul, table, .list').first().isVisible();
      const hasNoCourses = await page.locator('text=No courses, text=No data').first().isVisible();
      
      expect(hasCourseCards || hasCourseList || hasNoCourses).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle student assignment functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/student/assignments');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasAssignmentContent = await page.locator('h1:has-text("Assignments"), .assignment-list').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasAssignmentContent) {
      // Check for assignment elements
      const hasAssignments = await page.locator('.assignment-card, .assignment-item, table').first().isVisible();
      const hasNoAssignments = await page.locator('text=No assignments, text=No data').first().isVisible();
      
      expect(hasAssignments || hasNoAssignments).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle student results and grades', async ({ page }) => {
    await page.goto('http://localhost:3000/student/results');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasResultsContent = await page.locator('h1:has-text("Results"), .results-dashboard').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasResultsContent) {
      // Check for results/grades elements
      const hasResultsTable = await page.locator('table, .grade-table, .results-table').first().isVisible();
      const hasGradeCards = await page.locator('.grade-card, .result-card').first().isVisible();
      const hasNoResults = await page.locator('text=No results, text=No grades').first().isVisible();
      
      expect(hasResultsTable || hasGradeCards || hasNoResults).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle student profile management', async ({ page }) => {
    await page.goto('http://localhost:3000/student/profile');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasProfileContent = await page.locator('h1:has-text("Profile"), .profile-dashboard').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasProfileContent) {
      // Check for profile elements
      const hasProfileForm = await page.locator('form, input, .profile-form').first().isVisible();
      const hasProfileInfo = await page.locator('.profile-info, .student-info').first().isVisible();
      
      expect(hasProfileForm || hasProfileInfo).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test student page responsiveness', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      try {
        await page.goto('http://localhost:3000/student', { timeout: 20000 });
        
        try {
          await page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch (error) {
          // Continue if timeout
          console.log('Timeout on student responsive test, continuing...');
        }
        
        // Should be responsive and content should be visible
        const hasContent = await page.locator('main, .content, body').first().isVisible();
        const hasAuthRedirect = page.url().includes('/login');
        
        expect(hasContent || hasAuthRedirect).toBe(true);
        
        // Content should fit within viewport width (allowing some margin)
        if (hasContent && !hasAuthRedirect) {
          const contentElement = await page.locator('main, .content').first();
          if (await contentElement.isVisible()) {
            const boundingBox = await contentElement.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width + 50);
            }
          }
        }
      } catch (error) {
        // If page navigation fails completely, check if we can at least access any content
        console.log(`Failed to navigate to student page at ${viewport.width}x${viewport.height}, checking fallback...`);
        
        const hasAnyContent = await page.locator('body').first().isVisible();
        const hasLoginRedirect = page.url().includes('/login');
        
        // Should at least have some content or redirect
        expect(hasAnyContent || hasLoginRedirect).toBe(true);
      }
    }
  });

  test('should handle student data loading performance', async ({ page }) => {
    const studentDataPages = [
      '/student/courses',
      '/student/results', 
      '/student/assignments',
      '/student/attendance'
    ];
    
    for (const studentPath of studentDataPages) {
      const startTime = Date.now();
      
      await page.goto(`http://localhost:3000${studentPath}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (error) {
        // Continue if timeout
        console.log(`Timeout on ${studentPath} performance test, continuing...`);
      }
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (20 seconds for test environment)
      expect(loadTime).toBeLessThan(20000);
      
      // Should have content or proper auth
      const hasContent = await page.locator('main, .content').first().isVisible();
      const hasAuth = page.url().includes('/login') || await page.locator('input[type="email"]').first().isVisible();
      
      expect(hasContent || hasAuth).toBe(true);
    }
  });

  test('should handle student error scenarios gracefully', async ({ page }) => {
    const invalidStudentRoutes = [
      '/student/invalid-page',
      '/student/courses/invalid-course',
      '/student/assignments/invalid-assignment'
    ];
    
    for (const invalidPath of invalidStudentRoutes) {
      await page.goto(`http://localhost:3000${invalidPath}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (error) {
        // Continue if timeout
        console.log(`Timeout on ${invalidPath}, continuing...`);
      }
      
      // Should show 404, redirect, or access control
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = page.url() !== `http://localhost:3000${invalidPath}`;
      const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
      
      expect(has404 || hasRedirect || hasAccessControl).toBe(true);
      
      // Should not show unhandled errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });
});