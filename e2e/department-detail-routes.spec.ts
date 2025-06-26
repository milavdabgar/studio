import { test, expect } from '@playwright/test';

test.describe('Department Detail Routes', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication cookies
    await page.context().clearCookies();
  });

  test('should access department detail pages from departments listing', async ({ page }) => {
    // Start from departments page
    await page.goto('/departments');
    
    // Wait for page to load
    await expect(page.locator('section h1')).toContainText('Engineering Departments');
    
    // Find and click the first "Learn More" link (should be Civil Engineering)
    await page.getByRole('link', { name: /Learn More About/ }).first().click();
    
    // Should navigate to a department detail page
    await page.waitForURL('**/departments/**');
    expect(page.url()).toMatch(/\/departments\/[^\/]+$/);
    
    // Should see department detail content
    await expect(page.locator('section h1')).toBeVisible();
    await expect(page.getByText('Department Overview')).toBeVisible();
    await expect(page.getByText('Areas of Specialization')).toBeVisible();
    await expect(page.getByText('Career Opportunities')).toBeVisible();
    
    // Should have navigation back to departments
    await expect(page.getByRole('link', { name: 'Back to Departments' })).toBeVisible();
  });

  test('should access specific department pages directly', async ({ page }) => {
    // Test Civil Engineering page
    await page.goto('/departments/civil-engineering');
    
    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/departments/civil-engineering');
    
    // Should see Civil Engineering content
    await expect(page.locator('section h1')).toContainText('Civil Engineering');
    await expect(page.getByText('Department Overview')).toBeVisible();
    
    // Test navigation
    await expect(page.getByRole('link', { name: 'Back to Departments' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Apply for Admission' })).toBeVisible();
  });

  test('should handle invalid department slugs', async ({ page }) => {
    // Try to access a non-existent department
    await page.goto('/departments/non-existent-department');
    
    // Should show not found page
    await expect(page.getByText('Department Not Found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View All Departments' })).toBeVisible();
  });

  test('navigation between department pages should work', async ({ page }) => {
    // Start from departments listing
    await page.goto('/departments');
    
    // Click first department
    await page.getByRole('link', { name: /Learn More About/ }).first().click();
    await page.waitForURL('**/departments/**');
    
    // Click back to departments
    await page.getByRole('link', { name: 'Back to Departments' }).click();
    await page.waitForURL('**/departments');
    expect(page.url()).toContain('/departments');
    expect(page.url()).not.toMatch(/\/departments\/[^\/]+$/);
    
    // Should see departments listing again
    await expect(page.locator('section h1')).toContainText('Engineering Departments');
  });
});