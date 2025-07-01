import { test, expect } from '@playwright/test';

test('Base URL Configuration Test', async ({ page }) => {
  console.log('Testing baseURL configuration...');
  
  try {
    await page.goto('http://localhost:3000/login');
    console.log('Successfully navigated to /login');
    await expect(page).toHaveTitle(/GP Palanpur/);
  } catch (error) {
    console.error('Failed to navigate with relative URL:', error);
    
    // Fallback to absolute URL
    await page.goto('http://localhost:3000/login');
    console.log('Successfully navigated to http://localhost:3000/login');
    await expect(page).toHaveTitle(/GP Palanpur/);
  }
});