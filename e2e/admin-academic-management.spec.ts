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

test.describe('Admin Academic Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // --- Batch Management ---
  test.describe('Batch Management', () => {
    let createdBatchName: string = '';

    test('should navigate to batches page and create a new batch', async () => {
      await page.goto(`${APP_BASE_URL}/admin/batches`);
      await expect(page.getByRole('heading', { name: /batch management/i })).toBeVisible();

      createdBatchName = `E2E Batch ${Date.now().toString().slice(-4)}`;
      
      await page.getByRole('button', { name: /add new batch/i }).click();
      await page.getByLabel(/batch name/i).fill(createdBatchName);
      
      // Select a program - assuming 'Test Program' or the first one is available.
      // The selector `label:has-text("Program") + div select` is an example, adjust if needed.
      const programSelect = page.locator('form').getByLabel(/program/i);
      await programSelect.click();
      await page.getByRole('option').first().click(); // Select the first available program

      await page.getByLabel(/start academic year/i).fill('2024');
      await page.getByLabel(/end academic year/i).fill('2027');
      await page.getByLabel(/max intake/i).fill('60');

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /upcoming/i }).click();
      
      await page.getByRole('button', { name: /create batch/i }).click();
      await expect(page.getByText(/batch created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdBatchName)).toBeVisible();
    });

    test('should delete the created batch', async () => {
      test.skip(!createdBatchName, 'Skipping delete batch test as no batch name available');
      await page.goto(`${APP_BASE_URL}/admin/batches`);
      const batchRow = page.locator(`tr:has-text("${createdBatchName}")`).first();
      await expect(batchRow).toBeVisible();
      await batchRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/batch deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(batchRow).not.toBeVisible();
      createdBatchName = '';
    });
  });

  // --- Course Management ---
  test.describe('Course Management', () => {
    let createdCourseSubcode: string = '';

    test('should navigate to courses page and create a new course', async () => {
      await page.goto(`${APP_BASE_URL}/admin/courses`);
      await expect(page.getByRole('heading', { name: /course management/i })).toBeVisible();

      createdCourseSubcode = `E2ECRS${Date.now().toString().slice(-4)}`;
      const courseName = `E2E Test Course ${createdCourseSubcode}`;

      await page.getByRole('button', { name: /add new course/i }).click();
      await page.getByLabel(/subject code/i).fill(createdCourseSubcode);
      await page.getByLabel(/subject name/i).fill(courseName);
      
      // Select Department
      const departmentSelect = page.locator('form').getByLabel(/department/i);
      await departmentSelect.click();
      await page.getByRole('option', { name: /computer engineering/i }).click(); // Assuming this exists

      // Select Program (should be filtered by department or allow selection)
      const programSelect = page.locator('form').getByLabel(/program/i).first();
      await programSelect.click();
      await page.getByRole('option').first().click(); // Select first available program

      await page.getByLabel(/semester/i, { exact: true }).fill('1');
      await page.getByLabel(/lecture/i).fill('3');
      await page.getByLabel(/theory ese/i).fill('70');
      await page.getByRole('button', { name: /create course/i }).click();

      await expect(page.getByText(/course created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(courseName)).toBeVisible();
    });

    test('should delete the created course', async () => {
      test.skip(!createdCourseSubcode, 'Skipping delete course test as no course subcode available');
      await page.goto(`${APP_BASE_URL}/admin/courses`);
      const courseRow = page.locator(`tr:has-text("${createdCourseSubcode}")`).first();
      await expect(courseRow).toBeVisible();
      await courseRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/course deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(courseRow).not.toBeVisible();
      createdCourseSubcode = '';
    });
  });

  // --- Curriculum Management ---
  test.describe('Curriculum Management', () => {
    let createdCurriculumVersion: string = '';

    test('should navigate to curriculum page and create a new curriculum', async () => {
      await page.goto(`${APP_BASE_URL}/admin/curriculum`);
      await expect(page.getByRole('heading', { name: /curriculum management/i })).toBeVisible();
      
      createdCurriculumVersion = `V_E2E_${Date.now().toString().slice(-4)}`;

      await page.getByRole('button', { name: /new curriculum/i }).click();
      
      // Select Program
      const programSelect = page.locator('form').getByLabel(/program/i).first();
      await programSelect.click();
      await page.getByRole('option').first().click();

      await page.getByLabel(/version/i).fill(createdCurriculumVersion);
      await page.getByLabel(/effective date/i).click(); // Open calendar
      await page.getByRole('gridcell', { name: '15' }).first().click(); // Select 15th of current month

      await page.getByLabel(/status/i).click();
      await page.getByRole('option', { name: /draft/i }).click();
      
      // Add a course to the curriculum (simplified)
      const courseSelect = page.locator('form').getByLabel('Course', { exact: true }); // Assuming label 'Course'
      await courseSelect.click();
      await page.getByRole('option').first().click(); // Select first available course
      await page.getByLabel('Semester', { exact: true }).fill('1'); // Assuming label 'Semester'
      await page.getByRole('button', { name: /add course/i }).click();

      await page.getByRole('button', { name: /create curriculum/i }).click();

      await expect(page.getByText(/curriculum created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(new RegExp(createdCurriculumVersion, "i"))).toBeVisible();
    });

    test('should delete the created curriculum', async () => {
      test.skip(!createdCurriculumVersion, 'Skipping delete curriculum test as no version available');
      await page.goto(`${APP_BASE_URL}/admin/curriculum`);
      // This selector might need adjustment based on how version is displayed
      const curriculumRow = page.locator(`tr:has-text("${createdCurriculumVersion}")`).first(); 
      await expect(curriculumRow).toBeVisible();
      await curriculumRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/curriculum deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(curriculumRow).not.toBeVisible();
      createdCurriculumVersion = '';
    });
  });

  // --- Assessment Management ---
  test.describe('Assessment Management', () => {
    let createdAssessmentName: string = '';

    test('should navigate to assessments page and create a new assessment', async () => {
      await page.goto(`${APP_BASE_URL}/admin/assessments`);
      await expect(page.getByRole('heading', { name: /assessment management/i })).toBeVisible();

      createdAssessmentName = `E2E Assessment ${Date.now().toString().slice(-4)}`;

      await page.getByRole('button', { name: /add new assessment/i }).click();
      await page.getByLabel(/assessment name/i).fill(createdAssessmentName);

      // Select Course
      const courseSelect = page.locator('form').getByLabel('Course', { exact: true });
      await courseSelect.click();
      await page.getByRole('option').first().click(); // Select first course

      // Program should auto-fill or be selectable

      await page.getByLabel('Type', { exact: true }).click();
      await page.getByRole('option', { name: /quiz/i }).click();

      await page.getByLabel(/max marks/i).fill('25');
      
      await page.getByLabel('Status', { exact: true }).click();
      await page.getByRole('option', { name: /draft/i }).click();

      await page.getByRole('button', { name: /create assessment/i }).click();

      await expect(page.getByText(/assessment created/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(page.getByText(createdAssessmentName)).toBeVisible();
    });

    test('should delete the created assessment', async () => {
      test.skip(!createdAssessmentName, 'Skipping delete assessment test as no name available');
      await page.goto(`${APP_BASE_URL}/admin/assessments`);
      const assessmentRow = page.locator(`tr:has-text("${createdAssessmentName}")`).first();
      await expect(assessmentRow).toBeVisible();
      await assessmentRow.getByRole('button', { name: /delete/i }).click();
      
      await expect(page.getByText(/assessment deleted/i, { exact: false })).toBeVisible({timeout: 10000});
      await expect(assessmentRow).not.toBeVisible();
      createdAssessmentName = '';
    });
  });
});
