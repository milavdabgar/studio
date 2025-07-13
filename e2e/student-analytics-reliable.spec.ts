// e2e/student-analytics-reliable.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStudent, cleanupTestUser, type TestUser } from './helpers/auth-helpers';

test.describe('Student Analytics Dashboard - Reliable Tests', () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    testUser = await loginAsStudent(page);
  });

  test.afterEach(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  test('should access analytics dashboard from student dashboard', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    
    // Find Analytics Dashboard quick action
    const analyticsButton = page.getByRole('link', { name: /analytics dashboard/i });
    await expect(analyticsButton).toBeVisible({ timeout: 10000 });
    
    // Click to navigate
    await analyticsButton.click();
    
    // Should navigate to analytics page
    await expect(page).toHaveURL(/\/student\/analytics/);
  });

  test('should display analytics page correctly', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check main page structure
    await expect(page.getByRole('heading', { name: /academic analytics/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Comprehensive insights into your academic performance and progress').first()).toBeVisible();
    
    // Check for the main analytics dashboard component
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('should show key performance metrics', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Check for key metrics cards
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
    await expect(page.getByText('Assessments').first()).toBeVisible();
    await expect(page.getByText('Best Score')).toBeVisible();
    
    // Should display some percentage values (even if 0%)
    await expect(page.locator('text=/%/').first()).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Check for filter dropdowns using more specific selectors
    await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('combobox').nth(1)).toBeVisible();
  });

  test('should navigate between analytics tabs', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Check that Overview tab is active by default
    const overviewTab = page.getByRole('tab', { name: 'Overview' });
    await expect(overviewTab).toBeVisible();
    await expect(overviewTab).toHaveAttribute('data-state', 'active');
    
    // Test Trends tab
    const trendsTab = page.getByRole('tab', { name: 'Trends' });
    await expect(trendsTab).toBeVisible();
    await trendsTab.click();
    
    await expect(page.getByText('Monthly Performance Trends')).toBeVisible({ timeout: 10000 });
    await expect(trendsTab).toHaveAttribute('data-state', 'active');
    
    // Test Performance tab
    const performanceTab = page.getByRole('tab', { name: 'Performance' });
    await expect(performanceTab).toBeVisible();
    await performanceTab.click();
    
    await expect(page.getByText('Skill Performance Analysis')).toBeVisible({ timeout: 10000 });
    await expect(performanceTab).toHaveAttribute('data-state', 'active');
    
    // Test Insights tab
    const insightsTab = page.getByRole('tab', { name: 'Insights' });
    await expect(insightsTab).toBeVisible();
    await insightsTab.click();
    
    await expect(page.getByText('Key Insights')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Areas for Improvement')).toBeVisible();
    await expect(insightsTab).toHaveAttribute('data-state', 'active');
  });

  test('should display overview tab charts', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard and ensure Overview tab is active
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'active');
    
    // Check for chart section titles
    await expect(page.getByText('Score Over Time')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Performance by Assessment Type')).toBeVisible();
    await expect(page.getByText('Grade Distribution')).toBeVisible();
    await expect(page.getByText('Performance Comparison')).toBeVisible();
  });

  test('should show performance comparison section', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Check performance comparison section
    await expect(page.getByText('Performance Comparison')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your Average')).toBeVisible();
    await expect(page.getByText('Class Average')).toBeVisible();
    await expect(page.getByText('Top Performers')).toBeVisible();
  });

  test('should have functional export and share buttons', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /academic analytics/i })).toBeVisible({ timeout: 20000 });
    
    // Check for action buttons
    const exportBtn = page.getByRole('button', { name: /export data/i });
    const shareBtn = page.getByRole('button', { name: /share/i });
    const backBtn = page.getByRole('link', { name: /back to dashboard/i });
    
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
    await expect(shareBtn).toBeVisible();
    await expect(backBtn).toBeVisible();
    
    // Test export functionality (should show toast)
    await exportBtn.click();
    await expect(page.getByText(/export started/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /academic analytics/i })).toBeVisible({ timeout: 20000 });
    
    // Click back to dashboard
    const backBtn = page.getByRole('link', { name: /back to dashboard/i });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();
    
    // Should navigate back
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 15000 });
  });

  test('should show resources section', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load and scroll to resources
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Scroll to resources section
    await page.locator('text=Improve Your Performance').scrollIntoViewIfNeeded();
    
    // Check resources section
    await expect(page.getByText('Improve Your Performance')).toBeVisible({ timeout: 10000 });
    
    // Check for resource links
    const studyMaterialsLink = page.getByRole('link', { name: /study materials/i });
    const assessmentsLink = page.getByRole('link', { name: /upcoming assessments/i });
    const resultsLink = page.getByRole('link', { name: /detailed results/i });
    
    await expect(studyMaterialsLink).toBeVisible();
    await expect(assessmentsLink).toBeVisible();
    await expect(resultsLink).toBeVisible();
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Mock empty API responses
    await page.route('/api/assessments', async route => {
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.route('/api/student-scores*', async route => {
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should still load with empty data
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Should show metrics with zero values
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('0%').first()).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Should be accessible on mobile
    await expect(page.getByText('Academic Analytics')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 15000 });
    
    // Tabs should be visible (might stack differently)
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Trends' })).toBeVisible();
    
    // Action buttons should be accessible
    await expect(page.getByRole('button', { name: /export data/i })).toBeVisible({ timeout: 10000 });
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Slow down API responses to test loading states
    await page.route('/api/assessments', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.route('/api/student-scores*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/student/analytics');
    
    // Should eventually load even with slow APIs
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 25000 });
  });

  test('should switch time range filter', async ({ page }) => {
    await page.goto('/student/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to load
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 20000 });
    
    // Find and click time range filter (first combobox)
    const timeRangeSelect = page.getByRole('combobox').first();
    await expect(timeRangeSelect).toBeVisible({ timeout: 10000 });
    await timeRangeSelect.click();
    
    // Should open dropdown
    await expect(page.getByText('Last 7 days')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Last 90 days')).toBeVisible();
    await expect(page.getByText('All time')).toBeVisible();
    
    // Select a different option
    await page.getByText('Last 7 days').click();
    
    // Filter should have been applied (we can't easily verify the text change without specific test attributes)
    await page.waitForTimeout(1000); // Give time for filter to apply
  });
});