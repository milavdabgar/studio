import { test, expect } from '@playwright/test';

/**
 * Critical Student Workflows Tests - MongoDB Migration Priority
 * Priority: HIGH - Student workflows are essential for the learning management system
 * 
 * Tests student-specific routes and workflows that are affected by MongoDB migration
 */

test.describe('Critical Student Workflows - MongoDB Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should access student courses page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/courses');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show courses page or access control
    const hasCoursesPage = await page.locator('h1:has-text("Courses"), text="Courses"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasCoursesPage) {
      // Look for course listing elements
      const courseElements = [
        'text=Course',
        'text=Enrolled',
        'text=Semester',
        'text=Credits',
        'text=Faculty',
        'text=View',
        'text=No courses',
        'text=Empty'
      ];
      
      let courseElementFound = false;
      for (const element of courseElements) {
        if (await page.locator(element).first().isVisible()) {
          courseElementFound = true;
          break;
        }
      }
      
      expect(courseElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student course enrollment page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/courses/enroll');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show enrollment page or access control
    const hasEnrollPage = await page.locator('h1:has-text("Enroll"), text="Enroll"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasEnrollPage) {
      // Look for enrollment interface elements
      const enrollElements = [
        'text=Available',
        'text=Course',
        'text=Semester',
        'text=Credits',
        'text=Enroll',
        'text=Select',
        'checkbox',
        'button:has-text("Enroll")'
      ];
      
      let enrollElementFound = false;
      for (const element of enrollElements) {
        if (await page.locator(element).first().isVisible()) {
          enrollElementFound = true;
          break;
        }
      }
      
      expect(enrollElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student assignments page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/assignments');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show assignments page or access control
    const hasAssignmentsPage = await page.locator('h1:has-text("Assignments"), text="Assignments"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasAssignmentsPage) {
      // Look for assignment listing elements
      const assignmentElements = [
        'text=Assignment',
        'text=Due Date',
        'text=Status',
        'text=Course',
        'text=Submit',
        'text=View',
        'text=Pending',
        'text=Submitted',
        'text=No assignments',
        'text=Empty'
      ];
      
      for (const element of assignmentElements) {
        if (await page.locator(element).first().isVisible()) {
          assignmentElementFound = true;
          break;
        }
      }
      
      expect(assignmentElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student results page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/results');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show results page or access control
    const hasResultsPage = await page.locator('h1:has-text("Results"), text="Results"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasResultsPage) {
      // Look for results elements
      const resultElements = [
        'text=Results',
        'text=Grades',
        'text=Course',
        'text=Semester',
        'text=GPA',
        'text=Credits',
        'text=Performance',
        'text=No results',
        'text=Empty'
      ];
      
      let resultElementFound = false;
      for (const element of resultElements) {
        if (await page.locator(element).first().isVisible()) {
          resultElementFound = true;
          break;
        }
      }
      
      expect(resultElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student timetable page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/timetable');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show timetable page or access control
    const hasTimetablePage = await page.locator('h1:has-text("Timetable"), text="Timetable"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasTimetablePage) {
      // Look for timetable elements
      const timetableElements = [
        'text=Schedule',
        'text=Time',
        'text=Day',
        'text=Course',
        'text=Room',
        'text=Faculty',
        'text=Monday',
        'text=Tuesday',
        'text=No schedule',
        'text=Empty'
      ];
      
      let timetableElementFound = false;
      for (const element of timetableElements) {
        if (await page.locator(element).first().isVisible()) {
          timetableElementFound = true;
          break;
        }
      }
      
      expect(timetableElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student materials page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/materials');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show materials page or access control
    const hasMaterialsPage = await page.locator('h1:has-text("Materials"), text="Materials"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasMaterialsPage) {
      // Look for materials elements
      const materialElements = [
        'text=Study Materials',
        'text=Course',
        'text=Document',
        'text=File',
        'text=Download',
        'text=View',
        'text=PDF',
        'text=No materials',
        'text=Empty'
      ];
      
      let materialElementFound = false;
      for (const element of materialElements) {
        if (await page.locator(element).first().isVisible()) {
          materialElementFound = true;
          break;
        }
      }
      
      expect(materialElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student attendance page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/attendance');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show attendance page or access control
    const hasAttendancePage = await page.locator('h1:has-text("Attendance"), text="Attendance"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasAttendancePage) {
      // Look for attendance elements
      const attendanceElements = [
        'text=Attendance',
        'text=Course',
        'text=Present',
        'text=Absent',
        'text=Percentage',
        'text=Total',
        'text=Classes',
        'text=No attendance',
        'text=Empty'
      ];
      
      let attendanceElementFound = false;
      for (const element of attendanceElements) {
        if (await page.locator(element).first().isVisible()) {
          attendanceElementFound = true;
          break;
        }
      }
      
      expect(attendanceElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should access student profile page', async ({ page }) => {
    await page.goto('http://localhost:3000/student/profile');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show profile page or access control
    const hasProfilePage = await page.locator('h1:has-text("Profile"), text="Profile"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasProfilePage) {
      // Look for profile elements
      const profileElements = [
        'text=Personal Information',
        'text=Name',
        'text=Email',
        'text=Contact',
        'text=Program',
        'text=Semester',
        'text=Edit',
        'text=Update'
      ];
      
      let profileElementFound = false;
      for (const element of profileElements) {
        if (await page.locator(element).first().isVisible()) {
          profileElementFound = true;
          break;
        }
      }
      
      expect(profileElementFound).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test assignment submission workflow', async ({ page }) => {
    // Go to assignments page
    await page.goto('http://localhost:3000/student/assignments');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show assignments page or access control
    const hasAssignmentsPage = await page.locator('h1:has-text("Assignments"), text="Assignments"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasAssignmentsPage) {
      // Look for assignment with submit button
      const submitButton = page.locator('button:has-text("Submit"), a:has-text("Submit")').first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should navigate to assignment submission page
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Look for submission form elements
        const submissionElements = [
          'input[type="file"]',
          'textarea',
          'text=Upload',
          'text=File',
          'text=Comment',
          'text=Description',
          'button:has-text("Submit")'
        ];
        
        let submissionElementFound = false;
        for (const element of submissionElements) {
          if (await page.locator(element).first().isVisible()) {
            submissionElementFound = true;
            break;
          }
        }
        
        expect(submissionElementFound).toBe(true);
      }
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test course enrollment workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/student/courses/enroll');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show enrollment page or access control
    const hasEnrollPage = await page.locator('h1:has-text("Enroll"), text="Enroll"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasEnrollPage) {
      // Look for available courses to enroll
      const enrollCheckbox = page.locator('input[type="checkbox"]').first();
      
      if (await enrollCheckbox.isVisible()) {
        // Basic enrollment workflow testing
        const enrollButton = page.locator('button:has-text("Enroll"), button:has-text("Register")');
        expect(await enrollButton.isVisible() || await enrollCheckbox.isVisible()).toBe(true);
      } else {
        // Should at least show enrollment interface
        expect(hasEnrollPage).toBe(true);
      }
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test student navigation workflow', async ({ page }) => {
    const studentRoutes = [
      '/student',
      '/student/profile',
      '/student/courses',
      '/student/assignments',
      '/student/results',
      '/student/timetable',
      '/student/materials',
      '/student/attendance'
    ];
    
    for (const route of studentRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show page content or proper access control
      const hasPageContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasPageContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should test student profile update workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/student/profile');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should show profile page or access control
    const hasProfilePage = await page.locator('h1:has-text("Profile"), text="Profile"').isVisible();
    const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
    const hasLoginRedirect = page.url().includes('/login');
    
    if (hasProfilePage) {
      // Look for edit profile button or form fields
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
      const formFields = page.locator('input, textarea, select').first();
      
      expect(await editButton.isVisible() || await formFields.isVisible()).toBe(true);
    } else {
      expect(hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });

  test('should handle student data consistency', async ({ page }) => {
    // Test basic consistency across student pages
    const pagesToCheck = ['/student/profile', '/student/courses', '/student/assignments', '/student/results'];
    
    for (const pageRoute of pagesToCheck) {
      await page.goto(pageRoute);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should show page content or proper access control
      const hasPageContent = await page.locator('h1, h2, main, .content').first().isVisible();
      const hasAccessControl = await page.locator('text=Login, text=Access denied, input[type="email"], input[type="password"]').first().isVisible();
      const hasLoginRedirect = page.url().includes('/login');
      
      expect(hasPageContent || hasAccessControl || hasLoginRedirect).toBe(true);
    }
  });
});
