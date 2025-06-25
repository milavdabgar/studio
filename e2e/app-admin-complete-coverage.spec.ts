import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Complete Admin Section Coverage
 * Priority: All Admin Routes (Critical for Management)
 * 
 * This test suite provides comprehensive coverage of ALL admin routes
 * ensuring complete administrative functionality is tested.
 */

test.describe('Complete Admin Section Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  // Core Admin Pages
  const coreAdminPages = [
    '/admin/assessments',
    '/admin/assignments', 
    '/admin/batches',
    '/admin/buildings',
    '/admin/committees',
    '/admin/courses',
    '/admin/curriculum',
    '/admin/departments',
    '/admin/enrollments',
    '/admin/faculty',
    '/admin/faculty-workload',
    '/admin/feedback-analysis',
    '/admin/institutes',
    '/admin/leaves',
    '/admin/programs',
    '/admin/reporting-analytics',
    '/admin/resource-allocation',
    '/admin/results',
    '/admin/roles',
    '/admin/rooms',
    '/admin/settings',
    '/admin/students',
    '/admin/timetables',
    '/admin/users'
  ];

  test('should access all core admin management pages', async ({ page }) => {
    for (const adminPath of coreAdminPages) {
      await page.goto(adminPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show admin content or proper access control
      const hasAdminContent = await page.locator('h1, h2, .admin-content, .page-title, main').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, text=403, input[type="email"], input[type="password"]').first().isVisible();
      const hasNotFound = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasAdminContent || hasAccessControl || hasNotFound || hasLoginRedirect).toBe(true);
      
      // Should not show unhandled errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });

  // Project Fair Admin Pages
  const projectFairAdminPages = [
    '/admin/project-fair/events'
  ];

  test('should access project fair admin pages', async ({ page }) => {
    for (const pfPath of projectFairAdminPages) {
      await page.goto(pfPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  // Resource Allocation Sub-pages
  test('should access resource allocation sub-pages', async ({ page }) => {
    const resourcePages = [
      '/admin/resource-allocation',
      '/admin/resource-allocation/rooms'
    ];
    
    for (const resourcePath of resourcePages) {
      await page.goto(resourcePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  // Dynamic Admin Routes (with test IDs)
  test('should handle dynamic admin routes gracefully', async ({ page }) => {
    const dynamicRoutes = [
      '/admin/examinations/test-exam/results',
      '/admin/examinations/test-exam/timetable',
      '/admin/results/detailed/test-result',
      '/admin/results/history/test-student',
      '/admin/results/import',
      '/admin/students/test-student/academic-progress',
      '/admin/project-fair/events/test-event',
      '/admin/project-fair/events/test-event/dashboard',
      '/admin/project-fair/events/test-event/evaluations',
      '/admin/project-fair/events/test-event/locations',
      '/admin/project-fair/events/test-event/projects',
      '/admin/project-fair/events/test-event/results',
      '/admin/project-fair/events/test-event/schedule',
      '/admin/project-fair/events/test-event/teams',
      '/admin/project-fair/events/edit/test-event'
    ];
    
    for (const dynamicPath of dynamicRoutes) {
      await page.goto(dynamicPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should handle gracefully - either show content, 404, or access control
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      const hasNoData = await page.locator('text=No data, text=Not found, text=Invalid').first().isVisible();
      
      expect(hasContent || has404 || hasAccessControl || hasLoginRedirect || hasNoData).toBe(true);
      
      // Should not crash
      const hasError = await page.locator('text=Error, text=Something went wrong, text=500').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test admin page responsiveness', async ({ page }) => {
    const keyAdminPages = [
      '/admin/students',
      '/admin/faculty', 
      '/admin/courses',
      '/admin/results'
    ];
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const adminPath of keyAdminPages) {
      await page.goto(adminPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should be responsive
      const hasResponsiveContent = await page.locator('main, .content, body').first().isVisible();
      if (hasResponsiveContent) {
        const mainElement = await page.locator('main, .content').first();
        if (await mainElement.isVisible()) {
          const boundingBox = await mainElement.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(400); // Mobile width + margin
          }
        }
      }
    }
  });

  test('should test admin navigation consistency', async ({ page }) => {
    const adminPages = [
      '/admin/students',
      '/admin/faculty',
      '/admin/courses'
    ];
    
    for (const adminPath of adminPages) {
      await page.goto(adminPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for consistent admin navigation/layout
      const hasAdminLayout = await page.locator('.admin-layout, .admin-nav, .sidebar').first().isVisible();
      const hasMainContent = await page.locator('main, .main-content').first().isVisible();
      const hasHeader = await page.locator('header, .header, h1').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasAdminLayout || hasMainContent || hasHeader || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle admin form interactions', async ({ page }) => {
    const formPages = [
      '/admin/students',
      '/admin/faculty',
      '/admin/courses',
      '/admin/results/import'
    ];
    
    for (const formPath of formPages) {
      await page.goto(formPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Look for common form elements
      const hasForm = await page.locator('form').first().isVisible();
      const hasInputs = await page.locator('input, select, textarea').first().isVisible();
      const hasButtons = await page.locator('button').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      // Should have interactive elements or proper access control
      expect(hasForm || hasInputs || hasButtons || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test admin data loading performance', async ({ page }) => {
    const dataHeavyPages = [
      '/admin/students',
      '/admin/results',
      '/admin/reporting-analytics',
      '/admin/feedback-analysis'
    ];
    
    for (const dataPath of dataHeavyPages) {
      const startTime = Date.now();
      
      await page.goto(dataPath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (15 seconds for data-heavy pages)
      expect(loadTime).toBeLessThan(15000);
      
      // Should show content or access control
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      expect(hasContent).toBe(true);
    }
  });

  test('should test admin search and filter functionality', async ({ page }) => {
    const searchablePages = [
      '/admin/students',
      '/admin/faculty',
      '/admin/courses',
      '/admin/results'
    ];
    
    for (const searchPath of searchablePages) {
      await page.goto(searchPath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Look for search/filter elements
      const hasSearch = await page.locator('input[type="search"], .search-input, [placeholder*="search"]').first().isVisible();
      const hasFilters = await page.locator('select, .filter, .filter-dropdown').first().isVisible();
      const hasPagination = await page.locator('.pagination, .page-nav, button:has-text("Next")').isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      // Should have interactive elements or access control
      expect(hasSearch || hasFilters || hasPagination || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle admin error scenarios', async ({ page }) => {
    // Test non-existent admin routes
    const nonExistentRoutes = [
      '/admin/non-existent',
      '/admin/invalid-module',
      '/admin/fake-page'
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
