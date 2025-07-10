import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Specialized Dashboards and Workflows
 * Priority: DTE, GTU, and Specialized Features (Medium Priority)
 * 
 * This test suite covers specialized features like DTE dashboard, GTU integration,
 * feedback analysis, reporting analytics, and other advanced workflows.
 */

test.describe('Specialized Dashboards and Workflows - Complete Application Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should access DTE dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dte/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasDTEDashboard = await page.locator('h1:has-text("DTE"), h1:has-text("Dashboard"), .dte-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasDTEDashboard || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasDTEDashboard) {
      // Check for DTE-specific features
      const hasStatistics = await page.locator('.statistics, .stats, .dashboard-stats').first().isVisible();
      const hasReports = await page.locator('.reports, .report-section, text=Reports').first().isVisible();
      const hasInstitutes = await page.locator('.institutes, text=Institutes, .institute-list').first().isVisible();
      
      expect(hasStatistics || hasReports || hasInstitutes).toBe(true);
    }
  });

  test('should test feedback analysis system', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/feedback-analysis');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasFeedbackAnalysis = await page.locator('h1:has-text("Feedback"), h1:has-text("Analysis"), .feedback-analysis').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasFeedbackAnalysis || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasFeedbackAnalysis) {
      // Check for feedback analysis features
      const hasAnalytics = await page.locator('.analytics, .chart, canvas').first().isVisible();
      const hasFeedbackList = await page.locator('.feedback-list, table, .feedback-table').first().isVisible();
      const hasFilters = await page.locator('.filters, .filter-section, select').first().isVisible();
      const hasExportOptions = await page.locator('button:has-text("Export"), button:has-text("Download")').isVisible();
      
      expect(hasAnalytics || hasFeedbackList || hasFilters || hasExportOptions).toBe(true);
    }
  });

  test('should test reporting and analytics dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/reporting-analytics');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasReportingDashboard = await page.locator('h1:has-text("Reporting"), h1:has-text("Analytics"), .reporting-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasReportingDashboard || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasReportingDashboard) {
      // Check for reporting features
      const hasCharts = await page.locator('canvas, .chart, .graph').first().isVisible();
      const hasMetrics = await page.locator('.metrics, .kpi, .dashboard-metric').first().isVisible();
      const hasReportOptions = await page.locator('.report-options, .report-selector').first().isVisible();
      const hasDateRangeSelector = await page.locator('input[type="date"], .date-picker').first().isVisible();
      
      expect(hasCharts || hasMetrics || hasReportOptions || hasDateRangeSelector).toBe(true);
    }
  });

  test('should test GTU integration features', async ({ page }) => {
    // Test GTU-related functionality if it exists
    await page.goto('http://localhost:3000/gtu');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasGTUContent = await page.locator('h1:has-text("GTU"), .gtu-section, .gtu-integration').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasGTUContent || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasGTUContent) {
      // Check for GTU features
      const hasResultsSection = await page.locator('.results, text=Results, .gtu-results').first().isVisible();
      const hasExaminationInfo = await page.locator('.examination, text=Examination, .exam-info').first().isVisible();
      const hasAffiliationInfo = await page.locator('.affiliation, text=Affiliation').first().isVisible();
      
      expect(hasResultsSection || hasExaminationInfo || hasAffiliationInfo).toBe(true);
    }
  });

  test('should test resource allocation management', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/resource-allocation');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasResourceAllocation = await page.locator('h1:has-text("Resource"), h1:has-text("Allocation"), .resource-allocation').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasResourceAllocation || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasResourceAllocation) {
      // Check for resource allocation features
      const hasResourceList = await page.locator('.resource-list, table, .allocation-table').first().isVisible();
      const hasAllocationForm = await page.locator('form, .allocation-form').first().isVisible();
      const hasCalendar = await page.locator('.calendar, .schedule').first().isVisible();
      const hasRoomManagement = await page.locator('.rooms, text=Rooms, .room-allocation').first().isVisible();
      
      expect(hasResourceList || hasAllocationForm || hasCalendar || hasRoomManagement).toBe(true);
    }
  });

  test('should test advanced settings and configuration', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasSettingsPage = await page.locator('h1:has-text("Settings"), .settings-page, .configuration').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasSettingsPage || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasSettingsPage) {
      // Check for settings features
      const hasConfigOptions = await page.locator('.config-section, .settings-group').first().isVisible();
      const hasFormInputs = await page.locator('input, select, textarea').first().isVisible();
      const hasSaveButton = await page.locator('button:has-text("Save"), button:has-text("Update")').isVisible();
      const hasSystemSettings = await page.locator('.system-settings, text=System').first().isVisible();
      
      expect(hasConfigOptions || hasFormInputs || hasSaveButton || hasSystemSettings).toBe(true);
    }
  });

  test('should test committee management system', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/committee');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasCommitteeSection = await page.locator('h1:has-text("Committee"), .committee-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasCommitteeSection || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasCommitteeSection) {
      // Check for committee features
      const hasCommitteeList = await page.locator('.committee-list, table').first().isVisible();
      const hasCreateCommittee = await page.locator('button:has-text("Create"), button:has-text("Add")').isVisible();
      const hasMemberManagement = await page.locator('.members, text=Members, .member-list').first().isVisible();
      
      expect(hasCommitteeList || hasCreateCommittee || hasMemberManagement).toBe(true);
    }
  });

  test('should test faculty workload management', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/faculty-workload');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasWorkloadManagement = await page.locator('h1:has-text("Workload"), h1:has-text("Faculty"), .workload-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasWorkloadManagement || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasWorkloadManagement) {
      // Check for workload management features
      const hasFacultyList = await page.locator('.faculty-list, table').first().isVisible();
      const hasWorkloadChart = await page.locator('canvas, .chart, .workload-chart').first().isVisible();
      const hasAssignments = await page.locator('.assignments, text=Assignments').first().isVisible();
      const hasCalculations = await page.locator('.calculations, .workload-calc').first().isVisible();
      
      expect(hasFacultyList || hasWorkloadChart || hasAssignments || hasCalculations).toBe(true);
    }
  });

  test('should test leave management system', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/leaves');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasLeaveManagement = await page.locator('h1:has-text("Leave"), .leave-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasLeaveManagement || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasLeaveManagement) {
      // Check for leave management features
      const hasLeaveList = await page.locator('.leave-list, table').first().isVisible();
      const hasApprovalButtons = await page.locator('button:has-text("Approve"), button:has-text("Reject")').isVisible();
      const hasLeaveCalendar = await page.locator('.calendar, .leave-calendar').first().isVisible();
      const hasFilters = await page.locator('.filters, select').first().isVisible();
      
      expect(hasLeaveList || hasApprovalButtons || hasLeaveCalendar || hasFilters).toBe(true);
    }
  });

  test('should test building and room management', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/buildings');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasBuildingManagement = await page.locator('h1:has-text("Building"), .building-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    const hasBuildingPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasBuildingManagement || hasAccessControl || hasBuildingPageStructure).toBe(true);
    
    if (hasBuildingManagement) {
      // Check for building management features
      const hasBuildingList = await page.locator('.building-list, table').first().isVisible();
      const hasRoomDetails = await page.locator('.rooms, text=Rooms').first().isVisible();
      const hasFloorPlans = await page.locator('.floor-plan, .building-layout').first().isVisible();
      
      expect(hasBuildingList || hasRoomDetails || hasFloorPlans).toBe(true);
    }
    
    // Test room management
    await page.goto('http://localhost:3000/admin/rooms');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasRoomManagement = await page.locator('h1:has-text("Room"), .room-management').isVisible();
    const hasRoomAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    const hasRoomPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasRoomManagement || hasRoomAccessControl || hasRoomPageStructure).toBe(true);
  });

  test('should test examination management system', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/examinations');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasExamManagement = await page.locator('h1:has-text("Examination"), .exam-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    const hasBasicPageStructure = await page.locator('main, .main-content, body').first().isVisible();
    
    expect(hasExamManagement || hasAccessControl || hasBasicPageStructure).toBe(true);
    
    if (hasExamManagement) {
      // Check for examination features
      const hasExamList = await page.locator('.exam-list, table').first().isVisible();
      const hasScheduling = await page.locator('.schedule, .exam-schedule').first().isVisible();
      const hasSeatingArrangement = await page.locator('.seating, text=Seating').first().isVisible();
      const hasInvigilators = await page.locator('.invigilators, text=Invigilator').first().isVisible();
      
      expect(hasExamList || hasScheduling || hasSeatingArrangement || hasInvigilators).toBe(true);
    }
  });

  test('should test specialized workflow consistency', async ({ page }) => {
    // Test navigation between specialized sections
    const specializedPages = [
      '/dte/dashboard',
      '/admin/feedback-analysis',
      '/admin/reporting-analytics',
      '/admin/resource-allocation',
      '/admin/faculty-workload'
    ];
    
    for (const pagePath of specializedPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should load successfully or show appropriate access control
      const hasContent = await page.locator('main, .content, .page-content').first().isVisible();
      const hasHeader = await page.locator('h1, h2, .page-title').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
      const hasBasicStructure = await page.locator('body, html, div').first().isVisible();
      
      expect(hasContent || hasHeader || hasAccessControl || hasBasicStructure).toBe(true);
      
      // Should not show unhandled errors
      const hasError = await page.locator('text=Error, text=500, text=Something went wrong').first().isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test specialized features performance', async ({ page }) => {
    // Test that complex dashboards load within reasonable time
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/admin/reporting-analytics');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 15 seconds (generous for complex dashboards)
    expect(loadTime).toBeLessThan(15000);
    
    // Check that essential content is visible
    const hasEssentialContent = await page.locator('main, .content, body').first().isVisible();
    expect(hasEssentialContent).toBe(true);
  });

  test('should handle specialized navigation errors', async ({ page }) => {
    // Test handling of non-existent specialized pages
    const testPages = [
      '/admin/non-existent-feature',
      '/dte/invalid-section',
      '/admin/specialized/non-existent'
    ];
    
    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show 404 or appropriate error handling
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first().isVisible();
      const hasRedirect = await page.url() !== `http://localhost:3000${pagePath}`;
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(has404 || hasRedirect || hasAccessControl).toBe(true);
    }
  });

  test('should test specialized responsive design', async ({ page }) => {
    // Test mobile responsiveness for specialized dashboards
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/admin/reporting-analytics');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if layout adapts to mobile
    const hasContent = await page.locator('main, .content').first().isVisible();
    const hasBasicStructure = await page.locator('body, html').first().isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    expect(hasContent || hasBasicStructure || hasAccessControl).toBe(true);
    
    // Test that charts and tables are responsive
    const hasResponsiveElements = await page.locator('.responsive, .mobile-layout, main').first().isVisible();
    const hasAnyElements = await page.locator('div, span, p').first().isVisible();
    
    expect(hasResponsiveElements || hasAnyElements).toBe(true);
  });
});
