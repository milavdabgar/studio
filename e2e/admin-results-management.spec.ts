import { test, expect, Page } from '@playwright/test';
import path from 'path';

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

// Helper function to create a dummy CSV file for upload
const createDummyCsvFile = (content: string, fileName: string): string => {
  const fs = require('fs');
  const os = require('os');
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, content);
  return filePath;
};

test.describe('Admin Results Management', () => {
  let page: Page;
  let sampleStandardCsvPath: string;
  let sampleGtuCsvPath: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);

    // Create sample CSV files for testing imports
    const standardCsvContent = `EnrollmentNumber,StudentName,ExamName,Semester,BranchName,AcademicYear,SPI,CPI,OverallResult,SubjectCode1,SubjectName1,SubjectCredits1,SubjectGrade1\n220010107001,John Doe,Mid Sem 1,1,Computer Engineering,2023-24,8.5,8.5,PASS,CS101,Programming,4,AA`;
    sampleStandardCsvPath = createDummyCsvFile(standardCsvContent, 'sample_standard_results_import.csv');

    const gtuCsvContent = `St_Id,MAP_NUMBER,extype,examid,exam,DECLARATIONDATE,AcademicYear,sem,UNIT_NO,EXAMNUMBER,name,instcode,instName,CourseName,BR_CODE,BR_NAME,SUB1,SUB1NA,SUB1CR,SUB1GR,SPI,CPI,CGPA,RESULT,TRIAL,REMARK,CURBACKL,TOTBACKL\n220010107001,220010107001,REGULAR,12345,WINTER 2023,2024-01-15,2023-24,1,1,1,DOE JOHN MICHAEL,001,GPP,DCE,07,Computer Engineering,CS101,Programming,4,AA,9.5,9.5,9.5,PASS,1,,0,0`;
    sampleGtuCsvPath = createDummyCsvFile(gtuCsvContent, 'sample_gtu_results_import.csv');
  });

  test.afterAll(async () => {
    // Clean up sample CSV files
    const fs = require('fs');
    if (sampleStandardCsvPath) fs.unlinkSync(sampleStandardCsvPath);
    if (sampleGtuCsvPath) fs.unlinkSync(sampleGtuCsvPath);
    await page.close();
  });

  test('should navigate to results import page and import standard CSV', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results/import`);
    await expect(page.getByRole('heading', { name: /import student results/i })).toBeVisible();

    // Standard Import
    await page.getByLabel('Examination Type', { exact: true }).click();
    await page.getByRole('option', { name: /mid semester 1/i }).click();
    await page.getByLabel('Academic Year', { exact: true }).fill('2023-24');
    await page.getByLabel(/standard results csv file/i).setInputFiles(sampleStandardCsvPath);
    await page.getByRole('button', { name: /import standard results/i }).click();
    
    await expect(page.getByText(/import successful/i, { exact: false })).toBeVisible({timeout: 15000});
    // More specific assertion if possible, e.g., "1 results imported"
  });

  test('should import GTU CSV results', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results/import`);
    await page.getByLabel(/gtu results csv file/i).setInputFiles(sampleGtuCsvPath);
    await page.getByRole('button', { name: /import gtu results/i }).click();

    await expect(page.getByText(/gtu import successful/i, { exact: false })).toBeVisible({timeout: 15000});
    // More specific assertion if possible
  });

  test('should navigate to results view page and display results', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    await expect(page.getByRole('heading', { name: /result management/i })).toBeVisible();

    // Check if table shows some data (e.g., the imported student "DOE JOHN MICHAEL")
    await expect(page.getByText(/doe john michael/i, { exact: false })).toBeVisible({timeout: 10000});
    await expect(page.getByText('220010107001')).toBeVisible();
  });

  test('should filter results', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    
    // Example: Filter by branch name if multiple branches exist
    await page.getByLabel(/branch/i).fill('Computer Engineering');
    await page.getByRole('button', { name: /apply filters/i }).click();
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Ensure only "Computer Engineering" results are shown (or that other branches are hidden)
    // This requires knowing other data; for now, just check if the current student is still visible
    await expect(page.getByText(/doe john michael/i, { exact: false })).toBeVisible();

    // Clear filter
    await page.getByLabel(/branch/i).fill('');
    await page.getByRole('button', { name: /apply filters/i }).click();
    await page.waitForTimeout(500);
  });

  test('should navigate to branch analysis and view data', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    await page.getByRole('button', { name: /branch analysis/i }).click(); // Assuming a tab button

    // Check for analysis table headers
    await expect(page.getByText(/branch/i, { exact: false })).toBeVisible();
    await expect(page.getByText(/pass %/i)).toBeVisible();
    await expect(page.getByText(/avg. spi/i)).toBeVisible();
    // Check for some data, e.g., "Computer Engineering" in the analysis
    await expect(page.getByText(/computer engineering/i, { exact: false })).toBeVisible({timeout:10000});
  });

  test('should view upload batches and attempt to delete a batch', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    await page.getByRole('button', { name: /upload batches/i }).click(); // Assuming a tab button

    // Check if at least one batch is listed
    const batchRows = page.locator('ul > li:has-text("results")'); // Generic selector for list items
    await expect(batchRows.first()).toBeVisible({timeout:10000});

    // Try to delete the first batch (assuming it's a test batch that can be deleted)
    // This is risky if it deletes critical data, ideally use a specific test batch ID
    const firstBatchDeleteButton = batchRows.first().getByRole('button', { name: /delete batch/i });
    if (await firstBatchDeleteButton.isVisible()) {
        await firstBatchDeleteButton.click();
        await page.getByRole('button', { name: 'Delete', exact: true }).click(); // Confirm in dialog
        await expect(page.getByText(/batch deleted/i)).toBeVisible({timeout:10000});
    } else {
        console.warn("Could not find a delete button for an upload batch. Skipping deletion test.");
    }
  });
});
