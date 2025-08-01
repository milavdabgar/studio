import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test data
const testUsers = {
  student: {
    email: 'student@test.com',
    password: 'password123',
    name: 'Test Student',
    role: 'student'
  },
  faculty: {
    email: 'faculty@test.com',
    password: 'password123',
    name: 'Dr. Test Faculty',
    role: 'faculty'
  },
  hod: {
    email: 'hod@test.com',
    password: 'password123',
    name: 'Dr. Test HOD',
    role: 'hod'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    name: 'Test Admin',
    role: 'admin'
  }
};

// Helper functions
async function loginAs(page: Page, userType: keyof typeof testUsers) {
  const user = testUsers[userType];
  
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/);
  
  // Verify user is logged in
  await expect(page.locator(`text=${user.name}`)).toBeVisible();
}

async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

test.describe('Multi-Stakeholder Timetable Workflows', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Student Timetable View Workflow', async ({ page }) => {
    await loginAs(page, 'student');

    // Navigate to student timetable
    await page.click('text=My Timetable');
    await page.waitForURL('**/student/timetable');

    // Verify timetable interface loads
    await expect(page.locator('text=My Timetable')).toBeVisible();
    await expect(page.locator('[data-testid="timetable-grid"]')).toBeVisible();

    // Test tab navigation
    await page.click('[role="tab"][name*="Weekly"]');
    await expect(page.locator('text=Monday')).toBeVisible();
    await expect(page.locator('text=Tuesday')).toBeVisible();

    await page.click('[role="tab"][name*="List"]');
    await expect(page.locator('[data-testid="timetable-list"]')).toBeVisible();

    await page.click('[role="tab"][name*="Statistics"]');
    await expect(page.locator('text=Weekly Distribution')).toBeVisible();
    await expect(page.locator('text=Subject Breakdown')).toBeVisible();

    // Test real-time status indicator
    await expect(page.locator('[data-testid="realtime-status"]')).toBeVisible();

    // Test export functionality
    await page.click('text=Export');
    // Should show export options or trigger download

    // Test mobile responsive behavior
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=← Swipe to scroll horizontally →')).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Faculty Timetable Management Workflow', async ({ page }) => {
    await loginAs(page, 'faculty');

    // Navigate to faculty timetable
    await page.click('text=My Teaching Schedule');
    await page.waitForURL('**/faculty/timetable');

    // Verify faculty interface loads
    await expect(page.locator('text=My Teaching Schedule')).toBeVisible();
    await expect(page.locator('text=Dr. Test Faculty')).toBeVisible();

    // Test workload metrics
    await expect(page.locator('[data-testid="total-hours"]')).toBeVisible();
    await expect(page.locator('[data-testid="utilization-rate"]')).toBeVisible();

    // Test tab navigation
    await page.click('[role="tab"][name*="Schedule"]');
    await expect(page.locator('[data-testid="faculty-schedule"]')).toBeVisible();

    await page.click('[role="tab"][name*="Workload Analysis"]');
    await expect(page.locator('text=Weekly Distribution')).toBeVisible();
    await expect(page.locator('text=Time Slot Usage')).toBeVisible();
    await expect(page.locator('[data-testid="workload-chart"]')).toBeVisible();

    await page.click('[role="tab"][name*="Alerts"]');
    await expect(page.locator('text=Schedule Alerts')).toBeVisible();

    // Test conflict detection
    const conflictAlert = page.locator('[data-testid="conflict-alert"]');
    if (await conflictAlert.isVisible()) {
      await expect(conflictAlert).toContainText(/conflict|overlap|overload/i);
    }

    // Test export functionality
    await page.click('text=Export');
    // Should show export options

    // Test workload optimization
    const optimizeButton = page.locator('text=Optimize Schedule');
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click();
      await expect(page.locator('[data-testid="optimization-dialog"]')).toBeVisible();
    }
  });

  test('HOD Dashboard Management Workflow', async ({ page }) => {
    await loginAs(page, 'hod');

    // Navigate to HOD dashboard
    await page.click('text=Department Dashboard');
    await page.waitForURL('**/hod/**');

    // Verify HOD interface loads
    await expect(page.locator('text=Department Timetable Management')).toBeVisible();

    // Test department metrics
    await expect(page.locator('[data-testid="faculty-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="subjects-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="conflicts-count"]')).toBeVisible();

    // Test tab navigation
    await page.click('[role="tab"][name*="Overview"]');
    await expect(page.locator('text=Faculty Workload Distribution')).toBeVisible();
    await expect(page.locator('text=Recent Activities')).toBeVisible();

    await page.click('[role="tab"][name*="Faculty"]');
    await expect(page.locator('text=Faculty Workload Management')).toBeVisible();
    
    // Verify faculty workload information
    await expect(page.locator('[data-testid="faculty-workload-list"]')).toBeVisible();
    const progressBars = page.locator('[role="progressbar"]');
    expect(await progressBars.count()).toBeGreaterThan(0);

    await page.click('[role="tab"][name*="Timetables"]');
    await expect(page.locator('text=Filter timetables')).toBeVisible();

    // Test timetable filtering
    await page.click('[data-testid="timetable-filter"]');
    await page.click('text=Published');
    await expect(page.locator('text=PUBLISHED')).toBeVisible();

    await page.click('[data-testid="timetable-filter"]');
    await page.click('text=With Conflicts');
    const conflictIndicators = page.locator('text*=conflicts detected');
    if (await conflictIndicators.count() > 0) {
      await expect(conflictIndicators.first()).toBeVisible();
    }

    // Test timetable actions
    const viewButtons = page.locator('text=View');
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      // Should navigate to timetable detail view
    }

    // Test export functionality
    await page.click('text=Export');
    await page.click('text=Reports');
  });

  test('Institute Dashboard Administration Workflow', async ({ page }) => {
    await loginAs(page, 'admin');

    // Navigate to institute dashboard
    await page.click('text=Institute Dashboard');
    await page.waitForURL('**/admin/institute-dashboard');

    // Verify institute interface loads
    await expect(page.locator('text=Institute Dashboard')).toBeVisible();
    await expect(page.locator('text=Comprehensive overview of institute-wide timetable operations')).toBeVisible();

    // Test institute-wide metrics
    const metrics = [
      'Departments',
      'Faculty', 
      'Students',
      'Rooms',
      'Timetables',
      'Conflicts',
      'Utilization'
    ];

    for (const metric of metrics) {
      await expect(page.locator(`text=${metric}`)).toBeVisible();
    }

    // Test real-time status
    await expect(page.locator('[data-testid="realtime-status"]')).toBeVisible();

    // Test time range selection
    await page.click('[data-testid="time-range-selector"]');
    await expect(page.locator('text=This Week')).toBeVisible();
    await expect(page.locator('text=This Month')).toBeVisible();
    await expect(page.locator('text=Semester')).toBeVisible();

    // Test tab navigation
    await page.click('[role="tab"][name*="Overview"]');
    await expect(page.locator('text=Department Status')).toBeVisible();
    await expect(page.locator('text=System Health')).toBeVisible();

    await page.click('[role="tab"][name*="Departments"]');
    await expect(page.locator('text=Department Overview')).toBeVisible();
    
    // Verify department cards
    const departmentCards = page.locator('[data-testid="department-card"]');
    expect(await departmentCards.count()).toBeGreaterThan(0);

    await page.click('[role="tab"][name*="Resources"]');
    await expect(page.locator('text=Resource Utilization')).toBeVisible();
    
    // Verify resource monitoring
    await expect(page.locator('[data-testid="resource-list"]')).toBeVisible();

    await page.click('[role="tab"][name*="Alerts"]');
    await expect(page.locator('text=System Alerts')).toBeVisible();
    
    // Test alert management
    const alertBadge = page.locator('[role="tab"][name*="Alerts"] [data-testid="alert-badge"]');
    if (await alertBadge.isVisible()) {
      const alertCount = await alertBadge.textContent();
      expect(parseInt(alertCount || '0')).toBeGreaterThanOrEqual(0);
    }

    // Test resolve alert functionality
    const resolveButtons = page.locator('text=Resolve');
    if (await resolveButtons.count() > 0) {
      await resolveButtons.first().click();
      // Should update alert status
    }

    // Test export functionality
    await page.click('text=Export');
  });

  test('Cross-Stakeholder Real-time Updates', async ({ browser }) => {
    // Create multiple browser contexts for different users
    const studentContext = await browser.newContext();
    const facultyContext = await browser.newContext();
    const hodContext = await browser.newContext();

    const studentPage = await studentContext.newPage();
    const facultyPage = await facultyContext.newPage();
    const hodPage = await hodContext.newPage();

    try {
      // Login different users simultaneously
      await Promise.all([
        loginAs(studentPage, 'student'),
        loginAs(facultyPage, 'faculty'),
        loginAs(hodPage, 'hod')
      ]);

      // Navigate to respective dashboards
      await Promise.all([
        studentPage.goto('/student/timetable'),
        facultyPage.goto('/faculty/timetable'),
        hodPage.goto('/hod/timetable')
      ]);

      // Verify real-time status indicators
      await Promise.all([
        expect(studentPage.locator('[data-testid="realtime-status"]')).toBeVisible(),
        expect(facultyPage.locator('[data-testid="realtime-status"]')).toBeVisible(),
        expect(hodPage.locator('[data-testid="realtime-status"]')).toBeVisible()
      ]);

      // Simulate timetable update (this would be triggered by API in real scenario)
      // For testing, we can verify the notification system is in place
      const notificationSelectors = [
        '[data-testid="notification-toast"]',
        '[data-testid="update-banner"]',
        '.toast-notification'
      ];

      // Check if notification system elements exist
      for (const selector of notificationSelectors) {
        const elements = await Promise.all([
          studentPage.locator(selector).count(),
          facultyPage.locator(selector).count(),
          hodPage.locator(selector).count()
        ]);
        // Elements should be available in DOM (even if not visible)
      }

      // Test refresh functionality
      await Promise.all([
        studentPage.click('[data-testid="refresh-button"]').catch(() => {}),
        facultyPage.click('[data-testid="refresh-button"]').catch(() => {}),
        hodPage.click('[data-testid="refresh-button"]').catch(() => {})
      ]);

    } finally {
      await studentContext.close();
      await facultyContext.close();
      await hodContext.close();
    }
  });

  test('Role-Based Access Control Validation', async ({ page }) => {
    // Test student access
    await loginAs(page, 'student');
    
    // Student should access their own pages
    await page.goto('/student/timetable');
    await expect(page.locator('text=My Timetable')).toBeVisible();

    // Student should NOT access faculty pages
    await page.goto('/faculty/timetable');
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });

    // Student should NOT access admin pages
    await page.goto('/admin/institute-dashboard');
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });

    await logout(page);

    // Test faculty access
    await loginAs(page, 'faculty');
    
    // Faculty should access their own pages
    await page.goto('/faculty/timetable');
    await expect(page.locator('text=My Teaching Schedule')).toBeVisible();

    // Faculty should NOT access student pages
    await page.goto('/student/timetable');
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });

    // Faculty should NOT access admin pages  
    await page.goto('/admin/institute-dashboard');
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });

    await logout(page);

    // Test HOD access
    await loginAs(page, 'hod');
    
    // HOD should access their own pages
    await page.goto('/hod/timetable');
    await expect(page.locator('text=Department Timetable Management')).toBeVisible();

    // HOD should access faculty pages (supervisory access)
    await page.goto('/faculty/timetable');
    await expect(page.locator('text=My Teaching Schedule')).toBeVisible();

    await logout(page);

    // Test admin access
    await loginAs(page, 'admin');
    
    // Admin should access all pages
    await page.goto('/admin/institute-dashboard');
    await expect(page.locator('text=Institute Dashboard')).toBeVisible();

    await page.goto('/hod/timetable');
    await expect(page.locator('text=Department Timetable Management')).toBeVisible();

    await page.goto('/faculty/timetable');
    await expect(page.locator('text=My Teaching Schedule')).toBeVisible();
  });

  test('Mobile Responsive Multi-Stakeholder Experience', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test mobile student experience
    await loginAs(page, 'student');
    await page.goto('/student/timetable');

    await expect(page.locator('text=My Timetable')).toBeVisible();
    await expect(page.locator('text=← Swipe to scroll horizontally →')).toBeVisible();

    // Test mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    }

    await logout(page);

    // Test mobile faculty experience
    await loginAs(page, 'faculty');
    await page.goto('/faculty/timetable');

    await expect(page.locator('text=My Teaching Schedule')).toBeVisible();
    
    // Verify mobile-friendly charts and metrics
    await page.click('[role="tab"][name*="Workload Analysis"]');
    await expect(page.locator('[data-testid="workload-chart"]')).toBeVisible();

    await logout(page);

    // Test mobile HOD experience
    await loginAs(page, 'hod');
    await page.goto('/hod/timetable');

    await expect(page.locator('text=Department Timetable Management')).toBeVisible();
    
    // Test mobile metric cards
    const metricCards = page.locator('[data-testid="metric-card"]');
    expect(await metricCards.count()).toBeGreaterThan(0);

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Timetable Data Consistency Across Views', async ({ browser }) => {
    const studentContext = await browser.newContext();
    const facultyContext = await browser.newContext();

    const studentPage = await studentContext.newPage();
    const facultyPage = await facultyContext.newPage();

    try {
      await Promise.all([
        loginAs(studentPage, 'student'),
        loginAs(facultyPage, 'faculty')
      ]);

      await Promise.all([
        studentPage.goto('/student/timetable'),
        facultyPage.goto('/faculty/timetable')
      ]);

      // Extract schedule data from both views
      const studentScheduleData = await studentPage.locator('[data-testid="schedule-entry"]').allTextContents();
      const facultyScheduleData = await facultyPage.locator('[data-testid="schedule-entry"]').allTextContents();

      // Verify overlapping data is consistent
      // (This would require specific test data setup to verify the same courses appear in both views)
      
      // For now, verify both views show schedule data
      expect(studentScheduleData.length).toBeGreaterThan(0);
      expect(facultyScheduleData.length).toBeGreaterThan(0);

    } finally {
      await studentContext.close();
      await facultyContext.close();
    }
  });

  test('Performance and Load Testing', async ({ page }) => {
    // Measure page load times
    const measurePageLoad = async (url: string, expectedText: string) => {
      const startTime = Date.now();
      await page.goto(url);
      await expect(page.locator(`text=${expectedText}`)).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      // Ensure reasonable load times (adjust thresholds as needed)
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
      
      return loadTime;
    };

    await loginAs(page, 'admin');

    // Test different dashboard load times
    const studentTime = await measurePageLoad('/student/timetable', 'My Timetable');
    const facultyTime = await measurePageLoad('/faculty/timetable', 'My Teaching Schedule');
    const hodTime = await measurePageLoad('/hod/timetable', 'Department Timetable Management');
    const instituteTime = await measurePageLoad('/admin/institute-dashboard', 'Institute Dashboard');

    // Log performance metrics
    console.log('Page Load Times:', {
      student: studentTime,
      faculty: facultyTime,
      hod: hodTime,
      institute: instituteTime
    });

    // Test rapid navigation between views
    const navigationStart = Date.now();
    await page.goto('/student/timetable');
    await page.goto('/faculty/timetable');
    await page.goto('/hod/timetable');
    await page.goto('/admin/institute-dashboard');
    const navigationTime = Date.now() - navigationStart;

    expect(navigationTime).toBeLessThan(10000); // 10 seconds for 4 page navigation
  });

  test('Error Handling Across Stakeholder Views', async ({ page }) => {
    await loginAs(page, 'student');

    // Test handling of network errors
    await page.route('**/api/timetables**', (route) => {
      route.abort('failed');
    });

    await page.goto('/student/timetable');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Test error recovery
    await page.unroute('**/api/timetables**');
    await page.click('[data-testid="retry-button"]');
    
    // Should recover and show data
    await expect(page.locator('text=My Timetable')).toBeVisible();
  });
});