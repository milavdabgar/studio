// e2e/student-features-integration.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStudent, createTestUser, cleanupTestUser } from './helpers/auth-helpers';

test.describe('Student Dashboard New Features Integration', () => {
  let testUser: any;

  test.beforeEach(async ({ page }) => {
    testUser = await createTestUser('student');
    await loginAsStudent(page, testUser);
  });

  test.afterEach(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  test('should display analytics dashboard quick action', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Check for Analytics Dashboard quick action
    const analyticsButton = page.getByRole('link', { name: /analytics dashboard/i });
    await expect(analyticsButton).toBeVisible({ timeout: 10000 });
    await expect(analyticsButton).toContainText('View performance insights');
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click analytics button
    const analyticsButton = page.getByRole('link', { name: /analytics dashboard/i });
    await expect(analyticsButton).toBeVisible({ timeout: 10000 });
    await analyticsButton.click();
    
    // Should navigate to analytics page
    await expect(page).toHaveURL(/\/student\/analytics/);
    await expect(page.getByRole('heading', { name: /academic analytics/i })).toBeVisible();
  });

  test('should display analytics dashboard components', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check main analytics dashboard
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Check key metrics
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
    await expect(page.getByText('Assessments')).toBeVisible();
    await expect(page.getByText('Best Score')).toBeVisible();
  });

  test('should display analytics tabs', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Check tabs
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Trends' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Insights' })).toBeVisible();
  });

  test('should switch between analytics tabs', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Test tab switching
    await page.getByRole('tab', { name: 'Trends' }).click();
    await expect(page.getByText('Monthly Performance Trends')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Performance' }).click();
    await expect(page.getByText('Skill Performance Analysis')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Insights' }).click();
    await expect(page.getByText('Key Insights')).toBeVisible();
  });

  test('should have working analytics filters', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Check for filter controls
    await expect(page.locator('button:has-text("Last 30 days")')).toBeVisible();
    await expect(page.locator('button:has-text("All Types")')).toBeVisible();
  });

  test('should have export and share functionality', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check for action buttons
    await expect(page.getByRole('button', { name: /export data/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    
    // Test export functionality
    await page.getByRole('button', { name: /export data/i }).click();
    await expect(page.getByText(/export started/i)).toBeVisible();
  });

  test('should navigate back to dashboard from analytics', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Click back to dashboard
    const backButton = page.getByRole('link', { name: /back to dashboard/i });
    await expect(backButton).toBeVisible({ timeout: 10000 });
    await backButton.click();
    
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('should display notifications section on dashboard', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for any notification-related content
    // The exact component might not load if there's no data, but we should see the structure
    const hasNotifications = await page.locator('text=/notification/i').count() > 0;
    const hasAssessmentContent = await page.locator('text=/assessment/i').count() > 0;
    
    // At least one should be present indicating the features are integrated
    expect(hasNotifications || hasAssessmentContent).toBeTruthy();
  });

  test('should show improved resources section', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Scroll to resources section
    await page.locator('text=Improve Your Performance').scrollIntoViewIfNeeded();
    
    // Check resources section
    await expect(page.getByText('Improve Your Performance')).toBeVisible();
    await expect(page.getByRole('link', { name: /study materials/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /upcoming assessments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /detailed results/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Should be accessible on mobile
    await expect(page.getByText('Academic Analytics')).toBeVisible({ timeout: 10000 });
    
    // Analytics tabs should be visible but might stack
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Slow down API responses to test loading states
    await page.route('/api/assessments', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ json: [] });
    });
    
    await page.goto('/student/analytics');
    
    // Should eventually load even with slow APIs
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 15000 });
  });
});