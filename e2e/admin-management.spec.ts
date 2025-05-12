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

test.describe('Admin Data Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // --- Institute Management ---
  test.describe('Institute Management', () => {
    let createdInstituteId: string | null = null;
    let createdInstituteCode: string = '';

    test('should navigate to institutes page and create a new institute', async () => {
      await page.goto(`${APP_BASE_URL}/admin/institutes`);
      await expect(page.getByRole('heading', { name: /institute management/i })).toBeVisible();

      createdInstituteCode = `E2EI${Date.now().toString().slice(-4)}`;
      const instituteName = `E2E Test Institute ${createdInstituteCode}`;

      await page.getByRole('button', { name: /add new institute/i }).click();
      await page.getByLabel(/institute name/i).fill(instituteName);
      await page.getByLabel(/institute code/i).fill(createdInstituteCode);
      await page.getByLabel(/address/i).fill('123 E2E Test St');
      await page.getByLabel(/contact email/i).fill(`contact@${createdInstituteCode.toLowerCase()}.e2e`);
      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /active/i }).click();
      await page.getByRole('button', { name: /create institute/i }).click();

      await expect(page.getByText(/institute created/i)).toBeVisible({timeout: 10000});
      const instituteRow = page.locator(`tr:has-text("${instituteName}")`).first();
      await expect(instituteRow).toBeVisible();
      // Assuming the row or a child element has a data-id attribute with the institute's ID
      // This might need adjustment based on actual table structure.
      // For now, we'll rely on the code being unique enough for subsequent tests.
    });

    test('should edit the created institute', async () => {
      test.skip(!createdInstituteCode, 'Skipping edit institute test as no institute code available');
      await page.goto(`${APP_BASE_URL}/admin/institutes`);
      const instituteRow = page.locator(`tr:has-text("${createdInstituteCode}")`).first();
      await expect(instituteRow).toBeVisible();
      await instituteRow.getByRole('button', { name: /edit/i }).click();

      const updatedInstituteName = `E2E Test Institute ${createdInstituteCode} (Updated)`;
      await page.getByLabel(/institute name/i).fill(updatedInstituteName);
      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /inactive/i }).click();
      await page.getByRole('button', { name: /save changes/i }).click();

      await expect(page.getByText(/institute updated/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(updatedInstituteName)).toBeVisible();
      await expect(page.locator(`tr:has-text("${updatedInstituteName}")`).getByText(/inactive/i)).toBeVisible();
    });

    test('should delete the created institute', async () => {
      test.skip(!createdInstituteCode, 'Skipping delete institute test as no institute code available');
      await page.goto(`${APP_BASE_URL}/admin/institutes`);
      const instituteRow = page.locator(`tr:has-text("${createdInstituteCode}")`).first();
      await expect(instituteRow).toBeVisible();
      await instituteRow.getByRole('button', { name: /delete/i }).click();
      
      // Handle confirmation dialog if any
      // For example, if it's a native confirm:
      // page.on('dialog', dialog => dialog.accept());
      // Or if it's a modal, click the confirm button in the modal
      // For now, assuming direct deletion or Playwright handles basic confirms.

      await expect(page.getByText(/institute deleted/i)).toBeVisible({timeout: 10000});
      await expect(instituteRow).not.toBeVisible();
      createdInstituteCode = ''; // Reset for safety
    });
  });

  // --- Department Management ---
  test.describe('Department Management', () => {
    let createdDepartmentCode: string = '';

    test('should navigate to departments page and create a new department', async () => {
      await page.goto(`${APP_BASE_URL}/admin/departments`);
      await expect(page.getByRole('heading', { name: /department management/i })).toBeVisible();

      createdDepartmentCode = `E2ED${Date.now().toString().slice(-4)}`;
      const departmentName = `E2E Test Department ${createdDepartmentCode}`;

      await page.getByRole('button', { name: /add new department/i }).click();
      await page.getByLabel(/department name/i).fill(departmentName);
      await page.getByLabel(/department code/i).fill(createdDepartmentCode);
      // Select an institute - assuming 'GP Palanpur' is an option
      await page.locator('label:has-text("Institute") + div button[role="combobox"]').click();
      await page.getByRole('option', { name: /Government Polytechnic Palanpur/i }).click();

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /active/i }).click();
      await page.getByRole('button', { name: /create department/i }).click();

      await expect(page.getByText(/department created/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(departmentName)).toBeVisible();
    });

    test('should delete the created department', async () => {
      test.skip(!createdDepartmentCode, 'Skipping delete department test as no department code available');
      await page.goto(`${APP_BASE_URL}/admin/departments`);
      const departmentRow = page.locator(`tr:has-text("${createdDepartmentCode}")`).first();
      await expect(departmentRow).toBeVisible();
      await departmentRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/department deleted/i)).toBeVisible({timeout: 10000});
      await expect(departmentRow).not.toBeVisible();
      createdDepartmentCode = '';
    });
  });


  // --- User Management (subset of dashboard.spec.ts, focused on admin view) ---
  test.describe('User Management from Admin', () => {
    let testUserEmail: string;

    test('should navigate to users page and add a new user', async () => {
      await page.goto(`${APP_BASE_URL}/admin/users`);
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

      testUserEmail = `e2e.user.${Date.now()}@example.com`;
      await page.getByRole('button', { name: /add new user/i }).click();
      
      await page.getByLabel(/full name/i).fill('E2E Test User');
      await page.getByLabel(/first name/i).fill('E2E');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/personal email/i).fill(testUserEmail);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel(/confirm password/i).fill('Password123!');
      
      // Select Roles
      await page.getByText('Roles *').click(); // Assuming this opens the multi-select/checkbox group area
      await page.getByLabel('Student', { exact: true }).check(); // Select student role

      await page.getByRole('button', { name: /create user/i }).click();
      await expect(page.getByText(/user created/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(testUserEmail)).toBeVisible();
    });

    test('should delete the created user', async () => {
      test.skip(!testUserEmail, 'Skipping delete user test as no user email available');
      await page.goto(`${APP_BASE_URL}/admin/users`);
      const userRow = page.locator(`tr:has-text("${testUserEmail}")`).first();
      await expect(userRow).toBeVisible();
      await userRow.getByRole('button', { name: /delete/i }).click();

      await expect(page.getByText(/user deleted/i)).toBeVisible({timeout: 10000});
      await expect(userRow).not.toBeVisible();
    });
  });

  // --- Role Management ---
  test.describe('Role Management', () => {
    let testRoleCode: string;

    test('should navigate to roles page and create a new role', async () => {
      await page.goto(`${APP_BASE_URL}/admin/roles`);
      await expect(page.getByRole('heading', { name: /role management/i })).toBeVisible();

      testRoleCode = `e2e_test_role_${Date.now().toString().slice(-4)}`;
      const testRoleName = `E2E Test Role`;

      await page.getByRole('button', { name: /add new role/i }).click();
      await page.getByLabel(/role name/i).fill(testRoleName);
      await page.getByLabel(/role code/i).fill(testRoleCode);
      await page.getByLabel(/description/i).fill('E2E test role description.');
      // Select some permissions
      await page.getByLabel(/View Courses/i).check();
      await page.getByRole('button', { name: /create role/i }).click();

      await expect(page.getByText(/role created/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(testRoleName)).toBeVisible();
      await expect(page.getByText(testRoleCode, { exact: false })).toBeVisible();
    });

    test('should delete the created role', async () => {
      test.skip(!testRoleCode, 'Skipping delete role test as no role code available');
      await page.goto(`${APP_BASE_URL}/admin/roles`);
      const roleRow = page.locator(`tr:has-text("${testRoleCode}")`).first();
      await expect(roleRow).toBeVisible();
      await roleRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/role deleted/i)).toBeVisible({timeout: 10000});
      await expect(roleRow).not.toBeVisible();
    });
  });

});
