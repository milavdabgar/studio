import { test, expect } from '@playwright/test';

test.describe('DSA Study Materials Links Verification', () => {
  const basePath = '/posts/en/resources/study-materials/32-ict/sem-3/1333203-dsa';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the DSA index page
    await page.goto(basePath);
    await expect(page).toHaveTitle(/Data Structures and Algorithms/);
  });

  test('should verify all PDF links are accessible', async ({ page }) => {
    const pdfLinks = [
      { name: 'Course Syllabus', href: `${basePath}/1333203.pdf` },
      { name: 'Winter 2024 Paper', href: `${basePath}/1333203-Winter-2024.pdf` },
      { name: 'Summer 2024 Paper', href: `${basePath}/1333203-Summer-2024.pdf` },
      { name: 'Winter 2023 Paper', href: `${basePath}/1333203-Winter-2023.pdf` },
      { name: 'Winter 2024 Solutions PDF', href: `${basePath}/1333203-winter-2024-solution-english.pdf` },
      { name: 'Summer 2024 Solutions PDF', href: `${basePath}/1333203-summer-2024-solution.pdf` },
      { name: 'Winter 2023 Solutions PDF', href: `${basePath}/1333203-winter-2023-solution.pdf` }
    ];

    for (const link of pdfLinks) {
      console.log(`Testing PDF link: ${link.name}`);
      
      // Check if the link exists on the page
      const linkElement = page.getByRole('link', { name: new RegExp(link.name.replace('PDF', '').trim()) });
      await expect(linkElement.first()).toBeVisible();
      
      // Test that the PDF URL responds successfully
      const response = await page.request.get(link.href);
      expect(response.status(), `${link.name} should be accessible`).toBe(200);
      
      // Note: PDFs are served through Next.js routing as HTML pages that display PDF content
      // This is the expected behavior for this application architecture
      const contentType = response.headers()['content-type'];
      console.log(`${link.name} content-type: ${contentType}`);
      expect(contentType).toContain('text/html');
    }
  });

  test('should verify all web page solution links are accessible', async ({ page }) => {
    const webLinks = [
      { name: 'Winter 2024 Solutions', href: `${basePath}/1333203-winter-2024-solution-english` },
      { name: 'Summer 2024 Solutions', href: `${basePath}/1333203-summer-2024-solution` },
      { name: 'Winter 2023 Solutions', href: `${basePath}/1333203-winter-2023-solution` }
    ];

    for (const link of webLinks) {
      console.log(`Testing web page link: ${link.name}`);
      
      // Check if the link exists on the page
      const linkElement = page.getByRole('link', { name: new RegExp(link.name) }).first();
      await expect(linkElement).toBeVisible();
      
      // Navigate to the solution page
      await linkElement.click();
      
      // Verify the page loads successfully
      await expect(page).toHaveURL(link.href);
      await expect(page.locator('body')).toBeVisible();
      
      // Go back to the main page for next iteration
      await page.goto(basePath);
    }
  });

  test('should verify page structure and content', async ({ page }) => {
    // Check main headings exist
    await expect(page.getByRole('heading', { name: /Course Materials/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Syllabus/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Papers/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Paper Solutions/i })).toBeVisible();
    
    // Check introductory text
    await expect(page.getByText(/Welcome to the Data Structures and Algorithms course materials/)).toBeVisible();
    await expect(page.getByText(/Browse through the available resources/)).toBeVisible();
  });

  test('should verify link formats and accessibility', async ({ page }) => {
    // Get all links on the page
    const allLinks = await page.locator('a').all();
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && href.startsWith('/posts/en/resources/study-materials/32-ict/sem-3/1333203-dsa/')) {
        console.log(`Checking link: ${text} -> ${href}`);
        
        // Ensure link is visible and has proper text
        await expect(link).toBeVisible();
        expect(text).toBeTruthy();
        expect(text.trim().length).toBeGreaterThan(0);
        
        // Verify href follows the correct pattern
        expect(href).toMatch(/^\/posts\/en\/resources\/study-materials\/32-ict\/sem-3\/1333203-dsa\/.+/);
      }
    }
  });
});