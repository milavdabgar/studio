const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('1. Going to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Getting available roles...');
    const roles = await page.locator('select option').allTextContents();
    console.log('Available roles:', roles);
    
    console.log('3. Filling in faculty credentials...');
    await page.getByLabel(/email/i).fill('faculty@gppalanpur.in');
    console.log('Email filled');
    
    await page.getByLabel(/password/i).fill('Faculty@123');
    console.log('Password filled');
    
    console.log('4. Clicking role dropdown...');
    await page.getByLabel(/login as/i).click();
    await page.waitForTimeout(500);
    
    console.log('5. Getting role options...');
    const roleOptions = await page.locator('[role="option"]').allTextContents();
    console.log('Role options:', roleOptions);
    
    console.log('6. Selecting Faculty role...');
    await page.getByRole('option', { name: 'Faculty', exact: true }).click();
    console.log('Faculty role selected');
    
    console.log('7. Clicking login button...');
    await page.getByRole('button', { name: /login/i }).click();
    
    console.log('8. Waiting for response...');
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    
    // Check for toast messages
    const toasts = await page.locator('[role="status"], .toast, .alert').allTextContents();
    console.log('Toast messages:', toasts);
    
    const pageContent = await page.locator('body').textContent();
    if (pageContent.includes('Welcome back')) {
      console.log('Login successful message found');
    } else if (pageContent.includes('Login Failed')) {
      console.log('Login failed message found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();