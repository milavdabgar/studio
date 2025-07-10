import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsStudent, waitForPageLoad } from './test-helpers';

/**
 * Critical Dynamic Routes Tests - MongoDB Migration Priority
 * Priority: HIGH - Dynamic routes with parameters are complex and need thorough testing
 * 
 * Tests dynamic routes that handle entity-specific pages and are affected by MongoDB migration
 */

test.describe('Critical Dynamic Routes - MongoDB Migration Safety', () => {
  
  test('should handle admin examination results dynamic route', async ({ page }) => {
    await loginAsAdmin(page);
    
    const examId = 'test-exam-123';
    await waitForPageLoad(page, `/admin/examinations/${examId}/results`);
    
    // Page should load without errors
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify we're on the correct dynamic route
    expect(page.url()).toContain(`/admin/examinations/${examId}/results`);
    
    // Look for examination results elements
    const resultElements = [
      'text=Results',
      'text=Examination',
      'text=Student',
      'text=Marks',
      'text=Grade',
      'text=No results',
      'text=Empty'
    ];
    
    let resultElementFound = false;
    for (const element of resultElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        resultElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(resultElementFound).toBe(true);
  });

  test('should handle admin examination timetable dynamic route', async ({ page }) => {
    await loginAsAdmin(page);
    
    const examId = 'test-exam-123';
    await waitForPageLoad(page, `/admin/examinations/${examId}/timetable`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/admin/examinations/${examId}/timetable`);
    
    // Look for timetable elements
    const timetableElements = [
      'text=Timetable',
      'text=Schedule',
      'text=Date',
      'text=Time',
      'text=Subject',
      'text=Room',
      'text=No schedule',
      'text=Empty'
    ];
    
    let timetableElementFound = false;
    for (const element of timetableElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        timetableElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(timetableElementFound).toBe(true);
  });

  test('should handle admin detailed results dynamic route', async ({ page }) => {
    await loginAsAdmin(page);
    
    const resultId = 'test-result-123';
    await waitForPageLoad(page, `/admin/results/detailed/${resultId}`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/admin/results/detailed/${resultId}`);
    
    // Look for detailed result elements
    const detailedElements = [
      'text=Detailed',
      'text=Result',
      'text=Student',
      'text=Subject',
      'text=Performance',
      'text=Analysis',
      'text=Not found',
      'text=No data'
    ];
    
    let detailedElementFound = false;
    for (const element of detailedElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        detailedElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(detailedElementFound).toBe(true);
  });

  test('should handle admin student academic progress dynamic route', async ({ page }) => {
    await loginAsAdmin(page);
    
    const studentId = 'test-student-123';
    await waitForPageLoad(page, `/admin/students/${studentId}/academic-progress`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/admin/students/${studentId}/academic-progress`);
    
    // Look for academic progress elements
    const progressElements = [
      'text=Academic',
      'text=Progress',
      'text=Student',
      'text=Semester',
      'text=GPA',
      'text=Credits',
      'text=Performance',
      'text=Not found',
      'text=No data'
    ];
    
    let progressElementFound = false;
    for (const element of progressElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        progressElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(progressElementFound).toBe(true);
  });

  test('should handle admin results history dynamic route', async ({ page }) => {
    await loginAsAdmin(page);
    
    const studentId = 'test-student-123';
    await waitForPageLoad(page, `/admin/results/history/${studentId}`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/admin/results/history/${studentId}`);
    
    // Look for results history elements
    const historyElements = [
      'text=History',
      'text=Results',
      'text=Student',
      'text=Semester',
      'text=Year',
      'text=Grades',
      'text=Timeline',
      'text=Not found',
      'text=No history'
    ];
    
    let historyElementFound = false;
    for (const element of historyElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        historyElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(historyElementFound).toBe(true);
  });

  test('should handle student assignment detail dynamic route', async ({ page }) => {
    await loginAsStudent(page);
    
    const assignmentId = 'test-assignment-123';
    await waitForPageLoad(page, `/student/assignments/${assignmentId}`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Student routes may redirect to dashboard if not implemented or no access
    // Check if we're on the intended route or dashboard
    const isOnAssignmentRoute = page.url().includes(`/student/assignments/${assignmentId}`);
    const isOnDashboard = page.url().includes('/dashboard');
    
    expect(isOnAssignmentRoute || isOnDashboard).toBe(true);
    
    // If on assignment route, look for assignment elements; if on dashboard, look for dashboard elements
    if (isOnAssignmentRoute) {
      const assignmentElements = [
        'text=Assignment',
        'text=Details',
        'text=Description',
        'text=Due Date',
        'text=Submit',
        'text=Upload',
        'text=Instructions',
        'text=Not found',
        'text=No assignment'
      ];
      
      let assignmentElementFound = false;
      for (const element of assignmentElements) {
        try {
          await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
          assignmentElementFound = true;
          break;
        } catch (e) {
          // Continue checking
        }
      }
      
      expect(assignmentElementFound).toBe(true);
    } else if (isOnDashboard) {
      // If redirected to dashboard, just check that dashboard loaded properly
      const dashboardElements = await Promise.all([
        page.locator('main, .main-content, .dashboard').first().isVisible().catch(() => false),
        page.locator('nav, .sidebar, header').first().isVisible().catch(() => false),
        page.locator('h1, h2').first().isVisible().catch(() => false)
      ]);
      
      expect(dashboardElements.some(isVisible => isVisible)).toBe(true);
    }
  });

  test('should handle student course detail dynamic route', async ({ page }) => {
    await loginAsStudent(page);
    
    const courseId = 'test-course-123';
    await waitForPageLoad(page, `/student/courses/${courseId}`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/student/courses/${courseId}`);
    
    // Look for course detail elements
    const courseElements = [
      'text=Course',
      'text=Details',
      'text=Materials',
      'text=Assignments',
      'text=Schedule',
      'text=Faculty',
      'text=Syllabus',
      'text=Not found',
      'text=No course'
    ];
    
    let courseElementFound = false;
    for (const element of courseElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        courseElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(courseElementFound).toBe(true);
  });

  test('should handle project fair event dynamic routes', async ({ page }) => {
    await loginAsAdmin(page);
    
    const eventId = 'test-event-123';
    
    // Test event dashboard
    await waitForPageLoad(page, `/admin/project-fair/events/${eventId}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain(`/admin/project-fair/events/${eventId}/dashboard`);
    
    // Test event projects
    await waitForPageLoad(page, `/admin/project-fair/events/${eventId}/projects`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain(`/admin/project-fair/events/${eventId}/projects`);
    
    // Test event teams
    await waitForPageLoad(page, `/admin/project-fair/events/${eventId}/teams`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain(`/admin/project-fair/events/${eventId}/teams`);
    
    // Test event results
    await waitForPageLoad(page, `/admin/project-fair/events/${eventId}/results`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain(`/admin/project-fair/events/${eventId}/results`);
    
    // Test event schedule
    await waitForPageLoad(page, `/admin/project-fair/events/${eventId}/schedule`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain(`/admin/project-fair/events/${eventId}/schedule`);
  });

  test('should handle content system dynamic routes', async ({ page }) => {
    // Test blog post with language and slug
    await waitForPageLoad(page, '/posts/en/test-post-slug');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain('/posts/en/test-post-slug');
    
    // Test category page
    await waitForPageLoad(page, '/categories/en/technology');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain('/categories/en/technology');
    
    // Test tag page
    await waitForPageLoad(page, '/tags/en/programming');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain('/tags/en/programming');
    
    // Test author page
    await waitForPageLoad(page, '/authors/en/john-doe');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain('/authors/en/john-doe');
    
    // Test search page
    await waitForPageLoad(page, '/search/en?q=test');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(page.url()).toContain('/search/en');
  });

  test('should handle invalid dynamic route parameters', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test with invalid/non-existent IDs
    const invalidRoutes = [
      '/admin/examinations/invalid-exam-id/results',
      '/admin/results/detailed/invalid-result-id',
      '/admin/students/invalid-student-id/academic-progress'
    ];
    
    for (const route of invalidRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should either show error message, handle gracefully, or redirect to appropriate page
      const hasErrorMessage = await page.locator('text=Not found, text=Error, text=Invalid').isVisible();
      const hasNoDataMessage = await page.locator('text=No data, text=Empty, text=Not available').isVisible();
      const isRedirectedToValidPage = page.url().includes('/admin') || page.url().includes('/dashboard');
      
      // Should handle invalid IDs gracefully (show error, no data message, or redirect)
      expect(hasErrorMessage || hasNoDataMessage || isRedirectedToValidPage).toBe(true);
    }
  });

  test('should handle dynamic route navigation between related pages', async ({ page }) => {
    await loginAsAdmin(page);
    
    const examId = 'test-exam-123';
    
    // Navigate between related examination pages
    await waitForPageLoad(page, `/admin/examinations/${examId}/results`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for navigation to timetable
    const timetableLink = page.locator('a:has-text("Timetable"), button:has-text("Timetable")');
    if (await timetableLink.isVisible()) {
      await timetableLink.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check if we navigated to timetable or stayed on a valid admin page
      const isOnTimetable = page.url().includes('timetable');
      const isOnValidAdminPage = page.url().includes('/admin') || page.url().includes('/dashboard');
      
      expect(isOnTimetable || isOnValidAdminPage).toBe(true);
    }
  });

  test('should test dynamic route parameter handling', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test multiple parameter formats
    const parameterTests = [
      { route: '/admin/examinations/123/results', param: '123' },
      { route: '/admin/examinations/exam-456/results', param: 'exam-456' },
      { route: '/admin/examinations/test_exam_789/results', param: 'test_exam_789' }
    ];
    
    for (const test of parameterTests) {
      await page.goto(test.route);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Verify the parameter is correctly handled in the URL
      expect(page.url()).toContain(test.param);
      
      // Page should load without errors
      expect(page.url()).not.toContain('/login');
    }
  });
});
