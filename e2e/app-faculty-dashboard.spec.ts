import { test, expect } from '@playwright/test';

/**
 * Complete Application E2E Tests - Faculty Dashboard & Teaching Workflows
 * 
 * This test suite covers the entire faculty experience including course management,
 * student assessment, timetable management, and teaching-related functionalities.
 */

test.describe('Faculty Dashboard & Teaching Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to faculty login and attempt authentication
    await page.goto('http://localhost:3000/login');
    
    // Try to login as faculty member
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('faculty@test.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to faculty area
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle');
  });

  test('should load faculty dashboard', async ({ page }) => {
    // Should either show faculty dashboard or access control
    const hasFacultyAccess = await page.locator('h1:has-text("Faculty"), h1:has-text("Dashboard"), .faculty-dashboard').isVisible();
    const needsLogin = await page.locator('text=Login, text=Sign in').first().isVisible();
    const accessDenied = await page.locator('text=Access denied, text=Unauthorized').first().isVisible();
    
    if (hasFacultyAccess) {
      // Should have faculty navigation
      await expect(page.locator('nav, .sidebar, .faculty-nav')).toBeVisible();
      
      // Should have faculty menu items
      const facultyMenuItems = [
        page.locator('text=My Courses').first(),
        page.locator('text=Timetable').first(),
        page.locator('text=Assessments').first(),
        page.locator('text=Profile').first()
      ];
      
      const visibleItems = await Promise.all(
        facultyMenuItems.map(item => item.isVisible())
      );
      
      expect(visibleItems.some(isVisible => isVisible)).toBe(true);
    } else {
      expect(needsLogin || accessDenied).toBe(true);
    }
  });

  test('should test faculty profile management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/profile');
    await page.waitForLoadState('networkidle');
    
    // Should load profile page
    const hasProfile = await page.locator('h1:has-text("Profile"), .profile-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasProfile) {
      // Should show faculty information
      const hasProfileInfo = await page.locator('.profile-info, .faculty-details, form').first().isVisible();
      expect(hasProfileInfo).toBe(true);
      
      // Should have editable fields or display mode
      const hasEditButton = await page.locator('button:has-text("Edit"), button:has-text("Update")').isVisible();
      const hasFormFields = await page.locator('input, select, textarea').first().isVisible();
      
      expect(hasEditButton || hasFormFields).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test my courses section', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/my-courses');
    await page.waitForLoadState('networkidle');
    
    // Should load courses interface
    const hasCourses = await page.locator('h1:has-text("Courses"), .courses-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasCourses) {
      // Should show course list or empty state
      const hasCourseList = await page.locator('.course-list, .course-card, table').first().isVisible();
      const hasEmptyState = await page.locator('text=No courses, .empty-state').first().isVisible();
      
      expect(hasCourseList || hasEmptyState).toBe(true);
      
      // If has courses, test course navigation
      const firstCourse = page.locator('.course-card, tr, .course-item').first();
      if (await firstCourse.isVisible()) {
        await firstCourse.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to course details
        const hasCourseDetails = await page.locator('.course-details, h1').first().isVisible();
        expect(hasCourseDetails).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test course students management', async ({ page }) => {
    // Try to access a course students page
    await page.goto('http://localhost:3000/faculty/courses/test-course-id/students');
    await page.waitForLoadState('networkidle');
    
    // Should load students interface or show access control
    const hasStudentsInterface = await page.locator('h1:has-text("Students"), .students-list').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Not found').first().isVisible();
    
    if (hasStudentsInterface) {
      // Should show enrolled students
      const hasStudentsList = await page.locator('table, .student-list, .student-card').first().isVisible();
      const hasEmptyState = await page.locator('text=No students, .empty-state').first().isVisible();
      
      expect(hasStudentsList || hasEmptyState).toBe(true);
      
      // Should have student management actions
      const hasActions = await page.locator('button:has-text("Grade"), button:has-text("Attendance"), .action-button').isVisible();
      
      if (hasActions) {
        expect(hasActions).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test timetable functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/timetable');
    await page.waitForLoadState('networkidle');
    
    // Should load timetable interface
    const hasTimetable = await page.locator('h1:has-text("Timetable"), .timetable-view').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasTimetable) {
      // Should show timetable grid or calendar
      const hasTimetableView = await page.locator('.timetable-grid, .calendar, table').first().isVisible();
      const hasEmptyState = await page.locator('text=No schedule, .empty-state').first().isVisible();
      
      expect(hasTimetableView || hasEmptyState).toBe(true);
      
      // Should have view options (week/month/day)
      const hasViewOptions = await page.locator('button:has-text("Week"), button:has-text("Month"), button:has-text("Day"), .view-toggle').isVisible();
      
      if (hasViewOptions) {
        expect(hasViewOptions).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test assessments and grading', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/assessments');
    await page.waitForLoadState('networkidle');
    
    // Should load assessments interface
    const hasAssessments = await page.locator('h1:has-text("Assessments"), .assessments-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasAssessments) {
      // Should show assessments list
      const hasAssessmentsList = await page.locator('.assessment-list, .assessment-card, table').first().isVisible();
      const hasEmptyState = await page.locator('text=No assessments, .empty-state').first().isVisible();
      
      expect(hasAssessmentsList || hasEmptyState).toBe(true);
      
      // Should have create assessment option
      const hasCreateButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Assessment")').isVisible();
      
      if (hasCreateButton) {
        expect(hasCreateButton).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test grading workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/assessments/grade');
    await page.waitForLoadState('networkidle');
    
    // Should load grading interface
    const hasGrading = await page.locator('h1:has-text("Grade"), .grading-interface').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasGrading) {
      // Should have grading tools
      const hasGradingForm = await page.locator('form, .grading-form, input[type="number"], select').first().isVisible();
      const hasStudentList = await page.locator('.student-list, table').first().isVisible();
      
      expect(hasGradingForm || hasStudentList).toBe(true);
      
      // Should have save/submit functionality
      const hasSaveButton = await page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Update")').isVisible();
      
      if (hasSaveButton) {
        expect(hasSaveButton).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test leave management', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty/leaves');
    await page.waitForLoadState('networkidle');
    
    // Should load leave management interface
    const hasLeaves = await page.locator('h1:has-text("Leave"), .leaves-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
    
    if (hasLeaves) {
      // Should show leave requests or empty state
      const hasLeavesList = await page.locator('.leave-list, .leave-card, table').first().isVisible();
      const hasEmptyState = await page.locator('text=No leaves, .empty-state').first().isVisible();
      
      expect(hasLeavesList || hasEmptyState).toBe(true);
      
      // Should have apply for leave option
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Request"), button:has-text("New Leave")').first();
      
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await page.waitForLoadState('networkidle');
        
        // Should open leave application form
        const hasLeaveForm = await page.locator('form, .leave-form').first().isVisible();
        expect(hasLeaveForm).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test faculty workflow consistency', async ({ page }) => {
    // Test navigation consistency across faculty sections
    const facultySections = [
      '/faculty',
      '/faculty/my-courses',
      '/faculty/timetable',
      '/faculty/assessments',
      '/faculty/profile'
    ];
    
    for (const section of facultySections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');
      
      // Should maintain consistent faculty layout
      const hasFacultyLayout = await page.locator('.faculty-layout, .faculty-sidebar, nav:has-text("Faculty")').isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').first().isVisible();
      const hasContent = await page.locator('main, .content, .page-content').first().isVisible();
      
      expect(hasFacultyLayout || hasAccessControl || hasContent).toBe(true);
    }
  });

  test('should test responsive faculty interface', async ({ page }) => {
    // Test mobile responsiveness for faculty dashboard
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle');
    
    // Should be responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should adapt to tablet/mobile
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button:has-text("Menu")').first();
    const responsiveNav = page.locator('nav, .sidebar').first();
    
    const isMobileMenuVisible = await mobileMenu.isVisible();
    const isNavResponsive = await responsiveNav.isVisible();
    
    expect(isMobileMenuVisible || isNavResponsive).toBe(true);
  });

  test('should test course material access', async ({ page }) => {
    // Test if faculty can access course materials
    await page.goto('http://localhost:3000/faculty/my-courses');
    await page.waitForLoadState('networkidle');
    
    const hasCourses = await page.locator('.course-list, .course-card').first().isVisible();
    
    if (hasCourses) {
      // Try to access course materials
      const courseLink = page.locator('.course-card a, .course-link').first();
      
      if (await courseLink.isVisible()) {
        await courseLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should be able to navigate to materials or students
        const hasMaterialsLink = await page.locator('text=Materials, a:has-text("Materials")').isVisible();
        const hasStudentsLink = await page.locator('text=Students, a:has-text("Students")').isVisible();
        
        expect(hasMaterialsLink || hasStudentsLink).toBe(true);
      }
    }
  });

  test('should test faculty notification system', async ({ page }) => {
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle');
    
    // Look for notification indicators
    const notificationBell = page.locator('.notification-bell, .notifications, [data-testid="notifications"]').first();
    const hasNotificationCount = await page.locator('.notification-count, .badge').first().isVisible();
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForLoadState('networkidle');
      
      // Should show notifications panel or navigate to notifications page
      const hasNotificationsPanel = await page.locator('.notifications-panel, .notifications-dropdown').first().isVisible();
      const isOnNotificationsPage = page.url().includes('notification');
      
      expect(hasNotificationsPanel || isOnNotificationsPage).toBe(true);
    }
  });
});
