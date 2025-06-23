import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs'; // Import fs for file operations
import os from 'os'; // Import os for temp directory

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

// Helper function to create a dummy CSV file for upload
const createDummyCsvFile = (content: string, fileName: string): string => {
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

    const gtuCsvContent = `St_Id,MAP_NUMBER,extype,examid,exam,DECLARATIONDATE,AcademicYear,sem,UNIT_NO,EXAMNUMBER,name,instcode,instName,CourseName,BR_CODE,BR_NAME,SUB1,SUB1NA,SUB1CR,SUB1GR,SUB1GRE,SUB1GRM,SUB1GRTH,SUB1GRI,SUB1GRV,SUB1GRPR,SPI,CPI,CGPA,RESULT,TRIAL,REMARK,CURBACKL,TOTBACKL\n220010107001,220010107001,REGULAR,12345,WINTER 2023,2024-01-15,2023-24,1,1,1,DOE JOHN MICHAEL,001,GPP,DIPLOMA IN COMPUTER ENGINEERING,CE,Computer Engineering,CS101,Programming,4,AA,AA,AA,AA,AA,AA,AA,9.5,9.5,9.5,PASS,1,,0,0`;
    sampleGtuCsvPath = createDummyCsvFile(gtuCsvContent, 'sample_gtu_results_import.csv');
  });

  test.afterAll(async () => {
    // Clean up sample CSV files
    if (sampleStandardCsvPath && fs.existsSync(sampleStandardCsvPath)) fs.unlinkSync(sampleStandardCsvPath);
    if (sampleGtuCsvPath && fs.existsSync(sampleGtuCsvPath)) fs.unlinkSync(sampleGtuCsvPath);
    await page.close();
  });

  test('should navigate to results import page and import standard CSV', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results/import`);
    await expect(page.getByRole('heading', { name: /import student results/i })).toBeVisible();

    // Standard Import
    const examTypeSelect = page.locator('form').getByLabel('Examination Type *');
    await examTypeSelect.click();
    await page.getByRole('option', { name: /mid semester 1/i }).click();
    
    await page.getByLabel('Academic Year *').fill('2023-24');
    
    await page.getByLabel(/standard results csv file/i).setInputFiles(sampleStandardCsvPath);
    await page.getByRole('button', { name: /import standard results/i }).click();
    
    await expect(page.getByText(/results imported from standard csv/i, { exact: false })).toBeVisible({timeout: 15000});
  });

  test('should import GTU CSV results', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results/import`);
    await page.getByLabel(/gtu results csv file/i).setInputFiles(sampleGtuCsvPath);
    await page.getByRole('button', { name: /import gtu results/i }).click();

    await expect(page.getByText(/gtu results imported successfully/i, { exact: false })).toBeVisible({timeout: 15000});
  });

  test('should navigate to results view page and display results', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`); 
    await expect(page.getByRole('heading', { name: /result management/i })).toBeVisible();
    
    // Click on the "Results" tab if not already active
    const resultsTabButton = page.getByRole('tab', { name: /results/i, exact: true }); // ShadCN tabs use role="tab"
    if (await resultsTabButton.isVisible()) {
        if((await resultsTabButton.getAttribute('aria-selected')) !== 'true') {
            await resultsTabButton.click();
        }
    }
    await expect(page.getByText(/doe john michael/i, { exact: false })).toBeVisible({timeout: 10000});
    await expect(page.getByText('220010107001')).toBeVisible();
  });

  test('should filter results', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    
    const resultsTabButton = page.getByRole('tab', { name: /results/i, exact: true });
    if (await resultsTabButton.isVisible()) {
         if((await resultsTabButton.getAttribute('aria-selected')) !== 'true') {
            await resultsTabButton.click();
        }
    }
    
    await page.getByLabel(/branch/i).fill('Computer Engineering');
    await page.getByRole('button', { name: /apply filters/i }).click();
    await page.waitForTimeout(500); // Wait for potential re-render
    
    await expect(page.getByText(/doe john michael/i, { exact: false })).toBeVisible();

    await page.getByLabel(/branch/i).fill(''); // Clear filter
    await page.getByRole('button', { name: /apply filters/i }).click();
    await page.waitForTimeout(500);
  });

  test('should navigate to branch analysis and view data', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    const analysisTabButton = page.getByRole('tab', { name: /branch analysis/i }); // ShadCN tabs use role="tab"
    if(await analysisTabButton.isVisible()){
        await analysisTabButton.click();
    } else {
        test.skip(true, "Branch Analysis tab not found");
    }

    await expect(page.getByText(/branch/i, { exact: false })).toBeVisible();
    await expect(page.getByText(/pass %/i)).toBeVisible();
    await expect(page.getByText(/avg. spi/i)).toBeVisible();
    await expect(page.getByText(/computer engineering/i, { exact: false })).toBeVisible({timeout:10000});
  });

  test('should view upload batches and attempt to delete a batch', async () => {
    await page.goto(`${APP_BASE_URL}/admin/results`);
    const batchesTabButton = page.getByRole('tab', { name: /upload batches/i }); // ShadCN tabs use role="tab"
     if(await batchesTabButton.isVisible()){
        await batchesTabButton.click();
    } else {
        test.skip(true, "Upload Batches tab not found");
    }


    const batchListItems = page.locator('ul > li'); // Adjust selector if needed for the list of batches
    await expect(batchListItems.first()).toBeVisible({timeout:10000});

    const firstBatchDeleteButton = batchListItems.first().getByRole('button', { name: /delete batch/i });
    if (await firstBatchDeleteButton.isVisible()) {
        await firstBatchDeleteButton.click();
        
        // Handle confirmation dialog (assuming ShadCN Dialog)
        const confirmDialog = page.locator('div[role="dialog"]');
        await expect(confirmDialog).toBeVisible({timeout: 5000});
        const confirmDeleteButton = confirmDialog.getByRole('button', { name: 'Delete', exact: true });
        
        if (await confirmDeleteButton.isVisible({timeout: 2000})) {
            await confirmDeleteButton.click();
            await expect(page.getByText(/batch deleted/i, {exact: false})).toBeVisible({timeout:10000});
        } else {
            console.warn("Confirmation dialog for batch deletion not found or behavior changed.");
        }
    } else {
        console.warn("Could not find a delete button for an upload batch. Skipping deletion test.");
    }
  });
});
