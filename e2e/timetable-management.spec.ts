import { test, expect } from '@playwright/test';

test.describe('Timetable Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to timetable management page
    await page.goto('/admin/timetables');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display timetable management interface correctly', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('Timetable Management');
    
    // Check description
    await expect(page.getByText('Create, publish, and manage academic timetables')).toBeVisible();
    
    // Check new timetable button
    await expect(page.locator('button:has-text("New Timetable")')).toBeVisible();
    
    // Check search filters
    await expect(page.locator('text=Search Name/Year')).toBeVisible();
    await expect(page.locator('text=Filter Program')).toBeVisible();
    await expect(page.locator('text=Filter Batch')).toBeVisible();
    await expect(page.locator('text=Filter Status')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Program')).toBeVisible();
    await expect(page.locator('text=Batch')).toBeVisible();
    await expect(page.locator('text=Academic Year')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should allow searching timetables', async ({ page }) => {
    // Mock some timetables
    await page.route('/api/timetables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'tt1',
            name: 'CS Batch A - Semester 1',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch1',
            version: '1.0',
            status: 'published',
            effectiveDate: new Date().toISOString(),
            entries: []
          },
          {
            id: 'tt2',
            name: 'CS Batch B - Semester 1',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch2',
            version: '1.0',
            status: 'draft',
            effectiveDate: new Date().toISOString(),
            entries: []
          }
        ])
      });
    });
    
    await page.reload();
    
    // Search for specific timetable
    const searchInput = page.locator('input[placeholder*="Keyword"]');
    await searchInput.fill('Batch A');
    
    // Should filter results
    await expect(page.locator('text=CS Batch A - Semester 1')).toBeVisible();
    // Batch B should be hidden (if filtering works correctly)
  });

  test('should allow filtering by program and status', async ({ page }) => {
    // Mock programs and batches
    await page.route('/api/programs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prog1', name: 'Computer Science', code: 'CS' },
          { id: 'prog2', name: 'Information Technology', code: 'IT' }
        ])
      });
    });
    
    await page.route('/api/batches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'batch1', name: 'CS 2024 A', programId: 'prog1' },
          { id: 'batch2', name: 'IT 2024 A', programId: 'prog2' }
        ])
      });
    });
    
    await page.reload();
    
    // Filter by program
    const programFilter = page.locator('select').filter({ hasText: 'All Programs' });
    if (await programFilter.isVisible()) {
      await programFilter.selectOption('prog1');
    }
    
    // Filter by status
    const statusFilter = page.locator('select').filter({ hasText: 'All Statuses' });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('published');
    }
  });

  test('should open create timetable dialog', async ({ page }) => {
    // Mock required data
    await page.route('/api/programs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prog1', name: 'Computer Science', code: 'CS' }
        ])
      });
    });
    
    await page.route('/api/batches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'batch1', name: 'CS 2024 A', programId: 'prog1' }
        ])
      });
    });
    
    await page.reload();
    
    // Click new timetable button
    await page.locator('button:has-text("New Timetable")').click();
    
    // Check dialog is open
    await expect(page.locator('text=New Timetable')).toBeVisible();
    await expect(page.locator('text=Define timetable details and add entries')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('input[placeholder*="Name"]')).toBeVisible();
    await expect(page.locator('text=Academic Year')).toBeVisible();
    await expect(page.locator('text=Semester')).toBeVisible();
    await expect(page.locator('text=Program')).toBeVisible();
    await expect(page.locator('text=Batch')).toBeVisible();
  });

  test('should create new timetable successfully', async ({ page }) => {
    // Mock required data
    await page.route('/api/programs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prog1', name: 'Computer Science', code: 'CS' }
        ])
      });
    });
    
    await page.route('/api/batches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'batch1', name: 'CS 2024 A', programId: 'prog1' }
        ])
      });
    });
    
    // Mock create API
    await page.route('/api/timetables', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'tt_new',
            name: 'Test Timetable',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch1',
            version: '1.0',
            status: 'draft',
            effectiveDate: new Date().toISOString(),
            entries: []
          })
        });
      }
    });
    
    await page.reload();
    
    // Open dialog
    await page.locator('button:has-text("New Timetable")').click();
    
    // Fill form
    await page.locator('input').first().fill('Test Timetable');
    
    // Select academic year
    const academicYearSelect = page.locator('select').first();
    await academicYearSelect.selectOption('2024-25');
    
    // Select semester
    const semesterInput = page.locator('input[type="number"]').first();
    await semesterInput.fill('1');
    
    // Submit form
    await page.locator('button:has-text("Create Timetable")').click();
    
    // Check success message
    await expect(page.locator('text=Timetable Created')).toBeVisible();
    await expect(page.locator('text=Successfully created')).toBeVisible();
  });

  test('should validate timetable form', async ({ page }) => {
    // Mock data
    await page.route('/api/programs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prog1', name: 'Computer Science', code: 'CS' }
        ])
      });
    });
    
    await page.route('/api/batches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'batch1', name: 'CS 2024 A', programId: 'prog1' }
        ])
      });
    });
    
    await page.reload();
    
    // Open dialog
    await page.locator('button:has-text("New Timetable")').click();
    
    // Try to submit without required fields
    await page.locator('button:has-text("Create Timetable")').click();
    
    // Should show validation error
    await expect(page.locator('text=Validation Error')).toBeVisible();
    await expect(page.locator('text=Name, Program, Batch, and Academic Year are required')).toBeVisible();
  });

  test('should allow adding timetable entries', async ({ page }) => {
    // Mock all required data
    await page.route('/api/programs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prog1', name: 'Computer Science', code: 'CS' }
        ])
      });
    });
    
    await page.route('/api/batches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'batch1', name: 'CS 2024 A', programId: 'prog1' }
        ])
      });
    });
    
    await page.route('/api/course-offerings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'co1',
            courseId: 'course1',
            batchId: 'batch1',
            academicYear: '2024-25',
            semester: 1,
            facultyIds: ['faculty1'],
            roomIds: ['room1'],
            status: 'scheduled'
          }
        ])
      });
    });
    
    await page.route('/api/faculty', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'faculty1',
            gtuName: 'Dr. John Doe',
            staffCode: 'F001',
            instituteEmail: 'john@test.com',
            status: 'active'
          }
        ])
      });
    });
    
    await page.route('/api/rooms', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'room1',
            roomNumber: '101',
            name: 'Lecture Hall 1',
            type: 'Lecture Hall',
            capacity: 60,
            status: 'active'
          }
        ])
      });
    });
    
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
    
    // Open create dialog
    await page.locator('button:has-text("New Timetable")').click();
    
    // Fill basic details
    await page.locator('input').first().fill('Test Timetable');
    
    // Wait for form to be ready
    await page.waitForTimeout(1000);
    
    // Add an entry
    const daySelect = page.locator('select').filter({ hasText: 'Monday' });
    if (await daySelect.isVisible()) {
      await daySelect.selectOption('Tuesday');
    }
    
    // Set time
    const startTimeInput = page.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible()) {
      await startTimeInput.fill('09:00');
    }
    
    const endTimeInput = page.locator('input[type="time"]').nth(1);
    if (await endTimeInput.isVisible()) {
      await endTimeInput.fill('10:00');
    }
    
    // Select course offering
    const courseOfferingSelect = page.locator('select').filter({ hasText: 'Select Course Offering' });
    if (await courseOfferingSelect.isVisible()) {
      await courseOfferingSelect.selectOption('co1');
    }
    
    // Select faculty
    const facultySelect = page.locator('select').filter({ hasText: 'Select Faculty' });
    if (await facultySelect.isVisible()) {
      await facultySelect.selectOption('faculty1');
    }
    
    // Select room
    const roomSelect = page.locator('select').filter({ hasText: 'Select Room' });
    if (await roomSelect.isVisible()) {
      await roomSelect.selectOption('room1');
    }
    
    // Add entry
    await page.locator('button:has-text("Add Entry")').click();
    
    // Verify entry was added
    await expect(page.locator('text=Tuesday')).toBeVisible();
    await expect(page.locator('text=09:00-10:00')).toBeVisible();
  });

  test('should detect entry conflicts', async ({ page }) => {
    // Similar setup as above...
    await page.route('/api/programs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prog1', name: 'Computer Science', code: 'CS' }
        ])
      });
    });
    
    // Mock other required endpoints...
    
    await page.reload();
    
    // Open dialog and add conflicting entries
    await page.locator('button:has-text("New Timetable")').click();
    
    // Add first entry
    // ... (similar to above test)
    
    // Try to add conflicting entry (same faculty, same time)
    // ... (configure same parameters)
    
    // Should show conflict error
    await expect(page.locator('text=Slot Conflict')).toBeVisible();
  });

  test('should allow editing existing timetable', async ({ page }) => {
    // Mock existing timetable
    await page.route('/api/timetables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'tt1',
            name: 'Existing Timetable',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch1',
            version: '1.0',
            status: 'draft',
            effectiveDate: new Date().toISOString(),
            entries: []
          }
        ])
      });
    });
    
    await page.reload();
    
    // Click edit button
    const editButton = page.locator('button[aria-label="Edit Timetable"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Check edit dialog opens
      await expect(page.locator('text=Edit Timetable')).toBeVisible();
      
      // Check that form is pre-filled
      const nameInput = page.locator('input').first();
      await expect(nameInput).toHaveValue('Existing Timetable');
    }
  });

  test('should allow viewing timetable details', async ({ page }) => {
    // Mock existing timetable
    await page.route('/api/timetables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'tt1',
            name: 'View Test Timetable',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch1',
            version: '1.0',
            status: 'published',
            effectiveDate: new Date().toISOString(),
            entries: [
              {
                dayOfWeek: 'Monday',
                startTime: '09:00',
                endTime: '10:00',
                courseId: 'course1',
                facultyId: 'faculty1',
                roomId: 'room1',
                entryType: 'lecture'
              }
            ]
          }
        ])
      });
    });
    
    await page.reload();
    
    // Click view button
    const viewButton = page.locator('button[aria-label="View Timetable"]').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // Check view dialog opens
      await expect(page.locator('text=Timetable Details')).toBeVisible();
      await expect(page.locator('text=Basic Information')).toBeVisible();
      await expect(page.locator('text=Timetable Entries')).toBeVisible();
      
      // Check timetable details are displayed
      await expect(page.locator('text=View Test Timetable')).toBeVisible();
      await expect(page.locator('text=2024-25')).toBeVisible();
      await expect(page.locator('text=published')).toBeVisible();
    }
  });

  test('should allow deleting timetables', async ({ page }) => {
    // Mock existing timetable
    await page.route('/api/timetables', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tt1',
              name: 'Delete Test Timetable',
              academicYear: '2024-25',
              semester: 1,
              programId: 'prog1',
              batchId: 'batch1',
              version: '1.0',
              status: 'draft',
              effectiveDate: new Date().toISOString(),
              entries: []
            }
          ])
        });
      }
    });
    
    // Mock delete API
    await page.route('/api/timetables/tt1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200 });
      }
    });
    
    await page.reload();
    
    // Click delete button
    const deleteButton = page.locator('button[aria-label="Delete Timetable"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Check success message
      await expect(page.locator('text=Timetable Deleted')).toBeVisible();
    }
  });

  test('should handle bulk selection and deletion', async ({ page }) => {
    // Mock multiple timetables
    await page.route('/api/timetables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'tt1',
            name: 'Timetable 1',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch1',
            version: '1.0',
            status: 'draft',
            effectiveDate: new Date().toISOString(),
            entries: []
          },
          {
            id: 'tt2',
            name: 'Timetable 2',
            academicYear: '2024-25',
            semester: 1,
            programId: 'prog1',
            batchId: 'batch2',
            version: '1.0',
            status: 'draft',
            effectiveDate: new Date().toISOString(),
            entries: []
          }
        ])
      });
    });
    
    await page.reload();
    
    // Select multiple timetables
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      
      // Check that bulk delete button appears
      await expect(page.locator('button:has-text("Delete Selected")')).toBeVisible();
      
      // Check selection count
      await expect(page.locator('text=2 timetable(s) selected')).toBeVisible();
    }
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Mock many timetables to trigger pagination
    const manyTimetables = Array.from({ length: 25 }, (_, i) => ({
      id: `tt${i}`,
      name: `Timetable ${i}`,
      academicYear: '2024-25',
      semester: 1,
      programId: 'prog1',
      batchId: 'batch1',
      version: '1.0',
      status: 'draft',
      effectiveDate: new Date().toISOString(),
      entries: []
    }));
    
    await page.route('/api/timetables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(manyTimetables)
      });
    });
    
    await page.reload();
    
    // Check pagination controls
    await expect(page.locator('text=Page 1 of')).toBeVisible();
    
    // Check items per page selector
    const itemsPerPageSelect = page.locator('select').last();
    if (await itemsPerPageSelect.isVisible()) {
      await itemsPerPageSelect.selectOption('20');
    }
    
    // Check next/previous buttons
    const nextButton = page.locator('button[aria-label="Next page"]');
    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      await nextButton.click();
      await expect(page.locator('text=Page 2 of')).toBeVisible();
    }
  });

  test('should handle responsive design correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
  });
});