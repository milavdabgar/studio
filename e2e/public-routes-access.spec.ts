import { test, expect } from '@playwright/test';

test.describe('Public Routes Access', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication cookies
    await page.context().clearCookies();
  });

  test('should access homepage without authentication', async ({ page }) => {
    await page.goto('/');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toMatch(/\/$|\/$/);
    
    // Should see college branding in header
    await expect(page.locator('header').getByText('Government Polytechnic Palanpur')).toBeVisible();
    await expect(page.locator('header').getByText('Excellence in Technical Education')).toBeVisible();
  });

  test('should access about page without authentication', async ({ page }) => {
    await page.goto('/about');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/about');
    
    // Should see about page content
    await expect(page.locator('section h1')).toContainText('About');
    await expect(page.locator('section h1').getByText('Government Polytechnic Palanpur')).toBeVisible();
  });

  test('should access departments page without authentication', async ({ page }) => {
    await page.goto('/departments');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/departments');
    
    // Should see departments page content
    await expect(page.locator('section h1')).toContainText('Engineering Departments');
    await expect(page.getByText('Civil Engineering').first()).toBeVisible();
    await expect(page.getByText('Electrical Engineering').first()).toBeVisible();
  });

  test('should access admissions page without authentication', async ({ page }) => {
    await page.goto('/admissions');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/admissions');
    
    // Should see admissions page content
    await expect(page.getByRole('heading', { name: /Admissions/ })).toBeVisible();
    await expect(page.locator('text=Academic Year 2025-26')).toBeVisible();
  });

  test('should access facilities page without authentication', async ({ page }) => {
    await page.goto('/facilities');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/facilities');
    
    // Should see facilities page content
    await expect(page.locator('section h1')).toContainText('Campus Facilities');
    await expect(page.getByText('Modern Laboratories').first()).toBeVisible();
  });

  test('should access contact page without authentication', async ({ page }) => {
    await page.goto('/contact');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/contact');
    
    // Should see contact page content
    await expect(page.locator('section h1')).toContainText('Contact Us');
    await expect(page.locator('text=gppalanpur@gmail.com')).toBeVisible();
  });

  test('should access newsletters page without authentication', async ({ page }) => {
    await page.goto('/newsletters');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/newsletters');
    
    // Should see newsletters page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should access posts page without authentication', async ({ page }) => {
    await page.goto('/posts');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/posts');
    
    // Should see posts page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('protected routes should still redirect to login', async ({ page }) => {
    // Test admin route
    await page.goto('/admin');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
    
    // Test student route
    await page.goto('/student');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
    
    // Test faculty route
    await page.goto('/faculty');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
    
    // Test dashboard route
    await page.goto('/dashboard');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('navigation between public pages should work', async ({ page }) => {
    await page.goto('/');
    
    // Click on About link in header navigation
    await page.locator('nav').getByRole('link', { name: 'About' }).first().click();
    await page.waitForURL('**/about');
    expect(page.url()).toContain('/about');
    
    // Go back to home and test other links
    await page.goto('/');
    
    // Click on Departments link
    await page.locator('nav').getByRole('link', { name: 'Departments' }).first().click();
    await page.waitForURL('**/departments');
    expect(page.url()).toContain('/departments');
    
    // Go back to home 
    await page.goto('/');
    
    // Click on Admissions link
    await page.locator('nav').getByRole('link', { name: 'Admissions' }).first().click();
    await page.waitForURL('**/admissions');
    expect(page.url()).toContain('/admissions');
    
    // Go back to home
    await page.goto('/');
    
    // Click on Facilities link
    await page.locator('nav').getByRole('link', { name: 'Facilities' }).first().click();
    await page.waitForURL('**/facilities');
    expect(page.url()).toContain('/facilities');
    
    // Go back to home
    await page.goto('/');
    
    // Click on Contact link
    await page.locator('nav').getByRole('link', { name: 'Contact' }).first().click();
    await page.waitForURL('**/contact');
    expect(page.url()).toContain('/contact');
  });

  test('Portal login button should work from public pages', async ({ page }) => {
    await page.goto('/');
    
    // Click Portal button in header
    await page.click('text=Portal');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
    
    // Should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('middleware should not interfere with API routes', async ({ page }) => {
    // Test that API routes are not affected by middleware redirects
    const response = await page.request.get('/api/health');
    expect(response.status()).not.toBe(302); // Should not redirect
  });

  test('static assets should load without authentication', async ({ page }) => {
    await page.goto('/');
    
    // Check that favicon loads
    const faviconResponse = await page.request.get('/favicon.ico');
    expect(faviconResponse.status()).toBe(200);
    
    // Check that Next.js assets load
    await page.waitForLoadState('networkidle');
    
    // Should not have any redirect responses for static assets
    const responses = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').map((entry: any) => ({
        name: entry.name,
        redirectCount: entry.redirectCount
      }));
    });
    
    // Main page should not have redirects
    expect(responses[0].redirectCount).toBe(0);
  });
});