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

test.describe('Admin Infrastructure Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // --- Building Management ---
  test.describe('Building Management', () => {
    let createdBuildingCode: string = '';

    test('should navigate to buildings page and create a new building', async () => {
      await page.goto(`${APP_BASE_URL}/admin/buildings`);
      await expect(page.getByRole('heading', { name: /building management/i })).toBeVisible();

      createdBuildingCode = `E2EBLD${Date.now().toString().slice(-4)}`;
      const buildingName = `E2E Test Building ${createdBuildingCode}`;

      await page.getByRole('button', { name: /add new building/i }).click();
      await page.getByLabel(/building name/i).fill(buildingName);
      await page.getByLabel(/building code/i).fill(createdBuildingCode);
      
      // Select Institute
      const instituteSelect = page.locator('form').getByLabel('Institute', { exact: true });
      await instituteSelect.click();
      await page.getByRole('option', { name: /government polytechnic palanpur/i }).click(); // Assuming this exists

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /active/i }).click();
      
      await page.getByRole('button', { name: /create building/i }).click();

      await expect(page.getByText(/building created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(buildingName)).toBeVisible();
    });

    test('should delete the created building', async () => {
      test.skip(!createdBuildingCode, 'Skipping delete building test as no code available');
      await page.goto(`${APP_BASE_URL}/admin/buildings`);
      const buildingRow = page.locator(`tr:has-text("${createdBuildingCode}")`).first();
      await expect(buildingRow).toBeVisible();
      await buildingRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/building deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(buildingRow).not.toBeVisible();
      createdBuildingCode = '';
    });
  });

  // --- Room Management ---
  test.describe('Room Management', () => {
    let createdRoomNumber: string = '';

    test('should navigate to rooms page and create a new room', async () => {
      await page.goto(`${APP_BASE_URL}/admin/rooms`);
      await expect(page.getByRole('heading', { name: /room management/i })).toBeVisible();

      createdRoomNumber = `E2E-R${Date.now().toString().slice(-4)}`;
      const roomName = `E2E Test Room ${createdRoomNumber}`;

      await page.getByRole('button', { name: /add new room/i }).click();
      await page.getByLabel(/room number/i).fill(createdRoomNumber);
      await page.getByLabel(/room name/i).fill(roomName);

      // Select Building - Assuming a building like "Main Building" or "Test Building" exists
      const buildingSelect = page.locator('form').getByLabel('Building', { exact: true });
      await buildingSelect.click();
      await page.getByRole('option').first().click(); // Select first available building

      await page.getByLabel(/type/i).click();
      await page.getByRole('option', { name: /lecture hall/i }).click();

      await page.getByLabel(/capacity/i).fill('50');

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /available/i }).click();

      await page.getByRole('button', { name: /create room/i }).click();

      await expect(page.getByText(/room created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdRoomNumber)).toBeVisible();
    });

    test('should delete the created room', async () => {
      test.skip(!createdRoomNumber, 'Skipping delete room test as no room number available');
      await page.goto(`${APP_BASE_URL}/admin/rooms`);
      const roomRow = page.locator(`tr:has-text("${createdRoomNumber}")`).first();
      await expect(roomRow).toBeVisible();
      await roomRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/room deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(roomRow).not.toBeVisible();
      createdRoomNumber = '';
    });
  });
  
  // --- Room Allocation Management ---
  test.describe('Room Allocation Management', () => {
    let createdAllocationTitle: string = '';

    test('should navigate to room allocations page and create a new allocation', async () => {
      await page.goto(`${APP_BASE_URL}/admin/resource-allocation/rooms`); // Path from resource-allocation page
      await expect(page.getByRole('heading', { name: /room allocation management/i })).toBeVisible();

      createdAllocationTitle = `E2E Allocation ${Date.now().toString().slice(-4)}`;

      await page.getByRole('button', { name: /new allocation/i }).click();
      
      // Select Room
      const roomSelect = page.locator('form').getByLabel('Room', { exact: true });
      await roomSelect.click();
      await page.getByRole('option').first().click(); // Select first available room

      await page.getByLabel(/title/i).fill(createdAllocationTitle);
      
      await page.getByLabel(/purpose/i).click();
      await page.getByRole('option', { name: /lecture/i }).click();

      // Select Start Date & Time
      await page.getByLabel(/start date & time/i).locator('button[role="combobox"]').click(); // Assuming date picker trigger
      await page.getByRole('gridcell', { name: '10' }).first().click(); // Select 10th of current month
      await page.locator('input[type="time"]').first().fill('09:00'); // Fill start time
      
      // Select End Date & Time
      await page.getByLabel(/end date & time/i).locator('button[role="combobox"]').click();
      await page.getByRole('gridcell', { name: '10' }).first().click(); // Select 10th of current month
      await page.locator('input[type="time"]').last().fill('11:00'); // Fill end time

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /scheduled/i }).click();
      
      await page.getByRole('button', { name: /create allocation/i }).click();

      await expect(page.getByText(/allocation created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdAllocationTitle)).toBeVisible();
    });

    test('should delete the created room allocation', async () => {
      test.skip(!createdAllocationTitle, 'Skipping delete room allocation test as no title available');
      await page.goto(`${APP_BASE_URL}/admin/resource-allocation/rooms`);
      const allocationRow = page.locator(`tr:has-text("${createdAllocationTitle}")`).first();
      await expect(allocationRow).toBeVisible();
      await allocationRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/allocation deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(allocationRow).not.toBeVisible();
      createdAllocationTitle = '';
    });
  });
});
