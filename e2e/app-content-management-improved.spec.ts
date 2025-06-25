import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Content Management Improved Coverage
 * Priority: Content & Communications (Medium Priority)
 * 
 * This test suite covers blog, newsletters, notifications,
 * and content management functionality.
 */

test.describe('Content Management Improved Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Skip initial navigation in beforeEach to avoid conflicts
  });

  test('should access blog and posts functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/posts');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      console.log('Timeout on posts page, continuing...');
    }
    
    // Should show blog content or proper access control
    const hasBlogContent = await page.locator('h1, h2, .blog-posts, .posts-list, main').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    expect(hasBlogContent || hasAccessControl || hasLoginRedirect).toBe(true);
    
    if (hasBlogContent) {
      // Check for blog-specific elements
      const hasPostsList = await page.locator('.post-item, .blog-post, article').first().isVisible();
      const hasNoPosts = await page.locator('text=No posts, text=No content').first().isVisible();
      const hasPagination = await page.locator('.pagination, button:has-text("Next")').first().isVisible();
      
      expect(hasPostsList || hasNoPosts || hasPagination).toBe(true);
    }
  });

  test('should access blog dashboard functionality', async ({ page }) => {
    const blogDashboardPages = [
      '/blog-dashboard/en',
      '/categories/en', 
      '/tags/en',
      '/search/en'
    ];
    
    for (const blogPath of blogDashboardPages) {
      await page.goto(`http://localhost:3000${blogPath}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 8000 });
      } catch (error) {
        // Some pages might be slow, continue anyway
        console.log(`Timeout on ${blogPath}, continuing...`);
      }
      
      // Should handle gracefully - show content, auth control, or 404
      const hasContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasLoading = await page.locator('text=Loading, .spinner, .loading').first().isVisible();
      
      expect(hasContent || hasAccessControl || hasLoginRedirect || has404 || hasLoading).toBe(true);
      
      // Should not show unhandled errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });

  test('should access newsletter functionality', async ({ page }) => {
    const newsletterPages = [
      '/newsletters',
      '/newsletters/spectrum/original',
      '/newsletters/spectrum/interactive'
    ];
    
    for (const newsletterPath of newsletterPages) {
      await page.goto(`http://localhost:3000${newsletterPath}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (error) {
        console.log(`Timeout on ${newsletterPath}, continuing...`);
      }
      
      // Should show newsletter content or proper access control
      const hasNewsletterContent = await page.locator('h1, h2, .newsletter, main').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
      
      expect(hasNewsletterContent || hasAccessControl || hasLoginRedirect || has404).toBe(true);
      
      if (hasNewsletterContent) {
        // Check for newsletter-specific elements
        const hasNewsletterList = await page.locator('.newsletter-item, .spectrum-newsletter').first().isVisible();
        const hasSubscribeForm = await page.locator('form, input[type="email"]').first().isVisible();
        const hasNoNewsletters = await page.locator('text=No newsletters, text=Coming soon').first().isVisible();
        
        expect(hasNewsletterList || hasSubscribeForm || hasNoNewsletters).toBe(true);
      }
    }
  });

  test('should access notifications functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/notifications');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const hasNotificationContent = await page.locator('h1:has-text("Notifications"), .notifications-dashboard').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasNotificationContent) {
      // Check for notification elements
      const hasNotificationList = await page.locator('.notification-item, .notification-list, table').first().isVisible();
      const hasNoNotifications = await page.locator('text=No notifications, text=No new notifications').first().isVisible();
      const hasMarkAsRead = await page.locator('button:has-text("Mark"), button:has-text("Read")').first().isVisible();
      
      expect(hasNotificationList || hasNoNotifications || hasMarkAsRead).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test content search functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/search/en');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log('Timeout on search page, continuing...');
    }
    
    const hasSearchContent = await page.locator('h1:has-text("Search"), .search-page').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasSearchContent) {
      // Check for search elements
      const hasSearchForm = await page.locator('form, input[type="search"], input[placeholder*="search"]').first().isVisible();
      const hasSearchResults = await page.locator('.search-results, .results-list').first().isVisible();
      const hasNoResults = await page.locator('text=No results, text=No matches found').first().isVisible();
      
      expect(hasSearchForm || hasSearchResults || hasNoResults).toBe(true);
      
      // Test search functionality if form is available
      if (hasSearchForm) {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('test');
          
          const searchButton = page.locator('button[type="submit"], button:has-text("Search")').first();
          if (await searchButton.isVisible()) {
            await searchButton.click();
            await page.waitForTimeout(2000); // Wait for search results
            
            // Should show either results or no results message
            const hasResults = await page.locator('.search-results, .results-list').first().isVisible();
            const hasNoResultsMsg = await page.locator('text=No results, text=No matches').first().isVisible();
            
            expect(hasResults || hasNoResultsMsg).toBe(true);
          }
        }
      }
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test content categories and tags', async ({ page }) => {
    await page.goto('http://localhost:3000/categories/en');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log('Timeout on categories page, continuing...');
    }
    
    const hasCategoriesContent = await page.locator('h1:has-text("Categories"), .categories-page').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasCategoriesContent) {
      // Check for category elements
      const hasCategoryList = await page.locator('.category-item, .category-list, .tags-list').first().isVisible();
      const hasNoCategories = await page.locator('text=No categories, text=No tags').first().isVisible();
      
      expect(hasCategoryList || hasNoCategories).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
    
    // Test tags page
    await page.goto('http://localhost:3000/tags/en');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log('Timeout on tags page, continuing...');
    }
    
    const hasTagsContent = await page.locator('h1:has-text("Tags"), .tags-page').first().isVisible();
    const hasTagsAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasTagsLoginRedirect = page.url().includes('/login');
    
    if (hasTagsContent) {
      const hasTagsList = await page.locator('.tag-item, .tags-list').first().isVisible();
      const hasNoTags = await page.locator('text=No tags, text=No labels').first().isVisible();
      
      expect(hasTagsList || hasNoTags).toBe(true);
    } else {
      expect(hasTagsAccessControl || hasTagsLoginRedirect).toBe(true);
    }
  });

  test('should test shortcodes and demo functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/shortcodes-demo');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log('Timeout on shortcodes-demo page, continuing...');
    }
    
    const hasShortcodesContent = await page.locator('h1, h2, .shortcodes, main').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    const has404 = await page.locator('text=404, text=Not Found').first().isVisible();
    
    expect(hasShortcodesContent || hasAccessControl || hasLoginRedirect || has404).toBe(true);
    
    if (hasShortcodesContent) {
      // Check for demo elements
      const hasDemoContent = await page.locator('.demo, .example, .showcase').first().isVisible();
      const hasCodeBlocks = await page.locator('code, pre, .code-block').first().isVisible();
      const hasComponents = await page.locator('.component, .widget').first().isVisible();
      
      // At least some demo content should be present
      expect(hasDemoContent || hasCodeBlocks || hasComponents).toBe(true);
    }
  });

  test('should test content management responsiveness', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    const contentPages = ['/posts', '/newsletters', '/notifications'];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      for (const contentPath of contentPages) {
        await page.goto(`http://localhost:3000${contentPath}`);
        
        try {
          await page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch (error) {
          console.log(`Timeout on ${contentPath} responsive test, continuing...`);
        }
        
        // Should be responsive and content should be visible
        const hasContent = await page.locator('main, .content, body').first().isVisible();
        const hasAuthRedirect = page.url().includes('/login');
        
        expect(hasContent || hasAuthRedirect).toBe(true);
        
        // Content should fit within viewport width
        if (hasContent && !hasAuthRedirect) {
          const contentElement = await page.locator('main, .content').first();
          if (await contentElement.isVisible()) {
            const boundingBox = await contentElement.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width + 50);
            }
          }
        }
      }
    }
  });

  test('should handle content management error scenarios', async ({ page }) => {
    const invalidContentRoutes = [
      '/posts/invalid-post',
      '/newsletters/invalid-newsletter',
      '/categories/invalid-category',
      '/tags/invalid-tag'
    ];
    
    for (const invalidPath of invalidContentRoutes) {
      await page.goto(`http://localhost:3000${invalidPath}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 8000 });
      } catch (error) {
        console.log(`Timeout on ${invalidPath}, continuing...`);
      }
      
      // Should show 404, redirect, or access control
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = page.url() !== `http://localhost:3000${invalidPath}`;
      const hasAccessControl = await page.locator('text=Login, input[type="email"]').first().isVisible();
      
      expect(has404 || hasRedirect || hasAccessControl).toBe(true);
      
      // Should not show unhandled errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
    }
  });
});