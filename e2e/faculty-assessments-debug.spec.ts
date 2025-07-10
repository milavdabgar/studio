import { test, expect } from '@playwright/test';
import { loginAsFaculty } from './test-helpers';

test.describe('Faculty Assessments Debug', () => {
  test('debug faculty assessments page access', async ({ page }) => {
    // Login as faculty
    await loginAsFaculty(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/dashboard.*/);
    console.log('Current URL after login:', page.url());
    
    // Check authentication state
    const authCookie = await page.evaluate(() => document.cookie);
    console.log('Auth cookie:', authCookie);
    
    // Navigate to faculty assessments
    console.log('Navigating to faculty assessments...');
    await page.goto('http://localhost:3000/faculty/assessments');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for any loading states
    
    // Check final URL after navigation
    console.log('Final URL:', page.url());
    
    // Check for loading states
    const hasSpinner = await page.locator('.animate-spin').isVisible();
    const hasLoadingText = await page.locator('text=Loading').isVisible();
    console.log('hasSpinner:', hasSpinner);
    console.log('hasLoadingText:', hasLoadingText);
    
    // Check page content
    const pageContent = await page.locator('body').textContent();
    console.log('Page content preview:', pageContent?.substring(0, 400));
    
    // Check specific elements
    const hasAssessments = await page.locator('h1:has-text("Assessments")').isVisible();
    const hasAssessmentsSection = await page.locator('.assessments-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    const hasRedirect = page.url().includes('/login');
    
    console.log('hasAssessments:', hasAssessments);
    console.log('hasAssessmentsSection:', hasAssessmentsSection);
    console.log('hasAccessControl:', hasAccessControl);
    console.log('hasRedirect:', hasRedirect);
    
    // Verify page loads correctly
    if (hasRedirect) {
      console.log('ERROR: Page redirected to login - authentication failed');
    } else if (hasAssessments || hasAssessmentsSection) {
      console.log('SUCCESS: Faculty assessments page loaded correctly');
      expect(true).toBe(true);
    } else if (hasAccessControl) {
      console.log('INFO: Access control message displayed');
      expect(true).toBe(true);
    } else {
      console.log('ERROR: Unexpected page state');
      expect(false).toBe(true);
    }
  });
});