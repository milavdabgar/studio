import { test, expect } from '@playwright/test';

test('Newsletter Public Access Verification', async ({ page }) => {
  // Test 1: Access /newsletters without authentication
  await page.goto('http://localhost:3000/newsletters');
  await page.waitForTimeout(2000);
  
  // Verify we're NOT redirected to login page
  await expect(page).not.toHaveURL(/.*\/login/);
  await expect(page).toHaveURL(/.*\/newsletters$/);
  await expect(page.locator('body')).toBeVisible();
  
  // Test 2: Access /newsletters/ (with trailing slash) without authentication
  await page.goto('http://localhost:3000/newsletters/');
  await page.waitForTimeout(2000);
  
  // Verify redirect to /newsletters (without trailing slash) and NOT to login
  await expect(page).not.toHaveURL(/.*\/login/);
  await expect(page).toHaveURL(/.*\/newsletters$/);
  await expect(page.locator('body')).toBeVisible();
});
