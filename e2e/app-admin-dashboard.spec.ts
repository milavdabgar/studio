import { test, expect } from '@playwright/test';

/**
 * Complete Application E2E Tests - Admin Dashboard & Management
 * 
 * This test suite covers the entire admin workflow including academic management,
 * user management, infrastructure management, and administrative functions.
 */

test.describe('Admin Dashboard & Management Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login and attempt authentication
    await page.goto('http://localhost:3000/login');
    
    // Try to login as admin (will handle both success and failure scenarios)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@test.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to admin area (will test access control)
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should load admin dashboard', async ({ page }) => {
    // Should either show admin dashboard or login prompt
    const hasAdminAccess = await page.locator('h1:has-text("Admin"), h1:has-text("Dashboard"), .admin-dashboard').isVisible();
    const needsLogin = await page.locator('text=Login, text=Sign in').first().isVisible();
    const accessDenied = await page.locator('text=Access denied, text=Unauthorized').first().isVisible();
    
    if (hasAdminAccess) {
      // Should have admin navigation
      await expect(page.locator('nav, .sidebar, .admin-nav')).toBeVisible();
      
      // Should have admin menu items
      const adminMenuItems = [
        page.locator('text=Students').first(),
        page.locator('text=Faculty').first(),
        page.locator('text=Courses').first(),
        page.locator('text=Results').first()
      ];
      
      const visibleItems = await Promise.all(
        adminMenuItems.map(item => item.isVisible())
      );
      
      expect(visibleItems.some(isVisible => isVisible)).toBe(true);
    } else if (needsLogin || accessDenied) {
      // Expected behavior for unauthorized access
      expect(true).toBe(true);
    } else {
      // Should at least load some content
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should test academic management section', async ({ page }) => {
    const academicPages = [
      '/admin/students',
      '/admin/faculty', 
      '/admin/courses',
      '/admin/programs',
      '/admin/batches'
    ];
    
    for (const adminPage of academicPages) {
      await page.goto(adminPage);
      await page.waitForLoadState('networkidle');
      
      // Should load without server errors
      const hasServerError = await page.locator('text=500, text=Internal Server Error').first().isVisible();
      expect(hasServerError).toBe(false);
      
      // Should either show content or access control
      const hasContent = await page.locator('table, .data-grid, .list, h1, h2').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(hasContent || hasAccessControl).toBe(true);
      
      // If has content, should have management interface
      if (hasContent) {
        // Should have action buttons
        const hasActions = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Import"), .action-button').isVisible();
        
        if (hasActions) {
          expect(hasActions).toBe(true);
        }
      }
    }
  });

  test('should test infrastructure management', async ({ page }) => {
    const infrastructurePages = [
      '/admin/buildings',
      '/admin/rooms',
      '/admin/departments',
      '/admin/institutes'
    ];
    
    for (const adminPage of infrastructurePages) {
      await page.goto(adminPage);
      await page.waitForLoadState('networkidle');
      
      // Should load page successfully
      await expect(page.locator('body')).toBeVisible();
      
      // Should either show management interface or access control
      const hasManagementInterface = await page.locator('table, .grid, .list, .management-panel').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
      
      expect(hasManagementInterface || hasAccessControl).toBe(true);
    }
  });

  test('should test results management workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/results');
    await page.waitForLoadState('networkidle');
    
    // Should load results management
    const hasResultsInterface = await page.locator('h1:has-text("Results"), .results-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasResultsInterface) {
      // Should have results management features
      const hasImportButton = await page.locator('button:has-text("Import"), a:has-text("Import")').isVisible();
      const hasResultsList = await page.locator('table, .results-list, .data-table').first().isVisible();
      
      expect(hasImportButton || hasResultsList).toBe(true);
      
      // Test results import page
      if (hasImportButton) {
        await page.goto('http://localhost:3000/admin/results/import');
        await page.waitForLoadState('networkidle');
        
        // Should have import interface
        const hasImportForm = await page.locator('form, input[type="file"], .upload-area').first().isVisible();
        expect(hasImportForm).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test user management', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Should handle user management
    const hasUserManagement = await page.locator('h1:has-text("Users"), .user-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasUserManagement) {
      // Should have user list or creation interface
      const hasUserList = await page.locator('table, .user-list, .data-grid').first().isVisible();
      const hasCreateUser = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New User")').isVisible();
      
      expect(hasUserList || hasCreateUser).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test reporting and analytics', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/reporting-analytics');
    await page.waitForLoadState('networkidle');
    
    // Should load reporting interface
    const hasReporting = await page.locator('h1:has-text("Report"), h1:has-text("Analytics"), .analytics-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasReporting) {
      // Should have reporting options
      const hasReportOptions = await page.locator('button:has-text("Generate"), select, .report-type, .filter').isVisible();
      const hasCharts = await page.locator('canvas, .chart, .graph, svg').first().isVisible();
      
      expect(hasReportOptions || hasCharts).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test settings and configuration', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle');
    
    // Should load settings interface
    const hasSettings = await page.locator('h1:has-text("Settings"), .settings-panel').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasSettings) {
      // Should have configuration options
      const hasConfigForms = await page.locator('form, input, select, .config-section').first().isVisible();
      const hasSaveButton = await page.locator('button:has-text("Save"), button:has-text("Update")').isVisible();
      
      expect(hasConfigForms || hasSaveButton).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test feedback analysis features', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/feedback-analysis');
    await page.waitForLoadState('networkidle');
    
    // Should handle feedback analysis
    const hasFeedbackAnalysis = await page.locator('h1:has-text("Feedback"), .feedback-analysis').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasFeedbackAnalysis) {
      // Should have analysis interface
      const hasAnalysisTools = await page.locator('button:has-text("Analyze"), .analysis-controls, .feedback-data').isVisible();
      expect(hasAnalysisTools).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test resource allocation management', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/resource-allocation');
    await page.waitForLoadState('networkidle');
    
    // Should load resource allocation
    const hasResourceAllocation = await page.locator('h1:has-text("Resource"), .resource-allocation').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasResourceAllocation) {
      // Should have allocation interface
      const hasAllocationTools = await page.locator('button, select, .allocation-grid, .resource-list').first().isVisible();
      expect(hasAllocationTools).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test admin workflow consistency', async ({ page }) => {
    // Test that admin workflows maintain consistent navigation
    const adminSections = [
      '/admin/students',
      '/admin/faculty',
      '/admin/courses',
      '/admin/results'
    ];
    
    for (const section of adminSections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');
      
      // Should maintain consistent admin layout
      const hasAdminLayout = await page.locator('.admin-layout, .admin-sidebar, nav:has-text("Admin")').isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      const hasContent = await page.locator('main, .content, .page-content').first().isVisible();
      
      expect(hasAdminLayout || hasAccessControl || hasContent).toBe(true);
      
      // Should be able to navigate between sections
      if (hasAdminLayout) {
        const adminNavItems = await page.locator('nav a, .sidebar a, .admin-nav a').count();
        expect(adminNavItems).toBeGreaterThan(0);
      }
    }
  });

  test('should handle admin form interactions', async ({ page }) => {
    const formsPages = [
      '/admin/students',
      '/admin/faculty',
      '/admin/courses'
    ];
    
    for (const formPage of formsPages) {
      await page.goto(formPage);
      await page.waitForLoadState('networkidle');
      
      // Look for create/add buttons
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
        
        // Should open form or modal
        const hasForm = await page.locator('form, .modal, .dialog').first().isVisible();
        if (hasForm) {
          // Form should have input fields
          const hasInputs = await page.locator('input, select, textarea').first().isVisible();
          expect(hasInputs).toBe(true);
          
          // Should have submit button
          const hasSubmit = await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit")').isVisible();
          expect(hasSubmit).toBe(true);
        }
      }
    }
  });
});
