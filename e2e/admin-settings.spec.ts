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

test.describe('Admin System Settings', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to settings page and update settings', async () => {
    await page.goto(`${APP_BASE_URL}/admin/settings`);
    await expect(page.getByRole('heading', { name: /system settings/i })).toBeVisible();

    // Update Notifications Email
    const notificationsEmailInput = page.getByLabel(/notifications email/i);
    const originalEmail = await notificationsEmailInput.inputValue();
    const newEmail = `test-notifications-${Date.now()}@example.com`;
    await notificationsEmailInput.fill(newEmail);

    // Toggle Maintenance Mode
    const maintenanceModeSwitch = page.locator('button[role="switch"][aria-label*="maintenance mode"]'); // More specific selector for ShadCN switch
    const isMaintenanceModeEnabled = (await maintenanceModeSwitch.getAttribute('aria-checked')) === 'true';
    await maintenanceModeSwitch.click(); // Click to toggle

    // Toggle New User Registrations
    const registrationSwitch = page.locator('button[role="switch"][aria-label*="user registrations"]');
    const isRegistrationEnabled = (await registrationSwitch.getAttribute('aria-checked')) === 'true';
    await registrationSwitch.click();

    // Save settings
    await page.getByRole('button', { name: /save settings/i }).click();
    await expect(page.getByText(/settings saved/i, { exact: false })).toBeVisible({timeout: 10000});

    // Verify changes (by reloading and checking values)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByLabel(/notifications email/i)).toHaveValue(newEmail);
    expect((await page.locator('button[role="switch"][aria-label*="maintenance mode"]').getAttribute('aria-checked')) === 'true').toBe(!isMaintenanceModeEnabled);
    expect((await page.locator('button[role="switch"][aria-label*="user registrations"]').getAttribute('aria-checked')) === 'true').toBe(!isRegistrationEnabled);

    // Revert changes 
    await page.getByLabel(/notifications email/i).fill(originalEmail);
    // Click to revert to original states
    if (((await page.locator('button[role="switch"][aria-label*="maintenance mode"]').getAttribute('aria-checked')) === 'true') !== isMaintenanceModeEnabled) {
      await page.locator('button[role="switch"][aria-label*="maintenance mode"]').click();
    }
    if (((await page.locator('button[role="switch"][aria-label*="user registrations"]').getAttribute('aria-checked')) === 'true') !== isRegistrationEnabled) {
      await page.locator('button[role="switch"][aria-label*="user registrations"]').click();
    }
    await page.getByRole('button', { name: /save settings/i }).click();
    await expect(page.getByText(/settings saved/i, { exact: false })).toBeVisible({timeout: 10000});
  });
});
