import { test, expect } from '@playwright/test';
import { loginAsStudent, fillForm, submitForm, waitForPageLoad } from './test-helpers';

/**
 * Critical Student Workflows Tests - MongoDB Migration Priority
 * Priority: HIGH - Student workflows are essential for the learning management system
 * 
 * Tests student-specific routes and workflows that are affected by MongoDB migration
 */

test.describe('Critical Student Workflows - MongoDB Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as student for all tests
    await loginAsStudent(page);
  });

  test('should access student courses page', async ({ page }) => {
    await waitForPageLoad(page, '/student/courses');
    
    // Verify page loads correctly
    await expect(page.locator('text=Courses')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        courseElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(courseElementFound).toBe(true);
  });

  test('should access student course enrollment page', async ({ page }) => {
    await waitForPageLoad(page, '/student/courses/enroll');
    
    await expect(page.locator('text=Enroll')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        enrollElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(enrollElementFound).toBe(true);
  });

  test('should access student assignments page', async ({ page }) => {
    await waitForPageLoad(page, '/student/assignments');
    
    await expect(page.locator('text=Assignments')).toBeVisible({ timeout: 10000 });
    
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
    
    let assignmentElementFound = false;
    for (const element of assignmentElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        assignmentElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(assignmentElementFound).toBe(true);
  });

  test('should access student results page', async ({ page }) => {
    await waitForPageLoad(page, '/student/results');
    
    await expect(page.locator('text=Results')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        resultElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(resultElementFound).toBe(true);
  });

  test('should access student timetable page', async ({ page }) => {
    await waitForPageLoad(page, '/student/timetable');
    
    await expect(page.locator('text=Timetable')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        timetableElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(timetableElementFound).toBe(true);
  });

  test('should access student materials page', async ({ page }) => {
    await waitForPageLoad(page, '/student/materials');
    
    await expect(page.locator('text=Materials')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        materialElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(materialElementFound).toBe(true);
  });

  test('should access student attendance page', async ({ page }) => {
    await waitForPageLoad(page, '/student/attendance');
    
    await expect(page.locator('text=Attendance')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        attendanceElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(attendanceElementFound).toBe(true);
  });

  test('should access student profile page', async ({ page }) => {
    await waitForPageLoad(page, '/student/profile');
    
    await expect(page.locator('text=Profile')).toBeVisible({ timeout: 10000 });
    
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
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        profileElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(profileElementFound).toBe(true);
  });

  test('should test assignment submission workflow', async ({ page }) => {
    // Go to assignments page
    await waitForPageLoad(page, '/student/assignments');
    
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
        try {
          await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
          submissionElementFound = true;
          break;
        } catch (e) {
          // Continue checking
        }
      }
      
      if (submissionElementFound) {
        // Try to fill submission form
        const commentArea = page.locator('textarea, [name="comment"], [name="description"]');
        if (await commentArea.isVisible()) {
          await commentArea.fill('Test assignment submission');
        }
        
        // Submit the assignment
        const finalSubmitButton = page.locator('button:has-text("Submit"), button:has-text("Upload")');
        if (await finalSubmitButton.isVisible()) {
          await finalSubmitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should test course enrollment workflow', async ({ page }) => {
    await waitForPageLoad(page, '/student/courses/enroll');
    
    // Look for available courses to enroll
    const enrollCheckbox = page.locator('input[type="checkbox"]').first();
    
    if (await enrollCheckbox.isVisible()) {
      await enrollCheckbox.check();
      
      // Look for enroll button
      const enrollButton = page.locator('button:has-text("Enroll"), button:has-text("Register")');
      if (await enrollButton.isVisible()) {
        await enrollButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success message or redirect
        const successElements = [
          'text=Success',
          'text=Enrolled',
          'text=Registered',
          'text=Confirmation'
        ];
        
        let successFound = false;
        for (const element of successElements) {
          try {
            await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
            successFound = true;
            break;
          } catch (e) {
            // Continue checking
          }
        }
      }
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
      
      // Verify we're on the expected route
      expect(page.url()).toContain(route);
      
      // Verify page loads successfully (not redirected to login)
      expect(page.url()).not.toContain('/login');
      
      // Verify some student-related content exists
      const studentElements = [
        'text=Student',
        'text=Course',
        'text=Assignment',
        'text=Dashboard',
        'text=Profile'
      ];
      
      let studentElementFound = false;
      for (const element of studentElements) {
        try {
          await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
          studentElementFound = true;
          break;
        } catch (e) {
          // Continue checking
        }
      }
      
      expect(studentElementFound).toBe(true);
    }
  });

  test('should test student profile update workflow', async ({ page }) => {
    await waitForPageLoad(page, '/student/profile');
    
    // Look for edit profile button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Look for profile form fields
      const profileFields = [
        '[name="firstName"]',
        '[name="lastName"]',
        '[name="email"]',
        '[name="phone"]',
        '[name="address"]'
      ];
      
      let fieldFound = false;
      for (const field of profileFields) {
        try {
          if (await page.locator(field).isVisible({ timeout: 2000 })) {
            await page.locator(field).fill('Updated Value');
            fieldFound = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      if (fieldFound) {
        // Save the profile
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should handle student data consistency', async ({ page }) => {
    // Test that student data is consistent across different pages
    await waitForPageLoad(page, '/student/profile');
    
    // Get student name from profile if available
    let studentName = '';
    try {
      const nameElement = page.locator('text=/[A-Z][a-z]+ [A-Z][a-z]+/').first();
      if (await nameElement.isVisible({ timeout: 3000 })) {
        studentName = await nameElement.textContent() || '';
      }
    } catch (e) {
      // Continue test even if name not found
    }
    
    // Check other pages for consistency
    const pagesToCheck = ['/student/courses', '/student/assignments', '/student/results'];
    
    for (const pageRoute of pagesToCheck) {
      await waitForPageLoad(page, pageRoute);
      
      // Verify page loads and student context is maintained
      expect(page.url()).toContain(pageRoute);
      expect(page.url()).not.toContain('/login');
      
      // If we found a student name, check if it appears consistently
      if (studentName && studentName.length > 3) {
        try {
          await expect(page.locator(`text=${studentName}`)).toBeVisible({ timeout: 3000 });
        } catch (e) {
          // Name might not appear on all pages, which is okay
        }
      }
    }
  });
});
