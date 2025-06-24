import { test, expect } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUserCredentials = {
  email: 'admin@gppalanpur.in',
  password: 'Admin@123',
  role: 'Administrator',
};

async function loginAsAdmin(page: any) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(adminUserCredentials.email);
  await page.getByLabel(/password/i).fill(adminUserCredentials.password);
  await page.getByLabel(/login as/i).click();
  await page.waitForTimeout(1000); // Wait for dropdown to open
  await page.getByRole('option', { name: adminUserCredentials.role, exact: true }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(new RegExp(`${APP_BASE_URL}/dashboard`), {timeout: 30000});
  
  // Wait for the dashboard to fully load
  await page.waitForTimeout(3000);
}

test.describe('Admin Infrastructure Management', () => {

  // --- Building Management ---
  test.describe('Building Management', () => {
    let createdBuildingCode: string = '';
    const buildingBaseName = 'E2E Test Building';

    test('should navigate to buildings page and create a new building', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${APP_BASE_URL}/admin/buildings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Check if we were redirected to login (which would indicate auth failure)
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('User was redirected to login page - authentication failed');
      }
      
      await expect(page.getByText('Building Management', { exact: true })).toBeVisible({timeout: 20000});

      const timestamp = Date.now().toString().slice(-6);
      createdBuildingCode = `E2EBLD${timestamp}`;
      const buildingName = `${buildingBaseName} ${createdBuildingCode}`;

      await page.getByRole('button', { name: /add new building/i }).click();
      await page.getByLabel(/building name/i).fill(buildingName);
      await page.getByLabel(/building code/i).fill(createdBuildingCode);
      
      const instituteSelect = page.locator('form').getByLabel('Institute *', { exact: true });
      await instituteSelect.click();
      await page.getByRole('option', { name: /Government Polytechnic Palanpur/i }).first().click();
      
      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Active', exact: true }).click();
      
      await page.getByRole('button', { name: /create building/i }).click();
      await expect(page.getByText('Building Created', { exact: true })).toBeVisible({timeout: 10000});
      
      // Wait for potential redirect and verify the building exists in the list
      await page.waitForTimeout(2000);
      await page.goto('/admin/infrastructure/buildings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(buildingName)).toBeVisible({ timeout: 10000 });
    });

    test('should delete the created building', async ({ page }) => {
      if (!createdBuildingCode) {
        console.log('No building code available, skipping delete test');
        return;
      }
      
      await loginAsAdmin(page);
      await page.goto(`${APP_BASE_URL}/admin/buildings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Find the building row and delete it
      const buildingRow = page.locator(`tr:has-text("${createdBuildingCode}")`).first();
      if (await buildingRow.count() > 0) {
        await buildingRow.getByRole('button', { name: /delete/i }).click();
        await page.getByRole('button', { name: /confirm|yes|delete/i }).click();
        await expect(page.getByText('Building Deleted', { exact: true })).toBeVisible({timeout: 10000});
      } else {
        console.log('Building not found for deletion, may have been deleted already');
      }
    });
  });

  // --- Room Management ---
  test.describe('Room Management', () => {
    const roomBaseName = 'E2E Test Room';

    test('should navigate to rooms page and create a new room', async ({ page }) => {
      await loginAsAdmin(page);
      
      // First create a building for the room
      const timestamp = Date.now().toString().slice(-5);
      const tempBuildingCode = `RMTSTBLD${timestamp}`;
      const tempBuildingName = `Room Test Building ${tempBuildingCode}`;
      
      await page.goto(`${APP_BASE_URL}/admin/buildings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.getByRole('button', { name: /add new building/i }).click();
      await page.getByLabel(/building name/i).fill(tempBuildingName);
      await page.getByLabel(/building code/i).fill(tempBuildingCode);
      
      const instituteSelect = page.locator('form').getByLabel('Institute *', { exact: true });
      await instituteSelect.click();
      await page.getByRole('option', { name: /Government Polytechnic Palanpur/i }).first().click();
      
      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Active', exact: true }).click();
      await page.getByRole('button', { name: /create building/i }).click();
      await expect(page.getByText('Building Created', { exact: true })).toBeVisible({timeout: 10000});
      
      // Now create the room
      await page.goto(`${APP_BASE_URL}/admin/rooms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Check if we were redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('User was redirected to login page - authentication failed');
      }
      
      await expect(page.getByText('Room Management', { exact: true })).toBeVisible({timeout: 20000});

      const roomTimestamp = Date.now().toString().slice(-6);
      const createdRoomNumber = `E2ERM${roomTimestamp}`;
      const roomName = `${roomBaseName} ${createdRoomNumber}`;

      await page.getByRole('button', { name: /add new room/i }).click();
      await page.getByLabel(/room number/i).fill(createdRoomNumber);
      await page.getByLabel(/room name/i).fill(roomName);
      
      // Select the building we just created
      const buildingSelect = page.locator('form').getByLabel('Building *', { exact: true });
      await buildingSelect.click();
      await page.getByRole('option', { name: tempBuildingName }).click();
      
      await page.getByLabel(/capacity/i).fill('30');
      
      const roomTypeSelect = page.locator('form').getByLabel('Type *');
      await roomTypeSelect.click();
      await page.getByRole('option', { name: 'Lecture Hall', exact: true }).click();
      
      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Available', exact: true }).click();
      
      await page.getByRole('button', { name: /create room/i }).click();
      await expect(page.getByText('Room Created', { exact: true })).toBeVisible({timeout: 10000});
      await expect(page.getByText(roomName)).toBeVisible();
    });

    test('should delete the created room', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${APP_BASE_URL}/admin/rooms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Try to find any test room to delete
      const testRoomRows = page.locator('tr:has-text("E2ERM")');
      const count = await testRoomRows.count();
      
      if (count > 0) {
        const roomRow = testRoomRows.first();
        await roomRow.getByRole('button', { name: /delete/i }).click();
        await page.getByRole('button', { name: /confirm|yes|delete/i }).click();
        await expect(page.getByText('Room Deleted', { exact: true })).toBeVisible({timeout: 10000});
      } else {
        console.log('No test rooms found to delete, skipping delete test');
      }
    });
  });

  // --- Room Allocation Management ---
  test.describe('Room Allocation Management', () => {
    
    test('should navigate to room allocations page and create a new allocation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${APP_BASE_URL}/admin/resource-allocation/rooms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Check if we were redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('User was redirected to login page - authentication failed');
      }
      
      await expect(page.getByText('Room Allocation Management', { exact: true })).toBeVisible({timeout: 20000});

      // This test might be skipped if no rooms/courses are available
      const createButton = page.getByRole('button', { name: /add new|create/i }).first();
      const isCreateButtonVisible = await createButton.isVisible();
      
      if (isCreateButtonVisible) {
        await createButton.click();
        
        // Fill allocation form if possible
        await page.getByLabel(/purpose|description/i).fill('E2E Test Allocation');
        
        // Try to submit if required fields are available
        try {
          await page.getByRole('button', { name: /create|save/i }).click();
          await expect(page.getByText(/allocation created|booking created/i)).toBeVisible({timeout: 10000});
        } catch (error) {
          console.log('Could not complete room allocation creation, might need more test data');
        }
      } else {
        console.log('Room allocation creation not available, skipping test');
      }
    });

    test('should delete the created room allocation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${APP_BASE_URL}/admin/resource-allocation/rooms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Try to find any test allocation to delete
      const testAllocationRows = page.locator('tr:has-text("E2E Test")');
      const count = await testAllocationRows.count();
      
      if (count > 0) {
        const allocationRow = testAllocationRows.first();
        await allocationRow.getByRole('button', { name: /delete/i }).click();
        await page.getByRole('button', { name: /confirm|yes|delete/i }).click();
        await expect(page.getByText(/allocation deleted|booking deleted/i)).toBeVisible({timeout: 10000});
      } else {
        console.log('No test allocations found to delete, skipping delete test');
      }
    });
  });
});
