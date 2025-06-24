import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000/api'; // Assuming API is at /api
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
  await expect(page).toHaveURL(new RegExp(`${APP_BASE_URL}/dashboard`), { timeout: 25000 });
}

test.describe('Project Fair Management (Admin)', () => {
  let page: Page;
  let createdEventId: string | null = null;
  let createdEventName: string = '';
  const eventBaseName = 'E2E Test Event';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    if (createdEventId) {
      console.log(`Attempting to clean up event ID: ${createdEventId} named: ${createdEventName}`);
      // Prefer UI deletion if possible and reliable, otherwise API
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
      await page.waitForLoadState('networkidle');
      const eventRow = page.locator(`tr:has-text("${createdEventName}")`).first();
      if (await eventRow.isVisible({timeout: 5000})) {
          await eventRow.getByRole('button', { name: /delete/i }).click();
          await expect(page.getByText(/event deleted/i, { exact: false })).toBeVisible({ timeout: 10000 });
          console.log(`UI Cleanup of event ${createdEventName} successful.`);
      } else {
          console.warn(`Event ${createdEventName} not found in UI for cleanup. Attempting API deletion.`);
          const response = await page.request.delete(`${API_BASE_URL}/project-events/${createdEventId}`);
          if (!response.ok()) {
              console.warn(`API cleanup failed for event ${createdEventId}. Status: ${response.status()} Body: ${await response.text()}`);
          } else {
              console.log(`API Cleanup of event ${createdEventId} successful.`);
          }
      }
    }
    await page.close();
  });

  test.describe('Event Management', () => {
    test('Navigate to Project Fair Events page', async () => {
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Project Fair Event Management')).toBeVisible();
    });

    test('Create a new Project Fair Event', async () => {
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /create new event/i }).click();
      
      const timestamp = Date.now().toString().slice(-6);
      createdEventName = `${eventBaseName} ${timestamp}`;
      await page.getByLabel(/event name/i).fill(createdEventName);
      await page.getByRole('textbox', { name: 'Academic Year *' }).fill('2025-26');
      
      // Event Date
      await page.getByLabel(/event date/i).locator('button').click();
      await page.getByRole('gridcell', { name: '20', exact: true }).first().click();
      
      // Registration Start Date
      await page.getByLabel(/registration start date/i).locator('button').click();
      await page.getByRole('gridcell', { name: '1', exact: true }).first().click(); 
      
      // Registration End Date
      await page.getByLabel(/registration end date/i).locator('button').click();
      await page.getByRole('gridcell', { name: '10', exact: true }).first().click();

      // Status
      await page.locator('form').getByLabel('Status *').click();
      await page.getByRole('option', { name: /upcoming/i }).click();

      await page.getByLabel(/description/i).fill('E2E test event description.');
      
      // Target Departments - assumes at least one department is available for selection
      const departmentSelectTrigger = page.locator('form div:has(label:has-text("Target Departments")) button[role="combobox"]');
      if (await departmentSelectTrigger.isVisible()) {
          await departmentSelectTrigger.click();
          await page.waitForTimeout(200); // Wait for dropdown
          const firstDeptCheckbox = page.locator('div[role="listbox"] label').first();
          if (await firstDeptCheckbox.isVisible()) {
            await firstDeptCheckbox.click();
          }
          await page.keyboard.press('Escape'); // Close dropdown
      }
      
      await page.getByRole('button', { name: /create event/i }).click();
      await expect(page.getByText(/event created/i, { exact: false })).toBeVisible({ timeout: 15000 });
      
      // Extract event ID from the list after creation
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events`); // Go back to list
      await page.waitForSelector(`tr:has-text("${createdEventName}")`);
      const eventRow = page.locator(`tr:has-text("${createdEventName}")`).first();
      await expect(eventRow).toBeVisible();
      // Attempt to get ID from an edit link or dashboard link for the event
      // This is a common pattern but depends on your UI structure.
      // Example: if there's a link to an edit page like /admin/project-fair/events/edit/EVENT_ID
      const editLink = eventRow.getByRole('link', { name: /edit/i }); // Or "Manage", "Dashboard"
      if ((await editLink.count()) > 0) {
        const href = await editLink.getAttribute('href');
        if (href) {
            // Assuming URL structure like /.../edit/EVENT_ID or /.../EVENT_ID/dashboard
            const parts = href.split('/');
            // Find the part that looks like an ID (e.g., alphanumeric, possibly with "event_")
            // This is heuristic. A data-id attribute on the row or button would be more robust.
            const idCandidate = parts.find(part => part.startsWith('event_') || (part.length > 10 && /[a-zA-Z0-9_]+/.test(part)));
            if (idCandidate && idCandidate !== 'edit' && idCandidate !== 'dashboard') {
                 createdEventId = idCandidate;
            }
        }
      }
      // If ID not found via link, you might need a more robust way (e.g., API call or data-id attribute)
      if (!createdEventId) {
          console.warn("Could not reliably determine createdEventId from UI. Subsequent tests for this event might fail.");
          // As a fallback for tests that rely on createdEventId, we can try to find it via its name, assuming names are unique for testing.
          // This is less reliable if names are not guaranteed unique.
          // For now, we'll proceed, and tests that need the ID will skip if it's null.
      }
      if(createdEventId) console.log(`Created Event ID (from UI): ${createdEventId}`);
    });

    test('View and Edit the created Project Fair Event', async () => {
      test.skip(!createdEventId, 'Skipping edit test as no event ID was extracted from create test');
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/edit/${createdEventId}`);
      
      await expect(page.getByRole('heading', { name: /edit project fair event/i })).toBeVisible();
      const updatedDescription = `Updated event description ${Date.now().toString().slice(-4)}`;
      await page.getByLabel(/description/i).fill(updatedDescription);
      await page.getByRole('button', { name: /save changes/i }).click();
      
      await expect(page.getByText(/event updated/i, { exact: false })).toBeVisible({ timeout: 10000 });
      
      // Verify update by navigating to its dashboard or list
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/dashboard`);
      await expect(page.getByRole('heading', { name: new RegExp(createdEventName, 'i')})).toBeVisible();
      // Ideally, also check if description is updated, but this requires the dashboard to show it.
    });
  });

  test.describe('Event Content Management (Projects, Teams, Locations)', () => {
    test.beforeEach(async () => {
      test.skip(!createdEventId || !createdEventName, 'Skipping content management: No event context from create test.');
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/dashboard`);
    });

    test('Manage Projects: Create, View, Edit, Delete', async () => {
      await page.getByRole('link', { name: /manage projects/i }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/project-fair/events/${createdEventId}/projects`));
      await expect(page.getByRole('heading', { name: new RegExp(`Projects for ${createdEventName}`, 'i') })).toBeVisible();

      const projectBaseName = `E2E Test Project`;
      const projectTimestamp = Date.now().toString().slice(-6);
      const projectName = `${projectBaseName} ${projectTimestamp}`;

      await page.getByRole('button', { name: /add new project/i }).click();
      await page.getByLabel(/title/i).fill(projectName);
      await page.getByLabel(/category/i).fill('E2E Test Category');
      await page.getByLabel(/abstract/i).fill('E2E test project abstract.');
      
      // Select Department (ensure options are available)
      const deptSelect = page.locator('form').getByLabel('Department *');
      await deptSelect.click();
      await page.getByRole('option').first().click(); 
      
      // Select Team (ensure options are available, or handle case where no teams exist yet)
      const teamSelect = page.locator('form').getByLabel('Team *');
      await teamSelect.click();
      // If teams are created dynamically or by users, this test might need to create a team first
      // For now, assuming a team can be selected or a default is available.
      const teamOption = page.getByRole('option').first();
      if (await teamOption.isVisible({timeout: 2000})) {
        await teamOption.click();
      } else {
          console.warn("No teams available to select for project creation. Skipping team selection.");
          await page.keyboard.press('Escape'); // Close dropdown
      }
      
      // Select Guide (ensure options are available)
      const guideSelect = page.locator('form').getByLabel('Guide *');
      await guideSelect.click();
      await page.getByRole('option').first().click();

      await page.getByRole('button', { name: /create project/i }).click();
      await expect(page.getByText(/project created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(projectName)).toBeVisible();
      
      await page.waitForSelector(`tr:has-text("${projectName}")`);
      const projectRow = page.locator(`tr:has-text("${projectName}")`).first();

      // Edit (Simplified - checking only name update)
      await projectRow.getByRole('button', { name: /edit/i }).click();
      const updatedProjectName = `${projectName} (Updated)`;
      await page.getByLabel(/title/i).fill(updatedProjectName);
      await page.getByRole('button', { name: /save changes/i }).click();
      await expect(page.getByText(/project updated/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(updatedProjectName)).toBeVisible();

      // Delete
      await page.waitForSelector(`tr:has-text("${updatedProjectName}")`); // ensure updated name row exists
      const updatedProjectRow = page.locator(`tr:has-text("${updatedProjectName}")`).first();
      await updatedProjectRow.getByRole('button', { name: /delete/i }).click();
      await expect(page.getByText(/project deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(updatedProjectName)).not.toBeVisible();
    });

    // Other content management tests (Teams, Locations) can be added similarly.
  });

  // This delete test for the main event runs after all sub-tests for event content.
  // Note: Test execution order is not strictly guaranteed unless using test.serial or dependencies.
  // For robust cleanup, the afterAll hook is preferred.
});
