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
  await page.getByRole('option', { name: adminUserCredentials.role, exact: true }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(new RegExp(`${APP_BASE_URL}/dashboard`), {timeout: 25000});
}

// Helper to ensure required data exists or skip test
async function ensureTestData(page: Page, entityName: string, checkUrl: string, creationButtonText: string) {
  try {
    await page.goto(checkUrl, { timeout: 15000 });
    // Check if any data exists (e.g., by looking for table rows excluding header)
    const rowCount = await page.locator('table tbody tr').count();
    if (rowCount === 0 || (rowCount === 1 && (await page.locator('table tbody tr td:has-text("No data")').count()) === 1) ) {
      console.warn(`No ${entityName} found. Some timetable tests might be skipped or fail if dependent data is needed via UI selection.`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`Failed to check ${entityName} data at ${checkUrl}:`, error);
    return false;
  }
}


test.describe('Admin Timetable Management', () => {
  let page: Page;
  let createdTimetableName: string = '';
  const timetableBaseName = 'E2E Timetable';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);

    // Check for essential dependent data. This is a simplified check.
    // A full setup would involve creating test programs, batches, courses, offerings, faculty, rooms via API or UI.
    const programsExist = await ensureTestData(page, 'programs', `${APP_BASE_URL}/admin/programs`, 'Add New Program');
    const batchesExist = await ensureTestData(page, 'batches', `${APP_BASE_URL}/admin/batches`, 'Add New Batch');
    const courseOfferingsExist = true; // Hard to check UI without specific selectors, assume some exist for now
    const facultyExist = await ensureTestData(page, 'faculty', `${APP_BASE_URL}/admin/faculty`, 'Add New Faculty');
    const roomsExist = await ensureTestData(page, 'rooms', `${APP_BASE_URL}/admin/rooms`, 'Add New Room');

    if (!programsExist || !batchesExist || !facultyExist || !roomsExist) {
        console.warn("One or more prerequisite data types (programs, batches, faculty, rooms) are missing. Timetable creation tests might not be fully operational via UI selection.");
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to timetables page and create a new timetable', async () => {
    await page.goto(`${APP_BASE_URL}/admin/timetables`);
    await expect(page.getByText('Timetable Management')).toBeVisible();

    const timestamp = Date.now().toString().slice(-6);
    createdTimetableName = `${timetableBaseName} ${timestamp}`;

    // Wait for the button to be enabled before clicking
    await page.getByRole('button', { name: /new timetable/i }).waitFor({ state: 'visible' });
    await page.waitForTimeout(1000); // Wait for data to load
    await page.getByRole('button', { name: /new timetable/i }).click();

    // Fill timetable details
    await page.locator('form').getByLabel(/name/i).fill(createdTimetableName);
    await page.getByLabel(/academic year/i).fill('2024-25');
    
    // Select Program (ensure options are available)
    const programSelect = page.locator('form').getByLabel(/program/i).first();
    await programSelect.click();
    await page.getByRole('option').first().click(); 

    // Select Batch (ensure options filter or are available)
    const batchSelect = page.locator('form').getByLabel(/batch/i).first();
    await batchSelect.click();
    // Wait for batch options to potentially populate based on program
    await page.waitForTimeout(500); // Small delay for dependent dropdowns
    const firstBatchOption = page.getByRole('option').first();
    if (await firstBatchOption.isVisible({timeout: 3000})){
        await firstBatchOption.click();
    } else {
        console.warn("No batches available for selection for timetable test.");
        // If no batch, the form might not be submittable, this test part might fail or skip.
        await page.keyboard.press('Escape'); // Close dropdown
        test.skip(true, "No batches available to select for timetable creation.");
        return;
    }


    await page.getByLabel(/semester/i).fill('1');
    await page.getByLabel(/version/i).fill('1.0');

    await page.locator('form').getByLabel('Status').click();
    await page.getByRole('option', { name: /draft/i }).click();

    await page.getByLabel(/effective date/i).locator('button').click(); 
    await page.getByRole('gridcell', { name: '15' }).first().click(); 
    
    // Add a timetable entry
    const daySelect = page.locator('form div.grid').getByLabel(/day/i).first();
    await daySelect.click();
    await page.getByRole('option', { name: /monday/i }).click();
    
    await page.locator('form div.grid').getByLabel(/start time/i).first().fill('09:00');
    await page.locator('form div.grid').getByLabel(/end time/i).first().fill('10:00');

    // Select Course Offering (ensure options are available)
    const courseOfferingSelect = page.locator('form div.grid').getByLabel(/course offering/i).first();
    await courseOfferingSelect.click();
    await page.waitForTimeout(500); // For dependent dropdowns
    const firstCOOption = page.getByRole('option').first();
     if (await firstCOOption.isVisible({timeout: 3000})){
        await firstCOOption.click();
    } else {
        console.warn("No course offerings available to select for timetable entry.");
        await page.keyboard.press('Escape');
        test.skip(true, "No course offerings available to select for timetable entry.");
        return;
    }

    // Select Faculty
    const facultySelect = page.locator('form div.grid').getByLabel(/faculty/i).first();
    await facultySelect.click();
    await page.getByRole('option').first().click();

    // Select Room
    const roomSelect = page.locator('form div.grid').getByLabel(/room/i).first();
    await roomSelect.click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /add entry/i }).click();
    
    // Verify entry added to a list (if visible in the form)
    await expect(page.locator('table tbody tr').filter({hasText: /Monday/i}).filter({hasText: /09:00-10:00/i})).toBeVisible();


    await page.getByRole('button', { name: /create timetable/i, exact: true }).click();

    await expect(page.getByText(/timetable created/i, { exact: false })).toBeVisible({timeout: 10000});
    await expect(page.getByText(new RegExp(createdTimetableName, "i"))).toBeVisible();
  });

  test('should delete the created timetable', async () => {
    test.skip(!createdTimetableName, 'Skipping delete: No timetable name from create test.');
    await page.goto(`${APP_BASE_URL}/admin/timetables`);
    await page.waitForSelector(`tr:has-text("${createdTimetableName}")`);
    const timetableRow = page.locator(`tr:has-text("${createdTimetableName}")`).first();
    await expect(timetableRow).toBeVisible();
    await timetableRow.getByRole('button', { name: /delete/i }).click();
    
    await expect(page.getByText(/timetable deleted/i, { exact: false })).toBeVisible({timeout: 10000});
    await expect(timetableRow).not.toBeVisible();
    createdTimetableName = '';
  });
});
