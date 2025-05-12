import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:9003';

async function loginAsAdmin(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/email/i).fill('admin@gppalanpur.in');
  await page.getByLabel(/password/i).fill('Admin@123');
  await page.getByLabel(/login as/i).click();
  await page.getByRole('option', { name: /admin/i }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(`${APP_BASE_URL}/dashboard`, {timeout: 15000});
}

test.describe('Admin Timetable Management', () => {
  let page: Page;
  let createdTimetableName: string = '';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to timetables page and create a new timetable', async () => {
    await page.goto(`${APP_BASE_URL}/admin/timetables`);
    await expect(page.getByRole('heading', { name: /timetable management/i })).toBeVisible();

    createdTimetableName = `E2E Timetable ${Date.now().toString().slice(-4)}`;

    await page.getByRole('button', { name: /new timetable/i }).click();

    // Fill timetable details
    await page.getByLabel(/name/i).fill(createdTimetableName);
    await page.getByLabel(/academic year/i).fill('2024-25');
    
    // Select Program
    const programSelect = page.locator('form').getByLabel(/program/i).first();
    await programSelect.click();
    await page.getByRole('option').first().click(); // Select the first available program (e.g., DCE)

    // Select Batch (options should filter based on program)
    const batchSelect = page.locator('form').getByLabel(/batch/i).first();
    await batchSelect.click();
    await page.getByRole('option').first().click(); // Select the first available batch

    await page.getByLabel(/semester/i).fill('1');
    await page.getByLabel(/version/i).fill('1.0');

    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /draft/i }).click();

    await page.getByLabel(/effective date/i).click(); // Open calendar
    await page.getByRole('gridcell', { name: '15' }).first().click(); // Select 15th of current month
    
    // Add a timetable entry (simplified - assuming course offerings, faculty, rooms are available)
    const entryDialogPromise = page.waitForEvent('dialog'); // if add entry opens a separate dialog

    // Click "Add Entry" or fill inline form fields
    // For simplicity, assuming inline fields for now. If it's a modal/dialog, interaction will be different.
    // This part is highly dependent on the actual UI for adding entries.
    // For example, if there's an "Add Entry" button within the form:
    // await page.getByRole('button', { name: /add entry/i }).click(); // This might open another modal

    // Let's assume the form has direct input fields for the first entry:
    const daySelect = page.locator('form').getByLabel(/day/i).first(); // Assuming a select for Day
    await daySelect.click();
    await page.getByRole('option', { name: /monday/i }).click();
    
    await page.locator('form').getByLabel(/start time/i).first().fill('09:00');
    await page.locator('form').getByLabel(/end time/i).first().fill('10:00');

    // Select Course Offering
    const courseOfferingSelect = page.locator('form').getByLabel(/course offering/i).first();
    await courseOfferingSelect.click();
    await page.getByRole('option').first().click(); // Select first available offering

    // Select Faculty
    const facultySelect = page.locator('form').getByLabel(/faculty/i).first();
    await facultySelect.click();
    await page.getByRole('option').first().click(); // Select first available faculty

    // Select Room
    const roomSelect = page.locator('form').getByLabel(/room/i).first();
    await roomSelect.click();
    await page.getByRole('option').first().click(); // Select first available room

    await page.getByRole('button', { name: /add entry/i }).click(); // Click to add the configured entry to the list
    
    // Verify entry added to a list (if visible in the form)
    // await expect(page.locator('ul:has-text("Monday 09:00-10:00")')).toBeVisible();

    await page.getByRole('button', { name: /create timetable/i, exact: true }).click(); // Assuming exact name or more specific selector

    await expect(page.getByText(/timetable created/i, { exact: false })).toBeVisible({timeout: 10000});
    await expect(page.getByText(new RegExp(createdTimetableName, "i"))).toBeVisible();
  });

  test('should delete the created timetable', async () => {
    test.skip(!createdTimetableName, 'Skipping delete timetable test as no name available');
    await page.goto(`${APP_BASE_URL}/admin/timetables`);
    const timetableRow = page.locator(`tr:has-text("${createdTimetableName}")`).first();
    await expect(timetableRow).toBeVisible();
    await timetableRow.getByRole('button', { name: /delete/i }).click();
    
    await expect(page.getByText(/timetable deleted/i, { exact: false })).toBeVisible({timeout: 10000});
    await expect(timetableRow).not.toBeVisible();
    createdTimetableName = '';
  });
});
