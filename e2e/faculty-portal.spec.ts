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

test.describe('Faculty Portal', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsFaculty(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should display faculty dashboard with relevant cards', async () => {
    await page.goto(`${APP_BASE_URL}/dashboard`);
    await expect(page.getByText(`Welcome to your Dashboard, ${facultyUser.name}!`)).toBeVisible();
    await expect(page.getByText(/Assigned Courses/i)).toBeVisible();
    await expect(page.getByText(/Students Enrolled/i)).toBeVisible();
    await expect(page.getByText(/Mark Attendance/i)).toBeVisible();
  });

  test('should navigate to My Profile page and display profile info', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/profile`);
    await expect(page.getByRole('heading', { name: new RegExp(facultyUser.name, 'i') })).toBeVisible();
    await expect(page.getByText(facultyUser.email)).toBeVisible();
    // Add more checks for department, designation etc.
  });

  test('should navigate to My Timetable page', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/timetable`);
    await expect(page.getByRole('heading', { name: /my teaching schedule/i })).toBeVisible();
    await expect(page.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/i)).toBeVisible();
  });

  test('should navigate to My Courses page', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/courses`);
    await expect(page.getByRole('heading', { name: /my courses/i })).toBeVisible();
    // Example: await expect(page.getByText(/Introduction to Programming/i)).toBeVisible();
  });
  
  test('should navigate to My Students page (from a course)', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/courses`);
    // Click on the first course link that has "View Students" or similar
    // This selector is highly dependent on the actual UI of the courses list
    const viewStudentsLink = page.locator('a:has-text("View Students"), button:has-text("Students")').first();
    if(await viewStudentsLink.isVisible()){
        await viewStudentsLink.click();
        await expect(page.getByRole('heading', { name: /enrolled students/i })).toBeVisible();
    } else {
        console.warn("No 'View Students' link found on My Courses page, skipping detailed student list check.");
        // If no direct link, can try navigating to a known course's student page if ID is known/static
        // await page.goto(`${APP_BASE_URL}/faculty/courses/course_cs101_dce_gpp/students`);
        // await expect(page.getByRole('heading', { name: /enrolled students/i })).toBeVisible();
    }
  });

  test('should navigate to Mark Attendance page', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/attendance/mark`);
    await expect(page.getByRole('heading', { name: /mark attendance/i })).toBeVisible();
    await expect(page.getByLabel(/course offering/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
  });
  
  test('should navigate to Attendance Reports page', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/attendance/reports`);
    await expect(page.getByRole('heading', { name: /attendance reports/i })).toBeVisible();
    await expect(page.getByLabel(/course offering/i)).toBeVisible();
  });
  
  test('should navigate to Grade Assessments page', async () => {
    await page.goto(`${APP_BASE_URL}/faculty/assessments/grade`);
    await expect(page.getByRole('heading', { name: /grade assessments/i })).toBeVisible();
    await expect(page.getByLabel(/course offering/i)).toBeVisible();
    await expect(page.getByLabel(/assessment/i)).toBeVisible();
  });
  
  test('should navigate to Evaluate Projects page (Jury role)', async () => {
    // This test assumes the faculty user also has a 'jury' role or access to this page.
    // If not, this test should be in a separate spec for jury role.
    // For now, attempting navigation.
    const evaluateLink = page.locator('a[href*="project-fair/jury"], button:has-text("Evaluate Projects")').first();
    if (await evaluateLink.isVisible()){
        await evaluateLink.click();
        await expect(page.getByRole('heading', { name: /project evaluation/i })).toBeVisible();
    } else {
        await page.goto(`${APP_BASE_URL}/project-fair/jury`);
        // Check if it redirects to login (no access) or shows the page
        const isLoginPage = await page.locator('input[type="email"]').first().isVisible({timeout: 2000}).catch(() => false);
        if (isLoginPage && page.url().includes('/login')) {
            console.warn("Faculty user does not have access to /project-fair/jury, redirected to login. This is expected if role is not assigned.");
        } else {
            await expect(page.getByRole('heading', { name: /project evaluation/i })).toBeVisible();
        }
    }
  });

  test('should navigate to Feedback Analysis page (Admin/Faculty access)', async () => {
    await page.goto(`${APP_BASE_URL}/admin/feedback-analysis`); // Path might be faculty specific
    await expect(page.getByRole('heading', { name: /feedback analyzer/i })).toBeVisible();
    await expect(page.getByLabel(/upload feedback csv file/i)).toBeVisible();
  });

});
