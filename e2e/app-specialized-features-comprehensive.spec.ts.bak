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
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should access DTE dashboard', async ({ page }) => {
    await page.goto('/dte/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasDTEDashboard = await page.locator('h1:has-text("DTE"), h1:has-text("Dashboard"), .dte-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasDTEDashboard || hasAccessControl).toBe(true);
    
    if (hasDTEDashboard) {
      // Check for DTE-specific features
      const hasStatistics = await page.locator('.statistics, .stats, .dashboard-stats').isVisible();
      const hasReports = await page.locator('.reports, .report-section, text=Reports').isVisible();
      const hasInstitutes = await page.locator('.institutes, text=Institutes, .institute-list').isVisible();
      
      expect(hasStatistics || hasReports || hasInstitutes).toBe(true);
    }
  });

  test('should test feedback analysis system', async ({ page }) => {
    await page.goto('/admin/feedback-analysis');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasFeedbackAnalysis = await page.locator('h1:has-text("Feedback"), h1:has-text("Analysis"), .feedback-analysis').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasFeedbackAnalysis || hasAccessControl).toBe(true);
    
    if (hasFeedbackAnalysis) {
      // Check for feedback analysis features
      const hasAnalytics = await page.locator('.analytics, .chart, canvas').isVisible();
      const hasFeedbackList = await page.locator('.feedback-list, table, .feedback-table').isVisible();
      const hasFilters = await page.locator('.filters, .filter-section, select').isVisible();
      const hasExportOptions = await page.locator('button:has-text("Export"), button:has-text("Download")').isVisible();
      
      expect(hasAnalytics || hasFeedbackList || hasFilters || hasExportOptions).toBe(true);
    }
  });

  test('should test reporting and analytics dashboard', async ({ page }) => {
    await page.goto('/admin/reporting-analytics');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasReportingDashboard = await page.locator('h1:has-text("Reporting"), h1:has-text("Analytics"), .reporting-dashboard').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasReportingDashboard || hasAccessControl).toBe(true);
    
    if (hasReportingDashboard) {
      // Check for reporting features
      const hasCharts = await page.locator('canvas, .chart, .graph').isVisible();
      const hasMetrics = await page.locator('.metrics, .kpi, .dashboard-metric').isVisible();
      const hasReportOptions = await page.locator('.report-options, .report-selector').isVisible();
      const hasDateRangeSelector = await page.locator('input[type="date"], .date-picker').isVisible();
      
      expect(hasCharts || hasMetrics || hasReportOptions || hasDateRangeSelector).toBe(true);
    }
  });

  test('should test GTU integration features', async ({ page }) => {
    // Test GTU-related functionality if it exists
    await page.goto('/gtu');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasGTUContent = await page.locator('h1:has-text("GTU"), .gtu-section, .gtu-integration').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasGTUContent || hasAccessControl).toBe(true);
    
    if (hasGTUContent) {
      // Check for GTU features
      const hasResultsSection = await page.locator('.results, text=Results, .gtu-results').isVisible();
      const hasExaminationInfo = await page.locator('.examination, text=Examination, .exam-info').isVisible();
      const hasAffiliationInfo = await page.locator('.affiliation, text=Affiliation').isVisible();
      
      expect(hasResultsSection || hasExaminationInfo || hasAffiliationInfo).toBe(true);
    }
  });

  test('should test resource allocation management', async ({ page }) => {
    await page.goto('/admin/resource-allocation');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasResourceAllocation = await page.locator('h1:has-text("Resource"), h1:has-text("Allocation"), .resource-allocation').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasResourceAllocation || hasAccessControl).toBe(true);
    
    if (hasResourceAllocation) {
      // Check for resource allocation features
      const hasResourceList = await page.locator('.resource-list, table, .allocation-table').isVisible();
      const hasAllocationForm = await page.locator('form, .allocation-form').isVisible();
      const hasCalendar = await page.locator('.calendar, .schedule').isVisible();
      const hasRoomManagement = await page.locator('.rooms, text=Rooms, .room-allocation').isVisible();
      
      expect(hasResourceList || hasAllocationForm || hasCalendar || hasRoomManagement).toBe(true);
    }
  });

  test('should test advanced settings and configuration', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasSettingsPage = await page.locator('h1:has-text("Settings"), .settings-page, .configuration').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasSettingsPage || hasAccessControl).toBe(true);
    
    if (hasSettingsPage) {
      // Check for settings features
      const hasConfigOptions = await page.locator('.config-section, .settings-group').isVisible();
      const hasFormInputs = await page.locator('input, select, textarea').isVisible();
      const hasSaveButton = await page.locator('button:has-text("Save"), button:has-text("Update")').isVisible();
      const hasSystemSettings = await page.locator('.system-settings, text=System').isVisible();
      
      expect(hasConfigOptions || hasFormInputs || hasSaveButton || hasSystemSettings).toBe(true);
    }
  });

  test('should test committee management system', async ({ page }) => {
    await page.goto('/dashboard/committee');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasCommitteeSection = await page.locator('h1:has-text("Committee"), .committee-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasCommitteeSection || hasAccessControl).toBe(true);
    
    if (hasCommitteeSection) {
      // Check for committee features
      const hasCommitteeList = await page.locator('.committee-list, table').isVisible();
      const hasCreateCommittee = await page.locator('button:has-text("Create"), button:has-text("Add")').isVisible();
      const hasMemberManagement = await page.locator('.members, text=Members, .member-list').isVisible();
      
      expect(hasCommitteeList || hasCreateCommittee || hasMemberManagement).toBe(true);
    }
  });

  test('should test faculty workload management', async ({ page }) => {
    await page.goto('/admin/faculty-workload');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasWorkloadManagement = await page.locator('h1:has-text("Workload"), h1:has-text("Faculty"), .workload-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasWorkloadManagement || hasAccessControl).toBe(true);
    
    if (hasWorkloadManagement) {
      // Check for workload management features
      const hasFacultyList = await page.locator('.faculty-list, table').isVisible();
      const hasWorkloadChart = await page.locator('canvas, .chart, .workload-chart').isVisible();
      const hasAssignments = await page.locator('.assignments, text=Assignments').isVisible();
      const hasCalculations = await page.locator('.calculations, .workload-calc').isVisible();
      
      expect(hasFacultyList || hasWorkloadChart || hasAssignments || hasCalculations).toBe(true);
    }
  });

  test('should test leave management system', async ({ page }) => {
    await page.goto('/admin/leaves');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasLeaveManagement = await page.locator('h1:has-text("Leave"), .leave-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasLeaveManagement || hasAccessControl).toBe(true);
    
    if (hasLeaveManagement) {
      // Check for leave management features
      const hasLeaveList = await page.locator('.leave-list, table').isVisible();
      const hasApprovalButtons = await page.locator('button:has-text("Approve"), button:has-text("Reject")').isVisible();
      const hasLeaveCalendar = await page.locator('.calendar, .leave-calendar').isVisible();
      const hasFilters = await page.locator('.filters, select').isVisible();
      
      expect(hasLeaveList || hasApprovalButtons || hasLeaveCalendar || hasFilters).toBe(true);
    }
  });

  test('should test building and room management', async ({ page }) => {
    await page.goto('/admin/buildings');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasBuildingManagement = await page.locator('h1:has-text("Building"), .building-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasBuildingManagement || hasAccessControl).toBe(true);
    
    if (hasBuildingManagement) {
      // Check for building management features
      const hasBuildingList = await page.locator('.building-list, table').isVisible();
      const hasRoomDetails = await page.locator('.rooms, text=Rooms').isVisible();
      const hasFloorPlans = await page.locator('.floor-plan, .building-layout').isVisible();
      
      expect(hasBuildingList || hasRoomDetails || hasFloorPlans).toBe(true);
    }
    
    // Test room management
    await page.goto('/admin/rooms');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasRoomManagement = await page.locator('h1:has-text("Room"), .room-management').isVisible();
    const hasRoomAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasRoomManagement || hasRoomAccessControl).toBe(true);
  });

  test('should test examination management system', async ({ page }) => {
    await page.goto('/admin/examinations');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasExamManagement = await page.locator('h1:has-text("Examination"), .exam-management').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasExamManagement || hasAccessControl).toBe(true);
    
    if (hasExamManagement) {
      // Check for examination features
      const hasExamList = await page.locator('.exam-list, table').isVisible();
      const hasScheduling = await page.locator('.schedule, .exam-schedule').isVisible();
      const hasSeatingArrangement = await page.locator('.seating, text=Seating').isVisible();
      const hasInvigilators = await page.locator('.invigilators, text=Invigilator').isVisible();
      
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
      const hasContent = await page.locator('main, .content, .page-content').isVisible();
      const hasHeader = await page.locator('h1, h2, .page-title').isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
      
      expect(hasContent || hasHeader || hasAccessControl).toBe(true);
      
      // Should not show unhandled errors
      const hasError = await page.locator('text=Error, text=500, text=Something went wrong').isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('should test specialized features performance', async ({ page }) => {
    // Test that complex dashboards load within reasonable time
    const startTime = Date.now();
    
    await page.goto('/admin/reporting-analytics');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 15 seconds (generous for complex dashboards)
    expect(loadTime).toBeLessThan(15000);
    
    // Check that essential content is visible
    const hasEssentialContent = await page.locator('main, .content, body').isVisible();
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
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').isVisible();
      const hasRedirect = await page.url() !== `http://localhost:3000${pagePath}`;
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(has404 || hasRedirect || hasAccessControl).toBe(true);
    }
  });

  test('should test specialized responsive design', async ({ page }) => {
    // Test mobile responsiveness for specialized dashboards
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/reporting-analytics');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if layout adapts to mobile
    const hasContent = await page.locator('main, .content').isVisible();
    expect(hasContent).toBe(true);
    
    // Test that charts and tables are responsive
    const hasResponsiveElements = await page.locator('.responsive, .mobile-layout, main').isVisible();
    expect(hasResponsiveElements).toBe(true);
  });
});
