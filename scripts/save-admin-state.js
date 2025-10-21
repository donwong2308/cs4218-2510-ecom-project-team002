// One-time script to save an authenticated admin storage state for Playwright tests.
// Usage: node scripts/save-admin-state.js
// It will create file: playwright/.auth/adminAuth.json

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testhw2@gmail.com';
  const ADMIN_PASS = process.env.E2E_ADMIN_PASS || '123456';
  const outDir = 'playwright/.auth';
  const outFile = `${outDir}/adminAuth.json`;

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Opening login page:', BASE + '/login');
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button:has-text("LOGIN")');
    // wait for navigation or some logged-in indicator
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await context.storageState({ path: outFile });
    console.log('Saved admin storage state to', outFile);
  } catch (err) {
    console.error('Failed to save admin storage state:', err);
  } finally {
    await browser.close();
  }
})();
