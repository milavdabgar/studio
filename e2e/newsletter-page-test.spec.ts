import { test, expect } from '@playwright/test';

test('Newsletter Page Test', async ({ page }) => {
  // Navigate to the newsletters page
  await page.goto('http://localhost:9003/newsletters');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check for page heading
  const heading = page.locator('h1, h2, .newsletter-title');
  if (await heading.count() > 0) {
    await expect(heading.first()).toBeVisible();
  }
  
  // Check for newsletter content or links
  const content = page.locator('a, button, .newsletter-item, article, .newsletter');
  if (await content.count() > 0) {
    await expect(content.first()).toBeVisible();
  }
  
  // Try to interact with newsletter items if they exist
  const newsletterLinks = page.locator('a[href*="newsletter"], .newsletter-item');
  if (await newsletterLinks.count() > 0) {
    await newsletterLinks.first().click();
    await page.waitForTimeout(2000);
  }
});
