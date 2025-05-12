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

    test('should navigate to committees page and create a new committee', async () => {
      await page.goto(`${APP_BASE_URL}/admin/committees`);
      await expect(page.getByRole('heading', { name: /committee management/i })).toBeVisible();

      createdCommitteeCode = `E2ECMT${Date.now().toString().slice(-4)}`;
      const committeeName = `E2E Test Committee ${createdCommitteeCode}`;

      await page.getByRole('button', { name: /add new committee/i }).click();
      await page.getByLabel(/committee name/i).fill(committeeName);
      await page.getByLabel(/committee code/i).fill(createdCommitteeCode);
      await page.getByLabel(/purpose/i).fill('E2E testing purpose');
      
      // Select Institute
      const instituteSelect = page.locator('form').getByLabel('Institute', { exact: true });
      await instituteSelect.click();
      await page.getByRole('option', { name: /government polytechnic palanpur/i }).click(); // Assuming this exists

      // Select Formation Date
      await page.getByLabel(/formation date/i).click(); // Open calendar
      await page.getByRole('gridcell', { name: '10' }).first().click(); // Select 10th of current month

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /active/i }).click();
      
      // Select Convener (optional, assuming a faculty user exists)
      const convenerSelect = page.locator('form').getByLabel('Convener');
      await convenerSelect.click();
      // It's safer to select by a known convener name if possible, or by index if the list is predictable
      // For now, let's try to pick the "None" option or the first actual user if "None" is not there.
      const noneOption = page.getByRole('option', { name: /none/i });
      if (await noneOption.isVisible()) {
        await noneOption.click();
      } else {
        await page.getByRole('option').nth(1).click(); // Attempt to select the first actual user
      }
      
      await page.getByRole('button', { name: /create committee/i }).click();

      await expect(page.getByText(/committee created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(committeeName)).toBeVisible();
    });

    test('should delete the created committee', async () => {
      test.skip(!createdCommitteeCode, 'Skipping delete committee test as no code available');
      await page.goto(`${APP_BASE_URL}/admin/committees`);
      const committeeRow = page.locator(`tr:has-text("${createdCommitteeCode}")`).first();
      await expect(committeeRow).toBeVisible();
      await committeeRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/committee deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(committeeRow).not.toBeVisible();
      createdCommitteeCode = '';
    });
  });
});
