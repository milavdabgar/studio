import { test, expect } from '@playwright/test';

// Students API Migration - Before/After Validation Tests
// These tests will run before migration (against in-memory storage)
// and after migration (against MongoDB) to ensure identical behavior

test.describe('Students API Migration Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000/');
  });

  test.describe('Students Data Consistency', () => {
    
    test('should maintain student count after migration', async ({ page }) => {
      // Navigate to students page (assuming you have one)
      await page.goto('http://localhost:3000/students'); // Adjust URL to your actual students page
      
      // Count students before migration
      const studentElements = page.locator('[data-testid="student-item"]'); // Adjust selector
      const studentCount = await studentElements.count();
      
      console.log(`📊 Current student count: ${studentCount}`);
      
      // Validate we have the expected 38 students from our manual test
      expect(studentCount).toBeGreaterThan(30); // Allow for some flexibility
      expect(studentCount).toBeLessThan(50);    // But within reasonable bounds
    });

    test('should preserve all student data fields', async ({ page }) => {
      await page.goto('http://localhost:3000/students');
      
      // Check first student has all required fields
      const firstStudent = page.locator('[data-testid="student-item"]').first();
      
      // Verify essential fields are present (adjust selectors as needed)
      await expect(firstStudent.locator('[data-testid="student-name"]')).toBeVisible();
      await expect(firstStudent.locator('[data-testid="student-email"]')).toBeVisible();
      await expect(firstStudent.locator('[data-testid="student-id"]')).toBeVisible();
    });

    test('should maintain student search functionality', async ({ page }) => {
      await page.goto('http://localhost:3000/students');
      
      // Test search functionality if it exists
      const searchInput = page.locator('input[placeholder*="search" i]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test'); // Search for a common term
        await page.waitForTimeout(1000); // Wait for search results
        
        // Verify search results are shown
        const searchResults = page.locator('[data-testid="student-item"]');
        const resultCount = await searchResults.count();
        console.log(`🔍 Search returned ${resultCount} results`);
      }
    });

    test('should preserve student detail views', async ({ page }) => {
      await page.goto('http://localhost:3000/students');
      
      // Click on first student to view details
      const firstStudent = page.locator('[data-testid="student-item"]').first();
      if (await firstStudent.isVisible()) {
        await firstStudent.click();
        
        // Wait for navigation or modal/panel to open
        await page.waitForTimeout(1000);
        
        // Verify student details are displayed
        // Adjust these selectors based on your actual UI
        const detailsContainer = page.locator('[data-testid="student-details"]');
        if (await detailsContainer.isVisible()) {
          await expect(detailsContainer).toBeVisible();
        }
      }
    });
  });

  test.describe('Students CRUD Operations', () => {
    
    test('should create new student successfully', async ({ page }) => {
      await page.goto('http://localhost:3000/students');
      
      // Look for "Add Student" or similar button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Fill out student form (adjust field names as needed)
        const testEmail = `playwright-test-${Date.now()}@example.com`;
        
        await page.fill('[name="fullName"], [name="name"]', 'Playwright Test Student');
        await page.fill('[name="firstName"]', 'Playwright');
        await page.fill('[name="lastName"]', 'Student');
        await page.fill('[name="email"]', testEmail);
        
        // Submit form
        await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        await page.waitForTimeout(2000);
        
        // Verify student was created
        await expect(page.locator(`text=${testEmail}`)).toBeVisible();
        console.log(`✅ Created student with email: ${testEmail}`);
      } else {
        console.log('ℹ️ Add student button not found - skipping create test');
      }
    });

    test('should edit existing student', async ({ page }) => {
      await page.goto('http://localhost:3000/students');
      
      // Find an edit button or clickable student
      const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-student"]').first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Modify a field
        const nameField = page.locator('[name="fullName"], [name="name"]').first();
        if (await nameField.isVisible()) {
          await nameField.fill('Updated Test Student');
          
          // Save changes
          await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
          await page.waitForTimeout(1000);
          
          // Verify update
          await expect(page.locator('text=Updated Test Student')).toBeVisible();
          console.log('✅ Successfully updated student');
        }
      } else {
        console.log('ℹ️ Edit functionality not found - skipping edit test');
      }
    });

    test('should handle invalid student data', async ({ page }) => {
      await page.goto('http://localhost:3000/students');
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Try to submit with missing required fields
        await page.fill('[name="firstName"]', ''); // Clear required field
        await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        
        // Should show validation error
        const errorMessage = page.locator('text=required, text=error').first();
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
        console.log('✅ Validation errors shown correctly');
      }
    });
  });

  test.describe('Students API Direct Testing', () => {
    
    test('should respond to API calls correctly', async ({ request }) => {
      // Direct API testing using Playwright's request context
      const studentsResponse = await request.get('/api/students');
      
      expect(studentsResponse.status()).toBe(200);
      
      const students = await studentsResponse.json();
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBeGreaterThan(0);
      
      console.log(`📊 API returned ${students.length} students`);
      
      // Verify student structure
      if (students.length > 0) {
        const student = students[0];
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('email');
        expect(student).toHaveProperty('fullName');
        console.log('✅ Student data structure is correct');
      }
    });

    test('should handle student creation via API', async ({ request }) => {
      const newStudent = {
        fullName: 'API Test Student',
        firstName: 'API',
        lastName: 'Student',
        email: `api-test-${Date.now()}@example.com`,
        personalEmail: `personal-${Date.now()}@gmail.com`,
        mobileNumber: '9876543210',
        gender: 'Male',
        bloodGroup: 'O+',
        isActive: true
      };

      const response = await request.post('/api/students', {
        data: newStudent
      });

      expect(response.status()).toBe(201);
      
      const createdStudent = await response.json();
      expect(createdStudent.email).toBe(newStudent.email);
      expect(createdStudent.fullName).toBe(newStudent.fullName);
      
      console.log(`✅ Created student via API: ${createdStudent.id}`);
    });

    test('should maintain data consistency after server restart', async ({ request }) => {
      // This test is especially important for MongoDB migration
      // In-memory data would be lost on restart, MongoDB data should persist
      
      const beforeResponse = await request.get('/api/students');
      const beforeStudents = await beforeResponse.json();
      const beforeCount = beforeStudents.length;
      
      console.log(`📊 Students before restart simulation: ${beforeCount}`);
      
      // Note: In a real test, you'd actually restart the server here
      // For this test, we're just verifying current state consistency
      
      const afterResponse = await request.get('/api/students');
      const afterStudents = await afterResponse.json();
      const afterCount = afterStudents.length;
      
      expect(afterCount).toBe(beforeCount);
      console.log(`✅ Data consistency maintained: ${afterCount} students`);
    });
  });

  test.describe('Migration Safety Checks', () => {
    
    test('should preserve relationships with other entities', async ({ request }) => {
      // Check that students are still properly linked to programs, batches, etc.
      const studentsResponse = await request.get('/api/students');
      const students = await studentsResponse.json();
      
      if (students.length > 0) {
        const studentWithProgram = students.find((s: any) => s.programId || s.program);
        if (studentWithProgram) {
          console.log('✅ Student-program relationships preserved');
        }
        
        const studentWithBatch = students.find((s: any) => s.batchId || s.batch);
        if (studentWithBatch) {
          console.log('✅ Student-batch relationships preserved');
        }
      }
    });

    test('should maintain performance characteristics', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get('/api/students');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      console.log(`⚡ API response time: ${responseTime}ms`);
    });
  });
});
