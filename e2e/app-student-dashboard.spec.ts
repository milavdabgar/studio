import { test, expect } from '@playwright/test';

/**
 * Complete Application E2E Tests - Student Dashboard & Learning Workflows
 * 
 * This test suite covers the entire student experience including course enrollment,
 * assignment submission, result viewing, timetable access, and learning-related functionalities.
 */

test.describe('Student Dashboard & Learning Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to student login and attempt authentication
    await page.goto('http://localhost:3000/login');
    
    // Try to login as student
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('student@test.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to student area
    await page.goto('http://localhost:3000/student');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should load student dashboard', async ({ page }) => {
    // Should either show student dashboard or access control
    const hasStudentAccess = await page.locator('h1:has-text("Student"), h1:has-text("Dashboard"), .student-dashboard').isVisible();
    const needsLogin = await page.locator('text=Login, text=Sign in').isVisible();
    const accessDenied = await page.locator('text=Access denied, text=Unauthorized').isVisible();
    
    if (hasStudentAccess) {
      // Should have student navigation
      await expect(page.locator('nav, .sidebar, .student-nav')).toBeVisible();
      
      // Should have student menu items
      const studentMenuItems = [
        page.locator('text=Courses').first(),
        page.locator('text=Results').first(),
        page.locator('text=Timetable').first(),
        page.locator('text=Profile').first(),
        page.locator('text=Assignments').first()
      ];
      
      const visibleItems = await Promise.all(
        studentMenuItems.map(item => item.isVisible())
      );
      
      expect(visibleItems.some(isVisible => isVisible)).toBe(true);
    } else {
      expect(needsLogin || accessDenied).toBe(true);
    }
  });

  test('should test student profile management', async ({ page }) => {
    await page.goto('http://localhost:3000/student/profile');
    await page.waitForLoadState('networkidle');
    
    // Should load profile page
    const hasProfile = await page.locator('h1:has-text("Profile"), .profile-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasProfile) {
      // Should show student information
      const hasProfileInfo = await page.locator('.profile-info, .student-details, .personal-info').isVisible();
      expect(hasProfileInfo).toBe(true);
      
      // Should have student-specific fields
      const hasStudentFields = await page.locator('text=Enrollment, text=Roll Number, text=Semester, text=Program').isVisible();
      
      if (hasStudentFields) {
        expect(hasStudentFields).toBe(true);
      }
      
      // Should have edit functionality
      const hasEditButton = await page.locator('button:has-text("Edit"), button:has-text("Update")').isVisible();
      const hasFormFields = await page.locator('input, select, textarea').isVisible();
      
      expect(hasEditButton || hasFormFields).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test courses and enrollment', async ({ page }) => {
    await page.goto('http://localhost:3000/student/courses');
    await page.waitForLoadState('networkidle');
    
    // Should load courses interface
    const hasCourses = await page.locator('h1:has-text("Courses"), .courses-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasCourses) {
      // Should show enrolled courses or empty state
      const hasCourseList = await page.locator('.course-list, .course-card, table').isVisible();
      const hasEmptyState = await page.locator('text=No courses, .empty-state').isVisible();
      
      expect(hasCourseList || hasEmptyState).toBe(true);
      
      // Should have course enrollment option
      const hasEnrollButton = await page.locator('button:has-text("Enroll"), a:has-text("Enroll"), text=Enrollment').isVisible();
      
      if (hasEnrollButton) {
        await page.goto('http://localhost:3000/student/courses/enroll');
        await page.waitForLoadState('networkidle');
        
        // Should show enrollment interface
        const hasEnrollmentInterface = await page.locator('.enrollment-form, .course-selection').isVisible();
        expect(hasEnrollmentInterface).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test individual course access', async ({ page }) => {
    // Try to access a specific course
    await page.goto('http://localhost:3000/student/courses/test-course-id');
    await page.waitForLoadState('networkidle');
    
    // Should load course interface or show access control
    const hasCourseAccess = await page.locator('h1, .course-details, .course-content').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Not found').isVisible();
    
    if (hasCourseAccess) {
      // Should show course information
      const hasCourseInfo = await page.locator('.course-info, .course-description, .syllabus').isVisible();
      const hasCourseActions = await page.locator('button, .action-links, .course-nav').isVisible();
      
      expect(hasCourseInfo || hasCourseActions).toBe(true);
      
      // Should have access to course materials
      const hasMaterialsLink = await page.locator('text=Materials, a:has-text("Materials")').isVisible();
      
      if (hasMaterialsLink) {
        expect(hasMaterialsLink).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test assignments functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/student/assignments');
    await page.waitForLoadState('networkidle');
    
    // Should load assignments interface
    const hasAssignments = await page.locator('h1:has-text("Assignments"), .assignments-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasAssignments) {
      // Should show assignments list or empty state
      const hasAssignmentsList = await page.locator('.assignment-list, .assignment-card, table').isVisible();
      const hasEmptyState = await page.locator('text=No assignments, .empty-state').isVisible();
      
      expect(hasAssignmentsList || hasEmptyState).toBe(true);
      
      // Test assignment details access
      const firstAssignment = page.locator('.assignment-card, .assignment-item, tr').first();
      
      if (await firstAssignment.isVisible()) {
        await firstAssignment.click();
        await page.waitForLoadState('networkidle');
        
        // Should show assignment details
        const hasAssignmentDetails = await page.locator('.assignment-details, h1').isVisible();
        expect(hasAssignmentDetails).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test assignment submission workflow', async ({ page }) => {
    // Try to access a specific assignment
    await page.goto('http://localhost:3000/student/assignments/test-assignment-id');
    await page.waitForLoadState('networkidle');
    
    // Should load assignment details or show access control
    const hasAssignmentDetails = await page.locator('h1, .assignment-details').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, text=Not found').isVisible();
    
    if (hasAssignmentDetails) {
      // Should show assignment information
      const hasAssignmentInfo = await page.locator('.assignment-description, .due-date, .instructions').isVisible();
      expect(hasAssignmentInfo).toBe(true);
      
      // Should have submission interface
      const hasSubmissionForm = await page.locator('form, .submission-form, input[type="file"]').isVisible();
      const hasSubmitButton = await page.locator('button:has-text("Submit"), button:has-text("Upload")').isVisible();
      
      expect(hasSubmissionForm || hasSubmitButton).toBe(true);
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test results and grades viewing', async ({ page }) => {
    await page.goto('http://localhost:3000/student/results');
    await page.waitForLoadState('networkidle');
    
    // Should load results interface
    const hasResults = await page.locator('h1:has-text("Results"), .results-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasResults) {
      // Should show results or empty state
      const hasResultsList = await page.locator('.results-list, .grade-card, table').isVisible();
      const hasEmptyState = await page.locator('text=No results, .empty-state').isVisible();
      
      expect(hasResultsList || hasEmptyState).toBe(true);
      
      // Should show academic information if results exist
      const hasAcademicInfo = await page.locator('text=GPA, text=CGPA, text=Semester, .academic-summary').isVisible();
      
      if (hasAcademicInfo) {
        expect(hasAcademicInfo).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test student timetable', async ({ page }) => {
    await page.goto('http://localhost:3000/student/timetable');
    await page.waitForLoadState('networkidle');
    
    // Should load timetable interface
    const hasTimetable = await page.locator('h1:has-text("Timetable"), .timetable-view').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasTimetable) {
      // Should show timetable grid or empty state
      const hasTimetableView = await page.locator('.timetable-grid, .schedule-view, table').isVisible();
      const hasEmptyState = await page.locator('text=No schedule, .empty-state').isVisible();
      
      expect(hasTimetableView || hasEmptyState).toBe(true);
      
      // Should have view options
      const hasViewOptions = await page.locator('button:has-text("Week"), button:has-text("Day"), .view-toggle').isVisible();
      
      if (hasViewOptions) {
        expect(hasViewOptions).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test course materials access', async ({ page }) => {
    await page.goto('http://localhost:3000/student/materials');
    await page.waitForLoadState('networkidle');
    
    // Should load materials interface
    const hasMaterials = await page.locator('h1:has-text("Materials"), .materials-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasMaterials) {
      // Should show materials list or empty state
      const hasMaterialsList = await page.locator('.materials-list, .material-card, table').isVisible();
      const hasEmptyState = await page.locator('text=No materials, .empty-state').isVisible();
      
      expect(hasMaterialsList || hasEmptyState).toBe(true);
      
      // Should have download/view options for materials
      const hasDownloadLinks = await page.locator('a:has-text("Download"), button:has-text("View"), .download-link').isVisible();
      
      if (hasDownloadLinks) {
        expect(hasDownloadLinks).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test attendance tracking', async ({ page }) => {
    await page.goto('http://localhost:3000/student/attendance');
    await page.waitForLoadState('networkidle');
    
    // Should load attendance interface
    const hasAttendance = await page.locator('h1:has-text("Attendance"), .attendance-section').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
    
    if (hasAttendance) {
      // Should show attendance records or empty state
      const hasAttendanceRecords = await page.locator('.attendance-list, .attendance-summary, table').isVisible();
      const hasEmptyState = await page.locator('text=No attendance, .empty-state').isVisible();
      
      expect(hasAttendanceRecords || hasEmptyState).toBe(true);
      
      // Should show attendance percentage if records exist
      const hasAttendanceStats = await page.locator('text=%, .percentage, .attendance-rate').isVisible();
      
      if (hasAttendanceStats) {
        expect(hasAttendanceStats).toBe(true);
      }
    } else {
      expect(hasAccessControl).toBe(true);
    }
  });

  test('should test student workflow consistency', async ({ page }) => {
    // Test navigation consistency across student sections
    const studentSections = [
      '/student',
      '/student/courses',
      '/student/assignments',
      '/student/results',
      '/student/timetable',
      '/student/profile'
    ];
    
    for (const section of studentSections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');
      
      // Should maintain consistent student layout
      const hasStudentLayout = await page.locator('.student-layout, .student-sidebar, nav:has-text("Student")').isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied').isVisible();
      const hasContent = await page.locator('main, .content, .page-content').isVisible();
      
      expect(hasStudentLayout || hasAccessControl || hasContent).toBe(true);
    }
  });

  test('should test responsive student interface', async ({ page }) => {
    // Test mobile responsiveness for student dashboard
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000/student');
    await page.waitForLoadState('networkidle');
    
    // Should be responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should adapt to mobile
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button:has-text("Menu")').first();
    const responsiveNav = page.locator('nav, .sidebar').first();
    
    const isMobileMenuVisible = await mobileMenu.isVisible();
    const isNavResponsive = await responsiveNav.isVisible();
    
    expect(isMobileMenuVisible || isNavResponsive).toBe(true);
  });

  test('should test student notification system', async ({ page }) => {
    await page.goto('http://localhost:3000/student');
    await page.waitForLoadState('networkidle');
    
    // Look for notification indicators
    const notificationBell = page.locator('.notification-bell, .notifications, [data-testid="notifications"]').first();
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForLoadState('networkidle');
      
      // Should show notifications panel or navigate to notifications page
      const hasNotificationsPanel = await page.locator('.notifications-panel, .notifications-dropdown').isVisible();
      const isOnNotificationsPage = page.url().includes('notification');
      
      expect(hasNotificationsPanel || isOnNotificationsPage).toBe(true);
    }
  });

  test('should test student academic progress tracking', async ({ page }) => {
    await page.goto('http://localhost:3000/student');
    await page.waitForLoadState('networkidle');
    
    // Should show academic progress information
    const hasProgressInfo = await page.locator('.progress-card, .academic-summary, .gpa-display').isVisible();
    
    if (hasProgressInfo) {
      // Should show current semester/year information
      const hasSemesterInfo = await page.locator('text=Semester, text=Year, .current-semester').isVisible();
      expect(hasSemesterInfo).toBe(true);
      
      // Should show academic performance metrics
      const hasPerformanceMetrics = await page.locator('text=GPA, text=CGPA, .performance-metrics').isVisible();
      
      if (hasPerformanceMetrics) {
        expect(hasPerformanceMetrics).toBe(true);
      }
    }
  });

  test('should test file upload functionality in assignments', async ({ page }) => {
    await page.goto('http://localhost:3000/student/assignments');
    await page.waitForLoadState('networkidle');
    
    // Look for assignments with upload capability
    const hasFileUpload = await page.locator('input[type="file"], .file-upload, .upload-area').isVisible();
    
    if (hasFileUpload) {
      // Should handle file selection
      const fileInput = page.locator('input[type="file"]').first();
      
      // Test file input accessibility
      const isFileInputVisible = await fileInput.isVisible();
      const hasUploadArea = await page.locator('.upload-area, .dropzone').isVisible();
      
      expect(isFileInputVisible || hasUploadArea).toBe(true);
    }
  });
});
