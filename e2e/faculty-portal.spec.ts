import { test, expect, Page } from '@playwright/test';

const APP_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:9003';

const facultyUser = {
  email: 'faculty.cs01@gppalanpur.ac.in', 
  password: 'Password@123', 
  role: 'faculty',
  name: 'Prof. CS01 FACULTY' 
};

async function loginAsFaculty(page: Page) {
  await page.goto(`${APP_BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill(facultyUser.email);
  await page.getByLabel(/Password/i).fill(facultyUser.password);
  await page.getByLabel(/Login as/i).click();
  await page.getByRole('option', { name: /faculty/i }).click();
  await page.getByRole('button', { name: /Login|Sign In/i }).click();
  await expect(page).toHaveURL(`${APP_BASE_URL}/dashboard`, {timeout: 15000});
}

test.describe('Faculty Portal Detailed Functionality', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsFaculty(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should mark attendance for a course', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/attendance/mark`);
    await expect(page.getByRole('heading', { name: /mark attendance/i })).toBeVisible();

    // Select Course Offering (assuming first one is available and has students)
    const courseOfferingSelect = page.getByLabel(/course offering/i);
    await courseOfferingSelect.click();
    await page.getByRole('option').first().click(); // Select first available option

    // Select Date (assuming today or a valid date)
    // This might need interaction with a date picker component
    await page.getByLabel(/date/i).click(); // Open calendar
    // For simplicity, let's assume today's date is fine or a default is set.
    // If specific date selection is needed: await page.getByRole('gridcell', { name: '15' }).first().click();

    // Wait for students to load (adjust timeout if necessary)
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const studentRows = await page.locator('table tbody tr').count();
    expect(studentRows).toBeGreaterThan(0);

    // Mark first student as 'absent' (example)
    const firstStudentRow = page.locator('table tbody tr').first();
    await firstStudentRow.getByLabel(/absent/i).check(); 

    await page.getByRole('button', { name: /save attendance/i }).click();
    await expect(page.getByText(/attendance marked successfully/i, { exact: false })).toBeVisible({timeout: 10000});
  });
  
  test('should grade an assessment', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/assessments/grade`);
    await expect(page.getByRole('heading', { name: /grade assessments/i })).toBeVisible();

    // Select Course Offering
    const courseOfferingSelect = page.getByLabel(/course offering/i);
    await courseOfferingSelect.click();
    await page.getByRole('option').first().click();
    
    // Select Assessment (options should filter based on course offering)
    const assessmentSelect = page.getByLabel(/assessment/i);
    await assessmentSelect.click();
    await page.getByRole('option').first().click(); // Select first available assessment

    // Wait for students to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const studentRows = await page.locator('table tbody tr').count();
    expect(studentRows).toBeGreaterThan(0);

    // Enter score for the first student (example)
    const firstStudentRow = page.locator('table tbody tr').first();
    await firstStudentRow.getByLabel(/score/i).fill('85'); // Assuming input has aria-label "Score" or similar
    // Or by placeholder: await firstStudentRow.getByPlaceholder(/Enter score/i).fill('85');

    await page.getByRole('button', { name: /save grades/i }).click();
    await expect(page.getByText(/grades saved successfully/i, { exact: false })).toBeVisible({timeout: 10000});
  });
  
  test('should evaluate a project (as Jury)', async () => {
    // Navigate to Project Fair Jury section (this assumes faculty also has jury access or specific route)
    // The actual navigation might be more complex, e.g., through a project fair event dashboard
    await page.goto(`${APP_BASE_URL}/project-fair/jury`); 
    
    // Wait for projects to load if this is a list view
    // For example, expect a heading indicating the jury evaluation page:
    await expect(page.getByRole('heading', { name: /project evaluation/i })).toBeVisible();
    
    // Find a project to evaluate (assuming a list/table of projects)
    // This selector is highly dependent on the UI
    const projectToEvaluateLink = page.locator('table tbody tr a:has-text("Evaluate"), table tbody tr button:has-text("Evaluate")').first();
    if (await projectToEvaluateLink.count() === 0) {
        console.warn("No projects found to evaluate in Jury section. Skipping test.");
        test.skip();
        return;
    }
    await projectToEvaluateLink.click();

    // Now on the specific project evaluation page
    await expect(page.getByRole('heading', { name: /evaluate project/i })).toBeVisible();

    // Fill evaluation criteria (highly dependent on form structure)
    // Example:
    await page.getByLabel(/innovation & originality/i).fill('18'); // Assuming range input or text input
    await page.getByLabel(/technical excellence/i).fill('17');
    // ... fill other criteria ...
    await page.getByLabel(/comments & feedback/i).fill('Good effort, well-implemented innovative idea.');

    await page.getByRole('button', { name: /submit evaluation/i }).click();
    await expect(page.getByText(/evaluation submitted successfully/i, { exact: false })).toBeVisible({timeout: 10000});
  });
});
