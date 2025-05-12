import { test, expect, Page } from '@playwright/test';

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

test.describe('Student Portal', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsStudent(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should display student dashboard with relevant cards', async () => {
    await page.goto(`${APP_BASE_URL}/dashboard`);
    await expect(page.getByText(`Welcome to your Dashboard, ${studentUser.name}!`)).toBeVisible();
    await expect(page.getByText('My Courses')).toBeVisible();
    await expect(page.getByText('Upcoming Assignments')).toBeVisible();
    await expect(page.getByText('Latest Grades')).toBeVisible();
  });

  test('should navigate to My Profile page and display profile info', async () => {
    await page.goto(`${APP_BASE_URL}/student/profile`);
    await expect(page.getByRole('heading', { name: studentUser.name })).toBeVisible();
    await expect(page.getByText(studentUser.email, {exact: false})).toBeVisible(); // Check for personal or institute email
    await expect(page.getByText(studentUser.email.split('@')[0])).toBeVisible(); // Enrollment number
  });

  test('should navigate to My Timetable page', async () => {
    await page.goto(`${APP_BASE_URL}/student/timetable`);
    await expect(page.getByRole('heading', { name: /my timetable/i })).toBeVisible();
    // Further checks can be added if timetable data is predictable or mockable
    // For now, just checking if the page loads
    await expect(page.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/i)).toBeVisible();
  });

  test('should navigate to My Attendance page', async () => {
    await page.goto(`${APP_BASE_URL}/student/attendance`);
    await expect(page.getByRole('heading', { name: /my attendance/i })).toBeVisible();
    // Check for filter or summary elements
    await expect(page.getByText(/filter by course/i)).toBeVisible();
  });

  test('should navigate to My Courses page', async () => {
    await page.goto(`${APP_BASE_URL}/student/courses`);
    await expect(page.getByRole('heading', { name: /my courses/i })).toBeVisible();
    // Check for list of courses
    // This depends on actual data, if "Intro to Programming" is an enrolled course for the test student:
    // await expect(page.getByText(/Intro to Programming/i)).toBeVisible(); 
  });
  
  test('should navigate to Assignments page', async () => {
    await page.goto(`${APP_BASE_URL}/student/assignments`);
    await expect(page.getByRole('heading', { name: /my assignments/i })).toBeVisible();
    // Check for assignment list elements
    // Example: await expect(page.getByText(/Quiz 1/i)).toBeVisible();
  });

  test('should navigate to My Results page', async () => {
    await page.goto(`${APP_BASE_URL}/student/results`);
    await expect(page.getByRole('heading', { name: /my academic results/i })).toBeVisible();
    // Check for semester-wise results
    await expect(page.getByText(/semester 1 results/i, {exact: false})).toBeVisible();
  });
  
  test('should navigate to Study Materials page', async () => {
    await page.goto(`${APP_BASE_URL}/student/materials`);
    await expect(page.getByRole('heading', { name: /study materials/i })).toBeVisible();
    // Check for accordion or list of materials
    // Example: await expect(page.getByText(/Intro to Programming Materials/i)).toBeVisible();
  });

  test('should navigate to My Project page (Project Fair)', async () => {
    await page.goto(`${APP_BASE_URL}/project-fair/student`);
    await expect(page.getByRole('heading', { name: /my projects/i })).toBeVisible();
    // Check for project registration button or project list
  });

});
