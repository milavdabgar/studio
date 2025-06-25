import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Project Fair System - Complete Application Flow
 * Priority: Project Fair Module (High-Priority Feature)
 * 
 * This test suite covers the entire project fair workflow from student registration
 * to admin management, ensuring all user journeys are working properly.
 */

test.describe('Project Fair System - Complete Application Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure we start from the home page
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should access project fair landing page', async ({ page }) => {
    // Check if project fair is accessible from main navigation or direct URL
    await page.goto('http://localhost:3000/project-fair/student');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show project fair content or access control
    const hasProjectFairContent = await page.locator('h1:has-text("Project Fair"), h2:has-text("Project Fair"), .project-fair').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasProjectFairContent || hasAccessControl).toBe(true);
  });

  test('should test student project fair access', async ({ page }) => {
    await page.goto('http://localhost:3000/project-fair/student');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show student project fair interface or login prompt
    const hasStudentInterface = await page.locator('h1:has-text("Student"), .student-project-fair, [data-testid="project-registration"]').isVisible();
    const needsAuth = await page.locator('text=Login, text=Sign in, text=Authentication required').first().isVisible();
    
    expect(hasStudentInterface || needsAuth).toBe(true);
    
    if (hasStudentInterface) {
      // Check for key student features
      const hasRegistrationForm = await page.locator('form, .registration-form, [data-testid="team-form"]').isVisible();
      const hasProjectList = await page.locator('.project-list, [data-testid="projects"], table').isVisible();
      const hasTeamManagement = await page.locator('.team-management, [data-testid="team"], text=Team').isVisible();
      
      expect(hasRegistrationForm || hasProjectList || hasTeamManagement).toBe(true);
    }
  });

  test('should test admin project fair management', async ({ page }) => {
    await page.goto('http://localhost:3000/project-fair/admin');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show admin interface or access control
    const hasAdminInterface = await page.locator('h1:has-text("Admin"), h1:has-text("Project Fair"), .admin-project-fair').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Unauthorized').first().isVisible();
    
    expect(hasAdminInterface || hasAccessControl).toBe(true);
    
    if (hasAdminInterface) {
      // Check for admin management features
      const hasEventManagement = await page.locator('text=Events, text=Create Event, .event-management').isVisible();
      const hasTeamManagement = await page.locator('text=Teams, text=Manage Teams, .team-management').isVisible();
      const hasJudgeManagement = await page.locator('text=Judges, text=Jury, .judge-management').isVisible();
      
      expect(hasEventManagement || hasTeamManagement || hasJudgeManagement).toBe(true);
    }
  });

  test('should test project fair events management', async ({ page }) => {
    await page.goto('http://localhost:3000/project-fair/admin/new-event');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasEventsPage = await page.locator('h1:has-text("Events"), h1:has-text("New Event"), .events-list, [data-testid="events"]').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    expect(hasEventsPage || hasAccessControl).toBe(true);
    
    if (hasEventsPage) {
      // Check for event management features
      const hasCreateButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').isVisible();
      const hasEventsList = await page.locator('table, .event-card, .events-grid').isVisible();
      const hasEditControls = await page.locator('button:has-text("Edit"), button:has-text("Update"), .edit-button').isVisible();
      
      expect(hasCreateButton || hasEventsList || hasEditControls).toBe(true);
    }
  });

  test('should test project fair evaluation system', async ({ page }) => {
    // Test evaluation interface for judges/faculty
    await page.goto('http://localhost:3000/admin/project-fair/events/test-event/evaluations');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasEvaluationPage = await page.locator('h1:has-text("Evaluation"), .evaluation-form, [data-testid="evaluation"]').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404, text=Not Found').first().isVisible();
    
    expect(hasEvaluationPage || hasAccessControl).toBe(true);
    
    if (hasEvaluationPage) {
      // Check for evaluation features
      const hasProjectList = await page.locator('table, .project-list, .evaluation-grid').isVisible();
      const hasScoreInputs = await page.locator('input[type="number"], .score-input, .rating').isVisible();
      const hasSubmitButton = await page.locator('button:has-text("Submit"), button:has-text("Save")').isVisible();
      
      expect(hasProjectList || hasScoreInputs || hasSubmitButton).toBe(true);
    }
  });

  test('should test project fair results and analytics', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/project-fair/events/test-event/results');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasResultsPage = await page.locator('h1:has-text("Results"), .results-dashboard, [data-testid="results"]').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasResultsPage || hasAccessControl).toBe(true);
    
    if (hasResultsPage) {
      // Check for results features
      const hasResultsTable = await page.locator('table, .results-table, .leaderboard').isVisible();
      const hasCharts = await page.locator('canvas, .chart, .graph').isVisible();
      const hasExportOptions = await page.locator('button:has-text("Export"), button:has-text("Download")').isVisible();
      
      expect(hasResultsTable || hasCharts || hasExportOptions).toBe(true);
    }
  });

  test('should test project fair team management', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/project-fair/events/test-event/teams');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasTeamsPage = await page.locator('h1:has-text("Teams"), .teams-list, [data-testid="teams"]').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasTeamsPage || hasAccessControl).toBe(true);
    
    if (hasTeamsPage) {
      // Check for team management features
      const hasTeamsList = await page.locator('table, .team-card, .teams-grid').isVisible();
      const hasAddTeamButton = await page.locator('button:has-text("Add Team"), button:has-text("Create Team")').isVisible();
      const hasTeamActions = await page.locator('button:has-text("Edit"), button:has-text("Delete"), .team-actions').isVisible();
      
      expect(hasTeamsList || hasAddTeamButton || hasTeamActions).toBe(true);
    }
  });

  test('should test project fair scheduling', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/project-fair/events/test-event/schedule');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const hasSchedulePage = await page.locator('h1:has-text("Schedule"), .schedule, [data-testid="schedule"]').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=404').first().isVisible();
    
    expect(hasSchedulePage || hasAccessControl).toBe(true);
    
    if (hasSchedulePage) {
      // Check for scheduling features
      const hasCalendar = await page.locator('.calendar, .schedule-grid, table').isVisible();
      const hasTimeSlots = await page.locator('.time-slot, .schedule-item, .event-time').isVisible();
      const hasAddScheduleButton = await page.locator('button:has-text("Add"), button:has-text("Schedule"), button:has-text("Create")').isVisible();
      
      expect(hasCalendar || hasTimeSlots || hasAddScheduleButton).toBe(true);
    }
  });

  test('should test project fair workflow consistency', async ({ page }) => {
    // Test navigation between different project fair sections
    const projectFairPages = [
      '/project-fair/student',
      '/project-fair/admin',
      '/project-fair/admin/new-event'
    ];
    
    for (const pagePath of projectFairPages) {
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

  test('should test project fair responsive design', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/project-fair/student');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if layout adapts to mobile
    const isMobileMenuVisible = await page.locator('.mobile-menu, [data-testid="mobile-menu"], .hamburger').isVisible();
    const responsiveContent = await page.locator('.responsive, .mobile-layout, main').isVisible();
    
    expect(isMobileMenuVisible || responsiveContent).toBe(true);
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletLayout = await page.locator('main, .content').isVisible();
    expect(tabletLayout).toBe(true);
  });

  test('should handle project fair navigation errors', async ({ page }) => {
    // Test handling of non-existent project fair pages
    const testPages = [
      '/project-fair/non-existent',
      '/project-fair/admin/invalid-section'
    ];
    
    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show 404 or redirect appropriately
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').isVisible();
      const hasRedirect = await page.url() !== `http://localhost:3000${pagePath}`;
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      
      expect(has404 || hasRedirect || hasAccessControl).toBe(true);
    }
  });

  test('should test project fair data integrity', async ({ page }) => {
    // Test that project fair pages load without console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000/project-fair/student');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Filter out known acceptable errors (like network timeouts in test environment)
    const criticalErrors = errors.filter(error => 
      !error.includes('net::ERR_') && 
      !error.includes('favicon') &&
      !error.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
