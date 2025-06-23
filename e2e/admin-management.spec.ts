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
    let createdInstituteCode: string = '';
    const instituteBaseName = 'E2E Test Institute';

    test('should navigate to institutes page and create a new institute', async () => {
      await page.goto(`${APP_BASE_URL}/admin/institutes`);
      await expect(page.getByText('Institute Management', { exact: true }).first()).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      createdInstituteCode = `E2EI${timestamp}`;
      const instituteName = `${instituteBaseName} ${createdInstituteCode}`;

      await page.getByRole('button', { name: /add new institute/i }).click();
      await page.getByLabel(/institute name/i).fill(instituteName);
      await page.getByLabel(/institute code/i).fill(createdInstituteCode);
      await page.getByLabel(/address/i).fill('123 E2E Test St');
      await page.getByLabel(/contact email/i).fill(`contact@${createdInstituteCode.toLowerCase()}.e2e`);
      await page.getByRole('combobox', { name: 'Status *' }).click();
      await page.getByRole('option', { name: /active/i }).click();
      await page.getByRole('button', { name: /create institute/i }).click();

      await expect(page.getByText(/institute created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(instituteName)).toBeVisible();
    });

    test('should edit the created institute', async () => {
      test.skip(!createdInstituteCode, 'Skipping edit: No institute code from create test.');
      await page.goto(`${APP_BASE_URL}/admin/institutes`);
      const instituteRow = page.locator(`tr:has-text("${createdInstituteCode}")`).first();
      await expect(instituteRow).toBeVisible();
      await instituteRow.getByRole('button', { name: /edit/i }).click();

      const updatedInstituteName = `${instituteBaseName} ${createdInstituteCode} (Updated)`;
      await page.getByLabel(/institute name/i).fill(updatedInstituteName);
      await page.locator('label:has-text("Status") + button[role="combobox"]').click();
      await page.getByRole('option', { name: /inactive/i }).click();
      await page.getByRole('button', { name: /save changes/i }).click();

      await expect(page.getByText(/institute updated/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(updatedInstituteName)).toBeVisible();
      // Check for inactive status, might need a more specific selector based on actual table structure
      const updatedRow = page.locator(`tr:has-text("${updatedInstituteName}")`);
      await expect(updatedRow.getByText(/inactive/i, { exact: false })).toBeVisible();
    });

    test('should delete the created institute', async () => {
      test.skip(!createdInstituteCode, 'Skipping delete: No institute code from create test.');
      await page.goto(`${APP_BASE_URL}/admin/institutes`);
      const instituteRow = page.locator(`tr:has-text("${createdInstituteCode}")`).first();
      await expect(instituteRow).toBeVisible();
      await instituteRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/institute deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(instituteRow).not.toBeVisible();
      createdInstituteCode = ''; 
    });
  });

  // --- Department Management ---
  test.describe('Department Management', () => {
    let createdDepartmentCode: string = '';
    const departmentBaseName = 'E2E Test Department';

    test('should navigate to departments page and create a new department', async () => {
      await page.goto(`${APP_BASE_URL}/admin/departments`);
      await expect(page.getByText('Department Management', { exact: true }).first()).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      createdDepartmentCode = `E2ED${timestamp}`;
      const departmentName = `${departmentBaseName} ${createdDepartmentCode}`;

      await page.getByRole('button', { name: /add new department/i }).click();
      await page.getByLabel(/department name/i).fill(departmentName);
      await page.getByLabel(/department code/i).fill(createdDepartmentCode);
      
      // Select an institute - ensure at least one institute exists for selection
      // This assumes "Government Polytechnic Palanpur" exists or is the first option
      await page.getByRole('combobox', { name: 'Institute *' }).click();
      await page.getByRole('option', { name: /Government Polytechnic Palanpur/i }).first().click();

      await page.getByRole('combobox', { name: 'Status *' }).click();
      await page.getByRole('option', { name: /active/i }).click();
      await page.getByRole('button', { name: /create department/i }).click();

      await expect(page.getByText(/department created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(departmentName)).toBeVisible();
    });

    test('should delete the created department', async () => {
      test.skip(!createdDepartmentCode, 'Skipping delete: No department code from create test.');
      await page.goto(`${APP_BASE_URL}/admin/departments`);
      const departmentRow = page.locator(`tr:has-text("${createdDepartmentCode}")`).first();
      await expect(departmentRow).toBeVisible();
      await departmentRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/department deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(departmentRow).not.toBeVisible();
      createdDepartmentCode = '';
    });
  });


  // --- User Management ---
  test.describe('User Management from Admin', () => {
    let testUserEmail: string = '';
    const userBaseName = 'E2E Test User';

    test('should navigate to users page and add a new user', async () => {
      await page.goto(`${APP_BASE_URL}/admin/users`);
      await expect(page.getByText('User Management', { exact: true }).first()).toBeVisible();

      const timestamp = Date.now();
      testUserEmail = `e2e.user.${timestamp}@example.com`;
      const fullName = `${userBaseName} ${timestamp}`;

      await page.getByRole('button', { name: /add new user/i }).click();
      
      await page.getByLabel(/full name/i).fill(fullName);
      await page.getByLabel(/first name/i).fill('E2E');
      await page.getByLabel(/last name/i).fill(`User${timestamp}`);
      await page.getByLabel('Personal Email *').fill(testUserEmail); // Use exact label match if possible
      await page.getByLabel(/password/i).first().fill('Password123!');
      await page.getByLabel(/confirm password/i).fill('Password123!');
      
      // Select Roles - ensure 'Student' role checkbox exists
      await page.getByLabel('Roles *').locator('label:has-text("Student")').click(); // More specific targeting
      
      await page.getByRole('button', { name: /create user/i }).click();
      await expect(page.getByText(/user created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(testUserEmail)).toBeVisible();
    });

    test('should delete the created user', async () => {
      test.skip(!testUserEmail, 'Skipping delete: No user email from create test.');
      await page.goto(`${APP_BASE_URL}/admin/users`);
      // Ensure the user list has loaded. Sometimes a small delay or waitForSelector is needed.
      await page.waitForSelector(`tr:has-text("${testUserEmail}")`);
      const userRow = page.locator(`tr:has-text("${testUserEmail}")`).first();
      await expect(userRow).toBeVisible();
      
      // Prevent deleting the admin user itself
      if (testUserEmail.toLowerCase() === adminUserCredentials.email.toLowerCase()) {
        console.warn(`Skipping deletion of admin user: ${testUserEmail}`);
        return;
      }
      
      await userRow.getByRole('button', { name: /delete/i }).click();

      await expect(page.getByText(/user deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(userRow).not.toBeVisible();
      testUserEmail = '';
    });
  });

  // --- Role Management ---
  test.describe('Role Management', () => {
    let testRoleCode: string = '';
    const roleBaseName = 'E2E Test Role';

    test('should navigate to roles page and create a new role', async () => {
      await page.goto(`${APP_BASE_URL}/admin/roles`);
      await expect(page.getByText('Role Management', { exact: true }).first()).toBeVisible();

      const timestamp = Date.now().toString().slice(-6);
      testRoleCode = `e2e_test_role_${timestamp}`;
      const testRoleName = `${roleBaseName} ${timestamp}`;

      await page.getByRole('button', { name: /add new role/i }).click();
      await page.getByLabel(/role name/i).fill(testRoleName);
      await page.getByLabel(/role code/i).fill(testRoleCode);
      await page.getByLabel(/description/i).fill('E2E test role description.');
      
      // Select some permissions - ensure these permission labels exist
      await page.getByLabel(/view courses/i).check(); // Assuming 'View Courses' is a valid permission label
      await page.getByRole('button', { name: /create role/i }).click();

      await expect(page.getByText('Role Created', { exact: true })).toBeVisible({timeout: 10000});
      await expect(page.getByText(testRoleName)).toBeVisible();
      await expect(page.getByText(testRoleCode, { exact: true })).toBeVisible(); // Ensure code is also displayed
    });

    test('should delete the created role', async () => {
      test.skip(!testRoleCode, 'Skipping delete: No role code from create test.');
      
      // Prevent deletion of core system roles if this test role happens to be one
      if (['admin', 'student', 'faculty', 'hod', 'jury', 'super_admin'].includes(testRoleCode.toLowerCase())) {
        console.warn(`Skipping deletion of system-critical role code: ${testRoleCode}`);
        return;
      }
      
      await page.goto(`${APP_BASE_URL}/admin/roles`);
      await page.waitForSelector(`tr:has-text("${testRoleCode}")`);
      const roleRow = page.locator(`tr:has-text("${testRoleCode}")`).first();
      await expect(roleRow).toBeVisible();
      await roleRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/role deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(roleRow).not.toBeVisible();
      testRoleCode = '';
    });
  });

});
