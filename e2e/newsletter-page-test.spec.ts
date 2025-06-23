import { test, expect } from '@playwright/test';

test('Newsletter Page Test - Public Access Verification', async ({ page }) => {
  // Navigate to the newsletters page without any authentication
  await page.goto('http://localhost:3000/newsletters');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Verify we're on the newsletters page and NOT redirected to login
  await expect(page).toHaveURL(/.*\/newsletters$/);
  await expect(page).not.toHaveURL(/.*\/login/);
  
  // Verify page content loads (look for the main heading)
  const heading = page.locator('h1').filter({ hasText: 'Spectrum Newsletter' });
  await expect(heading).toBeVisible();
  
  // Verify the page has actual newsletter content
  const description = page.locator('text=Department of Electronics & Communication Engineering');
  await expect(description).toBeVisible();
  
  // Check for newsletter approach cards
  const newsletterCards = page.locator('div').filter({ hasText: 'Markdown-Based Newsletter' });
  await expect(newsletterCards.first()).toBeVisible();
});

test('Newsletter Page Test - Trailing Slash Redirect', async ({ page }) => {
  // Test that /newsletters/ redirects properly to /newsletters
  await page.goto('http://localhost:3000/newsletters/');
  
  // Wait for any redirects to complete
  await page.waitForTimeout(2000);
  
  // Verify we end up on the correct newsletters page (without trailing slash)
  await expect(page).toHaveURL(/.*\/newsletters$/);
  await expect(page).not.toHaveURL(/.*\/login/);
  
  // Verify the page loads content
  const heading = page.locator('h1').filter({ hasText: 'Spectrum Newsletter' });
  await expect(heading).toBeVisible();
});

test('Newsletter Page Test - No Authentication Required', async ({ page }) => {
  // Clear any existing cookies to ensure we're truly unauthenticated
  await page.context().clearCookies();
  
  // Navigate to newsletters page
  await page.goto('http://localhost:3000/newsletters');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Should not redirect to login
  await expect(page).not.toHaveURL(/.*\/login/);
  
  // Should show actual newsletter content, not login form
  await expect(page.locator('input[type="email"]')).not.toBeVisible();
  await expect(page.locator('input[type="password"]')).not.toBeVisible();
  
  // Should show newsletter content
  const mainContent = page.locator('h1').filter({ hasText: 'Spectrum Newsletter' });
  await expect(mainContent).toBeVisible();
});
