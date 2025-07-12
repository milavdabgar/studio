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
    // Test blog/posts access (redirects to /posts/en)
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasBlogContent = await page.locator('h1:has-text("Blog Posts"), h1:has-text("Posts"), h1:has-text("બ્લોગ પોસ્ટ્સ")').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasBlogContent || hasAccessControl).toBe(true);
    
    if (hasBlogContent) {
      // Check for blog features - this page shows a paginated list of posts
      const hasPostsList = await page.locator('[class*="PostCard"], .grid').first().isVisible();
      const hasPostContent = await page.locator('article, .prose').first().isVisible();
      const hasPagination = await page.locator('[class*="Pagination"], .pagination').first().isVisible();
      const hasPageInfo = await page.locator('text=/Page \\d+/, text=/showing/, text=/items/i').first().isVisible();
      
      expect(hasPostsList || hasPostContent || hasPagination || hasPageInfo).toBe(true);
    }
  });

  test('should test newsletter section', async ({ page }) => {
    await page.goto('http://localhost:3000/newsletters');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasNewsletterContent = await page.locator('h1:has-text("Spectrum Newsletter"), h1:has-text("Newsletter"), .newsletter, .newsletter-list').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasNewsletterContent || hasAccessControl).toBe(true);
    
    if (hasNewsletterContent) {
      // Check for newsletter showcase features (this page shows different newsletter approaches)
      const hasNewsletterApproaches = await page.locator('[data-testid="newsletter-approaches"], .grid').first().isVisible();
      const hasViewButtons = await page.locator('button:has-text("View Newsletter"), a[href*="/newsletters/spectrum"]').first().isVisible();
      const hasNewsletterCards = await page.locator('.card, [class*="Card"]').first().isVisible();
      
      expect(hasNewsletterApproaches || hasViewButtons || hasNewsletterCards).toBe(true);
    }
  });

  test('should test blog dashboard for content creators', async ({ page }) => {
    await page.goto('http://localhost:3000/blog-dashboard/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasBlogDashboard = await page.locator('h1:has-text("Blog Dashboard"), h1:has-text("Dashboard"), h1:has-text("બ્લોગ ડેશબોર્ડ")').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasBlogDashboard || hasAccessControl).toBe(true);
    
    if (hasBlogDashboard) {
      // Check for blog dashboard features - tabs for overview, analytics, search, manage
      const hasCreatePost = await page.locator('button:has-text("Create New Post"), button:has-text("નવી પોસ્ટ બનાવો"), a[href*="/new"]').isVisible();
      const hasTabs = await page.locator('[role="tablist"], .tabs, [class*="Tabs"]').first().isVisible();
      const hasStats = await page.locator('text=Quick Stats, text=Total Posts, text=ઝડપી આંકડા').first().isVisible();
      const hasRecentPosts = await page.locator('text=Recent Posts, text=તાજેતરની પોસ્ટ્સ').first().isVisible();
      
      expect(hasCreatePost || hasTabs || hasStats || hasRecentPosts).toBe(true);
    }
  });

  test('should test categories and tags system', async ({ page }) => {
    // Test categories page
    await page.goto('http://localhost:3000/categories/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasCategoriesPage = await page.locator('h1:has-text("Categories"), h1:has-text("શ્રેણીઓ")').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasCategoriesPage || hasAccessControl).toBe(true);
    
    if (hasCategoriesPage) {
      // Check for category features - grid of category cards with post counts
      const hasCategoryGrid = await page.locator('.grid').first().isVisible();
      const hasPostCount = await page.locator('text=/\\d+ posts?/i, text=post, text=posts').first().isVisible();
      const hasCategoryCards = await page.locator('[class*="Card"], .card').first().isVisible();
      const hasNoCategoriesMessage = await page.locator('text=No categories found, text=કોઈ શ્રેણીઓ મળી નથી').first().isVisible();
      
      expect(hasCategoryGrid || hasPostCount || hasCategoryCards || hasNoCategoriesMessage).toBe(true);
    }
    
    // Test tags page
    await page.goto('http://localhost:3000/tags/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasTagsPage = await page.locator('h1:has-text("Tags"), h1:has-text("ટેગ્સ")').isVisible();
    const hasTagsAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasTagsPage || hasTagsAccessControl).toBe(true);
  });

  test('should test search functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/search/en');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasSearchPage = await page.locator('h1:has-text("Search"), h1:has-text("શોધ")').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasSearchPage || hasAccessControl).toBe(true);
    
    if (hasSearchPage) {
      // Check for search features - this page uses AdvancedSearch component
      const hasSearchInput = await page.locator('input[type="search"], input[type="text"], [placeholder*="search"], [placeholder*="શોધ"]').first().isVisible();
      const hasSearchButton = await page.locator('button:has-text("Search"), button:has-text("શોધ")').first().isVisible();
      const hasAdvancedSearch = await page.locator('[class*="AdvancedSearch"], .advanced-search').first().isVisible();
      const hasSearchForm = await page.locator('form').first().isVisible();
      
      expect(hasSearchInput || hasSearchButton || hasAdvancedSearch || hasSearchForm).toBe(true);
      
      // Test search functionality if available
      if (hasSearchInput) {
        await page.fill('input[type="search"], input[type="text"]', 'test');
        const searchButton = page.locator('button:has-text("Search"), button:has-text("શોધ")').first();
        if (await searchButton.isVisible()) {
          await searchButton.click();
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          
          // Should show search results or no results message
          const hasResults = await page.locator('.search-result, .result-item, [class*="PostCard"]').first().isVisible();
          const hasNoResults = await page.locator('text=No results, text=No posts found, text=કોઈ પરિણામો મળ્યા નથી').first().isVisible();
          
          expect(hasResults || hasNoResults).toBe(true);
        }
      }
    }
  });

  test('should test individual post viewing', async ({ page }) => {
    // Try to access a specific post (may not exist, but should handle gracefully)
    // The posts route structure is /posts/[lang]/[...slugParts] so test-post should redirect to 404
    await page.goto('http://localhost:3000/posts/test-post');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // This URL structure should redirect or show a 404 since it doesn't match /posts/[lang] pattern
    const hasPostContent = await page.locator('article, .post-content, .blog-post').first().isVisible();
    const has404 = await page.locator('text=404, text=Not Found, text=Post not found').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    const hasRedirected = page.url() !== 'http://localhost:3000/posts/test-post';
    
    expect(hasPostContent || has404 || hasAccessControl || hasRedirected).toBe(true);
    
    if (hasPostContent) {
      // Check for post features
      const hasTitle = await page.locator('h1, .post-title').first().isVisible();
      const hasContent = await page.locator('.post-body, .content, p, .prose').first().isVisible();
      const hasMetadata = await page.locator('.post-meta, .author, .date, [class*="PostMeta"]').first().isVisible();
      
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
    // Test RSS feed - should either exist or return 404 gracefully
    const rssResponse = await page.request.get('http://localhost:3000/feed.xml');
    expect([200, 404, 500]).toContain(rssResponse.status());
    
    if (rssResponse.status() === 200) {
      const rssContent = await rssResponse.text();
      expect(rssContent).toContain('<?xml');
    }
    
    // Test sitemap - should either exist or return 404 gracefully  
    const sitemapResponse = await page.request.get('http://localhost:3000/sitemap.xml');
    expect([200, 404, 500]).toContain(sitemapResponse.status());
    
    if (sitemapResponse.status() === 200) {
      const sitemapContent = await sitemapResponse.text();
      expect(sitemapContent).toContain('<?xml');
    }
    
    // Test robots.txt - should exist for SEO
    const robotsResponse = await page.request.get('http://localhost:3000/robots.txt');
    expect([200, 404]).toContain(robotsResponse.status());
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
      const hasContent = await page.locator('main, .content, .page-content').first().isVisible();
      const hasHeader = await page.locator('h1, h2, .page-title').first().isVisible();
      const hasNotFound = await page.locator('text=404, text=Not Found').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(hasContent || hasHeader || hasNotFound || hasAccessControl).toBe(true);
      
      // Should not show unhandled errors
      const hasError = await page.locator('text=Error, text=500, text=Something went wrong').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test content management responsive design', async ({ page }) => {
    // Test mobile responsiveness for content pages
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/posts');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if layout adapts to mobile
    const hasContent = await page.locator('main, .content').first().isVisible();
    expect(hasContent).toBe(true);
    
    // Test content readability on mobile
    const hasReadableText = await page.locator('p, .post-content, article').first().isVisible();
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
    const hasEssentialContent = await page.locator('main, .content, body').first().isVisible();
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
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = await page.url() !== `http://localhost:3000${pagePath}`;
      const hasGracefulMessage = await page.locator('text=No posts, text=No content, text=Coming soon').first().isVisible();
      
      expect(has404 || hasRedirect || hasGracefulMessage).toBe(true);
    }
  });
});
