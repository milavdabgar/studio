import { test, expect, Page } from '@playwright/test';
import { loginAsStudent } from './test-helpers';

// Mock student data for testing
const mockStudent = {
  firstName: 'John',
  lastName: 'Doe', 
  enrollmentNumber: 'STU001',
  instituteEmail: 'student@example.com', // Use existing test user
  personalEmail: 'john@personal.com',
  contactNumber: '+1234567890',
  address: '123 Main St, City, State',
  currentSemester: 5
};

// Using shared authentication helper from test-helpers.ts

test.describe('Student Profile System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student before each test using shared helper
    await loginAsStudent(page);
  });

  test.describe('Profile Page Navigation', () => {
    test('should navigate to profile page successfully', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Check page loads correctly
      await expect(page.locator('text=Student Profile')).toBeVisible();
      await expect(page.locator('text=Manage your comprehensive student profile')).toBeVisible();
    });

    test('should display all profile tabs', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Verify all tabs are present
      await expect(page.locator('[data-testid="tab-basic"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-academics"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-professional"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-security"]')).toBeVisible();
    });

    test('should switch between tabs correctly', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Click on academics tab
      await page.click('[data-testid="tab-academics"]');
      await expect(page.locator('text=Education')).toBeVisible();
      
      // Click on professional tab
      await page.click('[data-testid="tab-professional"]');
      await expect(page.locator('text=Experience')).toBeVisible();
      
      // Click on security tab
      await page.click('[data-testid="tab-security"]');
      await expect(page.locator('text=Change Password')).toBeVisible();
    });
  });

  test.describe('Basic Information Tab', () => {
    test('should display student basic information', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Check basic info is displayed
      await expect(page.locator('text=' + mockStudent.firstName)).toBeVisible();
      await expect(page.locator('text=' + mockStudent.enrollmentNumber)).toBeVisible();
      await expect(page.locator('text=' + mockStudent.instituteEmail)).toBeVisible();
    });

    test('should open and close basic info edit dialog', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Click edit button
      await page.click('[data-testid="edit-basic-info"]');
      
      // Verify dialog opens
      await expect(page.locator('text=Edit Basic Information')).toBeVisible();
      
      // Close dialog
      await page.click('button:has-text("Cancel")');
      
      // Verify dialog closes
      await expect(page.locator('text=Edit Basic Information')).not.toBeVisible();
    });

    test('should edit basic information successfully', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Open edit dialog
      await page.click('[data-testid="edit-basic-info"]');
      
      // Update personal email
      await page.fill('[name="personalEmail"]', 'newemail@test.com');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Verify success message
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    });

    test('should display profile completeness indicator', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Check profile completeness section exists
      await expect(page.locator('text=Profile Completeness')).toBeVisible();
      await expect(page.locator('[role="progressbar"]')).toBeVisible();
    });

    test('should upload profile photo', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Create a test image file
      const fileInput = page.locator('input[type="file"]');
      
      // Mock file upload (adjust based on your implementation)
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });
      
      // Verify upload success message appears
      await expect(page.locator('text=Profile photo updated successfully')).toBeVisible();
    });
  });

  test.describe('Education Section', () => {
    test('should add new education entry', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Click add education button
      await page.click('button:has-text("Add Education")');
      
      // Fill education form
      await page.fill('[name="degree"]', 'Bachelor of Science');
      await page.fill('[name="field"]', 'Computer Science');
      await page.fill('[name="institution"]', 'Test University');
      await page.fill('[name="startDate"]', '2020-09-01');
      await page.fill('[name="endDate"]', '2024-05-31');
      await page.fill('[name="grade"]', '8.5');
      
      // Save education entry
      await page.click('button:has-text("Save")');
      
      // Verify education appears in list
      await expect(page.locator('text=Bachelor of Science')).toBeVisible();
      await expect(page.locator('text=Test University')).toBeVisible();
    });

    test('should edit existing education entry', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Assume there's already an education entry
      await page.click('[data-testid="edit-education-0"]');
      
      // Modify institution name
      await page.fill('[name="institution"]', 'Updated University');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      // Verify changes appear
      await expect(page.locator('text=Updated University')).toBeVisible();
    });

    test('should delete education entry', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Add an education entry first
      await page.click('button:has-text("Add Education")');
      await page.fill('[name="degree"]', 'Test Degree');
      await page.fill('[name="institution"]', 'Test School');
      await page.click('button:has-text("Save")');
      
      // Delete the entry
      await page.click('[data-testid="delete-education-0"]');
      
      // Verify entry is removed
      await expect(page.locator('text=Test Degree')).not.toBeVisible();
    });
  });

  test.describe('Skills Section', () => {
    test('should add new skill', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Click add skill button
      await page.click('button:has-text("Add Skill")');
      
      // Fill skill form
      await page.fill('[name="name"]', 'JavaScript');
      await page.selectOption('[name="category"]', 'technical');
      await page.selectOption('[name="proficiency"]', 'advanced');
      
      // Save skill
      await page.click('button:has-text("Save")');
      
      // Verify skill appears
      await expect(page.locator('text=JavaScript')).toBeVisible();
    });

    test('should group skills by category', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Add technical skill
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'Python');
      await page.selectOption('[name="category"]', 'technical');
      await page.click('button:has-text("Save")');
      
      // Add soft skill
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'Leadership');
      await page.selectOption('[name="category"]', 'soft');
      await page.click('button:has-text("Save")');
      
      // Verify skills are grouped
      await expect(page.locator('text=Technical Skills')).toBeVisible();
      await expect(page.locator('text=Soft Skills')).toBeVisible();
    });
  });

  test.describe('Projects Section', () => {
    test('should add new project', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-professional"]');
      
      // Click add project button
      await page.click('button:has-text("Add Project")');
      
      // Fill project form
      await page.fill('[name="title"]', 'E-commerce Website');
      await page.fill('[name="description"]', 'A full-stack e-commerce platform');
      await page.fill('[name="technologies"]', 'React, Node.js, MongoDB');
      await page.fill('[name="startDate"]', '2023-01-01');
      await page.fill('[name="endDate"]', '2023-06-01');
      await page.fill('[name="githubUrl"]', 'https://github.com/test/project');
      
      // Save project
      await page.click('button:has-text("Save")');
      
      // Verify project appears
      await expect(page.locator('text=E-commerce Website')).toBeVisible();
      await expect(page.locator('text=React')).toBeVisible();
    });

    test('should handle currently working on project', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-professional"]');
      
      // Add project
      await page.click('button:has-text("Add Project")');
      await page.fill('[name="title"]', 'Ongoing Project');
      await page.fill('[name="description"]', 'Current project in development');
      
      // Check currently working checkbox
      await page.check('[name="isCurrently"]');
      
      // Verify end date is disabled
      await expect(page.locator('[name="endDate"]')).toBeDisabled();
      
      // Save project
      await page.click('button:has-text("Save")');
      
      // Verify "Present" appears in date range
      await expect(page.locator('text=Present')).toBeVisible();
    });
  });

  test.describe('Experience Section', () => {
    test('should add work experience', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-professional"]');
      
      // Click add experience button
      await page.click('button:has-text("Add Experience")');
      
      // Fill experience form
      await page.fill('[name="company"]', 'Tech Corp');
      await page.fill('[name="position"]', 'Software Intern');
      await page.fill('[name="startDate"]', '2023-06-01');
      await page.fill('[name="endDate"]', '2023-08-31');
      await page.fill('[name="description"]', 'Developed web applications during summer internship');
      await page.selectOption('[name="employmentType"]', 'internship');
      
      // Save experience
      await page.click('button:has-text("Save")');
      
      // Verify experience appears
      await expect(page.locator('text=Software Intern')).toBeVisible();
      await expect(page.locator('text=Tech Corp')).toBeVisible();
    });
  });

  test.describe('Resume Generation', () => {
    test('should generate PDF resume', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Click resume dropdown
      await page.click('[data-testid="generate-resume-dropdown"]');
      
      // Start download
      const downloadPromise = page.waitForDownload();
      await page.click('text=Download as PDF');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    test('should generate DOCX resume', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Click resume dropdown
      await page.click('[data-testid="generate-resume-dropdown"]');
      
      // Start download
      const downloadPromise = page.waitForDownload();
      await page.click('text=Download as DOCX');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.docx$/);
    });

    test('should handle resume generation errors', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Mock server error response
      await page.route('/api/students/*/resume*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Resume generation failed' })
        });
      });
      
      // Try to generate resume
      await page.click('[data-testid="generate-resume-dropdown"]');
      await page.click('text=Download as PDF');
      
      // Verify error message appears
      await expect(page.locator('text=Resume generation failed')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields in education form', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Open add education dialog
      await page.click('button:has-text("Add Education")');
      
      // Try to save without filling required fields
      await page.click('button:has-text("Save")');
      
      // Verify validation messages or form doesn't submit
      // (Implementation depends on your validation approach)
      await expect(page.locator('text=Add Education')).toBeVisible(); // Dialog should still be open
    });

    test('should validate email format in basic info', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Open edit basic info
      await page.click('[data-testid="edit-basic-info"]');
      
      // Enter invalid email
      await page.fill('[name="personalEmail"]', 'invalid-email');
      
      // Try to save
      await page.click('button:has-text("Save Changes")');
      
      // Verify validation (adjust based on your validation implementation)
      const emailField = page.locator('[name="personalEmail"]');
      await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/student/profile');
      
      // Verify page loads and is usable on mobile
      await expect(page.locator('text=Student Profile')).toBeVisible();
      
      // Verify tabs are still accessible
      await page.click('[data-testid="tab-academics"]');
      await expect(page.locator('text=Education')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/student/profile');
      
      // Verify page loads correctly on tablet
      await expect(page.locator('text=Student Profile')).toBeVisible();
      
      // Test tab navigation
      await page.click('[data-testid="tab-professional"]');
      await expect(page.locator('text=Projects')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data after page reload', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Add a skill
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'Persistent Skill');
      await page.selectOption('[name="category"]', 'technical');
      await page.click('button:has-text("Save")');
      
      // Reload page
      await page.reload();
      await page.click('[data-testid="tab-academics"]');
      
      // Verify skill persists
      await expect(page.locator('text=Persistent Skill')).toBeVisible();
    });

    test('should handle concurrent updates gracefully', async ({ page, context }) => {
      // Open profile in two tabs
      const page1 = page;
      const page2 = await context.newPage();
      
      await page1.goto('/student/profile');
      await page2.goto('/student/profile');
      
      // Update profile in both tabs simultaneously
      await Promise.all([
        page1.click('[data-testid="edit-basic-info"]'),
        page2.click('[data-testid="edit-basic-info"]')
      ]);
      
      // Make different changes
      await page1.fill('[name="personalEmail"]', 'email1@test.com');
      await page2.fill('[name="personalEmail"]', 'email2@test.com');
      
      // Save changes
      await page1.click('button:has-text("Save Changes")');
      await page2.click('button:has-text("Save Changes")');
      
      // Verify one of the updates succeeded (last one typically wins)
      await page1.reload();
      await expect(page1.locator('text=email')).toBeVisible();
      
      await page2.close();
    });
  });

  test.describe('Security and Privacy', () => {
    test('should require authentication to access profile', async ({ page }) => {
      // Go to profile without logging in
      await page.goto('/student/profile');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('should not expose sensitive data in client', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Check that sensitive data is not exposed in page source
      const content = await page.content();
      
      // Should not contain raw passwords or sensitive tokens
      expect(content).not.toContain('password');
      expect(content).not.toContain('secret');
      expect(content).not.toContain('jwt');
    });

    test('should handle session expiry gracefully', async ({ page }) => {
      await page.goto('/student/profile');
      
      // Mock session expiry by clearing cookies
      await page.context().clearCookies();
      
      // Try to perform an action that requires authentication
      await page.click('[data-testid="edit-basic-info"]');
      await page.fill('[name="personalEmail"]', 'test@expired.com');
      await page.click('button:has-text("Save Changes")');
      
      // Should show authentication error or redirect to login
      await expect(page.locator('text=session expired|please log in|authentication')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load profile page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/student/profile');
      await expect(page.locator('text=Student Profile')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Profile should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/student/profile');
      await page.click('[data-testid="tab-academics"]');
      
      // Add multiple skills rapidly
      for (let i = 0; i < 10; i++) {
        await page.click('button:has-text("Add Skill")');
        await page.fill('[name="name"]', `Skill ${i}`);
        await page.selectOption('[name="category"]', 'technical');
        await page.click('button:has-text("Save")');
      }
      
      // Verify all skills are displayed without performance issues
      for (let i = 0; i < 10; i++) {
        await expect(page.locator(`text=Skill ${i}`)).toBeVisible();
      }
    });
  });
});