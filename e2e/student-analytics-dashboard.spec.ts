// e2e/student-analytics-dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStudent, createTestUser, cleanupTestUser } from './helpers/auth-helpers';

test.describe('Student Assessment Analytics Dashboard', () => {
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

  test('should access analytics dashboard from student dashboard', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Find and click the Analytics Dashboard quick action
    const analyticsButton = page.getByRole('link', { name: /analytics dashboard/i });
    await expect(analyticsButton).toBeVisible();
    
    await analyticsButton.click();
    
    // Should navigate to analytics page
    await expect(page).toHaveURL(/\/student\/analytics/);
  });

  test('should display analytics dashboard page correctly', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Check main title and description
    await expect(page.getByRole('heading', { name: /academic analytics/i })).toBeVisible();
    await expect(page.getByText(/comprehensive insights into your academic performance/i)).toBeVisible();
    
    // Check for Analytics Dashboard component
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible();
  });

  test('should show key performance metrics cards', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Check for key metrics
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
    await expect(page.getByText('Assessments')).toBeVisible();
    await expect(page.getByText('Best Score')).toBeVisible();
    
    // Should display percentage values
    await expect(page.locator('text=/%/')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Check for time range filter
    const timeRangeSelect = page.locator('button:has-text("Last 30 days")');
    await expect(timeRangeSelect).toBeVisible();
    
    // Check for assessment type filter
    const typeSelect = page.locator('button:has-text("All Types")');
    await expect(typeSelect).toBeVisible();
  });

  test('should switch between time ranges', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Click time range dropdown
    const timeRangeSelect = page.locator('button:has-text("Last 30 days")');
    await timeRangeSelect.click();
    
    // Should show time range options
    await expect(page.getByText('Last 7 days')).toBeVisible();
    await expect(page.getByText('Last 90 days')).toBeVisible();
    await expect(page.getByText('Last year')).toBeVisible();
    await expect(page.getByText('All time')).toBeVisible();
    
    // Select a different time range
    await page.getByText('Last 7 days').click();
    
    // Verify selection changed
    await expect(page.locator('button:has-text("Last 7 days")')).toBeVisible();
  });

  test('should switch between assessment types', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Click assessment type dropdown
    const typeSelect = page.locator('button:has-text("All Types")');
    await typeSelect.click();
    
    // Should show assessment type options (these come from API data)
    // We'll just verify the dropdown opens
    await expect(page.locator('[role="listbox"]')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Check that Overview tab is active by default
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'active');
    
    // Click Trends tab
    await page.getByRole('tab', { name: 'Trends' }).click();
    await expect(page.getByText('Monthly Performance Trends')).toBeVisible();
    
    // Click Performance tab
    await page.getByRole('tab', { name: 'Performance' }).click();
    await expect(page.getByText('Skill Performance Analysis')).toBeVisible();
    
    // Click Insights tab
    await page.getByRole('tab', { name: 'Insights' }).click();
    await expect(page.getByText('Key Insights')).toBeVisible();
    await expect(page.getByText('Areas for Improvement')).toBeVisible();
  });

  test('should display charts in overview tab', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Check for chart titles
    await expect(page.getByText('Score Over Time')).toBeVisible();
    await expect(page.getByText('Performance by Assessment Type')).toBeVisible();
    await expect(page.getByText('Grade Distribution')).toBeVisible();
    await expect(page.getByText('Performance Comparison')).toBeVisible();
    
    // Check for chart containers (recharts creates these)
    const chartContainers = page.locator('[data-testid="responsive-container"]');
    await expect(chartContainers.first()).toBeVisible();
  });

  test('should show performance comparison section', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Check performance comparison section
    await expect(page.getByText('Performance Comparison')).toBeVisible();
    await expect(page.getByText('Your Average')).toBeVisible();
    await expect(page.getByText('Class Average')).toBeVisible();
    await expect(page.getByText('Top Performers')).toBeVisible();
    
    // Should have progress bars
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
  });

  test('should display trends chart in trends tab', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load and navigate to trends
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    await page.getByRole('tab', { name: 'Trends' }).click();
    
    // Check trends content
    await expect(page.getByText('Monthly Performance Trends')).toBeVisible();
    await expect(page.getByText('Track your assessment completion and average scores over time')).toBeVisible();
  });

  test('should display skill analysis in performance tab', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load and navigate to performance
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    await page.getByRole('tab', { name: 'Performance' }).click();
    
    // Check skill analysis content
    await expect(page.getByText('Skill Performance Analysis')).toBeVisible();
    await expect(page.getByText('Breakdown of your performance across different skill areas')).toBeVisible();
  });

  test('should show insights and improvement areas', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load and navigate to insights
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    await page.getByRole('tab', { name: 'Insights' }).click();
    
    // Check insights sections
    await expect(page.getByText('Key Insights')).toBeVisible();
    await expect(page.getByText('Areas for Improvement')).toBeVisible();
    
    // Should show insight items
    await expect(page.getByText('Strong Performance')).toBeVisible();
    await expect(page.getByText('Consistency')).toBeVisible();
  });

  test('should have functional export and share buttons', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Check for action buttons in page header
    await expect(page.getByRole('button', { name: /export data/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
  });

  test('should export data functionality', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Click export button
    const exportBtn = page.getByRole('button', { name: /export data/i });
    await exportBtn.click();
    
    // Should show toast notification
    await expect(page.getByText(/export started/i)).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Click back to dashboard button
    const backBtn = page.getByRole('link', { name: /back to dashboard/i });
    await backBtn.click();
    
    // Should navigate back to student dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('should show additional resources section', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Scroll to bottom to see resources section
    await page.locator('text=Improve Your Performance').scrollIntoViewIfNeeded();
    
    // Check resources section
    await expect(page.getByText('Improve Your Performance')).toBeVisible();
    await expect(page.getByText('Based on your analytics, here are some resources')).toBeVisible();
    
    // Check resource links
    await expect(page.getByRole('link', { name: /study materials/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /upcoming assessments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /detailed results/i })).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Intercept API calls to simulate slow loading
    await page.route('/api/assessments', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: [] });
    });
    
    await page.route('/api/student-scores*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: [] });
    });
    
    await page.goto('/student/analytics');
    
    // Should show loading spinner initially
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // After loading, should show dashboard
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Mock empty API responses
    await page.route('/api/assessments', async route => {
      await route.fulfill({ json: [] });
    });
    
    await page.route('/api/student-scores*', async route => {
      await route.fulfill({ json: [] });
    });
    
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Should still show dashboard structure with zero values
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('0%')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API errors
    await page.route('/api/assessments', async route => {
      await route.abort('failed');
    });
    
    await page.route('/api/student-scores*', async route => {
      await route.abort('failed');
    });
    
    await page.goto('/student/analytics');
    
    // Should still show dashboard structure
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Average Score')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student/analytics');
    
    // Dashboard should be visible and functional on mobile
    await expect(page.getByText('Academic Analytics')).toBeVisible();
    await expect(page.getByText('Assessment Analytics Dashboard')).toBeVisible();
    
    // Tabs should still be accessible
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Trends' })).toBeVisible();
    
    // Metrics cards should stack vertically and be readable
    await expect(page.getByText('Average Score')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
  });

  test('should show trend indicators correctly', async ({ page }) => {
    await page.goto('/student/analytics');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Assessment Analytics Dashboard');
    
    // Look for trend icons (these appear next to metrics)
    const trendIcons = page.locator('svg[class*="trending"], svg[class*="arrow"]');
    
    // Should have some trend indicators in the metrics
    await expect(trendIcons.first()).toBeVisible({ timeout: 10000 });
  });
});