import { test, expect } from "@playwright/test";
import path from "path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:6060";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "testhw2@gmail.com";
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? "123456";
const TEST_IMAGE = path.resolve(__dirname, "../assets/test-image.jpg");

// --- Helpers ---
async function adminLogin(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("LOGIN")');
  await page.waitForLoadState('networkidle');
}

// obtain JWT by hitting backend login API directly
async function getAdminToken(request) {
  const resp = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
    timeout: 10000,
  });
  if (!resp.ok()) throw new Error(`admin login failed: ${resp.status()}`);
  const body = await resp.json();
  const token = body?.token;
  if (!token) throw new Error('admin login did not return token');
  return token;
}

async function createCategoryAndWait(page, name) {
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/v1/category/create-category') && r.status() >= 200 && r.status() < 300),
    (async () => {
      await page.fill('input[placeholder="Enter new category"]', name);
      await page.click('button:has-text("Submit")');
    })()
  ]);
  return resp;
}

async function deleteCategoryAndWait(page, id) {
  const resp = await page.request.delete(`${BASE}/api/v1/category/delete-category/${id}`);
  return resp;
}

async function createCategoryViaAPI(page, name) {
  // increase request timeout and be resilient if backend needs more time
  const maxAttempts = 3;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await page.request.post(`${BASE}/api/v1/category/create-category`, {
        data: { name },
        // Playwright default timeout may be low for some environments
        timeout: 60000,
      });
      const body = await resp.json().catch(() => null);
      return { resp, body };
    } catch (err) {
      lastErr = err;
      // if last attempt, throw, else wait a short backoff and retry
      if (attempt < maxAttempts) {
        // small backoff
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      throw new Error(`createCategoryViaAPI failed for '${name}': ${err.message}`);
    }
  }
}

// helper: poll products list for a product name (nicer than single waitForSelector)
async function waitForProductInList(page, productName, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await page.goto(`${BASE}/dashboard/admin/products`).catch(() => {});
    const cnt = await page.locator(`text=${productName}`).count().catch(() => 0);
    if (cnt > 0) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function waitForCategoryInList(page, categoryName, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await page.goto(`${BASE}/dashboard/admin/create-category`).catch(() => {});
    const cnt = await page.locator(`text=${categoryName}`).count().catch(() => 0);
    if (cnt > 0) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function selectCategoryByName(page, name) {
  // open the select control (try a few triggers)
  const trigger = page.locator('.form-select.mb-3 .ant-select-selector, .ant-select .ant-select-selector, .ant-select-selection--single').first();
  if (await trigger.count()) {
    await trigger.click();
  } else if (await page.getByText('Select a category').count()) {
    await page.getByText('Select a category').click();
  } else {
    // fallback: try clicking any select on the page
    await page.locator('.ant-select').first().click().catch(() => {});
  }
  // try to filter options by typing (antd showSearch)
  const searchInput = page.locator('.ant-select-dropdown .ant-select-selection-search-input, input[aria-autocomplete="list"]').first();
  if ((await searchInput.count()) > 0) {
    await searchInput.fill('');
    await searchInput.type(name, { delay: 50 }).catch(() => {});
  }
  // wait for options to render and try to click the exact match; if not found, click first option as last resort
  await page.locator('.ant-select-dropdown').first().waitFor({ timeout: 8000 }).catch(() => {});
  await page.waitForSelector('.ant-select-item-option, .ant-select-item-option-content', { timeout: 8000 });
  const matching = page.locator(`.ant-select-item-option[title="${name}"], .ant-select-item-option-content:has-text("${name}")`).first();
  if ((await matching.count()) > 0) {
    await matching.click();
  } else {
    const firstOpt = page.locator('.ant-select-item-option-content').first();
    await firstOpt.click();
  }
}

// Navigate to the admin products list and open the update page for a given product
async function openProductEditPage(page, productName) {
  await page.waitForSelector('text=All Products List', { timeout: 10000 }).catch(() => {});
  const link = page.locator(`a.product-link:has(h5:has-text("${productName}"))`).first();
  await link.waitFor({ timeout: 15000 });
  await link.click();
  await page.waitForURL('**/dashboard/admin/product/**', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('text=Update Product', { timeout: 10000 }).catch(() => {});
}

// Create product via API (form-data expected by server)
async function createProductViaAPI(request, token, fields) {
  return request.post(`${API_BASE}/api/v1/product/create-product`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: fields,
    timeout: 15000,
  });
}

// If a saved storage state exists, use it to speed up tests
import fs from 'fs';
const authPath = 'playwright/.auth/adminAuth.json';
if (fs.existsSync(authPath)) {
  test.use({ storageState: authPath });
}

test.beforeEach(async ({ page }) => {
  // If storageState not set, perform a login to ensure tests start authenticated
  if (!fs.existsSync(authPath)) {
    await adminLogin(page);
  }
});

// Quick server health check before running long E2E flows to fail fast with a clear message
test.beforeAll(async ({ request }) => {
  try {
    const resp = await request.get(BASE, { timeout: 5000 });
    if (!resp.ok()) {
      console.warn(`Server responded with status ${resp.status} at ${BASE} — Playwright tests may fail.`);
    }
  } catch (err) {
    throw new Error(`Unable to reach ${BASE}. Start the app (frontend + API) and retry. Error: ${err.message}`);
  }
});


test.describe("Admin - Category CRUD (UI)", () => {
  test("create category via UI and see it in list", async ({ page }) => {
    const name = `e2e-cat-${Date.now()}`;

    // Login
    await adminLogin(page);

    // Go to create category page
    await page.goto(`${BASE}/dashboard/admin/create-category`);
    // Wait for either the category input or a page heading to appear so the test is resilient
    await Promise.race([
      page.waitForSelector('input[placeholder="Enter new category"]', { timeout: 10000 }),
      page.waitForSelector('text=Create Category', { timeout: 10000 }).catch(() => {}),
    ]);

    // Fill and submit form
    await page.fill('input[placeholder="Enter new category"]', name);
    await page.click('button:has-text("Submit")');

    // Assert category visible in table (toast + list refresh)
    await page.waitForSelector(`text=${name}`, { timeout: 8000 });
    const found = await page.locator(`text=${name}`).count();
    expect(found).toBeGreaterThan(0);
  });

  test('create category, edit it, and see updated name in list', async ({ page }) => {
    const base = BASE;
    const original = `e2e-cat-${Date.now()}`;
    const updated = `${original}-updated`;

  // Login
  await adminLogin(page);

    // Go to create category page
    await page.goto(`${base}/dashboard/admin/create-category`);
    await page.waitForSelector('input[placeholder="Enter new category"]', { timeout: 10000 });

    // Create a new category
    await page.fill('input[placeholder="Enter new category"]', original);
    await page.click('button:has-text("Submit")');

    // Wait for category to appear in list
    await page.waitForSelector(`text=${original}`, { timeout: 8000 });

    // Click the Edit button for the created category
    // Find the row that contains the category name, then click its Edit button
    const row = page.locator(`xpath=//td[text()="${original}"]/..`);
    await row.waitFor({ timeout: 5000 });
    const editBtn = row.locator('button', { hasText: 'Edit' }).first();
    // Fallback if above locator doesn't work (use text matching)
    if ((await editBtn.count()) === 0) {
      // try to locate by finding the Edit button near the text
      await page.click(`xpath=//td[text()="${original}"]/following-sibling::td//button[contains(., 'Edit')]`);
    } else {
      await editBtn.click();
    }

    // Wait for modal to appear and fill the updated name using a modal-scoped input
    await page.waitForSelector('div.ant-modal', { timeout: 5000 }).catch(() => {});
    const modalInput = page.locator('div.ant-modal input[placeholder="Enter new category"]');
    if ((await modalInput.count()) > 0) {
      await modalInput.fill(updated);
    } else {
      // fallback: fill the first visible input inside the modal
      const visibleInput = page.locator('div.ant-modal input:visible').first();
      if ((await visibleInput.count()) > 0) {
        await visibleInput.fill(updated);
      } else {
        // last resort: fill any input in the modal
        const anyInput = page.locator('div.ant-modal input').first();
        if ((await anyInput.count()) > 0) await anyInput.fill(updated);
      }
    }

    // Click the Submit button inside modal and wait for the update API response
    try {
      const [resp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/v1/category/update-category') && r.status() >= 200 && r.status() < 300, { timeout: 15000 }),
        (async () => {
          const modalSubmit = page.locator('div.ant-modal button:has-text("Submit")');
          if ((await modalSubmit.count()) > 0) {
            await modalSubmit.first().click();
          } else {
            await page.click('button:has-text("Submit")');
          }
        })()
      ]);
      // ensure response consumed (optional)
      await resp.finished?.().catch(() => {});
    } catch (err) {
      // continue — we'll still check list polling below
      console.warn('Update API response not observed before timeout:', err.message);
    }

    // Navigate to the create-category page and wait for the updated name to appear inside the category table
    await page.goto(`${BASE}/dashboard/admin/create-category`);
    // give the server a moment then wait for the updated name in the admin table specifically
    await page.waitForTimeout(800);
    const tableCell = page.locator('table tbody td:has-text("' + updated + '")').first();
    await tableCell.waitFor({ timeout: 15000 });
    const foundUpdated = await page.locator('table tbody td:has-text("' + updated + '")').count();
    expect(foundUpdated).toBeGreaterThan(0);
  });

  test('create category then delete it and ensure it is removed from the list', async ({ page }) => {
    const base = BASE;
    const name = `e2e-cat-delete-${Date.now()}`;

    // Login
    await page.goto(`${base}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button:has-text("LOGIN")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Go to create category page and create category
    await page.goto(`${base}/dashboard/admin/create-category`);
    await page.waitForSelector('input[placeholder="Enter new category"]', { timeout: 10000 });
    await page.fill('input[placeholder="Enter new category"]', name);
    await page.click('button:has-text("Submit")');

    // Wait for category to appear
    await page.waitForSelector(`text=${name}`, { timeout: 10000 });

    // Find the row for the category and click its Delete button
    const row = page.locator(`xpath=//td[text()="${name}"]/..`);
    await row.waitFor({ timeout: 5000 });

    // Prefer a button element with text 'Delete' in the same row
    const deleteBtn = row.locator('button', { hasText: 'Delete' }).first();
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.click();
    } else {
      // Fallback: click by xpath looking for a button that contains Delete
      await page.click(`xpath=//td[text()="${name}"]/following-sibling::td//button[contains(., 'Delete')]`);
    }

    // Wait for confirmation modal or a confirm button. Try common patterns
    // 1) Ant modal confirm button
    const confirmBtn = page.locator('div.ant-modal button:has-text("Yes"), div.ant-modal button:has-text("Confirm"), div.ant-modal button:has-text("OK")');
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.first().click();
    } else if ((await page.getByRole('button', { name: 'Confirm' }).count()) > 0) {
      await page.getByRole('button', { name: 'Confirm' }).first().click();
    } else {
      // If there's a native confirm dialog (window.confirm), try to accept it via dialog handler
      page.once('dialog', async dialog => {
        await dialog.accept();
      });
    }

    // Wait for server response or list update. Optionally wait for a delete API response
    await page.waitForTimeout(1000);
    // reload list to be safe
    await page.goto(`${base}/dashboard/admin/create-category`);

    // Assert the deleted category is no longer present
    await page.waitForTimeout(500);
    const count = await page.locator(`text=${name}`).count();
    expect(count).toBe(0);
  });
});

test.describe("Admin - Create Product (UI)", () => {
  test("create product using UI (select category, upload photo)", async ({ page, request }) => {
    // Use shared adminLogin helper and BASE constant to avoid hardcoded URLs
    await adminLogin(page);

    // Ensure the category exists (seed via API) so the select has a stable option to choose
    const token = await getAdminToken(request);
    const catName = 'Electronics';
    await request.post(`${API_BASE}/api/v1/category/create-category`, {
      data: { name: catName },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    }).catch(() => {});

    // Navigate directly to the create-product page to reduce flakiness
    const productName = `testProduct-${Date.now()}`;
    await page.goto(`${BASE}/dashboard/admin/create-product`);

    // Select a category deterministically: open the select and pick the first option
    const selectTrigger = page.locator('.ant-select').first();
    await selectTrigger.click();
    await page.waitForSelector('.ant-select-dropdown .ant-select-item-option', { timeout: 8000 });
    const firstOption = page.locator('.ant-select-dropdown .ant-select-item-option').first();
    await firstOption.click();
    // Verify a selection is shown in the control
    const hasSelection = page.locator('.ant-select-selection-item').first();
    await expect(hasSelection).toBeVisible({ timeout: 3000 });

    // Close any lingering dropdown overlays after selection
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { document.querySelectorAll('.ant-select-dropdown').forEach(el => el.remove()); }).catch(() => {});

    // Wait for the product form to be ready (name input) before interacting
    await page.waitForSelector('input[placeholder="write a name"]', { timeout: 10000 });

    // Fill form fields (fill without click to avoid overlay intercepts)
    await page.getByRole('textbox', { name: 'write a name' }).fill(productName);
    await page.getByRole('textbox', { name: 'write a description' }).fill('test product desc');
    await page.getByPlaceholder('write a Price').fill('1.2');
    await page.getByPlaceholder('write a quantity').fill('1');

    // Shipping selection: try selectors used in the app
    if ((await page.locator('#rc_select_1').count()) > 0) {
      await page.locator('#rc_select_1').click().catch(() => {});
      await page.getByText('No').click().catch(() => {});
    } else if ((await page.locator('.mb-3 > .ant-select').count()) > 0) {
      await page.locator('.mb-3 > .ant-select').first().click().catch(() => {});
      await page.getByText('No').first().click().catch(() => {});
    }

    // Attempt file upload if file input exists; don't fail the test if upload isn't possible
    try {
      if ((await page.locator('input[type=file]').count()) > 0) {
        await page.locator('input[type=file]').first().setInputFiles(TEST_IMAGE);
      } else {
        // Try a global setInputFiles but guard against selector-not-found
        await page.setInputFiles('input[type=file]', TEST_IMAGE);
      }
    } catch (err) {
      // Log and continue; some environments may not expose file inputs the same way
      console.warn('File upload skipped or failed:', err.message);
    }

    // Click create and wait for the create-product API, then poll search API until product appears
    const waitCreate = page.waitForResponse(r => r.url().includes('/api/v1/product/create-product') && r.request().method() === 'POST', { timeout: 20000 }).catch(() => null);
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    const createResp = await waitCreate;
    if (!createResp) throw new Error('No network response observed for product creation');
    if (!createResp.ok()) {
      const txt = await createResp.text().catch(() => '');
      throw new Error(`Create product API failed: ${createResp.status()} ${txt}`);
    }

    let found = false;
    for (let i = 0; i < 10 && !found; i++) {
      const s = await request.get(`${API_BASE}/api/v1/product/search/${encodeURIComponent(productName)}`, { timeout: 10000 });
      if (s.ok()) {
        const results = await s.json().catch(() => []);
        if (Array.isArray(results) && results.some(p => p?.name === productName)) {
          found = true;
          break;
        }
      }
      await page.waitForTimeout(500);
    }
    expect(found).toBe(true);
  });

  test("update product via UI (edit price & quantity)", async ({ page, request }) => {
    // Seed data via API
    const token = await getAdminToken(request);
    const catName = `e2e-cat-${Date.now()}`;
    const catResp = await request.post(`${API_BASE}/api/v1/category/create-category`, {
      data: { name: catName },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (!catResp.ok()) throw new Error(`Failed to seed category: ${catResp.status()}`);
    const catJson = await catResp.json();
    const categoryId = catJson?.category?._id;
    const productName = `e2e-update-${Date.now()}`;
    const prodResp = await createProductViaAPI(request, token, {
      name: productName,
      description: "update test",
      price: "10.00",
      quantity: "2",
      category: categoryId,
      shipping: "0",
    });
    if (!prodResp.ok()) throw new Error(`Failed to seed product: ${prodResp.status()}`);

    // Login and go to admin products list, then open the edit page by clicking the product card link
    await adminLogin(page);
    await page.goto(`${BASE}/dashboard/admin/products`);
    await openProductEditPage(page, productName);
    // Wait for form to load existing values to ensure state (including id) is ready
    const nameInput = page.locator('input[placeholder="write a name"]').first();
    await nameInput.waitFor({ timeout: 15000 });
    await expect(nameInput).toHaveValue(productName, { timeout: 15000 });
    const priceLoaded = page.locator('input[placeholder="write a Price"]').first();
    await priceLoaded.waitFor({ timeout: 15000 });
    await expect(priceLoaded).not.toHaveValue('', { timeout: 15000 });

    // Edit may open a modal or navigate to an edit page — choose scope accordingly
    const maybeModal = page.locator('div.ant-modal:visible').first();
    const hasModal = (await maybeModal.count()) > 0;
    const scope = hasModal ? maybeModal : page;

    const newPrice = "12.34";
    const newQty = "5";

    // Try placeholder-specific selectors first, scoped
    const priceInput = scope.locator('input[placeholder="write a Price"], input[placeholder*="Price" i], input[type="number"]').first();
    const qtyInput = scope.locator('input[placeholder="write a quantity"], input[placeholder*="quantity" i], input[type="number"]').nth(1);

    if ((await priceInput.count()) > 0) {
      await priceInput.fill("");
      await priceInput.type(newPrice);
    } else {
      const firstInput = scope.locator('input').first();
      if ((await firstInput.count()) > 0) {
        await firstInput.fill(newPrice);
      }
    }

    if ((await qtyInput.count()) > 0) {
      await qtyInput.fill("");
      await qtyInput.type(newQty);
    } else {
      const second = scope.locator('input').nth(1);
      if ((await second.count()) > 0) {
        await second.fill(newQty);
      }
    }

    // Submit (modal or page)
    const submit = scope.locator('button:has-text("UPDATE PRODUCT"), button:has-text("Update"), button:has-text("Submit")').first();
    if ((await submit.count()) > 0) {
      const waitUpdate = page.waitForResponse(r => r.url().includes('/api/v1/product/update-product/') && r.status() >= 200 && r.status() < 300, { timeout: 20000 }).catch(() => null);
      await Promise.all([
        page.waitForURL('**/dashboard/admin/products', { timeout: 20000 }).catch(() => {}),
        submit.click(),
        waitUpdate,
      ]);
    } else {
      const form = scope.locator('form').first();
      if ((await form.count()) > 0) {
        const waitUpdate = page.waitForResponse(r => r.url().includes('/api/v1/product/update-product/') && r.status() >= 200 && r.status() < 300, { timeout: 20000 }).catch(() => null);
        await Promise.all([
          page.waitForURL('**/dashboard/admin/products', { timeout: 20000 }).catch(() => {}),
          form.evaluate(f => f.submit()),
          waitUpdate,
        ]);
      }
    }

    // Verify via API that the product was updated (poll up to ~5s)
    let updatedOk = false;
    for (let i = 0; i < 10 && !updatedOk; i++) {
      const search = await request.get(`${API_BASE}/api/v1/product/search/${encodeURIComponent(productName)}`, { timeout: 10000 });
      if (!search.ok()) break;
      const results = await search.json();
      const found = Array.isArray(results) ? results.find(p => p?.name === productName) : null;
      if (found) {
        const priceVal = parseFloat(found?.price ?? "0");
        const qtyVal = parseInt(found?.quantity ?? "0", 10);
        if (Math.abs(priceVal - parseFloat(newPrice)) < 0.01 && qtyVal === parseInt(newQty, 10)) {
          updatedOk = true;
          break;
        }
      }
      await page.waitForTimeout(500);
    }
    expect(updatedOk).toBe(true);
  });

  test("delete product via UI (create then remove)", async ({ page, request }) => {
    // Seed data via API
    const token = await getAdminToken(request);
    const catName = `e2e-cat-${Date.now()}`;
    const catResp = await request.post(`${API_BASE}/api/v1/category/create-category`, {
      data: { name: catName },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (!catResp.ok()) throw new Error(`Failed to seed category: ${catResp.status()}`);
    const catJson = await catResp.json();
    const categoryId = catJson?.category?._id;
    const productName = `e2e-delete-${Date.now()}`;
    const prodResp = await createProductViaAPI(request, token, {
      name: productName,
      description: "delete test",
      price: "19.99",
      quantity: "3",
      category: categoryId,
      shipping: "0",
    });
    if (!prodResp.ok()) throw new Error(`Failed to seed product: ${prodResp.status()}`);

    // Login and go to admin products list, then open the edit page by clicking the product card link
    await adminLogin(page);
    await page.goto(`${BASE}/dashboard/admin/products`);
    await openProductEditPage(page, productName);
    // Ensure product details loaded (id set) before attempting delete
    const nameInput2 = page.locator('input[placeholder="write a name"]').first();
    await nameInput2.waitFor({ timeout: 15000 });
    await expect(nameInput2).toHaveValue(productName, { timeout: 15000 });

    // Click Delete on the update page; app uses window.prompt, accept with a truthy value
    page.once('dialog', async dialog => {
      await dialog.accept('yes');
    });
    const deleteBtn = page.locator('button:has-text("DELETE PRODUCT")').first();
    const waitDelete = page.waitForResponse(r => r.url().includes('/api/v1/product/delete-product/') && r.status() >= 200 && r.status() < 300, { timeout: 20000 }).catch(() => null);
    await Promise.all([
      page.waitForURL('**/dashboard/admin/products', { timeout: 20000 }).catch(() => {}),
      deleteBtn.click(),
      waitDelete,
    ]);

    // Give server a moment and verify via API that the product no longer exists
    await page.waitForTimeout(800);
    // Poll API until product no longer present (up to ~6s)
    let gone = false;
    for (let i = 0; i < 12 && !gone; i++) {
      const search = await request.get(`${API_BASE}/api/v1/product/search/${encodeURIComponent(productName)}`, { timeout: 10000 });
      if (!search.ok()) break;
      const results = await search.json();
      const remaining = Array.isArray(results) ? results.filter(p => p?.name === productName) : [];
      if (remaining.length === 0) {
        gone = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    expect(gone).toBe(true);
  });
});

//Admin - Validations (UI)
test.describe('Admin - Validations (UI)', () => {
  test.setTimeout(120000);
  test('no duplicate categories should be allowed', async ({ page }) => {
    const base = BASE;
    const name = `e2e-dup-cat-${Date.now()}`;

    // Login
    await page.goto(`${base}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button:has-text("LOGIN")');
    await page.waitForLoadState('networkidle');

    // Create category first time
    await page.goto(`${base}/dashboard/admin/create-category`);
    await page.waitForSelector('input[placeholder="Enter new category"]');
    await page.fill('input[placeholder="Enter new category"]', name);
    await page.click('button:has-text("Submit")');
    await page.waitForSelector(`text=${name}`, { timeout: 8000 });

    // Attempt to create duplicate
    await page.fill('input[placeholder="Enter new category"]', name);
    await page.click('button:has-text("Submit")');
    // give UI time to react (toast or server)
    await page.waitForTimeout(1000);

    // Assert only one entry exists in the list
    const count = await page.locator(`xpath=//td[text()="${name}"]`).count();
    expect(count).toBe(1);
  });

  test('creation of product with invalid price should be rejected', async ({ page, request }) => {
    const base = BASE;
    const productName = `e2e-invalid-price-${Date.now()}`;

    // Login
    await page.goto(`${base}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button:has-text("LOGIN")');
    await page.waitForLoadState('networkidle');

    // Seed a category via API using admin token
    const token = await getAdminToken(request);
    const catName = `e2e-cat-fixture-${Date.now()}`;
    const catResp = await request.post(`${API_BASE}/api/v1/category/create-category`, {
      data: { name: catName },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (!catResp.ok()) throw new Error(`Failed to seed category: ${catResp.status()}`);
    const catJson = await catResp.json();
    const catId = catJson?.category?._id;
    // Create product via API with invalid price
    const bad = await createProductViaAPI(request, token, {
      name: productName,
      description: 'invalid price test',
      price: 'abc',
      quantity: '1',
      category: catId,
      shipping: '0',
    });
    expect(bad.status()).toBeGreaterThanOrEqual(400);
    expect(bad.status()).toBeLessThan(500);
    const badBody = await bad.json().catch(() => ({}));
    expect(badBody?.success).not.toBe(true);

    // Finally ensure product does not appear in products list
    await page.goto(`${base}/dashboard/admin/products`);
    await page.waitForTimeout(800);
    const found = await page.locator(`text=${productName}`).count();
    expect(found).toBe(0);
  });

  test('no creation of product with the same category and product name', async ({ page, request }) => {
    const base = BASE;
    const productName = `e2e-unique-prod-${Date.now()}`;

    // Login
    await page.goto(`${base}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button:has-text("LOGIN")');
    await page.waitForLoadState('networkidle');

    // We'll use API for both first creation and duplicate attempt

  // Create first product (should succeed). Ensure category exists via API (authorized)
  const token = await getAdminToken(request);
  const catFixture = `e2e-cat-fixture-${Date.now()}`;
  const catResp = await request.post(`${API_BASE}/api/v1/category/create-category`, {
    data: { name: catFixture },
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
  if (!catResp.ok()) throw new Error(`Failed to seed category: ${catResp.status()}`);
  const catJson2 = await catResp.json();
  const catId2 = catJson2?.category?._id;
  const token2 = await getAdminToken(request);
  const first = await createProductViaAPI(request, token2, {
    name: productName,
    description: 'dup product test',
    price: '9.99',
    quantity: '1',
    category: catId2,
    shipping: '0',
  });
  expect(first.status()).toBe(201);
  // Verify existence via API search (more deterministic than UI list)
  let search = await request.get(`${API_BASE}/api/v1/product/search/${encodeURIComponent(productName)}`, { timeout: 10000 });
  expect(search.ok()).toBeTruthy();
  let results = await search.json();
  expect(Array.isArray(results)).toBeTruthy();
  let cnt = results.filter(p => p?.name === productName).length;
  expect(cnt).toBeGreaterThan(0);

    // Attempt to create duplicate product with the same name & category
    const dup = await createProductViaAPI(request, token2, {
      name: productName,
      description: 'dup product test',
      price: '9.99',
      quantity: '1',
      category: catId2,
      shipping: '0',
    });
    expect(dup.status()).toBe(409);
  // Verify still only one via API search
  search = await request.get(`${API_BASE}/api/v1/product/search/${encodeURIComponent(productName)}`, { timeout: 10000 });
  expect(search.ok()).toBeTruthy();
  results = await search.json();
  expect(Array.isArray(results)).toBeTruthy();
  cnt = results.filter(p => p?.name === productName).length;
  expect(cnt).toBe(1);
  });
});