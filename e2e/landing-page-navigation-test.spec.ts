import { test, expect } from '@playwright/test';

test('Landing Page Navigation Test', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check for main heading or title
  await expect(page.getByRole('heading', { name: /Premier Government Polytechnic/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Discover GP Palanpur/i })).toBeVisible();
  
  // Check for portal link/button
  const loginElement = page.getByRole('link', { name: 'Portal', exact: true });
  await expect(loginElement).toBeVisible();
  
  // Click portal button/link
  await loginElement.click();
  
  // Verify we're on login page
  await expect(page).toHaveURL(/.*\/login/);
  
  // Check for login form elements
  await expect(page.locator('h1, h2, form')).toBeVisible();
});
