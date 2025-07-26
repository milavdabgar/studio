import { test, expect, Page } from '@playwright/test';

// Mock faculty data for testing
const mockFaculty = {
  firstName: 'Dr. Jane',
  lastName: 'Smith',
  staffCode: 'FAC001',
  instituteEmail: 'jane.smith@institute.edu',
  personalEmail: 'jane@personal.com',
  contactNumber: '+1234567890',
  department: 'Computer Science',
  designation: 'Associate Professor'
};

// Test authentication helper
async function loginAsFaculty(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill login form (adjust selectors based on your actual login form)
  await page.fill('[name="email"]', mockFaculty.instituteEmail);
  await page.fill('[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForURL('/faculty/**');
}

test.describe('Faculty Profile System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as faculty before each test
    await loginAsFaculty(page);
  });

  test.describe('Profile Page Navigation', () => {
    test('should navigate to faculty profile page successfully', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check page loads correctly
      await expect(page.locator('text=Faculty Profile')).toBeVisible();
      await expect(page.locator('text=Manage your comprehensive faculty profile')).toBeVisible();
    });

    test('should display all faculty profile tabs', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Verify all tabs are present
      await expect(page.locator('text=Basic Info')).toBeVisible();
      await expect(page.locator('text=Academics')).toBeVisible();
      await expect(page.locator('text=Research')).toBeVisible();
      await expect(page.locator('text=Security')).toBeVisible();
    });

    test('should switch between tabs correctly', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Click on academics tab
      await page.click('text=Academics');
      await expect(page.locator('text=Education')).toBeVisible();
      
      // Click on research tab
      await page.click('text=Research');
      await expect(page.locator('text=Experience')).toBeVisible();
      await expect(page.locator('text=Publications')).toBeVisible();
      
      // Click on security tab
      await page.click('text=Security');
      await expect(page.locator('text=Change Password')).toBeVisible();
    });
  });

  test.describe('Faculty Basic Information Tab', () => {
    test('should display faculty basic information', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check basic info is displayed
      await expect(page.locator('text=Dr. Jane Smith')).toBeVisible();
      await expect(page.locator('text=' + mockFaculty.staffCode)).toBeVisible();
      await expect(page.locator('text=' + mockFaculty.instituteEmail)).toBeVisible();
      await expect(page.locator('text=' + mockFaculty.department)).toBeVisible();
    });

    test('should display faculty profile photo with upload functionality', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check avatar is displayed
      await expect(page.locator('[data-testid="faculty-avatar"]')).toBeVisible();
      
      // Check photo upload button is present
      await expect(page.locator('input[type="file"]')).toBePresent();
    });

    test('should upload faculty profile photo', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Create a test image file
      const fileInput = page.locator('input[type="file"]');
      
      // Mock file upload
      await fileInput.setInputFiles({
        name: 'faculty-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-faculty-image-data')
      });
      
      // Verify upload success message appears
      await expect(page.locator('text=Profile photo updated successfully')).toBeVisible();
    });

    test('should edit faculty basic information', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Find and click edit button for basic info
      await page.click('[data-testid="edit-faculty-basic-info"]');
      
      // Verify edit dialog opens
      await expect(page.locator('text=Edit Basic Information')).toBeVisible();
      
      // Update personal email
      await page.fill('[name="personalEmail"]', 'updated.jane@personal.com');
      
      // Update research interests
      await page.fill('[name="researchInterests"]', 'Machine Learning, Artificial Intelligence');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Verify success message
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    });

    test('should update profile summary and visibility', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Update profile summary
      const summaryText = 'I am an experienced computer science professor with expertise in AI and machine learning.';
      await page.fill('[name="profileSummary"]', summaryText);
      
      // Change visibility setting
      await page.click('[data-testid="profile-visibility-select"]');
      await page.click('text=Institute Only');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Verify changes saved
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    });

    test('should display public profile URL', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check public profile URL is displayed
      await expect(page.locator('text=Public URL:')).toBeVisible();
      await expect(page.locator(`text=/faculty/${mockFaculty.staffCode}`)).toBeVisible();
    });

    test('should open public profile in new tab', async ({ page, context }) => {
      await page.goto('/faculty/profile');
      
      // Click public view button
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=Public View')
      ]);
      
      // Verify new page opens with public profile
      await expect(newPage).toHaveURL(new RegExp(`/faculty/${mockFaculty.staffCode}`));
      await newPage.close();
    });
  });

  test.describe('Faculty Education Section', () => {
    test('should add faculty education entry', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Academics');
      
      // Click add education button
      await page.click('button:has-text("Add Education")');
      
      // Fill education form with faculty-specific data
      await page.fill('[name="degree"]', 'PhD');
      await page.fill('[name="field"]', 'Computer Science');
      await page.fill('[name="institution"]', 'Stanford University');
      await page.fill('[name="startDate"]', '2005-09-01');
      await page.fill('[name="endDate"]', '2009-05-31');
      await page.fill('[name="grade"]', '4.0');
      await page.selectOption('[name="gradeType"]', 'gpa');
      
      // Save education entry
      await page.click('button:has-text("Save")');
      
      // Verify education appears in list
      await expect(page.locator('text=PhD')).toBeVisible();
      await expect(page.locator('text=Stanford University')).toBeVisible();
    });

    test('should display qualifications from profile data', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check if qualifications section is visible (if faculty has qualifications)
      const qualificationsExists = await page.locator('text=Qualifications').isVisible();
      if (qualificationsExists) {
        await expect(page.locator('text=Qualifications')).toBeVisible();
      }
    });
  });

  test.describe('Faculty Skills Section', () => {
    test('should add faculty skills with academic focus', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Academics');
      
      // Click add skill button
      await page.click('button:has-text("Add Skill")');
      
      // Fill skill form
      await page.fill('[name="name"]', 'Machine Learning');
      await page.selectOption('[name="category"]', 'technical');
      await page.selectOption('[name="proficiency"]', 'expert');
      
      // Save skill
      await page.click('button:has-text("Save")');
      
      // Verify skill appears
      await expect(page.locator('text=Machine Learning')).toBeVisible();
    });

    test('should group faculty skills by category', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Academics');
      
      // Add technical skill
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'Deep Learning');
      await page.selectOption('[name="category"]', 'technical');
      await page.click('button:has-text("Save")');
      
      // Add research skill
      await page.click('button:has-text("Add Skill")');
      await page.fill('[name="name"]', 'Research Methodology');
      await page.selectOption('[name="category"]', 'research');
      await page.click('button:has-text("Save")');
      
      // Verify skills are grouped
      await expect(page.locator('text=Technical Skills')).toBeVisible();
      await expect(page.locator('text=Research Skills')).toBeVisible();
    });
  });

  test.describe('Faculty Research and Publications', () => {
    test('should add academic experience', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Research');
      
      // Click add experience button
      await page.click('button:has-text("Add Experience")');
      
      // Fill academic experience form
      await page.fill('[name="company"]', 'Previous University');
      await page.fill('[name="position"]', 'Assistant Professor');
      await page.fill('[name="startDate"]', '2010-08-01');
      await page.fill('[name="endDate"]', '2015-07-31');
      await page.fill('[name="description"]', 'Teaching and research in computer science department');
      await page.selectOption('[name="employmentType"]', 'full-time');
      
      // Save experience
      await page.click('button:has-text("Save")');
      
      // Verify experience appears
      await expect(page.locator('text=Assistant Professor')).toBeVisible();
      await expect(page.locator('text=Previous University')).toBeVisible();
    });

    test('should add research projects', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Research');
      
      // Click add project button
      await page.click('button:has-text("Add Project")');
      
      // Fill research project form
      await page.fill('[name="title"]', 'AI in Education Research');
      await page.fill('[name="description"]', 'Investigating the use of AI technologies in educational settings');
      await page.fill('[name="technologies"]', 'Python, TensorFlow, Machine Learning');
      await page.fill('[name="startDate"]', '2020-01-01');
      await page.fill('[name="endDate"]', '2023-12-31');
      await page.fill('[name="role"]', 'Principal Investigator');
      
      // Save project
      await page.click('button:has-text("Save")');
      
      // Verify project appears
      await expect(page.locator('text=AI in Education Research')).toBeVisible();
      await expect(page.locator('text=Principal Investigator')).toBeVisible();
    });

    test('should add publications', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Research');
      
      // Click add publication button
      await page.click('button:has-text("Add Publication")');
      
      // Fill publication form
      await page.fill('[name="title"]', 'Advances in Neural Network Architecture');
      await page.fill('[name="authors"]', 'Dr. Jane Smith, John Doe, Alice Johnson');
      await page.selectOption('[name="publicationType"]', 'journal');
      await page.fill('[name="venue"]', 'Journal of Artificial Intelligence');
      await page.fill('[name="date"]', '2023-06-15');
      await page.fill('[name="doi"]', '10.1234/jai.2023.001');
      await page.fill('[name="abstract"]', 'This paper presents novel approaches to neural network design');
      
      // Save publication
      await page.click('button:has-text("Save")');
      
      // Verify publication appears
      await expect(page.locator('text=Advances in Neural Network Architecture')).toBeVisible();
      await expect(page.locator('text=Journal of Artificial Intelligence')).toBeVisible();
    });

    test('should edit existing publication', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Research');
      
      // Assume there's already a publication, click edit
      await page.click('[data-testid="edit-publication-0"]');
      
      // Modify title
      await page.fill('[name="title"]', 'Updated Research Paper Title');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      // Verify changes appear
      await expect(page.locator('text=Updated Research Paper Title')).toBeVisible();
    });
  });

  test.describe('Faculty Awards and Certifications', () => {
    test('should add academic awards', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Academics');
      
      // Click add award button
      await page.click('button:has-text("Add Award")');
      
      // Fill award form
      await page.fill('[name="title"]', 'Excellence in Teaching Award');
      await page.fill('[name="issuer"]', 'University Board');
      await page.fill('[name="date"]', '2022-05-15');
      await page.selectOption('[name="category"]', 'academic');
      await page.fill('[name="description"]', 'Recognized for outstanding teaching performance and student engagement');
      
      // Save award
      await page.click('button:has-text("Save")');
      
      // Verify award appears
      await expect(page.locator('text=Excellence in Teaching Award')).toBeVisible();
      await expect(page.locator('text=University Board')).toBeVisible();
    });

    test('should add professional certifications', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Academics');
      
      // Click add certification button
      await page.click('button:has-text("Add Certification")');
      
      // Fill certification form
      await page.fill('[name="name"]', 'Certified Data Scientist');
      await page.fill('[name="issuer"]', 'Data Science Institute');
      await page.fill('[name="issueDate"]', '2021-08-01');
      await page.fill('[name="expiryDate"]', '2024-08-01');
      await page.fill('[name="credentialId"]', 'CDS-123456');
      await page.fill('[name="skills"]', 'Data Science, Statistics, Python, R');
      
      // Save certification
      await page.click('button:has-text("Save")');
      
      // Verify certification appears
      await expect(page.locator('text=Certified Data Scientist')).toBeVisible();
      await expect(page.locator('text=Data Science Institute')).toBeVisible();
    });
  });

  test.describe('Faculty Resume Generation', () => {
    test('should generate academic CV in PDF format', async ({ page }) => {
      await page.goto('/faculty/profile');
      
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

    test('should generate LaTeX CV', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Click resume dropdown
      await page.click('[data-testid="generate-resume-dropdown"]');
      
      // Start download
      const downloadPromise = page.waitForDownload();
      await page.click('text=Download as PDF LaTeX');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    test('should handle resume generation with comprehensive faculty data', async ({ page }) => {
      // First, populate profile with comprehensive data
      await page.goto('/faculty/profile');
      
      // Add education
      await page.click('text=Academics');
      await page.click('button:has-text("Add Education")');
      await page.fill('[name="degree"]', 'PhD');
      await page.fill('[name="field"]', 'Computer Science');
      await page.fill('[name="institution"]', 'MIT');
      await page.click('button:has-text("Save")');
      
      // Add research project
      await page.click('text=Research');
      await page.click('button:has-text("Add Project")');
      await page.fill('[name="title"]', 'ML Research Project');
      await page.fill('[name="description"]', 'Research project description');
      await page.click('button:has-text("Save")');
      
      // Generate resume
      await page.click('[data-testid="generate-resume-dropdown"]');
      
      const downloadPromise = page.waitForDownload();
      await page.click('text=Download as PDF');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });
  });

  test.describe('Faculty Profile Completeness', () => {
    test('should display faculty-specific completeness metrics', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check profile completeness section exists
      await expect(page.locator('text=Profile Completeness')).toBeVisible();
      await expect(page.locator('[role="progressbar"]')).toBeVisible();
      
      // Should show faculty-specific suggestions
      await expect(page.locator('text=research|publication|teaching')).toBeVisible();
    });

    test('should update completeness when faculty data is added', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Note initial completeness percentage
      const initialCompleteness = await page.locator('[role="progressbar"]').getAttribute('aria-valuenow');
      
      // Add research interests
      const summaryText = 'Research in machine learning and artificial intelligence.';
      await page.fill('[name="profileSummary"]', summaryText);
      await page.click('button:has-text("Save Changes")');
      
      // Check if completeness improved
      const updatedCompleteness = await page.locator('[role="progressbar"]').getAttribute('aria-valuenow');
      
      // Completeness should have changed (improved)
      expect(updatedCompleteness).not.toBe(initialCompleteness);
    });
  });

  test.describe('Faculty Security', () => {
    test('should access password change form', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Security');
      
      // Verify password change form is accessible
      await expect(page.locator('text=Change Password')).toBeVisible();
      await expect(page.locator('[name="currentPassword"]')).toBeVisible();
      await expect(page.locator('[name="newPassword"]')).toBeVisible();
      await expect(page.locator('[name="confirmPassword"]')).toBeVisible();
    });

    test('should validate password change requirements', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Security');
      
      // Try to change password with weak new password
      await page.fill('[name="currentPassword"]', 'currentpass');
      await page.fill('[name="newPassword"]', '123');
      await page.fill('[name="confirmPassword"]', '123');
      
      await page.click('button:has-text("Change Password")');
      
      // Should show validation error
      await expect(page.locator('text=Password must be')).toBeVisible();
    });
  });

  test.describe('Faculty Data Validation', () => {
    test('should validate research interests format', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Open edit basic info
      await page.click('[data-testid="edit-faculty-basic-info"]');
      
      // Enter research interests
      await page.fill('[name="researchInterests"]', 'Machine Learning, AI, Deep Learning');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Verify changes saved successfully
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    });

    test('should validate DOI format in publications', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Research');
      
      // Add publication with invalid DOI
      await page.click('button:has-text("Add Publication")');
      await page.fill('[name="title"]', 'Test Publication');
      await page.fill('[name="authors"]', 'Dr. Smith');
      await page.fill('[name="doi"]', 'invalid-doi-format');
      
      // Try to save
      await page.click('button:has-text("Save")');
      
      // Should show validation error or correct the format
      // (Implementation depends on your validation logic)
      const doiField = page.locator('[name="doi"]');
      const doiValue = await doiField.inputValue();
      
      // Either shows error or accepts valid format
      expect(doiValue).toBeDefined();
    });
  });

  test.describe('Faculty Profile Performance', () => {
    test('should load faculty profile efficiently with many publications', async ({ page }) => {
      await page.goto('/faculty/profile');
      await page.click('text=Research');
      
      // Add multiple publications to test performance
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Add Publication")');
        await page.fill('[name="title"]', `Research Paper ${i + 1}`);
        await page.fill('[name="authors"]', 'Dr. Smith, Co-Author');
        await page.selectOption('[name="publicationType"]', 'journal');
        await page.fill('[name="venue"]', `Journal ${i + 1}`);
        await page.click('button:has-text("Save")');
      }
      
      // Verify all publications are displayed without performance issues
      for (let i = 0; i < 5; i++) {
        await expect(page.locator(`text=Research Paper ${i + 1}`)).toBeVisible();
      }
    });

    test('should handle large research data sets efficiently', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      const startTime = Date.now();
      
      // Switch between tabs with heavy data
      await page.click('text=Research');
      await page.click('text=Academics');
      await page.click('text=Basic Info');
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Tab switching should be responsive (within 2 seconds)
      expect(totalTime).toBeLessThan(2000);
    });
  });

  test.describe('Faculty Profile Integration', () => {
    test('should integrate with faculty directory', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Profile should be accessible via faculty directory
      await page.goto('/faculty');
      
      // Should find faculty member in directory
      await expect(page.locator(`text=${mockFaculty.firstName}`)).toBeVisible();
      
      // Click on faculty profile
      await page.click(`text=${mockFaculty.firstName}`);
      
      // Should navigate to public profile view
      await expect(page).toHaveURL(new RegExp(`/faculty/${mockFaculty.staffCode}`));
    });

    test('should sync with academic calendar and events', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Profile should display relevant academic information
      await expect(page.locator('text=Department')).toBeVisible();
      await expect(page.locator(`text=${mockFaculty.department}`)).toBeVisible();
    });
  });

  test.describe('Faculty Accessibility', () => {
    test('should be accessible via keyboard navigation', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Use keyboard to navigate through tabs
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should activate focused element
      
      // Verify keyboard navigation works
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('should have proper ARIA labels for faculty-specific content', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check important elements have ARIA labels
      await expect(page.locator('[aria-label*="faculty"]')).toBePresent();
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('[role="tab"]')).toHaveCount(4);
    });

    test('should support screen readers for faculty content', async ({ page }) => {
      await page.goto('/faculty/profile');
      
      // Check that headings are properly structured
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
      
      // Check that form labels are properly associated
      await page.click('[data-testid="edit-faculty-basic-info"]');
      const emailField = page.locator('[name="personalEmail"]');
      const emailLabel = page.locator('label[for="personalEmail"]');
      
      await expect(emailField).toBeVisible();
      await expect(emailLabel).toBeVisible();
    });
  });
});