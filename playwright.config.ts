
import { defineConfig, devices } from '@playwright/test';

// Read environment variables from file.
// https://github.com/motdotla/dotenv
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0, // Reduced retries for faster local feedback if needed
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined, // Allow some parallelism on CI
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:9003',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    // Increase default action timeout
    actionTimeout: 10 * 1000, // 10 seconds
    // Increase default navigation timeout
    navigationTimeout: 30 * 1000, // 30 seconds
  },
  // Increase global test timeout
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for expect assertions
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev', // Ensure this command starts your Next.js dev server
    url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:9003',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // Increased to 3 minutes for server to start, especially with Turbopack
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
        NODE_ENV: 'development', // Or 'test' if you have specific test environment settings
    }
  },
});

