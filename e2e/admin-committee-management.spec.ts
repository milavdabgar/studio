import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUserCredentials = {
  email: 'admin@gppalanpur.in',
  password: 'Admin@123',
  role: 'admin',
};

async function loginAsAdmin(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(adminUserCredentials.email);
  await page.getByLabel(/password/i).fill(adminUserCredentials.password);
  await page.getByLabel(/login as/i).click();
  await page.getByRole('option', { name: new RegExp(adminUserCredentials.role, 'i') }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(new RegExp(`${APP_BASE_URL}/dashboard`), {timeout: 25000});
}

test.describe('Admin Committee Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('Committee Management', () => {
    let createdCommitteeCode: string = '';
    const committeeBaseName = 'E2E Test Committee';

    test('should navigate to committees page and create a new committee', async () => {
      await page.goto(`${APP_BASE_URL}/admin/committees`);
      await expect(page.getByRole('heading', { name: /committee management/i })).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      createdCommitteeCode = `E2ECMT${timestamp}`;
      const committeeName = `${committeeBaseName} ${createdCommitteeCode}`;

      await page.getByRole('button', { name: /add new committee/i }).click();
      await page.getByLabel(/committee name/i).fill(committeeName);
      await page.getByLabel(/committee code/i).fill(createdCommitteeCode);
      await page.getByLabel(/purpose/i).fill('E2E testing purpose');
      
      // Select Institute - ensure "Government Polytechnic Palanpur" or first option exists
      const instituteSelect = page.locator('form').getByLabel('Institute *', { exact: true });
      await instituteSelect.click();
      await page.getByRole('option', { name: /Government Polytechnic Palanpur/i }).first().click(); 

      // Select Formation Date
      await page.getByLabel(/formation date/i).locator('button').click(); // Open calendar
      await page.getByRole('gridcell', { name: '10' }).first().click(); // Select 10th of current month

      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: /active/i }).click();
      
      // Select Convener (optional, assuming a faculty user exists)
      const convenerSelect = page.locator('form').getByLabel('Convener');
      await convenerSelect.click();
      // Try to pick the "None" option or the first actual user if "None" is not there.
      const noneOption = page.getByRole('option', { name: /none/i });
      if (await noneOption.isVisible({timeout: 2000})) { // Reduced timeout for quicker check
        await noneOption.click();
      } else {
        // Check if other options are available before trying to click
        const firstUserOption = page.getByRole('option').nth(1); // 0th might be "None" or placeholder
        if(await firstUserOption.isVisible({timeout: 2000})){
            await firstUserOption.click(); 
        } else {
            console.warn("No convener options available to select for committee test.");
            // Close dropdown if open
            await page.keyboard.press('Escape');
        }
      }
      
      await page.getByRole('button', { name: /create committee/i }).click();

      await expect(page.getByText(/committee created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(committeeName)).toBeVisible();
    });

    test('should delete the created committee', async () => {
      test.skip(!createdCommitteeCode, 'Skipping delete: No committee code from create test.');
      await page.goto(`${APP_BASE_URL}/admin/committees`);
      await page.waitForSelector(`tr:has-text("${createdCommitteeCode}")`); // Ensure the row is loaded
      const committeeRow = page.locator(`tr:has-text("${createdCommitteeCode}")`).first();
      await expect(committeeRow).toBeVisible();
      await committeeRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/committee deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(committeeRow).not.toBeVisible();
      createdCommitteeCode = '';
    });
  });
});
