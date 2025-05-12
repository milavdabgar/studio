import { test, expect, Page } from '@playwright/test';
import path from 'path';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:9003';

const studentUser = {
  email: '220010107001@gppalanpur.ac.in', // Assuming this student exists
  password: '220010107001',
  role: 'student',
  name: 'DOE JOHN MICHAEL'
};

async function loginAsStudent(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill(studentUser.email);
  await page.getByLabel(/Password/i).fill(studentUser.password);
  await page.getByLabel(/Login as/i).click(); 
  await page.getByRole('option', { name: /student/i }).click();
  await page.getByRole('button', { name: /Login|Sign In/i }).click();
  await expect(page).toHaveURL(`${APP_BASE_URL}/dashboard`, {timeout: 15000});
}

// Helper function to create a dummy file for upload
const createDummyFile = (content: string, fileName: string): string => {
  const fs = require('fs');
  const os = require('os');
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, content);
  return filePath;
};
let sampleFilePath: string;


test.describe('Student Portal Detailed Functionality', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsStudent(page);
    sampleFilePath = createDummyFile('This is a test submission file.', 'e2e_sample_submission.txt');
  });

  test.afterAll(async () => {
    // Clean up sample file
    const fs = require('fs');
    if (sampleFilePath) fs.unlinkSync(sampleFilePath);
    await page.close();
  });

  test('should submit an assignment', async () => {
    await page.goto(`${APP_BASE_URL}/student/assignments`);
    await expect(page.getByRole('heading', { name: /my assignments/i })).toBeVisible();

    // Find an assignment to submit to (assuming one is listed and available for submission)
    // This selector is highly dependent on the UI.
    const submitLink = page.locator('table tbody tr:has-text("Pending") a:has-text("Submit"), table tbody tr:has-text("Pending") button:has-text("Submit")').first();
    
    const assignmentIsAvailable = await submitLink.count() > 0;
    test.skip(!assignmentIsAvailable, "No pending assignment found to submit for testing.");
    
    await submitLink.click();
    
    // Now on the assignment detail/submission page
    await expect(page.getByRole('heading', { name: /submit your work/i })).toBeVisible();

    // Upload a file
    await page.getByLabel(/upload file/i).setInputFiles(sampleFilePath);
    await expect(page.getByText(/e2e_sample_submission.txt/i, { exact: false })).toBeVisible();

    // Add comments (optional)
    await page.getByLabel(/comments/i).fill('This is my E2E test submission.');

    await page.getByRole('button', { name: /submit assignment/i }).click();
    await expect(page.getByText(/submission successful/i, { exact: false })).toBeVisible({timeout: 10000});

    // Verify submission status changed on the main assignments page (optional)
    await page.goto(`${APP_BASE_URL}/student/assignments`);
    // This check depends on how the submitted assignment is displayed, e.g., its status text changes.
    // await expect(page.locator('table tbody tr:has-text("e2e_sample_submission.txt")').first().getByText(/submitted/i)).toBeVisible();
  });

  test('should view and download study materials', async () => {
    await page.goto(`${APP_BASE_URL}/student/materials`);
    await expect(page.getByRole('heading', { name: /study materials/i })).toBeVisible();

    // Assume materials are grouped by course in accordions
    // Click on the first course accordion to expand it
    const firstCourseAccordionTrigger = page.locator('button[role="heading"][aria-expanded="false"]').first(); // Selector for ShadCN accordion trigger
    
    const courseAccordionExists = await firstCourseAccordionTrigger.count() > 0;
    test.skip(!courseAccordionExists, "No course accordions found for study materials.");

    await firstCourseAccordionTrigger.click();
    
    // Find a material to download within the expanded accordion
    // This selector is highly dependent on the UI.
    const downloadButton = page.locator('div[data-state="open"] button:has-text("Download")').first(); // Assuming open accordion content
    
    const materialExists = await downloadButton.count() > 0;
    test.skip(!materialExists, "No downloadable material found in the first course.");

    // Start waiting for download before clicking. Note: web-first assertions are usually preferred.
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download (e.g., check suggested filename or save path if needed)
    expect(download.suggestedFilename()).not.toBe(''); // Basic check
    
    // To save the file to a temporary path for further inspection (optional):
    // const tempPath = path.join(os.tmpdir(), `e2e_download_${download.suggestedFilename()}`);
    // await download.saveAs(tempPath);
    // expect(fs.existsSync(tempPath)).toBeTruthy();
    // fs.unlinkSync(tempPath); // Clean up
  });
});
