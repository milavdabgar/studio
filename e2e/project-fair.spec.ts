import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:9003/api';
const APP_BASE_URL = 'http://localhost:9003';

async function loginAsAdmin(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/email/i).fill('admin@gppalanpur.in');
  await page.getByLabel(/password/i).fill('Admin@123');
  await page.getByLabel(/login as/i).click(); 
  await page.getByRole('option', { name: /admin/i }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(`${APP_BASE_URL}/dashboard`, { timeout: 15000 });
}

test.describe('Project Fair Management (Admin)', () => {
  let page: Page;
  let createdEventId: string | null = null;
  let createdEventName: string = '';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    if (createdEventId) {
      console.log(`Attempting to clean up event ID: ${createdEventId}`);
      const response = await page.request.delete(`${API_BASE_URL}/project-events/${createdEventId}`);
      if (!response.ok()) {
          console.warn(`Failed to cleanup event ${createdEventId}. Status: ${response.status()} Body: ${await response.text()}`);
      } else {
          console.log(`Cleanup of event ${createdEventId} successful.`);
      }
    }
    await page.close();
  });

  test.describe('Event Management', () => {
    test('Navigate to Project Fair Events page', async () => {
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
      await expect(page.getByRole('heading', { name: /project fair event management/i })).toBeVisible();
    });

    test('Create a new Project Fair Event', async () => {
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
      await page.getByRole('button', { name: /create new event/i }).click();
      
      createdEventName = `E2E Test Event ${Date.now()}`;
      await page.getByLabel(/event name/i).fill(createdEventName);
      await page.getByLabel(/academic year/i).fill('2025-26');
      
      await page.getByLabel(/event date/i).click();
      await page.getByRole('gridcell', { name: '20', exact: true }).first().click(); // Pick a date
      await page.waitForTimeout(200);

      await page.getByLabel(/registration start/i).click();
      await page.getByRole('gridcell', { name: '1', exact: true }).first().click();
      await page.waitForTimeout(200);
      
      await page.getByLabel(/registration end/i).click();
      await page.getByRole('gridcell', { name: '10', exact: true }).first().click();
      await page.waitForTimeout(200);

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /upcoming/i }).click();

      await page.getByLabel(/description/i).fill('E2E test event description.');
      
      const departmentSelectTrigger = page.locator('label:has-text("Target Departments") + div button[role="combobox"]');
      if (await departmentSelectTrigger.isVisible()) {
          await departmentSelectTrigger.click();
          await page.waitForTimeout(200); // Wait for dropdown
          // Attempt to select first available department, be robust if none
          const firstDeptCheckbox = page.locator('div[role="listbox"] label').first();
          if (await firstDeptCheckbox.isVisible()) {
            await firstDeptCheckbox.click();
          }
          await page.keyboard.press('Escape'); // Close dropdown
      }
      
      await page.getByRole('button', { name: /create event/i }).click();
      await expect(page.getByText(/event created/i, { exact: false })).toBeVisible({ timeout: 15000 });
      
      // Extract event ID from the URL or from the list
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') && currentUrl.includes('/admin/project-fair/events/')) {
        const parts = currentUrl.split('/');
        createdEventId = parts[parts.length - 2];
      } else {
         // Fallback: find in list
        const eventRow = page.locator(`tr:has-text("${createdEventName}")`).first();
        await expect(eventRow).toBeVisible();
        const editButton = eventRow.getByRole('link', { name: /dashboard/i }); // Assuming edit navigates to dashboard/edit
        const href = await editButton.getAttribute('href');
        if (href) {
             const parts = href.split('/');
             createdEventId = parts[parts.length - 2]; // e.g. /admin/project-fair/events/EVENT_ID/dashboard
        }
      }
      expect(createdEventId).not.toBeNull();
      console.log(`Created Event ID: ${createdEventId}`);
    });

    test('View and Edit the created Project Fair Event', async () => {
      test.skip(!createdEventId, 'Skipping edit test as no event was created');
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/edit/${createdEventId}`);
      
      await expect(page.getByRole('heading', { name: /edit project fair event/i })).toBeVisible();
      const updatedDescription = `Updated event description ${Date.now()}`;
      await page.getByLabel(/description/i).fill(updatedDescription);
      await page.getByRole('button', { name: /save changes/i }).click();
      
      await expect(page.getByText(/event updated/i, { exact: false })).toBeVisible({ timeout: 10000 });
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/dashboard`);
      // Verify the update on the dashboard or event details page
      // This might require navigating to a specific part of the dashboard page
      // For now, just ensure navigation is successful
      await expect(page.getByRole('heading', { name: new RegExp(createdEventName, 'i')})).toBeVisible();
    });
  });

  test.describe('Event Content Management (Projects, Teams, Locations)', () => {
    test.beforeEach(async () => {
      test.skip(!createdEventId, 'Skipping content management tests as no event context');
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/dashboard`);
    });

    // --- Project Management within an Event ---
    test('Manage Projects: Create, View, Edit, Delete', async () => {
      await page.getByRole('link', { name: /manage projects/i }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/project-fair/events/${createdEventId}/projects`));
      await expect(page.getByRole('heading', { name: /projects for/i })).toBeVisible();

      // Create
      const projectName = `Test Project ${Date.now()}`;
      await page.getByRole('button', { name: /add new project/i }).click();
      await page.getByLabel(/title/i).fill(projectName);
      await page.getByLabel(/category/i).fill('E2E Test Category');
      await page.getByLabel(/abstract/i).fill('E2E test project abstract.');
      // Select Department (assuming a select element)
      await page.locator('label:has-text("Department") + div select').selectOption({ index: 1 }); // Select first available
      // Select Team (assuming a select element, team needs to be created first or selected if exists)
      // For now, skip team selection if it's complex, or assume a default/placeholder
      const teamSelect = page.locator('label:has-text("Team") + div select');
      if (await teamSelect.isVisible() && await teamSelect.locator('option').count() > 1) {
        await teamSelect.selectOption({ index: 1 });
      }
      // Select Guide (User)
      const guideSelect = page.locator('label:has-text("Guide") + div select');
       if (await guideSelect.isVisible() && await guideSelect.locator('option').count() > 1) {
        await guideSelect.selectOption({ index: 1 });
      }

      await page.getByRole('button', { name: /create project/i }).click();
      await expect(page.getByText(/project created successfully/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(projectName)).toBeVisible();
      
      // Find the created project row
      const projectRow = page.locator(`tr:has-text("${projectName}")`).first();
      const projectId = await projectRow.getAttribute('data-id'); // Assuming row has data-id

      // Edit
      await projectRow.getByRole('button', { name: /edit/i }).click();
      const updatedProjectName = `${projectName} (Updated)`;
      await page.getByLabel(/title/i).fill(updatedProjectName);
      await page.getByRole('button', { name: /save changes/i }).click();
      await expect(page.getByText(/project updated successfully/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(updatedProjectName)).toBeVisible();

      // Delete
      await projectRow.getByRole('button', { name: /delete/i }).click();
      // Handle confirmation dialog if any (Playwright handles native dialogs with page.on('dialog'))
      // If custom modal:
      // await page.getByRole('button', { name: /confirm delete/i }).click();
      await expect(page.getByText(/project deleted successfully/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(updatedProjectName)).not.toBeVisible();
    });

    // --- Team Management within an Event (Simplified) ---
    test('Manage Teams: Create and View', async () => {
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/teams`);
      await expect(page.getByRole('heading', { name: /teams for/i })).toBeVisible();

      const teamName = `Test Team ${Date.now()}`;
      await page.getByRole('button', { name: /add new team/i }).click();
      await page.getByLabel(/team name/i).fill(teamName);
      // Select Department
      await page.locator('label:has-text("Department") + div select').selectOption({ index: 1 }); 
      // Add members (simplified: assuming first member is current admin user or prefilled)
      const firstMemberNameInput = page.locator('input[id^="members"][id$="name"]').first();
      if (await firstMemberNameInput.inputValue() === '') {
         await firstMemberNameInput.fill('Admin User Lead');
         await page.locator('input[id^="members"][id$="enrollmentNo"]').first().fill('ADMIN001');
         await page.locator('input[id^="members"][id$="role"]').first().fill('Team Leader');
         await page.locator('input[id^="members"][id$="isLeader"]').first().check();
      }
      await page.getByRole('button', { name: /create team/i }).click();
      await expect(page.getByText(/team created successfully/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(teamName)).toBeVisible();
    });

    // --- Location Management within an Event (Simplified) ---
    test('Manage Locations: Create and View', async () => {
      await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/locations`);
      await expect(page.getByRole('heading', { name: /locations for/i })).toBeVisible();

      const locationId = `E2E-LOC-${Date.now().toString().slice(-4)}`;
      await page.getByRole('button', { name: /add new location/i }).click();
      await page.getByLabel(/location id/i).fill(locationId);
      await page.getByLabel(/section/i).fill('Z');
      await page.getByLabel(/position/i).fill('99');
       // Select Department
      await page.locator('label:has-text("Department") + div select').selectOption({ index: 1 }); 
      await page.getByRole('button', { name: /create location/i }).click();
      await expect(page.getByText(/location created successfully/i)).toBeVisible({timeout: 10000});
      await expect(page.getByText(locationId)).toBeVisible();
    });
  });

  // This test should be run last or after all other tests in this describe block
  test('Delete the main E2E Test Event', async () => {
    test.skip(!createdEventId, 'Skipping delete test as no event was created/found for deletion');
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
    
    const eventRow = page.locator(`tr:has-text("${createdEventName}")`).first();
    await expect(eventRow).toBeVisible({timeout: 5000}); // Ensure row is there before trying to delete
    
    await eventRow.getByRole('button', { name: /delete/i }).click();
    
    // Handle confirmation dialog (if any)
    // If it's a native confirm: page.on('dialog', dialog => dialog.accept());
    // If it's a custom modal, locate and click its confirm button.
    // For now, assuming direct deletion or Playwright handles basic confirms.
    
    await expect(page.getByText(/event deleted/i, { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`tr:has-text("${createdEventName}")`)).not.toBeVisible({timeout: 5000});
    createdEventId = null; // Mark as deleted for afterAll hook
    createdEventName = '';
  });
});
