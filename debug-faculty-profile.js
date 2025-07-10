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
    
    console.log('2. Waiting for redirect...');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('Successfully redirected to:', page.url());
    
    console.log('3. Going to faculty profile...');
    await page.goto('http://localhost:3000/faculty/profile');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    
    console.log('4. Checking page content...');
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const mainContent = await page.locator('main, body').first().textContent();
    console.log('Main content preview:', mainContent?.substring(0, 500));
    
    // Check for error messages
    const errorMessages = await page.locator('.error, [role="alert"], .text-red-500').allTextContents();
    console.log('Error messages:', errorMessages);
    
    // Check for profile elements
    const hasCard = await page.locator('.card, .space-y-6').isVisible();
    console.log('Has card elements:', hasCard);
    
    const hasAvatar = await page.locator('.avatar, img').isVisible();
    console.log('Has avatar:', hasAvatar);
    
    const hasProfileText = await page.locator('text=Professor Dr. Faculty User').isVisible();
    console.log('Has profile name:', hasProfileText);
    
    const hasStaffCode = await page.locator('text=FAC001').isVisible();
    console.log('Has staff code:', hasStaffCode);
    
    await page.screenshot({ path: 'faculty-profile-debug.png', fullPage: true });
    console.log('Screenshot saved as faculty-profile-debug.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();