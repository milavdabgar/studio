import { test, expect } from '@playwright/test';
import { loginAsFaculty } from './test-helpers';

test.describe('Faculty Profile Debug', () => {
  test('debug faculty profile page content', async ({ page }) => {
    // Login as faculty
    await loginAsFaculty(page);
    
    // Navigate to faculty profile
    console.log('Navigating to faculty profile...');
    await page.goto('http://localhost:3000/faculty/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Final URL:', page.url());
    
    // Check for loading states
    const hasSpinner = await page.locator('.animate-spin').isVisible();
    const hasLoadingText = await page.locator('text=Loading').isVisible();
    console.log('hasSpinner:', hasSpinner, 'hasLoadingText:', hasLoadingText);
    
    // Check for main elements the test expects
    const hasProfileCard = await page.locator('.card, .space-y-6').first().isVisible();
    console.log('hasProfileCard:', hasProfileCard);
    
    // Check for specific content
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    console.log('hasAccessControl:', hasAccessControl);
    
    // Get page content to see what's actually there
    const pageContent = await page.locator('body').textContent();
    console.log('Page content preview:', pageContent?.substring(0, 500));
    
    // Check for various possible faculty profile elements
    const profileElements = await Promise.all([
      page.locator('text=Dr. Faculty User').isVisible().catch(() => false),
      page.locator('text=faculty@gppalanpur..ac.in').isVisible().catch(() => false),
      page.locator('text=Computer Engineering').isVisible().catch(() => false),
      page.locator('text=Faculty Profile').isVisible().catch(() => false),
      page.locator('text=Profile').isVisible().catch(() => false),
      page.locator('.avatar').isVisible().catch(() => false),
      page.locator('button').isVisible().catch(() => false)
    ]);
    
    console.log('Profile elements found:', {
      'Dr. Faculty User': profileElements[0],
      'faculty@gppalanpur..ac.in': profileElements[1], 
      'Computer Engineering': profileElements[2],
      'Faculty Profile': profileElements[3],
      'Profile': profileElements[4],
      'avatar': profileElements[5],
      'button': profileElements[6]
    });
    
    // Test passes if we can see some content
    expect(hasProfileCard || hasAccessControl || profileElements.some(e => e)).toBe(true);
  });
});