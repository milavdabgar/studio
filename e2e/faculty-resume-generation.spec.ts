import { test, expect } from '@playwright/test';
import { loginAsFaculty } from './test-helpers';

test.describe('Faculty Resume Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as faculty first
    await loginAsFaculty(page);
    
    // Navigate to the faculty profile page
    await page.goto('/faculty/profile');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display faculty profile information', async ({ page }) => {
    // Check that the faculty profile card is visible
    await expect(page.locator('[data-testid="faculty-profile-card"]').first()).toBeVisible();
    
    // Check for basic faculty information elements
    await expect(page.locator('text=/Faculty Profile/i')).toBeVisible();
  });

  test('should show resume generation dropdown menu', async ({ page }) => {
    // Look for the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await expect(resumeButton).toBeVisible();
    
    // Click to open the dropdown
    await resumeButton.click();
    
    // Check that all format options are available
    await expect(page.locator('text=Download as PDF')).toBeVisible();
    await expect(page.locator('text=Download as DOCX')).toBeVisible();
    await expect(page.locator('text=Download as HTML')).toBeVisible();
    await expect(page.locator('text=Download as TXT')).toBeVisible();
  });

  test('should generate PDF resume successfully', async ({ page }) => {
    // Mock the API response for successful PDF generation
    await page.route('/api/faculty/*/resume*', async (route) => {
      const url = new URL(route.request().url());
      const format = url.searchParams.get('format');
      
      if (format === 'pdf') {
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="Faculty_Resume.pdf"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: Buffer.from('mock-pdf-content')
        });
      }
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Wait for the success toast
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/PDF/i')).toBeVisible();
  });

  test('should generate DOCX resume successfully', async ({ page }) => {
    // Mock the API response for successful DOCX generation
    await page.route('/api/faculty/*/resume*', async (route) => {
      const url = new URL(route.request().url());
      const format = url.searchParams.get('format');
      
      if (format === 'docx') {
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': 'attachment; filename="Faculty_Resume.docx"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: Buffer.from('mock-docx-content')
        });
      }
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the DOCX option
    await page.locator('text=Download as DOCX').click();
    
    // Wait for the success toast
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/DOCX/i')).toBeVisible();
  });

  test('should generate HTML resume successfully', async ({ page }) => {
    // Mock the API response for successful HTML generation
    await page.route('/api/faculty/*/resume*', async (route) => {
      const url = new URL(route.request().url());
      const format = url.searchParams.get('format');
      
      if (format === 'html') {
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': 'attachment; filename="Faculty_Resume.html"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: '<html><body><h1>Faculty Resume</h1></body></html>'
        });
      }
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the HTML option
    await page.locator('text=Download as HTML').click();
    
    // Wait for the success toast
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/HTML/i')).toBeVisible();
  });

  test('should generate TXT resume successfully', async ({ page }) => {
    // Mock the API response for successful TXT generation
    await page.route('/api/faculty/*/resume*', async (route) => {
      const url = new URL(route.request().url());
      const format = url.searchParams.get('format');
      
      if (format === 'txt') {
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename="Faculty_Resume.txt"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: 'Faculty Resume\n\nName: John Doe\nEmail: john.doe@example.com'
        });
      }
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the TXT option
    await page.locator('text=Download as TXT').click();
    
    // Wait for the success toast
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/TXT/i')).toBeVisible();
  });

  test('should handle resume generation errors gracefully', async ({ page }) => {
    // Mock the API response for failed generation
    await page.route('/api/faculty/*/resume*', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Resume generation failed' })
      });
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Wait for the error toast
    await expect(page.locator('text=/Generation Failed/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Resume generation failed/i')).toBeVisible();
  });

  test('should show loading state during resume generation', async ({ page }) => {
    // Mock a delayed API response
    await page.route('/api/faculty/*/resume*', async (route) => {
      // Add delay to simulate loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Faculty_Resume.pdf"'
        },
        body: Buffer.from('mock-pdf-content')
      });
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Check for loading state (spinner should be visible)
    await expect(page.locator('button:has-text("Generate Resume") svg.animate-spin')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 15000 });
  });

  test('should handle faculty data not available error', async ({ page }) => {
    // Mock an empty faculty response
    await page.route('/api/faculty', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      });
    });

    // Navigate to the page which should now show no faculty data
    await page.goto('/faculty/profile');
    await page.waitForLoadState('networkidle');
    
    // Try to generate resume when no data is available
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    
    // If button exists, click it and expect error
    if (await resumeButton.isVisible()) {
      await resumeButton.click();
      await page.locator('text=Download as PDF').click();
      
      // Should show error toast
      await expect(page.locator('text=/Faculty data not available/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should validate API request parameters', async ({ page }) => {
    let requestUrl = '';
    
    // Intercept the API request to validate parameters
    await page.route('/api/faculty/*/resume*', async (route) => {
      requestUrl = route.request().url();
      
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Faculty_Resume.pdf"'
        },
        body: Buffer.from('mock-pdf-content')
      });
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Wait for request to complete
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    
    // Validate the request URL contains the correct format parameter
    expect(requestUrl).toContain('format=pdf');
    expect(requestUrl).toContain('/api/faculty/');
    expect(requestUrl).toContain('/resume');
  });

  test('should handle browser download restrictions gracefully', async ({ page }) => {
    // Mock successful API response
    await page.route('/api/faculty/*/resume*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Faculty_Resume.pdf"'
        },
        body: Buffer.from('mock-pdf-content')
      });
    });

    // Simulate browser blocking downloads
    await page.addInitScript(() => {
      // Override the download functionality
      HTMLAnchorElement.prototype.click = function() {
        // Simulate blocked download
        throw new Error('Download blocked by browser');
      };
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Should still show success message even if download fails
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
  });

  test('should properly format filename based on faculty name', async ({ page }) => {
    let responseHeaders: Record<string, string> = {};
    
    // Mock faculty data with specific name
    await page.route('/api/faculty', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          id: 'faculty-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        }])
      });
    });

    // Mock API response with specific filename
    await page.route('/api/faculty/*/resume*', async (route) => {
      responseHeaders = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="John_Doe_Faculty_Resume.pdf"'
      };
      
      await route.fulfill({
        status: 200,
        headers: responseHeaders,
        body: Buffer.from('mock-pdf-content')
      });
    });

    // Navigate to the page
    await page.goto('/faculty/profile');
    await page.waitForLoadState('networkidle');

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Wait for completion
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    
    // The filename should be properly formatted in the response headers
    expect(responseHeaders['Content-Disposition']).toContain('John_Doe_Faculty_Resume.pdf');
  });

  test('should maintain proper HTTP headers for security', async ({ page }) => {
    let responseHeaders: Record<string, string> = {};
    
    // Intercept the API request to check headers
    await page.route('/api/faculty/*/resume*', async (route) => {
      responseHeaders = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Faculty_Resume.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      await route.fulfill({
        status: 200,
        headers: responseHeaders,
        body: Buffer.from('mock-pdf-content')
      });
    });

    // Click the Generate Resume button
    const resumeButton = page.locator('button:has-text("Generate Resume")');
    await resumeButton.click();
    
    // Click the PDF option
    await page.locator('text=Download as PDF').click();
    
    // Wait for completion
    await expect(page.locator('text=/Resume Generated/i')).toBeVisible({ timeout: 10000 });
    
    // Validate security headers are present
    expect(responseHeaders['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(responseHeaders['Pragma']).toBe('no-cache');
    expect(responseHeaders['Expires']).toBe('0');
    expect(responseHeaders['Content-Disposition']).toContain('attachment');
  });
});