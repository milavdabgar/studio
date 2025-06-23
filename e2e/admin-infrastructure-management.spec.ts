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

test.describe('Admin Infrastructure Management', () => {
  let page: Page;
  let createdRoomNumber: string = ''; // Moved to top level for sharing between test groups
  let testBuildingIdForRooms: string = ''; // To store ID of a building created for rooms

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
    const buildingBaseName = 'E2E Test Building';

    test('should navigate to buildings page and create a new building', async () => {
      await page.goto(`${APP_BASE_URL}/admin/buildings`);
      await expect(page.getByText('Building Management', { exact: true })).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      createdBuildingCode = `E2EBLD${timestamp}`;
      const buildingName = `${buildingBaseName} ${createdBuildingCode}`;

      await page.getByRole('button', { name: /add new building/i }).click();
      await page.getByLabel(/building name/i).fill(buildingName);
      await page.getByLabel(/building code/i).fill(createdBuildingCode);
      
      // Select Institute - ensure "Government Polytechnic Palanpur" or first option exists
      const instituteSelect = page.locator('form').getByLabel('Institute *', { exact: true });
      await instituteSelect.click();
      await page.getByRole('option', { name: /Government Polytechnic Palanpur/i }).first().click(); 

      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Active', exact: true }).click();
      
      await page.getByRole('button', { name: /create building/i }).click();

      await expect(page.getByText('Building Created', { exact: true })).toBeVisible({timeout: 10000});
      await expect(page.getByText(buildingName)).toBeVisible();
    });

    test('should delete the created building', async () => {
      test.skip(!createdBuildingCode, 'Skipping delete: No building code from create test.');
      await page.goto(`${APP_BASE_URL}/admin/buildings`);
      await page.waitForSelector(`tr:has-text("${createdBuildingCode}")`);
      const buildingRow = page.locator(`tr:has-text("${createdBuildingCode}")`).first();
      await expect(buildingRow).toBeVisible();
      await buildingRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText('Building Deleted', { exact: true })).toBeVisible({timeout: 10000});
      await expect(buildingRow).not.toBeVisible();
      createdBuildingCode = '';
    });
  });

  // --- Room Management ---
  test.describe('Room Management', () => {
    const roomBaseName = 'E2E Test Room';

    test.beforeAll(async () => {
      // Create a temporary building for room tests
      const timestamp = Date.now().toString().slice(-5);
      const tempBuildingCode = `RMTSTBLD${timestamp}`;
      const tempBuildingName = `Room Test Building ${tempBuildingCode}`;
      await page.goto(`${APP_BASE_URL}/admin/buildings`);
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
      
      // Get the ID of the created building for room creation
      // This is a simplified way, ideally API response would give ID or table has data-id
      // For now, assuming the building name is unique enough to find it
      await page.goto(`${APP_BASE_URL}/admin/buildings`);
      const buildingRow = page.locator(`tr:has-text("${tempBuildingCode}")`).first();
      // Extract ID - this is tricky without a direct ID. Assuming an edit button might contain it or we rely on name.
      // This part might need refinement based on how IDs are accessible or if we switch to API creation for setup.
      testBuildingIdForRooms = tempBuildingCode; // Using code as a proxy if ID isn't easily gettable
    });

    test.afterAll(async () => {
        // Delete the temporary building
        if (testBuildingIdForRooms) {
            await page.goto(`${APP_BASE_URL}/admin/buildings`);
            const buildingRow = page.locator(`tr:has-text("${testBuildingIdForRooms}")`).first();
            if(await buildingRow.isVisible({timeout: 5000})){
                await buildingRow.getByRole('button', { name: /delete/i }).click();
                await expect(page.getByText(/building deleted/i, { exact: false })).toBeVisible({timeout: 10000});
            }
        }
    });


    test('should navigate to rooms page and create a new room', async () => {
      test.skip(!testBuildingIdForRooms, "Skipping room creation: No test building ID available.");
      await page.goto(`${APP_BASE_URL}/admin/rooms`);
      await expect(page.getByText('Room Management', { exact: true })).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      createdRoomNumber = `E2E-R${timestamp}`;
      const roomName = `${roomBaseName} ${createdRoomNumber}`;

      await page.getByRole('button', { name: /add new room/i }).click();
      await page.getByLabel(/room number/i).fill(createdRoomNumber);
      await page.getByLabel(/room name/i).fill(roomName);

      // Select Building - use the created test building
      const buildingSelect = page.locator('form').getByLabel('Building *', { exact: true });
      await buildingSelect.click();
      // Try to select the building by its name/code used as proxy ID
      const buildingOption = page.getByRole('option', { name: new RegExp(testBuildingIdForRooms, 'i') });
      if ((await buildingOption.count()) > 0) {
        await buildingOption.first().click();
      } else {
        await page.getByRole('option').first().click(); // Fallback to first if not found by name/code
      }
      
      await page.locator('form').getByLabel('Type *').click();
      await page.getByRole('option', { name: /lecture hall/i }).click();

      await page.getByLabel(/capacity/i).fill('50');

      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Available', exact: true }).click();

      await page.getByRole('button', { name: /create room/i }).click();

      await expect(page.getByText('Room Created', { exact: true })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdRoomNumber, { exact: true })).toBeVisible();
    });

    test('should delete the created room', async () => {
      test.skip(!createdRoomNumber, 'Skipping delete: No room number from create test.');
      await page.goto(`${APP_BASE_URL}/admin/rooms`);
      await page.waitForSelector(`tr:has-text("${createdRoomNumber}")`);
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
    const allocationBaseName = 'E2E Allocation';
    let testRoomIdForAllocation: string = ''; // Will use the room created above

    test.beforeAll(async() => {
        // Ensure a room exists for allocation testing. Create one if 'createdRoomNumber' is not set.
        if (!createdRoomNumber && testBuildingIdForRooms) { // If the specific room wasn't created or its test was skipped
            const timestamp = Date.now().toString().slice(-5);
            const tempRoomNumber = `ALLOC-R${timestamp}`;
            await page.goto(`${APP_BASE_URL}/admin/rooms`);
            await page.getByRole('button', { name: /add new room/i }).click();
            await page.getByLabel(/room number/i).fill(tempRoomNumber);
            const buildingSelect = page.locator('form').getByLabel('Building *', { exact: true });
            await buildingSelect.click();
            const buildingOption = page.getByRole('option', { name: new RegExp(testBuildingIdForRooms, 'i') });
             if ((await buildingOption.count()) > 0) {
                await buildingOption.first().click();
             } else {
                await page.getByRole('option').first().click();
             }
            await page.locator('form').getByLabel('Type *').click();
            await page.getByRole('option', { name: /lecture hall/i }).click();
            await page.getByRole('button', { name: /create room/i }).click();
            await expect(page.getByText(/room created/i, { exact: false })).toBeVisible({timeout:10000});
            testRoomIdForAllocation = tempRoomNumber;
        } else {
            testRoomIdForAllocation = createdRoomNumber;
        }
    });

    test('should navigate to room allocations page and create a new allocation', async () => {
      test.skip(!testRoomIdForAllocation, 'Skipping allocation creation: No test room ID available.');
      await page.goto(`${APP_BASE_URL}/admin/resource-allocation/rooms`); 
      await expect(page.getByRole('heading', { name: /room allocation management/i })).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      createdAllocationTitle = `${allocationBaseName} ${timestamp}`;

      await page.getByRole('button', { name: /new allocation/i }).click();
      
      // Select Room - by the number of the room created for allocation
      const roomSelect = page.locator('form').getByLabel('Room *', { exact: true });
      await roomSelect.click();
      const roomOption = page.getByRole('option', { name: new RegExp(testRoomIdForAllocation, 'i') });
      if((await roomOption.count()) > 0){
          await roomOption.first().click();
      } else {
          await page.getByRole('option').first().click(); // Fallback
      }


      await page.getByLabel(/title/i).fill(createdAllocationTitle);
      
      await page.locator('form').getByLabel('Purpose *').click();
      await page.getByRole('option', { name: /lecture/i }).click();

      // Select Start Date & Time
      await page.getByLabel(/start date & time/i).locator('button[role="combobox"]').click();
      await page.getByRole('gridcell', { name: '10' }).first().click(); 
      await page.locator('input[type="time"]').first().fill('09:00');
      
      // Select End Date & Time
      await page.getByLabel(/end date & time/i).locator('button[role="combobox"]').click();
      await page.getByRole('gridcell', { name: '10' }).first().click(); 
      await page.locator('input[type="time"]').last().fill('11:00');

      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Scheduled', exact: true }).click();
      
      await page.getByRole('button', { name: /create allocation/i }).click();

      await expect(page.getByText(/allocation created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdAllocationTitle)).toBeVisible();
    });

    test('should delete the created room allocation', async () => {
      test.skip(!createdAllocationTitle, 'Skipping delete: No allocation title from create test.');
      await page.goto(`${APP_BASE_URL}/admin/resource-allocation/rooms`);
      await page.waitForSelector(`tr:has-text("${createdAllocationTitle}")`);
      const allocationRow = page.locator(`tr:has-text("${createdAllocationTitle}")`).first();
      await expect(allocationRow).toBeVisible();
      await allocationRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/allocation deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(allocationRow).not.toBeVisible();
      createdAllocationTitle = '';
    });
  });
});
