import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:9003/api';
const APP_BASE_URL = 'http://localhost:9003';

async function loginAsAdmin(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/email/i).fill('admin@gppalanpur.in');
  await page.getByLabel(/password/i).fill('Admin@123');
  await page.getByLabel(/login as/i).click(); // Open select
  await page.getByRole('option', { name: /admin/i }).click();
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(`${APP_BASE_URL}/dashboard`);
}

test.describe('Project Fair Event Management E2E Tests', () => {
  let page: Page;
  let createdEventId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    if (createdEventId) {
      // Clean up created event
      const response = await page.request.delete(`${API_BASE_URL}/project-events/${createdEventId}`);
      console.log(`Cleanup event ${createdEventId} status: ${response.status()}`);
    }
    await page.close();
  });

  test('Navigate to Project Fair Events page', async () => {
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
    await expect(page.getByRole('heading', { name: /project fair event management/i })).toBeVisible();
  });

  test('Create a new Project Fair Event', async () => {
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
    await page.getByRole('button', { name: /create new event/i }).click();
    
    const eventName = `Test Event ${Date.now()}`;
    await page.getByLabel(/event name/i).fill(eventName);
    await page.getByLabel(/academic year/i).fill('2024-25');
    
    // Date inputs
    await page.getByLabel(/event date/i).click(); // Open popover
    await page.getByRole('gridcell', { name: '15' }).nth(1).click(); // Click 15th of next month (example)
    await page.waitForTimeout(200); // allow popover to close

    await page.getByLabel(/registration start/i).click();
    await page.getByRole('gridcell', { name: '1', exact: true }).first().click(); // 1st of current month
    await page.waitForTimeout(200);
    
    await page.getByLabel(/registration end/i).click();
    await page.getByRole('gridcell', { name: '10', exact: true }).first().click(); // 10th of current month
    await page.waitForTimeout(200);

    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /upcoming/i }).click();

    await page.getByLabel(/description/i).fill('This is a test event description for E2E testing.');
    
    // Department selection (assuming departments are loaded)
    // This part might need adjustment based on how departments are listed in your multi-select
    const departmentSelect = page.locator('label:has-text("Target Departments") + div').getByRole('checkbox').first();
    if (await departmentSelect.isVisible()) {
        await departmentSelect.check();
    }


    await page.getByRole('button', { name: /create event/i }).click();

    // Check for success toast
    await expect(page.getByText(/event created/i, { exact: false })).toBeVisible({ timeout: 10000 });
    
    // Verify redirection or presence in the list
    // await expect(page.getByRole('heading', { name: eventName })).toBeVisible(); // If redirect to event details page
    await expect(page.getByText(eventName)).toBeVisible(); // If stays on list page

    // Store createdEventId for cleanup
    const eventLink = page.locator(`a:has-text("${eventName}")`).first(); // Adjust if name isn't link
    if(await eventLink.isVisible({timeout: 2000})){
      const href = await eventLink.getAttribute('href');
      if (href) {
        const parts = href.split('/');
        createdEventId = parts[parts.length - 2]; // e.g., /admin/project-fair/events/EVENT_ID/dashboard
        console.log("Created Event ID for cleanup:", createdEventId);
      }
    } else {
        // Fallback: fetch the latest event from API to get ID (less ideal for E2E)
        const response = await page.request.get(`${API_BASE_URL}/project-events`);
        const events = await response.json();
        if (events && events.length > 0) {
            const latestEvent = events.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            if (latestEvent.name === eventName) {
                createdEventId = latestEvent.id;
                console.log("Created Event ID (via API fetch) for cleanup:", createdEventId);
            }
        }
    }


  });

  test('View and Edit an existing Project Fair Event', async () => {
    if (!createdEventId) {
      console.warn('Skipping edit test as no event was created');
      test.skip();
      return;
    }
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
    // Find the created event in the table (more robust selector needed if table structure changes)
    const row = page.locator('tr', { hasText: new RegExp(createdEventId.substring(0,10)) }).first(); // Search by partial ID to find the row
    await row.getByRole('button', { name: /edit/i }).click();
    
    await expect(page.getByRole('heading', { name: /edit project fair event/i })).toBeVisible();
    
    const updatedDescription = `Updated event description ${Date.now()}`;
    await page.getByLabel(/description/i).fill(updatedDescription);
    await page.getByRole('button', { name: /save changes/i }).click();
    
    await expect(page.getByText(/event updated/i, { exact: false })).toBeVisible({ timeout: 10000 });
    
    // Navigate to the event's dashboard to verify the update
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/dashboard`);
    await expect(page.getByText(updatedDescription)).toBeVisible();
  });

  test('Navigate to specific event dashboard and check links', async () => {
    if (!createdEventId) {
        console.warn('Skipping dashboard navigation test as no event was created/found');
        test.skip();
        return;
    }
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events/${createdEventId}/dashboard`);
    await expect(page.getByRole('heading', { name: /Test Event/i })).toBeVisible(); // Check for event name in heading

    // Check some management links
    await page.getByRole('link', { name: /manage projects/i }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/project-fair/events/${createdEventId}/projects`));
    await page.goBack();

    await page.getByRole('link', { name: /assign locations/i }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/project-fair/events/${createdEventId}/locations`));
    await page.goBack();
  });

  test('Delete the created Project Fair Event', async () => {
    if (!createdEventId) {
      console.warn('Skipping delete test as no event was created/found for deletion');
      test.skip();
      return;
    }
    await page.goto(`${APP_BASE_URL}/admin/project-fair/events`);
    // Find the created event in the table
    const row = page.locator('tr', { hasText: new RegExp(createdEventId.substring(0,10)) }).first();
    await row.getByRole('button', { name: /delete/i }).click();
    
    // Handle confirmation dialog if any (Playwright handles native dialogs by default)
    // If it's a custom modal, you'll need specific selectors to click "Confirm"
    
    await expect(page.getByText(/event deleted/i, { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('tr', { hasText: new RegExp(createdEventId.substring(0,10)) })).not.toBeVisible();
    createdEventId = null; // Mark as deleted for afterAll hook
  });
});
