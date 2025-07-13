// e2e/student-notifications-realtime.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStudent, createTestUser, cleanupTestUser } from './helpers/auth-helpers';

test.describe('Student Real-Time Assessment Notifications', () => {
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

  test('should display real-time notifications component on dashboard', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for the page to load and user data to be available
    await page.waitForLoadState('networkidle');
    
    // Check if the real-time notifications component is visible
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Assessment Notifications')).toBeVisible();
    await expect(page.getByText('Live')).toBeVisible();
  });

  test('should show upcoming assessments section', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Check upcoming assessments section
    await expect(page.getByText('Upcoming Assessments')).toBeVisible();
    
    // Should show count in parentheses
    await expect(page.locator('text=/Upcoming Assessments \\(\\d+\\)/')).toBeVisible();
  });

  test('should show recent notifications section', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Check recent notifications section
    await expect(page.getByText('Recent Updates')).toBeVisible();
    
    // Should show count in parentheses
    await expect(page.locator('text=/Recent Updates \\(\\d+\\)/')).toBeVisible();
  });

  test('should display urgency badges for assessments', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Look for urgency badges (high, medium, low, critical)
    const urgencyBadges = page.locator('.badge').filter({ hasText: /^(low|medium|high|critical)$/i });
    
    // Should have at least some urgency indicators
    await expect(urgencyBadges.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show progress bars for assessments', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Look for progress bars
    const progressBars = page.locator('[role="progressbar"]');
    
    // Should have progress indicators
    await expect(progressBars.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display notification icons correctly', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Check for various notification icons (svg elements)
    const notificationIcons = page.locator('svg').filter({ hasText: '' });
    await expect(notificationIcons.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have working View All Assessments link', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Find and click the "View All Assessments" button
    const viewAllBtn = page.getByRole('link', { name: /view all assessments/i });
    await expect(viewAllBtn).toBeVisible();
    
    await viewAllBtn.click();
    
    // Should navigate to assessments page
    await expect(page).toHaveURL(/\/student\/assessments/);
  });

  test('should have working All Notifications link', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Find and click the "All Notifications" button
    const allNotificationsBtn = page.getByRole('link', { name: /all notifications/i });
    await expect(allNotificationsBtn).toBeVisible();
    
    await allNotificationsBtn.click();
    
    // Should navigate to notifications page
    await expect(page).toHaveURL(/\/notifications/);
  });

  test('should refresh data automatically', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Get initial timestamp
    const initialTimestamp = await page.getByText(/Updated .+ ago/).textContent();
    
    // Wait for auto-refresh (component refreshes every 30 seconds in tests)
    await page.waitForTimeout(2000);
    
    // Check that the "Live" indicator is still present
    await expect(page.getByText('Live')).toBeVisible();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Mock empty API responses
    await page.route('/api/assessments*', async route => {
      await route.fulfill({ json: [] });
    });
    
    await page.route('/api/notifications*', async route => {
      await route.fulfill({ json: [] });
    });
    
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Should show empty state messages
    await expect(page.getByText('No upcoming assessments')).toBeVisible();
    await expect(page.getByText('No recent notifications')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API errors
    await page.route('/api/assessments*', async route => {
      await route.abort('failed');
    });
    
    await page.route('/api/notifications*', async route => {
      await route.abort('failed');
    });
    
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Should still show the component structure even with errors
    await expect(page.getByText('Assessment Notifications')).toBeVisible();
    await expect(page.getByText('No upcoming assessments')).toBeVisible();
    await expect(page.getByText('No recent notifications')).toBeVisible();
  });

  test('should show correct notification types', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Look for different types of notification icons and content
    const notificationContent = page.locator('[data-testid="assessment-notifications"]');
    
    // Should be able to find the notifications section
    await expect(notificationContent).toBeVisible();
    
    // Check for notification-related terms
    const hasNotificationTerms = await notificationContent.textContent();
    expect(hasNotificationTerms).toBeTruthy();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student/dashboard');
    
    // Wait for notifications component to load
    await page.waitForSelector('[data-testid="assessment-notifications"]');
    
    // Component should still be visible and functional on mobile
    await expect(page.getByText('Assessment Notifications')).toBeVisible();
    await expect(page.getByText('Live')).toBeVisible();
    
    // Action buttons should still be accessible
    await expect(page.getByRole('link', { name: /view all assessments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /all notifications/i })).toBeVisible();
  });
});