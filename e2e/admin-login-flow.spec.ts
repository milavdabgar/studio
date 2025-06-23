import { test, expect } from '@playwright/test';

test('Admin Login Flow', async ({ page }) => {
  // Navigate to the login page
  await page.goto('http://localhost:9003/login');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Fill in login credentials
  await page.fill('input[type="email"], input[name="email"], #email', 'admin@gppalanpur.in');
  await page.fill('input[type="password"], input[name="password"], #password', 'Admin@123');
  
  // Submit the form
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
  
  // Wait for navigation to complete
  await page.waitForTimeout(5000);
  
  // Check if we're on the dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
  
  // Look for dashboard content
  await expect(page.getByRole('heading', { name: 'Welcome to your Dashboard,' })).toBeVisible();
  
  // Verify we see the admin welcome message (just check the first occurrence)
  await expect(page.locator('text=Super Admin').first()).toBeVisible();
});
