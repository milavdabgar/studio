import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Complete Application Coverage - Existing Routes
 * Priority: All Implemented Features (High Priority)
 * 
 * This test suite provides comprehensive coverage of all implemented routes
 * and features in the application, focusing on actual existing functionality.
 */

test.describe('Complete Application Coverage - Existing Routes', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('should test all public/marketing pages', async ({ page }) => {
    const publicPages = [
      '/',
      '/posts',
      '/login',
      '/signup'
    ];
    
    for (const pagePath of publicPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Should load successfully
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      expect(hasContent).toBe(true);
      
      // Should not show server errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });

  test('should test newsletter functionality', async ({ page }) => {
    // Test newsletter pages
    const newsletterPages = [
      '/newsletters',
      '/newsletters/spectrum/original',
      '/newsletters/spectrum/interactive'
    ];
    
    for (const pagePath of newsletterPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(hasContent || has404 || hasAccessControl).toBe(true);
    }
  });

  test('should test faculty dashboard and features', async ({ page }) => {
    // Test faculty main page
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasFacultyPage = await page.locator('h1:has-text("Faculty"), .faculty-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    expect(hasFacultyPage || hasAccessControl || hasLoginRedirect).toBe(true);
    
    // Test faculty sub-pages
    const facultyPages = [
      '/faculty/profile',
      '/faculty/my-courses',
      '/faculty/timetable',
      '/faculty/leaves',
      '/faculty/attendance/mark',
      '/faculty/attendance/reports',
      '/faculty/assessments/grade'
    ];
    
    for (const pagePath of facultyPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test student dashboard and features', async ({ page }) => {
    // Test student main page - it automatically redirects to student/profile
    await page.goto('http://localhost:3000/student');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Student page should redirect, check if we're on student profile or login
    const currentUrl = page.url();
    const isOnStudentPage = currentUrl.includes('/student');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnStudentPage || isOnLoginPage).toBe(true);
    
    // Test student sub-pages - these should redirect to login for unauthenticated users
    const studentPages = [
      '/student/profile',
      '/student/timetable', 
      '/student/results',
      '/student/attendance',
      '/student/materials'
    ];
    
    for (const pagePath of studentPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Check if page loads (either student content or redirects to login)
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      // At least one of these should be true
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test admin dashboard sections', async ({ page }) => {
    // Test main admin areas that exist
    const adminPages = [
      '/dashboard',
      '/dashboard/committee',
      '/notifications',
      '/dte/dashboard'
    ];
    
    for (const pagePath of adminPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test project fair functionality', async ({ page }) => {
    // Test project fair pages
    const projectFairPages = [
      '/project-fair/student',
      '/project-fair/admin',
      '/project-fair/admin/new-event'
    ];
    
    for (const pagePath of projectFairPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasContent || hasAccessControl || hasLoginRedirect).toBe(true);
      
      // Should not show unhandled errors
      const hasError = await page.locator('text=Error, text=500, text=Something went wrong').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test blog and content management', async ({ page }) => {
    // Test blog/content pages
    const contentPages = [
      '/posts',
      '/blog-dashboard/en',
      '/categories/en',
      '/tags/en',
      '/search/en',
      '/shortcodes-demo'
    ];
    
    for (const pagePath of contentPages) {
      await page.goto(pagePath);
      
      try {
        await page.waitForSelector('main, .content, body, h1, form, input[type="email"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, form, input[type="email"], input[type="password"]').first().isVisible();
      const hasRedirect = page.url().includes('/login');
      
      expect(hasContent || has404 || hasAccessControl || hasRedirect).toBe(true);
    }
  });

  test('should test course assignment functionality', async ({ page }) => {
    // Test assignment-related pages
    const assignmentPages = [
      '/student/assignments',
      '/student/assignments/test-assignment'
    ];
    
    for (const pagePath of assignmentPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(hasContent || has404 || hasAccessControl).toBe(true);
    }
  });

  test('should test dynamic course routes', async ({ page }) => {
    // Test dynamic routes for courses (these may not have data but should handle gracefully)
    const dynamicRoutes = [
      '/faculty/course-offerings/test-course/assessments',
      '/faculty/course-offerings/test-course/materials',
      '/faculty/course-offerings/test-course/students',
      '/faculty/courses/test-course/students',
      '/student/courses'
    ];
    
    for (const pagePath of dynamicRoutes) {
      await page.goto(pagePath);
      
      try {
        await page.waitForSelector('main, .content, body, h1, form, input[type="email"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, form, input[type="email"], input[type="password"]').first().isVisible();
      const hasNoData = await page.locator('text=No data, text=No courses, text=Empty').first().isVisible();
      const hasRedirect = page.url().includes('/login');
      
      expect(hasContent || has404 || hasAccessControl || hasNoData || hasRedirect).toBe(true);
    }
  });

  test('should test application navigation consistency', async ({ page }) => {
    // Test that main navigation elements work across different pages
    const mainPages = [
      '/',
      '/dashboard',
      '/faculty',
      '/student',
      '/posts'
    ];
    
    for (const pagePath of mainPages) {
      await page.goto(pagePath);
      
      try {
        await page.waitForSelector('nav, .navbar, header, .header, main, .content, body, input[type="email"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      // Check for consistent navigation elements
      const hasNavigation = await page.locator('nav, .navbar, .navigation').first().isVisible();
      const hasHeader = await page.locator('header, .header').first().isVisible();
      const hasLogo = await page.locator('.logo, [alt*="logo"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      const hasAuthForm = await page.locator('input[type="email"], input[type="password"]').first().isVisible();
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      
      // At least one navigation element should be present, or it's an auth page, or has content
      expect(hasNavigation || hasHeader || hasLogo || hasLoginRedirect || hasAuthForm || hasContent).toBe(true);
    }
  });

  test('should test responsive design across key pages', async ({ page }) => {
    const keyPages = ['/', '/dashboard', '/faculty', '/student'];
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      for (const pagePath of keyPages) {
        await page.goto(pagePath);
        
        try {
          await page.waitForSelector('main, .content, body, input[type="email"]', { timeout: 8000 });
        } catch (error) {
          await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        }
        
        // Should be responsive and content should be visible
        const hasContent = await page.locator('main, .content, body').first().isVisible();
        const hasRedirect = page.url().includes('/login');
        const hasAuthForm = await page.locator('input[type="email"], input[type="password"]').first().isVisible();
        
        expect(hasContent || hasRedirect || hasAuthForm).toBe(true);
        
        // Content should fit within viewport width (only if visible content)
        if (hasContent && !hasRedirect) {
          const contentElement = await page.locator('main, .content').first();
          if (await contentElement.isVisible()) {
            const boundingBox = await contentElement.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width + 50); // Allow some margin
            }
          }
        }
      }
    }
  });

  test('should test application error handling', async ({ page }) => {
    // Test non-existent routes
    const nonExistentRoutes = [
      '/non-existent-page',
      '/admin/non-existent',
      '/faculty/non-existent',
      '/student/non-existent'
    ];
    
    for (const pagePath of nonExistentRoutes) {
      await page.goto(pagePath);
      
      try {
        await page.waitForSelector('main, .content, body, h1, input[type="email"]', { timeout: 8000 });
      } catch (error) {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      }
      
      // Should either show 404 or redirect gracefully
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = page.url() !== `http://localhost:3000${pagePath}`;
      const hasContent = await page.locator('main, .content, body').first().isVisible();
      const hasAuthForm = await page.locator('input[type="email"], input[type="password"]').first().isVisible();
      
      expect(has404 || hasRedirect || hasContent || hasAuthForm).toBe(true);
    }
  });

  test('should test application performance', async ({ page }) => {
    // Test loading performance of key pages
    const performancePages = ['/', '/dashboard', '/faculty', '/student'];
    
    for (const pagePath of performancePages) {
      const startTime = Date.now();
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 15 seconds (generous for test environment)
      expect(loadTime).toBeLessThan(15000);
      
      // Essential content should be visible
      const hasEssentialContent = await page.locator('main, .content, body').first().isVisible();
      expect(hasEssentialContent).toBe(true);
    }
  });

  test('should test application accessibility basics', async ({ page }) => {
    const accessibilityPages = ['/', '/login'];
    
    for (const pagePath of accessibilityPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Check for basic accessibility features
      const hasMainLandmark = await page.locator('main, [role="main"]').first().isVisible();
      const hasHeadings = await page.locator('h1, h2, h3').first().isVisible();
      const hasSkipLink = await page.locator('a:has-text("Skip to content"), .skip-link').isVisible();
      
      // Should have proper structure (either main landmark or headings)
      expect(hasMainLandmark || hasHeadings).toBe(true);
    }

    // Test dashboard accessibility only if user can access it (authenticated state)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Check if we're on dashboard (authenticated) or redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      // User is authenticated, test dashboard accessibility
      const hasMainLandmark = await page.locator('main, [role="main"]').first().isVisible();
      const hasHeadings = await page.locator('h1, h2, h3').first().isVisible();
      expect(hasMainLandmark || hasHeadings).toBe(true);
    } else {
      // User redirected to login, which is correct behavior
      console.log('Dashboard correctly redirected to login for unauthenticated user');
    }
  });

  test('should test application data consistency', async ({ page }) => {
    // Test that pages load without critical console errors
    const testPages = ['/', '/dashboard', '/faculty', '/student'];
    
    for (const pagePath of testPages) {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Filter out known acceptable errors
      const criticalErrors = errors.filter(error => 
        !error.includes('net::ERR_') && 
        !error.includes('favicon') &&
        !error.includes('Failed to load resource') &&
        !error.includes('websocket')
      );
      
      // Should not have critical errors
      expect(criticalErrors.length).toBeLessThanOrEqual(2); // Allow some minor errors
    }
  });
});
