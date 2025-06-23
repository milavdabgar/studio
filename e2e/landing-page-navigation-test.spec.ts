import { test, expect } from '@playwright/test';

test('Landing Page Navigation Test', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:9003');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check for main heading or title
  await expect(page.getByRole('heading', { name: 'PolyManager' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Streamline Your College' })).toBeVisible();
  
  // Check for login link/button
  const loginElement = page.getByRole('link', { name: 'Login' });
  await expect(loginElement).toBeVisible();
  
  // Click login button/link
  await loginElement.click();
  
  // Verify we're on login page
  await expect(page).toHaveURL(/.*\/login/);
  
  // Check for login form elements
  await expect(page.locator('h1, h2, form')).toBeVisible();
});
