import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Tests
 * Donavon's Scope: Contact, Login, Payment, Policy, Registration, Protected Routes
 */
export default defineConfig({
  testDir: './playwright/e2e',
  
  // Test timeout (30 seconds per test)
  timeout: 30000,
  
  // Retry failed tests (no retries locally, 2 in CI)
  retries: process.env.CI ? 2 : 0,
  
  // Run tests in parallel
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  use: {
    // Base URL for the app
    baseURL: 'http://localhost:3000',
    
    // Screenshots on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Action timeout
    actionTimeout: 10000,
  },
  
  // Test against different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile testing
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
  
  // Web server configuration (auto-start server before tests)
  // webServer: {
  //   command: 'npm start',
  //   port: 3000,
  //   timeout: 120000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
