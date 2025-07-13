// e2e/student-notifications-realtime-reliable.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStudent, cleanupTestUser, type TestUser } from './helpers/auth-helpers';

test.describe('Student Real-Time Assessment Notifications - Reliable Tests', () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    testUser = await loginAsStudent(page);
  });

  test.afterEach(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  test('should load student dashboard with user authentication', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify user is authenticated by checking for welcome message or user-specific content
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    
    // The page should not redirect to login
    expect(page.url()).toContain('/student/dashboard');
  });

  test('should display notifications component when user data is available', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for user authentication to complete
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    
    // Check for notifications component (it's conditionally rendered)
    const notificationsComponent = page.locator('[data-testid="assessment-notifications"]');
    
    // Component should appear once user data is loaded
    await expect(notificationsComponent).toBeVisible({ timeout: 15000 });
    
    // Check for key elements within the component
    await expect(page.getByText('Assessment Notifications')).toBeVisible();
    await expect(page.getByText('Live')).toBeVisible();
  });

  test('should show notifications sections', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    
    // Wait for notifications component
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    
    // Check for sections by using more specific selectors to avoid strict mode violations
    await expect(page.getByRole('heading', { name: /upcoming assessments/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /recent updates/i })).toBeVisible();
  });

  test('should have working action buttons', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication and component load
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    
    // Check for action buttons
    const viewAllAssessmentsBtn = page.getByRole('link', { name: /view all assessments/i });
    const allNotificationsBtn = page.getByRole('link', { name: /all notifications/i });
    
    await expect(viewAllAssessmentsBtn).toBeVisible();
    await expect(allNotificationsBtn).toBeVisible();
    
    // Test navigation
    await viewAllAssessmentsBtn.click();
    await expect(page).toHaveURL(/\/student\/assessments/);
    
    // Go back and test notifications link
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 10000 });
    await allNotificationsBtn.click();
    await expect(page).toHaveURL(/\/notifications/);
  });

  test('should display empty states appropriately', async ({ page }) => {
    // Mock empty API responses
    await page.route('/api/assessments*', async route => {
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.route('/api/notifications*', async route => {
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication and component
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    
    // Should show empty state messages
    await expect(page.getByText('No upcoming assessments')).toBeVisible({ timeout: 10000 });
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
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    
    // Component should still render
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    
    // Should show empty states when APIs fail
    await expect(page.getByText('No upcoming assessments')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('No recent notifications')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    
    // Component should be visible on mobile
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    
    // Key elements should be accessible
    await expect(page.getByText('Assessment Notifications')).toBeVisible();
    await expect(page.getByText('Live')).toBeVisible();
    
    // Action buttons should still work
    await expect(page.getByRole('link', { name: /view all assessments/i })).toBeVisible();
  });

  test('should show live indicator and refresh info', async ({ page }) => {
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication and component
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="assessment-notifications"]')).toBeVisible({ timeout: 15000 });
    
    // Check for live indicator
    await expect(page.getByText('Live')).toBeVisible();
    
    // Check for last updated timestamp (should contain "Updated" and "ago")
    await expect(page.locator('text=/updated.*ago/i')).toBeVisible({ timeout: 10000 });
  });
});