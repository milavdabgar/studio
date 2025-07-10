const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Going to login page...');
    await page.goto('http://localhost:3000/login');
    
    console.log('2. Filling in faculty credentials...');
    await page.getByLabel(/email/i).fill('faculty@gppalanpur.in');
    await page.getByLabel(/password/i).fill('Faculty@123');
    await page.getByLabel(/login as/i).click();
    await page.getByRole('option', { name: 'Faculty', exact: true }).click();
    await page.getByRole('button', { name: /login/i }).click();
    
    console.log('3. Waiting for login to complete...');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after login:', page.url());
    
    console.log('4. Going to faculty page...');
    await page.goto('http://localhost:3000/faculty');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after faculty nav:', page.url());
    
    console.log('5. Getting page content...');
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const mainContent = await page.locator('main, body').first().textContent();
    console.log('Main content preview:', mainContent?.substring(0, 500));
    
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Headings found:', headings);
    
    const navItems = await page.locator('nav a, .sidebar a, .faculty-nav a').allTextContents();
    console.log('Nav items found:', navItems);
    
    // Check for faculty-specific elements
    const hasFacultyAccess = await page.locator('h1:has-text("Faculty"), h1:has-text("Dashboard"), .faculty-dashboard').isVisible();
    console.log('Has faculty access elements:', hasFacultyAccess);
    
    const needsLogin = await page.locator('text=Login, text=Sign in').first().isVisible();
    console.log('Needs login:', needsLogin);
    
    const accessDenied = await page.locator('text=Access denied, text=Unauthorized').first().isVisible();
    console.log('Access denied:', accessDenied);
    
    console.log('6. Checking specific faculty menu items...');
    const facultyMenuItems = await Promise.all([
      page.locator('text=My Courses').first().isVisible().catch(() => false),
      page.locator('text=Timetable').first().isVisible().catch(() => false),
      page.locator('text=Assessments').first().isVisible().catch(() => false),
      page.locator('text=Profile').first().isVisible().catch(() => false)
    ]);
    console.log('Faculty menu items visibility:', facultyMenuItems);
    
    await page.screenshot({ path: 'faculty-debug.png', fullPage: true });
    console.log('Screenshot saved as faculty-debug.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();