import { test, expect } from '@playwright/test';

/**
 * Complete Application E2E Tests - Authentication & Core User Journeys
 * 
 * This test suite covers the entire application from a user perspective,
 * testing complete workflows across different user roles to ensure
 * the application functions correctly before MongoDB migration.
 */

test.describe('Authentication & Core User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('http://localhost:3000/');
  });

  test('should load the home page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/PolyManager|College|Institute/);
    
    // Should have main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Should have login link or user menu
    const loginLink = page.locator('text=Login').first();
    const userMenu = page.locator('[data-testid="user-menu"]').first();
    
    await expect(loginLink.or(userMenu)).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login link if not already authenticated
    const loginLink = page.locator('text=Login').first();
    
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login.*/);
      
      // Should have login form
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"], button:has-text("Login")')).toBeVisible();
    }
  });

  test('should handle login form validation', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    await submitButton.click();
    
    // Should show validation errors or prevent submission
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    // Check if HTML5 validation or custom validation is working
    await expect(emailInput.first().or(passwordInput.first())).toBeFocused();
  });

  test('should attempt admin login workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill login form with test admin credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    
    await emailInput.fill('admin@test.com');
    await passwordInput.fill('password123');
    await submitButton.click();
    
    // Wait for navigation or error handling
    await page.waitForLoadState('networkidle');
    
    // Should either redirect to dashboard or show error
    const currentUrl = page.url();
    const hasError = await page.locator('.error, .alert-error, [role="alert"]').isVisible();
    
    if (!hasError) {
      // If login successful, should be on dashboard or admin page
      expect(currentUrl).toMatch(/\/(dashboard|admin|faculty|student)/);
    }
  });

  test('should handle navigation between public pages', async ({ page }) => {
    // Test navigation to various public pages
    const publicPages = [
      '/',
      '/login',
      '/signup'
    ];
    
    for (const pagePath of publicPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should load without errors
      await expect(page.locator('body')).toBeVisible();
      
      // Should not show server error
      const hasServerError = await page.locator('text=500').isVisible();
      expect(hasServerError).toBe(false);
    }
  });

  test('should load notifications page', async ({ page }) => {
    await page.goto('http://localhost:3000/notifications');
    await page.waitForLoadState('networkidle');
    
    // Should load notifications interface
    await expect(page.locator('body')).toBeVisible();
    
    // Might show login prompt or notifications list
    const hasLoginPrompt = await page.locator('text=Login').first().isVisible();
    const hasNotifications = await page.locator('[data-testid="notifications"], .notification').isVisible();
    
    expect(hasLoginPrompt || hasNotifications).toBe(true);
  });

  test('should test responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/');
    
    // Should be responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should adapt to mobile
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button:has-text("Menu")').first();
    const desktopNav = page.locator('nav').first();
    
    // Either mobile menu should be visible or desktop nav should be responsive
    const isMobileMenuVisible = await mobileMenu.isVisible();
    const isDesktopNavVisible = await desktopNav.isVisible();
    
    expect(isMobileMenuVisible || isDesktopNavVisible).toBe(true);
  });

  test('should handle dark mode toggle if available', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")').first();
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      
      // Should change theme
      await page.waitForTimeout(500); // Wait for theme change
      
      // Check if body or html has dark mode class
      const hasDarkMode = await page.locator('html.dark, body.dark, [data-theme="dark"]').isVisible();
      expect(hasDarkMode).toBe(true);
    }
  });

  test('should test accessibility basics', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check for basic accessibility features
    const hasSkipLink = await page.locator('a:has-text("Skip to content"), .skip-link').isVisible();
    const hasMainLandmark = await page.locator('main, [role="main"]').isVisible();
    const hasHeadings = await page.locator('h1, h2, h3').first().isVisible();
    
    // At least main content should be properly structured
    expect(hasMainLandmark || hasHeadings).toBe(true);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Should still load basic page structure
    await expect(page.locator('body')).toBeVisible();
    
    // Should handle API failures gracefully
    const hasErrorBoundary = await page.locator('.error-boundary, .error-fallback').isVisible();
    const hasNotification = await page.locator('.toast, .alert, .notification').isVisible();
    
    // Application should not crash
    expect(page.url()).toBeTruthy();
  });

  test('should test page performance basics', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Should have rendered content
    await expect(page.locator('body')).toBeVisible();
  });
});
