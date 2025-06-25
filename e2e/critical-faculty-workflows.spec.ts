import { test, expect } from '@playwright/test';
import { loginAsFaculty, fillForm, submitForm, waitForPageLoad } from './test-helpers';

/**
 * Critical Faculty Workflow Tests - MongoDB Migration Priority
 * Priority: HIGH - Faculty workflows are core to the system and affected by MongoDB migration
 * 
 * Tests faculty-specific routes and workflows that handle teaching, grading, and attendance
 */

test.describe('Critical Faculty Workflows - MongoDB Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as faculty for all tests
    await loginAsFaculty(page);
  });

  test('should access faculty attendance marking page', async ({ page }) => {
    await waitForPageLoad(page, '/faculty/attendance/mark');
    
    // Verify page loads correctly
    await expect(page.locator('text=Attendance')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Mark')).toBeVisible();
    
    // Look for attendance marking interface elements
    const attendanceElements = [
      'text=Student',
      'text=Present',
      'text=Absent',
      'checkbox',
      'button:has-text("Save")',
      'button:has-text("Submit")'
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

  test('should access faculty attendance reports page', async ({ page }) => {
    await waitForPageLoad(page, '/faculty/attendance/reports');
    
    await expect(page.locator('text=Attendance')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Report')).toBeVisible();
    
    // Look for report elements
    const reportElements = [
      'text=Student',
      'text=Percentage',
      'text=Total',
      'text=Present',
      'text=Absent',
      'table',
      'text=Export'
    ];
    
    let reportElementFound = false;
    for (const element of reportElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        reportElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(reportElementFound).toBe(true);
  });

  test('should access faculty assessments grading page', async ({ page }) => {
    await waitForPageLoad(page, '/faculty/assessments/grade');
    
    await expect(page.locator('text=Assessment')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Grade')).toBeVisible();
    
    // Look for grading interface elements
    const gradingElements = [
      'text=Student',
      'text=Marks',
      'text=Grade',
      'input[type="number"]',
      'select',
      'button:has-text("Save")',
      'button:has-text("Submit")'
    ];
    
    let gradingElementFound = false;
    for (const element of gradingElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        gradingElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(gradingElementFound).toBe(true);
  });

  test('should access faculty my courses page', async ({ page }) => {
    await waitForPageLoad(page, '/faculty/my-courses');
    
    await expect(page.locator('text=Course')).toBeVisible({ timeout: 10000 });
    
    // Look for course listing elements
    const courseElements = [
      'text=Course',
      'text=Students',
      'text=Semester',
      'text=View',
      'text=Manage',
      'link'
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

  test('should access faculty leaves management page', async ({ page }) => {
    await waitForPageLoad(page, '/faculty/leaves');
    
    await expect(page.locator('text=Leave')).toBeVisible({ timeout: 10000 });
    
    // Test leave application functionality
    const applyButton = page.locator('button:has-text("Apply"), a:has-text("Apply")').first();
    if (await applyButton.isVisible()) {
      await applyButton.click();
      
      // Verify leave application form
      await expect(page.locator('[name="leaveType"], [name="type"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[name="startDate"], [name="fromDate"]')).toBeVisible();
      await expect(page.locator('[name="endDate"], [name="toDate"]')).toBeVisible();
      await expect(page.locator('[name="reason"]')).toBeVisible();
      
      // Fill leave application form
      await fillForm(page, {
        leaveType: 'Sick Leave',
        startDate: '2024-07-01',
        endDate: '2024-07-02',
        reason: 'Medical appointment'
      });
      
      await submitForm(page);
      await page.waitForTimeout(2000);
    }
  });

  test('should access dynamic faculty course offering assessments', async ({ page }) => {
    // Use a test course offering ID
    const courseOfferingId = 'test-course-offering-123';
    await waitForPageLoad(page, `/faculty/course-offerings/${courseOfferingId}/assessments`);
    
    // Page should load (may show no data but shouldn't error)
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if we're still on the expected route (not redirected to error page)
    expect(page.url()).toContain(`/faculty/course-offerings/${courseOfferingId}/assessments`);
    
    // Look for assessment-related elements
    const assessmentElements = [
      'text=Assessment',
      'text=Grade',
      'text=Student',
      'text=Marks',
      'text=No data',
      'text=Empty'
    ];
    
    let assessmentElementFound = false;
    for (const element of assessmentElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        assessmentElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(assessmentElementFound).toBe(true);
  });

  test('should access dynamic faculty course offering materials', async ({ page }) => {
    const courseOfferingId = 'test-course-offering-123';
    await waitForPageLoad(page, `/faculty/course-offerings/${courseOfferingId}/materials`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/faculty/course-offerings/${courseOfferingId}/materials`);
    
    // Look for materials-related elements
    const materialElements = [
      'text=Material',
      'text=Upload',
      'text=File',
      'text=Document',
      'text=Add',
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

  test('should access dynamic faculty course offering students', async ({ page }) => {
    const courseOfferingId = 'test-course-offering-123';
    await waitForPageLoad(page, `/faculty/course-offerings/${courseOfferingId}/students`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/faculty/course-offerings/${courseOfferingId}/students`);
    
    // Look for student listing elements
    const studentElements = [
      'text=Student',
      'text=Name',
      'text=Roll',
      'text=Email',
      'text=Enrollment',
      'text=No students',
      'text=Empty'
    ];
    
    let studentElementFound = false;
    for (const element of studentElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        studentElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(studentElementFound).toBe(true);
  });

  test('should access dynamic faculty course students', async ({ page }) => {
    const courseId = 'test-course-123';
    await waitForPageLoad(page, `/faculty/courses/${courseId}/students`);
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(page.url()).toContain(`/faculty/courses/${courseId}/students`);
    
    // Look for course student elements
    const courseStudentElements = [
      'text=Student',
      'text=Course',
      'text=Enrolled',
      'text=Grade',
      'text=Performance',
      'text=No students',
      'text=Empty'
    ];
    
    let courseStudentElementFound = false;
    for (const element of courseStudentElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 3000 });
        courseStudentElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(courseStudentElementFound).toBe(true);
  });

  test('should handle faculty workflow navigation', async ({ page }) => {
    const facultyRoutes = [
      '/faculty',
      '/faculty/profile',
      '/faculty/my-courses',
      '/faculty/timetable',
      '/faculty/attendance/mark',
      '/faculty/assessments/grade'
    ];
    
    for (const route of facultyRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Verify we're on the expected route
      expect(page.url()).toContain(route);
      
      // Verify page loads successfully (not redirected to login)
      expect(page.url()).not.toContain('/login');
      
      // Verify some faculty-related content exists
      const facultyElements = [
        'text=Faculty',
        'text=Course',
        'text=Student',
        'text=Dashboard'
      ];
      
      let facultyElementFound = false;
      for (const element of facultyElements) {
        try {
          await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
          facultyElementFound = true;
          break;
        } catch (e) {
          // Continue checking
        }
      }
      
      expect(facultyElementFound).toBe(true);
    }
  });

  test('should test faculty form interactions', async ({ page }) => {
    // Test attendance marking form interaction
    await waitForPageLoad(page, '/faculty/attendance/mark');
    
    // Look for attendance checkboxes or buttons
    const attendanceInputs = page.locator('input[type="checkbox"], button:has-text("Present"), button:has-text("Absent")');
    const inputCount = await attendanceInputs.count();
    
    if (inputCount > 0) {
      // Click first attendance checkbox/button
      await attendanceInputs.first().click();
      
      // Look for save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should test faculty grading workflow', async ({ page }) => {
    await waitForPageLoad(page, '/faculty/assessments/grade');
    
    // Look for grading inputs
    const gradeInputs = page.locator('input[type="number"], select');
    const inputCount = await gradeInputs.count();
    
    if (inputCount > 0) {
      // Fill first grade input
      const firstInput = gradeInputs.first();
      const inputType = await firstInput.getAttribute('type');
      
      if (inputType === 'number') {
        await firstInput.fill('85');
      } else {
        // Assume it's a select
        await firstInput.selectOption({ index: 1 });
      }
      
      // Look for save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
