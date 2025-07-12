import { test, expect } from '@playwright/test';
import { loginAsAdmin, fillForm, submitForm, waitForPageLoad } from './test-helpers';

/**
 * Critical Admin Sub-Routes Tests - MongoDB Migration Priority
 * Priority: HIGH - These routes handle core data management affected by MongoDB migration
 * 
 * Tests all admin sub-routes that manage entities stored in-memory and need MongoDB migration
 */

test.describe('Critical Admin Sub-Routes - MongoDB Migration Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin for all tests
    await loginAsAdmin(page);
  });

  test('should access admin batches management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/batches');
    
    // Verify page loads correctly
    await expect(page.getByRole('heading', { name: 'Batch Management' })).toBeVisible({ timeout: 10000 });
    
    // Verify key elements exist
    await expect(page.locator('text=Add')).toBeVisible();
    
    // Test batch creation form
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      // Verify form fields
      await page.waitForSelector('#name', { timeout: 10000 });
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#programId')).toBeVisible();
      await expect(page.locator('#startAcademicYear')).toBeVisible();
      
      // Test form submission
      await page.fill('#name', 'Test Batch 2024');
      await page.fill('#startAcademicYear', '2024');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show success or redirect
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin buildings management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/buildings');
    
    await expect(page.getByRole('heading', { name: 'Building Management' })).toBeVisible({ timeout: 10000 });
    
    // Test building creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#name', { timeout: 10000 });
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#code')).toBeVisible();
      
      await page.fill('#name', 'Test Building');
      await page.fill('#code', 'TB001');
      
      // Submit form - look for submit button
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin curriculum management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/curriculum');
    
    await expect(page.getByRole('heading', { name: 'Curriculum Management' })).toBeVisible({ timeout: 10000 });
    
    // Test curriculum creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#curriculumName', { timeout: 10000 });
      await expect(page.locator('#curriculumName')).toBeVisible();
      await expect(page.locator('#programId')).toBeVisible();
      
      await page.fill('#curriculumName', 'Test Curriculum');
      await page.fill('#version', '1.0');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin departments management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/departments');
    
    await expect(page.getByRole('heading', { name: 'Department Management' })).toBeVisible({ timeout: 10000 });
    
    // Test department creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#deptName', { timeout: 10000 });
      await expect(page.locator('#deptName')).toBeVisible();
      await expect(page.locator('#deptCode')).toBeVisible();
      
      await page.fill('#deptName', 'Test Department');
      await page.fill('#deptCode', 'TD');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin institutes management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/institutes');
    
    await expect(page.getByRole('heading', { name: 'Institute Management' })).toBeVisible({ timeout: 10000 });
    
    // Test institute creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#name', { timeout: 10000 });
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#code')).toBeVisible();
      
      await page.fill('#name', 'Test Institute');
      await page.fill('#code', 'TI');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin programs management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/programs');
    
    await expect(page.getByRole('heading', { name: 'Program Management' })).toBeVisible({ timeout: 10000 });
    
    // Test program creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#progName', { timeout: 10000 });
      await expect(page.locator('#progName')).toBeVisible();
      await expect(page.locator('#progCode')).toBeVisible();
      
      await page.fill('#progName', 'Test Program');
      await page.fill('#progCode', 'TP');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin roles management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/roles');
    
    await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible({ timeout: 10000 });
    
    // Test role creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#roleName', { timeout: 10000 });
      await expect(page.locator('#roleName')).toBeVisible();
      
      await page.fill('#roleName', 'Test Role');
      await page.fill('#description', 'Test role description');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin assignments management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/assignments');
    
    await expect(page.getByRole('heading', { name: 'Assignment Management' })).toBeVisible({ timeout: 10000 });
    
    // Test assignment creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#title', { timeout: 10000 });
      await expect(page.locator('#title')).toBeVisible();
      await expect(page.locator('#courseId')).toBeVisible();
      
      await page.fill('#title', 'Test Assignment');
      await page.fill('#description', 'Test assignment description');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin courses management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/courses');
    
    await expect(page.getByRole('heading', { name: 'Course Management' })).toBeVisible({ timeout: 10000 });
    
    // Test course creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#courseName', { timeout: 10000 });
      await expect(page.locator('#courseName')).toBeVisible();
      await expect(page.locator('#courseCode')).toBeVisible();
      
      await page.fill('#courseName', 'Test Course');
      await page.fill('#courseCode', 'TC001');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin enrollments management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/enrollments');
    
    await expect(page.getByRole('heading', { name: 'Enrollment Management' })).toBeVisible({ timeout: 10000 });
    
    // Test enrollment creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#studentId', { timeout: 10000 });
      await expect(page.locator('#studentId')).toBeVisible();
      await expect(page.locator('#courseOfferingId')).toBeVisible();
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin rooms management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/rooms');
    
    await expect(page.getByRole('heading', { name: 'Room Management' })).toBeVisible({ timeout: 10000 });
    
    // Test room creation
    const addButton = page.locator('button:has-text("Add"), a:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await page.waitForSelector('#roomNumber', { timeout: 10000 });
      await expect(page.locator('#roomNumber')).toBeVisible();
      await expect(page.locator('#buildingId')).toBeVisible();
      
      await page.fill('#roomNumber', 'R001');
      await page.fill('#capacity', '50');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should access admin leaves management', async ({ page }) => {
    await waitForPageLoad(page, '/admin/leaves');
    
    await expect(page.getByRole('heading', { name: 'Leave Management' })).toBeVisible({ timeout: 10000 });
    
    // Verify leave requests list or management interface
    const leaveElements = [
      'text=Leave Request',
      'text=Pending',
      'text=Approved',
      'text=Faculty',
      'text=Date',
      'text=Leave',
      'text=Management'
    ];
    
    // At least some leave-related elements should be visible
    let leaveElementFound = false;
    for (const element of leaveElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
        leaveElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(leaveElementFound).toBe(true);
  });

  test('should access admin faculty workload page', async ({ page }) => {
    await waitForPageLoad(page, '/admin/faculty-workload');
    
    await expect(page.getByText('Faculty Workload Overview')).toBeVisible({ timeout: 10000 });
    
    // Verify workload-related elements
    const workloadElements = [
      'text=Workload',
      'text=Faculty',
      'text=Courses',
      'text=Hours',
      'text=Load'
    ];
    
    let workloadElementFound = false;
    for (const element of workloadElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
        workloadElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(workloadElementFound).toBe(true);
  });

  test('should access admin resource allocation page', async ({ page }) => {
    await waitForPageLoad(page, '/admin/resource-allocation');
    
    await expect(page.getByText('Resource Allocation Management')).toBeVisible({ timeout: 10000 });
    
    // Verify resource allocation elements
    const resourceElements = [
      'text=Resource',
      'text=Allocation',
      'text=Room',
      'text=Faculty',
      'text=Time'
    ];
    
    let resourceElementFound = false;
    for (const element of resourceElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
        resourceElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(resourceElementFound).toBe(true);
  });

  test('should access admin resource allocation rooms page', async ({ page }) => {
    await waitForPageLoad(page, '/admin/resource-allocation/rooms');
    
    await expect(page.getByText('Room Allocation Management')).toBeVisible({ timeout: 10000 });
    
    // Verify room allocation specific elements
    const roomElements = [
      'text=Room Allocation',
      'text=Schedule',
      'text=Available',
      'text=Occupied',
      'text=Booking'
    ];
    
    let roomElementFound = false;
    for (const element of roomElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
        roomElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(roomElementFound).toBe(true);
  });

  test('should access admin reporting analytics page', async ({ page }) => {
    await waitForPageLoad(page, '/admin/reporting-analytics');
    
    await expect(page.getByText('Reporting & Analytics')).toBeVisible({ timeout: 10000 });
    
    // Verify analytics elements
    const analyticsElements = [
      'text=Analytics',
      'text=Report',
      'text=Statistics',
      'text=Chart',
      'text=Data'
    ];
    
    let analyticsElementFound = false;
    for (const element of analyticsElements) {
      try {
        await expect(page.locator(element)).toBeVisible({ timeout: 2000 });
        analyticsElementFound = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }
    
    expect(analyticsElementFound).toBe(true);
  });

  test('should handle admin navigation between sub-routes', async ({ page }) => {
    const routes = [
      '/admin/students',
      '/admin/faculty', 
      '/admin/batches',
      '/admin/courses',
      '/admin/programs'
    ];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Verify we're on the expected route
      expect(page.url()).toContain(route);
      
      // Verify page loads successfully (not redirected to login)
      expect(page.url()).not.toContain('/login');
    }
  });
});
