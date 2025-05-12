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
    const maintenanceModeSwitch = page.getByLabel(/enable maintenance mode/i);
    const isMaintenanceModeEnabled = await maintenanceModeSwitch.isChecked();
    await maintenanceModeSwitch.setChecked(!isMaintenanceModeEnabled);

    // Toggle New User Registrations
    const registrationSwitch = page.getByLabel(/allow new user registrations/i);
    const isRegistrationEnabled = await registrationSwitch.isChecked();
    await registrationSwitch.setChecked(!isRegistrationEnabled);

    // Save settings
    await page.getByRole('button', { name: /save settings/i }).click();
    await expect(page.getByText(/settings saved/i, { exact: false })).toBeVisible({timeout: 10000});

    // Verify changes (by reloading and checking values, or if API returns updated values)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByLabel(/notifications email/i)).toHaveValue(newEmail);
    await expect(page.getByLabel(/enable maintenance mode/i)).toBeChecked(!isMaintenanceModeEnabled);
    await expect(page.getByLabel(/allow new user registrations/i)).toBeChecked(!isRegistrationEnabled);

    // Revert changes (optional, good for test hygiene if state persists across tests)
    await notificationsEmailInput.fill(originalEmail);
    await maintenanceModeSwitch.setChecked(isMaintenanceModeEnabled);
    await registrationSwitch.setChecked(isRegistrationEnabled);
    await page.getByRole('button', { name: /save settings/i }).click();
    await expect(page.getByText(/settings saved/i, { exact: false })).toBeVisible({timeout: 10000});
  });
});
