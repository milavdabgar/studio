const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Logging in as faculty...');
    await page.goto('http://localhost:3000/login');
    await page.getByLabel(/email/i).fill('faculty@gppalanpur.in');
    await page.getByLabel(/password/i).fill('Faculty@123');
    await page.getByLabel(/login as/i).click();
    await page.getByRole('option', { name: 'Faculty', exact: true }).click();
    await page.getByRole('button', { name: /login/i }).click();
    
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('At dashboard:', page.url());
    
    console.log('2. Trying to navigate to /faculty...');
    await page.goto('http://localhost:3000/faculty');
    await page.waitForTimeout(2000);
    console.log('After /faculty:', page.url());
    
    console.log('3. Now trying /faculty/profile directly...');
    await page.goto('http://localhost:3000/faculty/profile');
    await page.waitForTimeout(3000);
    console.log('After /faculty/profile:', page.url());
    
    // Check if there's any javascript redirect happening
    const pageContent = await page.locator('body').textContent();
    console.log('Page content includes "Redirecting":', pageContent.includes('Redirecting'));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();