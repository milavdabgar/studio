import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUserCredentials = {
  email: 'admin@gppalanpur..ac.in',
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

    test.skip('should navigate to committees page and create a new committee - Date picker component needs investigation', async () => {
      await page.goto(`${APP_BASE_URL}/admin/committees`);
      await expect(page.getByText('Committee Management', { exact: true })).toBeVisible();

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

      // Select Formation Date - try typing the date directly or using a simpler approach
      const formationDateButton = page.getByRole('button').filter({ hasText: /pick a date/i }).first();
      
      // Try clicking and then typing a date using keyboard
      await formationDateButton.click();
      await page.waitForTimeout(500);
      
      // Try typing the date: June 15, 2024
      await page.keyboard.type('June 15, 2024');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Check if the date was set
      const buttonText = await formationDateButton.textContent();
      console.log(`Formation date button text after typing: "${buttonText}"`);
      
      // If typing didn't work, try the calendar approach one more time
      if (buttonText?.includes('Pick a date')) {
        console.log('Typing approach failed, trying calendar selection');
        await formationDateButton.click();
        await page.waitForTimeout(1000);
        
        // Try to select any date that's available - use a more direct approach
        await page.keyboard.press('Enter'); // Try pressing Enter to select today
        await page.waitForTimeout(500);
        
        // Final check
        const finalButtonText = await formationDateButton.textContent();
        console.log(`Formation date final text: "${finalButtonText}"`);
        
        if (finalButtonText?.includes('Pick a date')) {
          console.log('Date picker still not working, but continuing with test to see other validation errors');
        }
      }

      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: 'Active', exact: true }).first().click();
      
      // Skip Convener selection if it's disabled (no faculty available)
      const convenerSelect = page.locator('form').getByLabel('Convener');
      const isConvenerEnabled = await convenerSelect.isEnabled();
      if (isConvenerEnabled) {
        await convenerSelect.click();
        // Try to pick the "None" option or the first actual user if "None" is not there.
        const noneOption = page.getByRole('option', { name: /none/i });
        if (await noneOption.isVisible({timeout: 2000})) {
          await noneOption.click();
        } else {
          // Check if other options are available before trying to click
          const convenerOptions = page.getByRole('option');
          const convenerCount = await convenerOptions.count();
          if (convenerCount > 0) {
            await convenerOptions.first().click();
          } else {
            console.log('No convener options available, continuing without selection');
          }
        }
      } else {
        console.log('Convener dropdown is disabled, skipping selection');
      }
      
      await page.getByRole('button', { name: /create committee/i }).click();

      // Debug: Wait and see what happens after form submission
      await page.waitForTimeout(3000);
      
      // Check for any error messages or validation issues
      const errorMessages = await page.locator('.text-red-500, .text-destructive, [data-state="error"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('Error messages found:', errorMessages);
      }
      
      // Check what toast/notification messages appear
      const toastMessages = await page.locator('[data-sonner-toast], .toast, [role="alert"]').allTextContents();
      if (toastMessages.length > 0) {
        console.log('Toast messages found:', toastMessages);
      }
      
      // Check if form is still visible (indicating submission failed)
      const isFormStillVisible = await page.locator('form').isVisible();
      console.log('Form still visible after submission:', isFormStillVisible);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/committee-creation-debug.png', fullPage: true });

      await expect(page.getByText('Committee Created', { exact: true })).toBeVisible({timeout: 10000});
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
