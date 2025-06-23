import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs'; // Import fs for file operations
import os from 'os'; // Import os for temp directory


const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const studentUserCredentials = {
  email: 'student@example.com', 
  password: 'password', 
  role: 'Student',
  name: 'Alice Student'
};

async function loginAsStudent(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill(studentUserCredentials.email);
  await page.getByLabel(/Password/i).fill(studentUserCredentials.password);
  await page.getByLabel(/Login as/i).click(); 
  await page.getByRole('option', { name: studentUserCredentials.role, exact: true }).click();
  await page.getByRole('button', { name: /Login|Sign In/i }).click();
  await expect(page).toHaveURL(new RegExp(`${APP_BASE_URL}/dashboard`), {timeout: 25000});
}

// Helper function to create a dummy file for upload
const createDummyFile = (content: string, fileName: string): string => {
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
    sampleFilePath = createDummyFile('This is an E2E test submission file content.', 'e2e_sample_submission.txt');
  });

  test.afterAll(async () => {
    // Clean up sample file
    if (sampleFilePath && fs.existsSync(sampleFilePath)) fs.unlinkSync(sampleFilePath);
    await page.close();
  });

  test('should submit an assignment', async () => {
    await page.goto(`${APP_BASE_URL}/student/assignments`);
    await expect(page.getByRole('heading', { name: /my assignments/i })).toBeVisible();

    // Find an assignment to submit to. This looks for a "Submit" button/link in a row containing "Pending".
    const submitLink = page.locator('table tbody tr:has-text("Pending")').first().getByRole('link', { name: /submit/i }); 
    // Or, if it's a button: page.locator('table tbody tr:has-text("Pending")').first().getByRole('button', { name: /submit/i });
    
    if (!(await submitLink.isVisible({timeout: 5000}))) {
        console.warn("No pending assignment found with a 'Submit' link/button. Skipping assignment submission test.");
        test.skip(true, "No pending assignment available for submission.");
        return;
    }
    await submitLink.click();
    
    await expect(page.getByRole('heading', { name: /submit your work/i })).toBeVisible({timeout: 10000});

    // Upload a file using setInputFiles
    await page.getByLabel(/upload file/i).setInputFiles(sampleFilePath);
    // Check if the file name appears, indicating successful selection for upload
    await expect(page.getByText(/e2e_sample_submission.txt/i)).toBeVisible({timeout:5000});

    // Add comments (optional)
    await page.getByLabel(/comments/i).fill('This is my E2E test submission for Playwright.');

    await page.getByRole('button', { name: /submit assignment/i }).click();
    await expect(page.getByText(/submission successful/i, { exact: false })).toBeVisible({timeout: 10000});

    // Optional: Verify submission status changed on the main assignments page
    await page.goto(`${APP_BASE_URL}/student/assignments`);
    // This check depends on how submitted assignments are displayed (e.g., "Submitted" status text).
    // This is a placeholder, you might need to adjust based on the specific UI update.
    const submittedRow = page.locator('table tbody tr').filter({ hasText: /submitted/i }).first();
    await expect(submittedRow).toBeVisible({timeout:10000});
  });

  test('should view and download study materials', async () => {
    await page.goto(`${APP_BASE_URL}/student/materials`);
    await expect(page.getByRole('heading', { name: /study materials/i })).toBeVisible();

    // Click on the first course accordion to expand it if it exists
    const firstCourseAccordionTrigger = page.locator('button[data-state="closed"][role="heading"]').first(); 
    if (!(await firstCourseAccordionTrigger.isVisible({timeout: 5000}))) {
      console.warn("No course accordions found for study materials. Skipping test.");
      test.skip(true, "No course accordions for study materials.");
      return;
    }
    await firstCourseAccordionTrigger.click();
    
    // Wait for accordion content to be visible
    const openAccordionContent = page.locator('div[data-state="open"]');
    await expect(openAccordionContent).toBeVisible({timeout: 5000});

    // Find a material to download within the expanded accordion
    const downloadButton = openAccordionContent.getByRole('link', { name: /download/i }).first(); 
    // Or, if it's a button: openAccordionContent.getByRole('button', { name: /download/i }).first();
    
    if (!(await downloadButton.isVisible({timeout: 5000}))) {
      console.warn("No downloadable material found in the first course. Skipping download test.");
      test.skip(true, "No downloadable material in the first course.");
      return;
    }

    // Start waiting for download before clicking.
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).not.toBe('');
    
    // Optional: Save the file and verify existence
    const tempPath = path.join(os.tmpdir(), `e2e_download_${download.suggestedFilename()}`);
    await download.saveAs(tempPath);
    expect(fs.existsSync(tempPath)).toBeTruthy();
    fs.unlinkSync(tempPath); // Clean up
  });
});
