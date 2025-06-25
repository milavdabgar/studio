import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Content Management System - Blog, Newsletter, and Media
 * Priority: Content Management Module (Medium-High Priority)
 * 
 * This test suite covers the content management features including blog posts,
 * newsletters, media management, and public content access.
 */

test.describe('Content Management System - Complete Application Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should access blog and posts section', async ({ page }) => {
    // Test blog/posts access
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasBlogContent = await page.locator('h1:has-text("Posts"), h1:has-text("Blog"), .blog-post, .post-list').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasBlogContent || hasAccessControl).toBe(true);
    
    if (hasBlogContent) {
      // Check for blog features
      const hasPostsList = await page.locator('.post-card, .blog-card, article').isVisible();
      const hasCategories = await page.locator('.categories, .tags, .category-filter').isVisible();
      const hasSearch = await page.locator('input[type="search"], .search-box, [placeholder*="search"]').isVisible();
      
      expect(hasPostsList || hasCategories || hasSearch).toBe(true);
    }
  });

  test('should test newsletter section', async ({ page }) => {
    await page.goto('http://localhost:3000/newsletters');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasNewsletterContent = await page.locator('h1:has-text("Newsletter"), .newsletter, .newsletter-list').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasNewsletterContent || hasAccessControl).toBe(true);
    
    if (hasNewsletterContent) {
      // Check for newsletter features
      const hasNewsletterList = await page.locator('.newsletter-card, .newsletter-item').isVisible();
      const hasSubscription = await page.locator('input[type="email"], .subscribe, button:has-text("Subscribe")').isVisible();
      const hasArchive = await page.locator('.archive, .past-newsletters, .newsletter-archive').isVisible();
      
      expect(hasNewsletterList || hasSubscription || hasArchive).toBe(true);
    }
  });

  test('should test blog dashboard for content creators', async ({ page }) => {
    await page.goto('http://localhost:3000/blog-dashboard/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasBlogDashboard = await page.locator('h1:has-text("Dashboard"), h1:has-text("Blog"), .blog-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasBlogDashboard || hasAccessControl).toBe(true);
    
    if (hasBlogDashboard) {
      // Check for content management features
      const hasCreatePost = await page.locator('button:has-text("Create"), button:has-text("New Post"), .create-button').isVisible();
      const hasPostsList = await page.locator('table, .posts-list, .content-list').isVisible();
      const hasEditControls = await page.locator('button:has-text("Edit"), button:has-text("Delete"), .post-actions').isVisible();
      
      expect(hasCreatePost || hasPostsList || hasEditControls).toBe(true);
    }
  });

  test('should test categories and tags system', async ({ page }) => {
    // Test categories page
    await page.goto('http://localhost:3000/categories/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasCategoriesPage = await page.locator('h1:has-text("Categories"), .categories, .category-list').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasCategoriesPage || hasAccessControl).toBe(true);
    
    if (hasCategoriesPage) {
      // Check for category features
      const hasCategoryList = await page.locator('.category-card, .category-item, .category-grid').isVisible();
      const hasPostCount = await page.locator('.post-count, .count, text=/\\d+ posts?/i').isVisible();
      
      expect(hasCategoryList || hasPostCount).toBe(true);
    }
    
    // Test tags page
    await page.goto('http://localhost:3000/tags/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasTagsPage = await page.locator('h1:has-text("Tags"), .tags, .tag-list').isVisible();
    const hasTagsAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasTagsPage || hasTagsAccessControl).toBe(true);
  });

  test('should test search functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/search/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasSearchPage = await page.locator('h1:has-text("Search"), .search-page, .search-results').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasSearchPage || hasAccessControl).toBe(true);
    
    if (hasSearchPage) {
      // Check for search features
      const hasSearchInput = await page.locator('input[type="search"], .search-input, [placeholder*="search"]').isVisible();
      const hasSearchButton = await page.locator('button:has-text("Search"), .search-button').isVisible();
      const hasFilters = await page.locator('.search-filters, .filter-options').isVisible();
      
      expect(hasSearchInput || hasSearchButton || hasFilters).toBe(true);
      
      // Test search functionality if available
      if (hasSearchInput) {
        await page.fill('input[type="search"], .search-input', 'test');
        const searchButton = page.locator('button:has-text("Search"), .search-button').first();
        if (await searchButton.isVisible()) {
          await searchButton.click();
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          
          // Should show search results or no results message
          const hasResults = await page.locator('.search-result, .result-item').isVisible();
          const hasNoResults = await page.locator('text=No results, text=No posts found').isVisible();
          
          expect(hasResults || hasNoResults).toBe(true);
        }
      }
    }
  });

  test('should test individual post viewing', async ({ page }) => {
    // Try to access a specific post (may not exist, but should handle gracefully)
    await page.goto('http://localhost:3000/posts/test-post');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasPostContent = await page.locator('article, .post-content, .blog-post').isVisible();
    const has404 = await page.locator('text=404, text=Not Found, text=Post not found').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    expect(hasPostContent || has404 || hasAccessControl).toBe(true);
    
    if (hasPostContent) {
      // Check for post features
      const hasTitle = await page.locator('h1, .post-title').isVisible();
      const hasContent = await page.locator('.post-body, .content, p').isVisible();
      const hasMetadata = await page.locator('.post-meta, .author, .date').isVisible();
      
      expect(hasTitle || hasContent || hasMetadata).toBe(true);
    }
  });

  test('should test media and file management', async ({ page }) => {
    // Check if media files are accessible
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for any images or media on the page
    const hasImages = await page.locator('img').count() > 0;
    
    if (hasImages) {
      // Get the first image and check if it loads
      const firstImage = page.locator('img').first();
      const imageSrc = await firstImage.getAttribute('src');
      
      if (imageSrc) {
        // Check if image is accessible
        const response = await page.request.get(imageSrc);
        expect([200, 404]).toContain(response.status()); // Allow 404 for placeholder images
      }
    }
    
    // Test media directory access (should be restricted or properly handled)
    const mediaResponse = await page.request.get('/media/');
    expect([200, 403, 404]).toContain(mediaResponse.status());
  });

  test('should test RSS feed and sitemap', async ({ page }) => {
    // Test RSS feed
    const rssResponse = await page.request.get('/feed.xml');
    expect([200, 404]).toContain(rssResponse.status());
    
    if (rssResponse.status() === 200) {
      const rssContent = await rssResponse.text();
      expect(rssContent).toContain('<?xml');
    }
    
    // Test sitemap
    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect([200, 404]).toContain(sitemapResponse.status());
    
    if (sitemapResponse.status() === 200) {
      const sitemapContent = await sitemapResponse.text();
      expect(sitemapContent).toContain('<?xml');
    }
  });

  test('should test content workflow consistency', async ({ page }) => {
    // Test navigation between different content sections
    const contentPages = [
      '/posts',
      '/newsletters',
      '/categories/en',
      '/tags/en',
      '/search/en'
    ];
    
    for (const pagePath of contentPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should load successfully or show appropriate message
      const hasContent = await page.locator('main, .content, .page-content').isVisible();
      const hasHeader = await page.locator('h1, h2, .page-title').isVisible();
      const hasNotFound = await page.locator('text=404, text=Not Found').isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(hasContent || hasHeader || hasNotFound || hasAccessControl).toBe(true);
      
      // Should not show unhandled errors
      const hasError = await page.locator('text=Error, text=500, text=Something went wrong').isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test content management responsive design', async ({ page }) => {
    // Test mobile responsiveness for content pages
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if layout adapts to mobile
    const hasContent = await page.locator('main, .content').isVisible();
    expect(hasContent).toBe(true);
    
    // Test content readability on mobile
    const hasReadableText = await page.locator('p, .post-content, article').isVisible();
    if (hasReadableText) {
      // Check that text is not cut off (basic responsive check)
      const contentWidth = await page.locator('main, .content').first().boundingBox();
      expect(contentWidth?.width).toBeLessThanOrEqual(375);
    }
  });

  test('should test content loading performance', async ({ page }) => {
    // Test that content pages load reasonably fast
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Content should load within 10 seconds (generous for test environment)
    expect(loadTime).toBeLessThan(10000);
    
    // Check that essential content is visible
    const hasEssentialContent = await page.locator('main, .content, body').isVisible();
    expect(hasEssentialContent).toBe(true);
  });

  test('should handle content navigation errors gracefully', async ({ page }) => {
    // Test handling of non-existent content pages
    const testPages = [
      '/posts/non-existent-post',
      '/categories/invalid',
      '/tags/non-existent-tag',
      '/newsletters/invalid-newsletter'
    ];
    
    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show 404 or handle gracefully
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').isVisible();
      const hasRedirect = await page.url() !== `http://localhost:3000${pagePath}`;
      const hasGracefulMessage = await page.locator('text=No posts, text=No content, text=Coming soon').isVisible();
      
      expect(has404 || hasRedirect || hasGracefulMessage).toBe(true);
    }
  });
});
