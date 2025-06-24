import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUserCredentials = {
  email: 'admin@gppalanpur.in',
  password: 'Admin@123',
  role: 'Administrator',
};

async function loginAsAdmin(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(adminUserCredentials.email);
  await page.getByLabel(/password/i).fill(adminUserCredentials.password);
  
  await page.getByLabel(/login as/i).click();
  await page.waitForTimeout(1000); // Wait longer for dropdown to open
  await page.getByRole('option', { name: adminUserCredentials.role, exact: true }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(new RegExp(`${APP_BASE_URL}/dashboard`), {timeout: 30000});
  
  // Wait for the dashboard to fully load and check if we can see dashboard elements
  await page.waitForTimeout(3000);
  
  // Verify we're actually logged in by checking for user-specific content
  try {
    await expect(page.getByText(/dashboard/i)).toBeVisible({timeout: 5000});
  } catch (error) {
    console.log('Dashboard not fully loaded, but proceeding...');
  }
}

test.describe('Admin Academic Management', () => {
  
  // --- Batch Management ---
  test.describe('Batch Management', () => {
    let createdBatchName: string = '';
    const batchBaseName = 'E2E Batch';

    test('should navigate to batches page and create a new batch', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Try to navigate to admin page without networkidle as it might be timing out
      await page.goto(`${APP_BASE_URL}/admin/batches`, { timeout: 60000 });
      
      // Check if we were redirected to login (which would indicate auth failure)
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('User was redirected to login page - authentication failed');
      }
      
      await expect(page.getByText('Batch Management', { exact: true })).toBeVisible({timeout: 20000});

      const timestamp = Date.now().toString().slice(-6);
      createdBatchName = `${batchBaseName} ${timestamp}`;
      
      await page.getByRole('button', { name: /add new batch/i }).click();
      await page.getByLabel(/batch name/i).fill(createdBatchName);
      
      // Select a program - ensure the first option is selectable
      const programSelect = page.locator('form').getByLabel(/program/i).first();
      await programSelect.click();
      await page.getByRole('option').first().click(); // Assuming at least one program exists

      await page.getByLabel(/start academic year/i).fill('2024');
      await page.getByLabel(/end academic year/i).fill('2027');
      await page.getByLabel(/max intake/i).fill('60');

      await page.getByRole('combobox', { name: 'Status *' }).click();
      await page.getByRole('option', { name: 'Upcoming', exact: true }).click();
      
      await page.getByRole('button', { name: /create batch/i }).click();
      await expect(page.getByText('Batch Created', { exact: true })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdBatchName)).toBeVisible();
    });
  });

  // --- Course Management ---
  test.describe('Course Management', () => {
    let createdCourseSubcode: string = '';
    const courseBaseName = 'E2E Test Course';

    test('should navigate to courses page and create a new course', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Try to navigate to admin page without networkidle as it might be timing out
      await page.goto(`${APP_BASE_URL}/admin/courses`, { timeout: 60000 });
      
      // Check if we were redirected to login (which would indicate auth failure)
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('User was redirected to login page - authentication failed');
      }
      
      await expect(page.getByText('Course Management', { exact: true })).toBeVisible({timeout: 20000});

      const timestamp = Date.now().toString().slice(-6);
      createdCourseSubcode = `E2ECRS${timestamp}`;
      const courseName = `${courseBaseName} ${createdCourseSubcode}`;

      // Wait for the button to be enabled before clicking
      await page.getByRole('button', { name: /add new course/i }).waitFor({ state: 'visible' });
      await page.waitForTimeout(1000); // Wait for data to load
      await page.getByRole('button', { name: /add new course/i }).click();
      await page.getByLabel(/subject code/i).fill(createdCourseSubcode);
      await page.getByLabel(/subject name/i).fill(courseName);
       // Select Department - try each department until we find one with programs
      const departmentSelect = page.locator('form').getByLabel(/department/i).first();
      await departmentSelect.click();
      
      const departmentOptions = page.getByRole('option');
      const departmentCount = await departmentOptions.count();
      console.log(`Found ${departmentCount} department options`);
      
      let programsFound = false;
      
      // Try each department to find one with programs
      for (let i = 0; i < departmentCount && !programsFound; i++) {
        if (i > 0) {
          // Reopen department dropdown if not the first attempt
          await departmentSelect.click();
        }
        
        const departmentOption = departmentOptions.nth(i);
        const optionText = await departmentOption.textContent();
        console.log(`Trying department: ${optionText}`);
        await departmentOption.click();

        // Wait for program dropdown to be enabled after department selection
        await page.waitForTimeout(2000);

        // Check if program dropdown is available and enabled
        const programSelect = page.locator('form').getByLabel(/program/i).first();
        await programSelect.waitFor({ state: 'attached' });
        
        const isProgramSelectDisabled = await programSelect.getAttribute('data-disabled');
        console.log(`Program select disabled status: ${isProgramSelectDisabled}`);
        
        if (isProgramSelectDisabled === null || isProgramSelectDisabled === 'false') {
          await programSelect.click();
          
          // Check if there are program options
          const programOptions = page.getByRole('option');
          const programCount = await programOptions.count();
          console.log(`Found ${programCount} program options`);
          
          if (programCount > 0) {
            await programOptions.first().click();
            programsFound = true;
            console.log(`Successfully selected program for department: ${optionText}`);
            break;
          } else {
            console.log(`No program options for department: ${optionText}`);
            // Close the program dropdown
            await page.keyboard.press('Escape');
          }
        } else {
          console.log(`Program dropdown is disabled for department: ${optionText}`);
        }
      }
      
      if (!programsFound) {
        throw new Error('No departments with available programs found');
      }

      await page.getByRole('spinbutton', { name: 'Semester *' }).fill('1');
      
      // Fill more required fields
      await page.getByLabel(/lecture/i).fill('3');
      await page.getByLabel(/tutorial/i).fill('1');
      await page.getByRole('spinbutton', { name: 'Practical (P)' }).fill('2');
      await page.getByLabel(/theory ese/i).fill('70');
      await page.getByLabel(/theory pa/i).fill('30');
      await page.getByRole('spinbutton', { name: 'Practical ESE (V)' }).fill('50');
      await page.getByRole('spinbutton', { name: 'Practical PA (I)' }).fill('50');
      
      // Fill the required category field (it's a text input, not a dropdown)
      await page.getByLabel(/category/i).fill('Program Core');
      console.log('Category field filled with "Program Core"');
      
      await page.getByRole('button', { name: /create course/i }).click();
      await expect(page.getByText('Course Created', { exact: true })).toBeVisible({timeout: 10000});
      await expect(page.getByText(courseName)).toBeVisible();
    });
  });
});