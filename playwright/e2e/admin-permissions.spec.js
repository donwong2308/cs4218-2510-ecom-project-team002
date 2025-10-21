import { test, expect } from '@playwright/test';
import path from 'path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:6060';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'testhw2@gmail.com';
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? '123456';
// fallback regular user from existing suites
const USER_EMAIL = process.env.E2E_USER_EMAIL ?? 'test@test.com';
const USER_PASS = process.env.E2E_USER_PASS ?? 'test';
const TEST_IMAGE = path.resolve(__dirname, '../assets/test-image.jpg');

// Helpers
async function adminLogin(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("LOGIN")');
  await page.waitForLoadState('networkidle');
}

async function userLogin(page) {
  // ensure we're starting clean
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', USER_EMAIL);
  await page.fill('input[type="password"]', USER_PASS);
  await page.click('button:has-text("LOGIN")');
  await page.waitForLoadState('networkidle');
}

// Generate unique names
function unique(prefix) { return `${prefix}-${Date.now()}`; }

// Tests

test.describe('Admin permissions and profile', () => {
  test('only admin accounts can see admin dashboard and menu', async ({ page }) => {
    // Admin should be able to visit admin create-category page
    await adminLogin(page);
    await page.goto(`${BASE}/dashboard/admin/create-category`);
    // Expect Manage Category heading or admin url
    const heading = page.locator('h1:has-text("Manage Category")');
    await expect(heading).toBeVisible({ timeout: 5000 });

  // Logout by clearing storage (cookies, localStorage)
  await page.context().clearCookies();
  await page.context().clearPermissions();
  await page.evaluate(() => localStorage.clear());

    // Regular user should NOT access admin page
    await userLogin(page);
    await page.goto(`${BASE}/dashboard/admin/create-category`);
    // Expect redirect to login via Spinner
    await page.waitForURL('**/login', { timeout: 10000 });
  });

  test('only admin accounts can create, update and delete products', async ({ page, request }) => {
    const prod = unique('e2e-product');

    // Admin creates a product
    await adminLogin(page);
    await page.goto(`${BASE}/dashboard/admin/create-product`);
    await page.waitForSelector('text=Create Product', { timeout: 10000 });

    // Select category (same robust approach)
    if (await page.locator('div.form-select').count() > 0) {
      await page.click('div.form-select');
    } else if (await page.locator('.ant-select-selection--single').count() > 0) {
      await page.click('.ant-select-selection--single');
    }
    await page.waitForSelector('.ant-select-item-option-content', { timeout: 5000 });
    await page.locator('.ant-select-item-option-content').first().click();

    await page.setInputFiles('input[name="photo"]', TEST_IMAGE);
    await page.fill('input[placeholder="write a name"]', prod);
    await page.fill('textarea[placeholder="write a description"]', 'created by admin test');
    await page.fill('input[placeholder="write a Price"]', '3.33');
    await page.fill('input[placeholder="write a quantity"]', '4');

    // submit create
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
      page.click('button:has-text("CREATE PRODUCT")')
    ]);

  // verify product in products list and capture slug from link
  await page.goto(`${BASE}/dashboard/admin/products`);
  const cardLink = page.locator(`a.product-link:has(h5:has-text("${prod}"))`).first();
  await cardLink.waitFor({ timeout: 10000 });
  const href = await cardLink.getAttribute('href');
  // href looks like /dashboard/admin/product/:slug
  const slug = href?.split('/dashboard/admin/product/')[1] || '';

  // Open product page (admin Update page) as admin to verify buttons exist
  await cardLink.click();
  await page.waitForLoadState('networkidle');

    // Admin should see UPDATE PRODUCT and DELETE PRODUCT buttons
    await expect(page.getByRole('button', { name: 'UPDATE PRODUCT' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'DELETE PRODUCT' })).toBeVisible();

    // Now logout and login as regular user
    await page.context().clearCookies();
    await page.context().clearPermissions();
    await page.evaluate(() => localStorage.clear());

    // Seed regular user if needed (idempotent)
    try {
      await request.post(`${API_BASE}/api/v1/auth/register`, {
        data: { name: 'E2E User', email: USER_EMAIL, password: USER_PASS, phone: '1234567890', address: 'E2E Street' },
        timeout: 8000,
      });
    } catch { /* ignore */ }
    await userLogin(page);

    // Regular user should not be able to visit create-product page
  await page.goto(`${BASE}/dashboard/admin/create-product`);
  await page.waitForURL('**/login', { timeout: 10000 });

    // Regular user should not see delete/update buttons on the product page
    // Navigate to public product details page and assert admin-only buttons are not present
    if (slug) {
      await page.goto(`${BASE}/product/${slug}`).catch(() => {});
      await page.waitForLoadState('networkidle');
    }

    // Now assert update/delete buttons are NOT visible
    const updateBtnCount = await page.getByRole('button', { name: 'UPDATE PRODUCT' }).count();
    const deleteBtnCount = await page.getByRole('button', { name: 'DELETE PRODUCT' }).count();
    expect(updateBtnCount).toBe(0);
    expect(deleteBtnCount).toBe(0);
  });

  test('Profile page shows user information correctly', async ({ page, request }) => {
    // Ensure user exists and login
    try {
      await request.post(`${API_BASE}/api/v1/auth/register`, {
        data: { name: 'E2E User', email: USER_EMAIL, password: USER_PASS, phone: '1234567890', address: 'E2E Street' },
        timeout: 8000,
      });
    } catch { /* ignore */ }
    // Ensure regular user exists
    try {
      await request.post(`${API_BASE}/api/v1/auth/register`, {
        data: { name: 'E2E User', email: USER_EMAIL, password: USER_PASS, phone: '1234567890', address: 'E2E Street', answer: 'blue' },
        timeout: 8000,
      });
    } catch {}
    // Login via API
    const loginResp = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: USER_EMAIL, password: USER_PASS },
    });
    const loginJson = await loginResp.json();
    // Start fresh and inject auth into localStorage on the app origin
    await page.context().clearCookies();
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((value) => {
      window.localStorage.setItem('auth', value);
    }, JSON.stringify(loginJson));
    // Reload so AuthProvider reads localStorage on mount
    await page.reload();
    // Navigate to user dashboard and assert email is visible
    await page.goto(`${BASE}/dashboard/user`);
    await page.waitForResponse((r) => r.url().includes('/api/v1/auth/user-auth') && r.status() === 200, { timeout: 10000 }).catch(() => {});
    await expect(page.locator(`text=${USER_EMAIL}`)).toBeVisible({ timeout: 10000 });
  });
});
