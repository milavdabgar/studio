import { test, expect } from '@playwright/test';

test.describe('Faculty Preferences', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to faculty preferences page
    await page.goto('/faculty/preferences');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display faculty preferences interface correctly', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('Teaching Preferences');
    
    // Check description
    await expect(page.getByText('Configure your course and time preferences')).toBeVisible();
    
    // Check save button
    await expect(page.locator('button:has-text("Save Preferences")')).toBeVisible();
    
    // Check academic term section
    await expect(page.locator('text=Academic Term')).toBeVisible();
    await expect(page.locator('text=Academic Year')).toBeVisible();
    await expect(page.locator('text=Semester')).toBeVisible();
    
    // Check course preferences section
    await expect(page.locator('text=Course Preferences')).toBeVisible();
    
    // Check time preferences section
    await expect(page.locator('text=Time Preferences')).toBeVisible();
    
    // Check working days section
    await expect(page.locator('text=Working Days')).toBeVisible();
    
    // Check workload limits section
    await expect(page.locator('text=Workload Limits')).toBeVisible();
  });

  test('should allow selecting academic year and semester', async ({ page }) => {
    // Select academic year
    const academicYearSelect = page.locator('select').first();
    await academicYearSelect.selectOption('2024-25');
    await expect(academicYearSelect).toHaveValue('2024-25');
    
    // Select semester
    const semesterSelect = page.locator('select').nth(1);
    await semesterSelect.selectOption('2');
    await expect(semesterSelect).toHaveValue('2');
  });

  test('should allow adding course preferences', async ({ page }) => {
    // Mock courses being available
    await page.route('/api/courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'course1',
            subjectName: 'Data Structures',
            subjectCode: 'CS101'
          },
          {
            id: 'course2',
            subjectName: 'Algorithms',
            subjectCode: 'CS102'
          }
        ])
      });
    });
    
    // Reload to get mock data
    await page.reload();
    
    // Select a course
    const courseSelect = page.locator('select').filter({ hasText: 'Select course' });
    if (await courseSelect.isVisible()) {
      await courseSelect.selectOption('course1');
      
      // Select preference level
      const preferenceSelect = page.locator('select').nth(2);
      await preferenceSelect.selectOption('high');
      
      // Set expertise level
      const expertiseInput = page.locator('input[type="number"]').first();
      await expertiseInput.fill('8');
      
      // Click add button
      await page.locator('button').filter({ hasText: 'Add' }).click();
      
      // Verify course preference was added
      await expect(page.locator('text=Data Structures')).toBeVisible();
      await expect(page.locator('text=CS101')).toBeVisible();
      await expect(page.locator('text=high')).toBeVisible();
    }
  });

  test('should allow adding time preferences', async ({ page }) => {
    // Select day
    const daySelect = page.locator('select').filter({ hasText: 'Monday' }).first();
    await daySelect.selectOption('Tuesday');
    
    // Select start time
    const startTimeSelect = page.locator('select').filter({ hasText: '09:00' }).first();
    await startTimeSelect.selectOption('10:00');
    
    // Select end time
    const endTimeSelect = page.locator('select').filter({ hasText: '10:00' }).first();
    await endTimeSelect.selectOption('12:00');
    
    // Select preference type
    const preferenceSelect = page.locator('select').filter({ hasText: 'Preferred' }).first();
    await preferenceSelect.selectOption('available');
    
    // Click add button
    const addButtons = page.locator('button').filter({ hasText: 'Add' });
    await addButtons.last().click();
    
    // Verify time preference was added to table
    await expect(page.locator('text=Tuesday')).toBeVisible();
    await expect(page.locator('text=10:00 - 12:00')).toBeVisible();
    await expect(page.locator('text=available')).toBeVisible();
  });

  test('should validate time preferences', async ({ page }) => {
    // Try to add invalid time range (end before start)
    const startTimeSelect = page.locator('select').filter({ hasText: '09:00' }).first();
    await startTimeSelect.selectOption('12:00');
    
    const endTimeSelect = page.locator('select').filter({ hasText: '10:00' }).first();
    await endTimeSelect.selectOption('10:00');
    
    // Click add button
    const addButton = page.locator('button').filter({ hasText: 'Add' }).last();
    await addButton.click();
    
    // Should show validation error
    await expect(page.locator('text=Invalid Time')).toBeVisible();
    await expect(page.locator('text=End time must be after start time')).toBeVisible();
  });

  test('should allow toggling working days', async ({ page }) => {
    // Check current state of Monday checkbox
    const mondayCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Monday' });
    const initialState = await mondayCheckbox.isChecked();
    
    // Toggle Monday
    await mondayCheckbox.click();
    await expect(mondayCheckbox).toBeChecked(!initialState);
    
    // Toggle Tuesday
    const tuesdayCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Tuesday' });
    const tuesdayInitialState = await tuesdayCheckbox.isChecked();
    await tuesdayCheckbox.click();
    await expect(tuesdayCheckbox).toBeChecked(!tuesdayInitialState);
  });

  test('should allow configuring workload limits', async ({ page }) => {
    // Configure max hours per week
    const maxHoursInput = page.locator('input[type="number"]').filter({ hasText: 'Max Hours Per Week' });
    await maxHoursInput.fill('25');
    await expect(maxHoursInput).toHaveValue('25');
    
    // Configure max consecutive hours
    const consecutiveInput = page.locator('input[type="number"]').filter({ hasText: 'Max Consecutive Hours' });
    await consecutiveInput.fill('4');
    await expect(consecutiveInput).toHaveValue('4');
    
    // Configure priority level
    const priorityInput = page.locator('input[type="number"]').filter({ hasText: 'Priority Level' });
    await priorityInput.fill('7');
    await expect(priorityInput).toHaveValue('7');
  });

  test('should save preferences successfully', async ({ page }) => {
    // Mock save API
    await page.route('/api/faculty-preferences', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'pref1',
            facultyId: 'faculty1',
            academicYear: '2024-25',
            semester: 1,
            preferredCourses: [],
            timePreferences: [],
            roomPreferences: [],
            maxHoursPerWeek: 20,
            maxConsecutiveHours: 3,
            unavailableSlots: [],
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            priority: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      }
    });
    
    // Configure some basic settings
    const maxHoursInput = page.locator('input[type="number"]').first();
    await maxHoursInput.fill('22');
    
    // Save preferences
    await page.locator('button:has-text("Save Preferences")').click();
    
    // Check for success message
    await expect(page.locator('text=Preferences Saved')).toBeVisible();
    await expect(page.locator('text=successfully')).toBeVisible();
  });

  test('should handle save errors gracefully', async ({ page }) => {
    // Mock save API error
    await page.route('/api/faculty-preferences', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Validation failed'
        })
      });
    });
    
    // Try to save
    await page.locator('button:has-text("Save Preferences")').click();
    
    // Check for error message
    await expect(page.locator('text=Save Failed')).toBeVisible();
  });

  test('should allow removing course preferences', async ({ page }) => {
    // Mock having existing course preferences
    await page.route('/api/faculty-preferences*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pref1',
            facultyId: 'faculty1',
            academicYear: '2024-25',
            semester: 1,
            preferredCourses: [
              {
                courseId: 'course1',
                preference: 'high',
                expertise: 8,
                previouslyTaught: true
              }
            ],
            timePreferences: [],
            roomPreferences: [],
            maxHoursPerWeek: 20,
            maxConsecutiveHours: 3,
            unavailableSlots: [],
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            priority: 5
          }
        ])
      });
    });
    
    await page.reload();
    
    // Look for remove button (trash icon)
    const removeButton = page.locator('button').filter({ hasText: 'Remove' }).first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Verify course preference was removed
      await expect(page.locator('text=No course preferences added yet')).toBeVisible();
    }
  });

  test('should allow removing time preferences', async ({ page }) => {
    // Add a time preference first
    const startTimeSelect = page.locator('select').filter({ hasText: '09:00' }).first();
    await startTimeSelect.selectOption('10:00');
    
    const endTimeSelect = page.locator('select').filter({ hasText: '10:00' }).first();
    await endTimeSelect.selectOption('11:00');
    
    await page.locator('button').filter({ hasText: 'Add' }).last().click();
    
    // Now remove it
    const removeButton = page.locator('button svg').filter({ hasText: 'trash' }).first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Verify time preference was removed
      await expect(page.locator('text=No time preferences added yet')).toBeVisible();
    }
  });

  test('should display important notes correctly', async ({ page }) => {
    // Check that important notes section is visible
    await expect(page.locator('text=Important Notes')).toBeVisible();
    
    // Check specific notes
    await expect(page.getByText('Preferences are used during automatic timetable generation')).toBeVisible();
    await expect(page.getByText('High priority preferences are given more weight')).toBeVisible();
    await expect(page.getByText('Time conflicts will still be avoided')).toBeVisible();
    await expect(page.getByText('You can update preferences anytime')).toBeVisible();
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Mock slow loading
    await page.route('/api/courses', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.reload();
    
    // Should show loading state
    await expect(page.locator('text=Loading preferences')).toBeVisible();
  });

  test('should prevent duplicate course preferences', async ({ page }) => {
    // Mock courses
    await page.route('/api/courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'course1',
            subjectName: 'Data Structures',
            subjectCode: 'CS101'
          }
        ])
      });
    });
    
    await page.reload();
    
    // Add first course preference
    const courseSelect = page.locator('select').filter({ hasText: 'Select course' });
    if (await courseSelect.isVisible()) {
      await courseSelect.selectOption('course1');
      await page.locator('button').filter({ hasText: 'Add' }).first().click();
      
      // Try to add the same course again
      await courseSelect.selectOption('course1');
      await page.locator('button').filter({ hasText: 'Add' }).first().click();
      
      // Should update existing preference instead of creating duplicate
      const courseElements = page.locator('text=Data Structures');
      await expect(courseElements).toHaveCount(1);
    }
  });

  test('should handle responsive design correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that form is still usable on mobile
    const saveButton = page.locator('button:has-text("Save Preferences")');
    await expect(saveButton).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should validate form inputs correctly', async ({ page }) => {
    // Test negative hours
    const maxHoursInput = page.locator('input[type="number"]').first();
    await maxHoursInput.fill('-5');
    
    // Should enforce minimum value
    await expect(maxHoursInput).toHaveValue('1'); // Assuming min="1"
    
    // Test excessive hours
    await maxHoursInput.fill('100');
    
    // Should enforce maximum value
    await expect(maxHoursInput).toHaveValue('40'); // Assuming max="40"
  });

  test('should show appropriate preference badges', async ({ page }) => {
    // Mock having preferences loaded
    await page.route('/api/faculty-preferences*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pref1',
            facultyId: 'faculty1',
            academicYear: '2024-25',
            semester: 1,
            preferredCourses: [
              {
                courseId: 'course1',
                preference: 'high',
                expertise: 9,
                previouslyTaught: true
              }
            ],
            timePreferences: [
              {
                dayOfWeek: 'Monday',
                startTime: '09:00',
                endTime: '11:00',
                preference: 'preferred'
              }
            ],
            roomPreferences: [],
            maxHoursPerWeek: 20,
            maxConsecutiveHours: 3,
            unavailableSlots: [],
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            priority: 8
          }
        ])
      });
    });
    
    await page.reload();
    
    // Check for preference badges with correct colors
    const highBadge = page.locator('text=high').first();
    if (await highBadge.isVisible()) {
      // High preference should have green styling
      await expect(highBadge).toHaveClass(/green/);
    }
    
    const preferredBadge = page.locator('text=preferred').first();
    if (await preferredBadge.isVisible()) {
      // Preferred time should have green styling
      await expect(preferredBadge).toHaveClass(/green/);
    }
  });
});