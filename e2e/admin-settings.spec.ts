import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const adminUserCredentials = {
  email: 'admin@gppalanpur.ac.in',
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
    await page.goto(`${APP_BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('System Settings', { exact: true }).first()).toBeVisible();

    // Update Notifications Email
    const notificationsEmailInput = page.getByLabel(/notifications email/i);
    const originalEmail = await notificationsEmailInput.inputValue();
    const newEmail = `test-notifications-${Date.now()}@example.com`;
    await notificationsEmailInput.fill(newEmail);

    // Toggle Maintenance Mode
    const maintenanceModeSwitch = page.getByRole('switch', { name: /Enable Maintenance Mode/i });
    const isMaintenanceModeEnabled = (await maintenanceModeSwitch.getAttribute('aria-checked')) === 'true';
    await maintenanceModeSwitch.click(); // Click to toggle

    // Toggle New User Registrations
    const registrationSwitch = page.getByRole('switch', { name: /Allow New User Registrations/i });
    const isRegistrationEnabled = (await registrationSwitch.getAttribute('aria-checked')) === 'true';
    await registrationSwitch.click();

    // Save settings
    await page.getByRole('button', { name: /save settings/i }).click();
    await expect(page.getByText('Settings Saved', { exact: true })).toBeVisible({timeout: 10000});

    // Verify changes by checking current state without reloading
    await expect(page.getByLabel(/notifications email/i)).toHaveValue(newEmail);
    expect((await page.getByRole('switch', { name: /Enable Maintenance Mode/i }).getAttribute('aria-checked')) === 'true').toBe(!isMaintenanceModeEnabled);
    expect((await page.getByRole('switch', { name: /Allow New User Registrations/i }).getAttribute('aria-checked')) === 'true').toBe(!isRegistrationEnabled);
  });
});
