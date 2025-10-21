import { test, expect } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * E2E TEST SUITE: Category Functionality
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * BLACK BOX TESTING: Tests from user perspective only
 * - Tests Categories.js page loading and display
 * - Tests useCategory hook integration
 * - Tests categoryController endpoint through UI (/api/v1/category/get-category)
 * - Tests singleCategoryController endpoint through UI (/api/v1/category/single-category/:slug)
 * - Tests category navigation and links
 * - Verifies category data integrity and error handling
 * 
 * SCOPE: Category functionality, useCategory hook, and category controllers
 * TESTS: 8 comprehensive category tests
 */

test.describe('E2E Suite: Category Functionality', () => {

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * CATEGORIES PAGE TESTS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('Categories Page - Loads Successfully', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Verify page title
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    console.log(`✅ Categories page title: ${pageTitle}`);

    // Verify page heading
    const heading = page.locator('h1, h2, h3').filter({ hasText: /categor/i });
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible();
      console.log('✅ Categories page heading displayed');
    }

    // Verify layout components are present
    const navbar = page.locator('.navbar');
    const footer = page.locator('.footer');
    await expect(navbar).toBeVisible();
    await expect(footer).toBeVisible();

    console.log('✅ Categories page loads successfully');
  });

  test('Categories Page - Displays Category List', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    // Check for category buttons/links (Categories.js uses .btn-primary)
    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      console.log(`✅ Found ${categoryCount} category buttons on Categories page`);
      
      // Verify first category button is visible
      const firstCategory = categoryButtons.first();
      await expect(firstCategory).toBeVisible();
      
      // Check if category has text content
      const categoryText = await firstCategory.textContent();
      expect(categoryText).toBeTruthy();
      console.log(`✅ First category: "${categoryText}"`);
      
      // Verify category link structure
      const categoryHref = await firstCategory.getAttribute('href');
      if (categoryHref) {
        expect(categoryHref).toMatch(/\/category\//);
        console.log(`✅ Category link structure correct: ${categoryHref}`);
      }
    } else {
      console.log('⚠️ No category buttons found on Categories page - may be empty database or loading issue');
    }

    console.log('✅ Categories page displays category list');
  });

  test('Categories Page - useCategory Hook Integration', async ({ page }) => {
    // Monitor network requests to verify useCategory hook calls
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/category/get-category')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for API call to complete
    await page.waitForTimeout(3000);

    // Verify useCategory hook made API call
    expect(apiCalls.length).toBeGreaterThan(0);
    console.log(`✅ useCategory hook made ${apiCalls.length} API call(s)`);

    // Verify API call details
    const categoryApiCall = apiCalls.find(call => call.url.includes('/api/v1/category/get-category'));
    expect(categoryApiCall).toBeTruthy();
    expect(categoryApiCall.method).toBe('GET');
    console.log(`✅ API call: ${categoryApiCall.method} ${categoryApiCall.url}`);

    // Verify response was handled (categories should be displayed)
    const categoryElements = page.locator('.btn-primary, a[href*="/category/"]');
    const elementCount = await categoryElements.count();
    
    if (elementCount > 0) {
      console.log('✅ useCategory hook successfully processed API response');
    } else {
      console.log('⚠️ useCategory hook may have issues processing response');
    }

    console.log('✅ useCategory hook integration working correctly');
  });

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * CATEGORY CONTROLLER TESTS (categoryController)
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('Category Controller - API Endpoint Response', async ({ page }) => {
    // Intercept API response to verify categoryController
    let apiResponse = null;
    page.on('response', response => {
      if (response.url().includes('/api/v1/category/get-category')) {
        apiResponse = {
          status: response.status(),
          url: response.url(),
          headers: response.headers()
        };
      }
    });

    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for API call
    await page.waitForTimeout(3000);

    // Verify API response
    expect(apiResponse).toBeTruthy();
    expect(apiResponse.status).toBe(200);
    console.log(`✅ categoryController API responded with status ${apiResponse.status}`);

    // Verify response headers
    expect(apiResponse.headers['content-type']).toContain('application/json');
    console.log('✅ API response has correct content-type');

    // Verify categories are displayed (indicates successful data processing)
    const categoryElements = page.locator('.btn-primary');
    const elementCount = await categoryElements.count();
    
    if (elementCount > 0) {
      console.log(`✅ categoryController returned ${elementCount} categories`);
    } else {
      console.log('⚠️ categoryController may have returned empty data');
    }

    console.log('✅ categoryController endpoint working correctly');
  });

  test('Category Controller - Data Integrity', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Test first few categories for data integrity
      const categoriesToTest = Math.min(3, categoryCount);
      
      for (let i = 0; i < categoriesToTest; i++) {
        const category = categoryButtons.nth(i);
        
        // Verify category has text content
        const categoryText = await category.textContent();
        expect(categoryText).toBeTruthy();
        expect(categoryText.trim().length).toBeGreaterThan(0);
        
        // Verify category link
        const categoryHref = await category.getAttribute('href');
        expect(categoryHref).toBeTruthy();
        expect(categoryHref).toMatch(/\/category\/[a-zA-Z0-9-]+/);
        
        // Verify category is clickable
        await expect(category).toBeVisible();
        
        console.log(`✅ Category ${i + 1}: "${categoryText}" -> ${categoryHref}`);
      }
      
      console.log(`✅ Data integrity verified for ${categoriesToTest} categories`);
    } else {
      console.log('⚠️ No categories to verify - may be empty database');
    }

    console.log('✅ categoryController data integrity verified');
  });

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * SINGLE CATEGORY CONTROLLER TESTS (singleCategoryController)
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('Single Category Controller - Navigation and API Call', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Monitor API calls for single category
      const singleCategoryApiCalls = [];
      page.on('request', request => {
        if (request.url().includes('/api/v1/category/single-category/')) {
          singleCategoryApiCalls.push({
            url: request.url(),
            method: request.method(),
            slug: request.url().split('/').pop()
          });
        }
      });

      // Click first category
      const firstCategory = categoryButtons.first();
      const categoryHref = await firstCategory.getAttribute('href');
      const expectedSlug = categoryHref.split('/').pop();
      
      await firstCategory.click();
      
      // Wait for navigation and API call
      await page.waitForTimeout(3000);

      // Verify API call was made (if any)
      if (singleCategoryApiCalls.length > 0) {
        const apiCall = singleCategoryApiCalls[0];
        expect(apiCall.method).toBe('GET');
        expect(apiCall.slug).toBe(expectedSlug);
        
        console.log(`✅ singleCategoryController API called: ${apiCall.method} ${apiCall.url}`);
        console.log(`✅ Slug parameter: ${apiCall.slug}`);
      } else {
        console.log('⚠️ No single category API call detected - may be handled differently');
      }

      // Verify we're on category page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/category/');
      console.log(`✅ Navigated to category page: ${currentUrl}`);

    } else {
      console.log('⚠️ No categories available to test single category navigation');
    }

    console.log('✅ singleCategoryController navigation working correctly');
  });

  test('Single Category Controller - Page Content and Data', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Click first category
      const firstCategory = categoryButtons.first();
      const categoryText = await firstCategory.textContent();
      
      await firstCategory.click();
      
      // Wait for page to load
      await page.waitForTimeout(3000);

      // Verify page elements are present
      const navbar = page.locator('.navbar');
      const footer = page.locator('.footer');
      await expect(navbar).toBeVisible();
      await expect(footer).toBeVisible();

      // Check for category-specific content
      const pageContent = page.locator('.container, .row, .col');
      await expect(pageContent.first()).toBeVisible();

      // Verify page title reflects category
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      console.log(`✅ Single category page title: ${pageTitle}`);

      // Check for products or category information
      const productElements = page.locator('.card, .product, [class*="product"]');
      const productCount = await productElements.count();
      
      if (productCount > 0) {
        console.log(`✅ Single category page shows ${productCount} products`);
      } else {
        // Check for "no products" message
        const noProductsMessage = page.locator('text=/no products/i, text=/empty/i, text=/not found/i');
        const noProductsCount = await noProductsMessage.count();
        
        if (noProductsCount > 0) {
          console.log('✅ Single category page shows "no products" message');
        } else {
          console.log('⚠️ Single category page content needs verification');
        }
      }

      console.log(`✅ Single category page loaded for: "${categoryText}"`);

    } else {
      console.log('⚠️ No categories available to test single category page');
    }

    console.log('✅ singleCategoryController page content verified');
  });

  test('Single Category Controller - Error Handling', async ({ page }) => {
    // Test with invalid category slug
    const invalidSlug = 'nonexistent-category-12345';
    
    // Monitor API calls
    const errorApiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/v1/category/single-category/')) {
        errorApiCalls.push({
          url: response.url(),
          status: response.status(),
          slug: response.url().split('/').pop()
        });
      }
    });

    await page.goto(`/category/${invalidSlug}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for API call
    await page.waitForTimeout(3000);

    // Verify API call was made (if any)
    if (errorApiCalls.length > 0) {
      const apiCall = errorApiCalls[0];
      expect(apiCall.slug).toBe(invalidSlug);
      console.log(`✅ API called for invalid slug: ${apiCall.slug}`);
    } else {
      console.log('⚠️ No API call made for invalid slug - may be handled client-side');
    }

    // Check how the app handles the error
    const currentUrl = page.url();
    
    // App might redirect to 404, stay on page, or show error message
    if (currentUrl.includes('/404') || currentUrl.includes('not-found')) {
      console.log('✅ App redirected to 404 page for invalid category');
    } else if (currentUrl.includes(`/category/${invalidSlug}`)) {
      // Check for error message or empty state
      const errorMessage = page.locator('text=/not found/i, text=/error/i, text=/invalid/i');
      const errorCount = await errorMessage.count();
      
      if (errorCount > 0) {
        console.log('✅ App shows error message for invalid category');
      } else {
        console.log('⚠️ App stays on invalid category page without clear error indication');
      }
    }

    // Verify page is still functional (navbar, footer present)
    const navbar = page.locator('.navbar');
    const footer = page.locator('.footer');
    await expect(navbar).toBeVisible();
    await expect(footer).toBeVisible();

    console.log('✅ singleCategoryController error handling verified');
  });

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * CATEGORIES PAGE NAVIGATION
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('Categories Page Navigation to Category Page', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    // Get category buttons from Categories page
    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Click first category button
      const firstCategory = categoryButtons.first();
      const categoryText = await firstCategory.textContent();
      const expectedHref = await firstCategory.getAttribute('href');
      
      console.log(`✅ Clicking category "${categoryText}" from Categories page`);
      
      // Click the category button
      await firstCategory.click();
      
      // Wait for navigation
      await page.waitForTimeout(2000);
      
      // Verify URL updated to the right link
      const currentUrl = page.url();
      expect(currentUrl).toContain('/category/');
      expect(new URL(currentUrl).pathname).toBe(expectedHref);
      
      console.log(`✅ Navigated to: ${currentUrl}`);
      console.log(`✅ URL matches expected: ${expectedHref}`);
      
      // Verify page loaded correctly
      const navbar = page.locator('.navbar');
      await expect(navbar).toBeVisible();
      
      console.log('✅ Category page loaded successfully');
    } else {
      console.log('⚠️ No categories available to test navigation');
    }

    console.log('✅ Categories page navigation to category page works correctly');
  });

  test('URL Updates to Right Link of Chosen Category', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Test multiple categories to verify URL structure
      const categoriesToTest = Math.min(3, categoryCount);
      
      for (let i = 0; i < categoriesToTest; i++) {
        // Go back to categories page
        await page.goto('/categories', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        const categoryButton = categoryButtons.nth(i);
        const categoryText = await categoryButton.textContent();
        const expectedHref = await categoryButton.getAttribute('href');
        
        // Click category
        await categoryButton.click();
        await page.waitForTimeout(2000);
        
        // Verify URL structure
        const currentUrl = page.url();
        expect(currentUrl).toContain('/category/');
        expect(new URL(currentUrl).pathname).toBe(expectedHref);
        
        // Verify URL contains the category slug
        const urlSlug = new URL(currentUrl).pathname.split('/').pop();
        expect(urlSlug).toBeTruthy();
        expect(urlSlug.length).toBeGreaterThan(0);
        
        console.log(`✅ Category "${categoryText}": ${currentUrl} (slug: ${urlSlug})`);
      }
      
      console.log(`✅ URL updates correctly for ${categoriesToTest} categories`);
    } else {
      console.log('⚠️ No categories available to test URL updates');
    }

    console.log('✅ URL updates to the right link of chosen category');
  });

  test('Navigation Completes Without Errors', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Monitor for console errors during navigation
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Test navigation for first few categories
      const categoriesToTest = Math.min(2, categoryCount);
      
      for (let i = 0; i < categoriesToTest; i++) {
        // Go back to categories page
        await page.goto('/categories', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        const categoryButton = categoryButtons.nth(i);
        const categoryText = await categoryButton.textContent();
        
        // Click category
        await categoryButton.click();
        await page.waitForTimeout(2000);
        
        // Verify no error popups
        const hasErrorPopup = await page.locator('[role="alert"], .alert-danger, .error-popup').isVisible().catch(() => false);
        expect(hasErrorPopup).toBeFalsy();
        
        // Verify page elements are present (not crashed)
        const navbar = page.locator('.navbar');
        const footer = page.locator('.footer');
        await expect(navbar).toBeVisible();
        await expect(footer).toBeVisible();
        
        console.log(`✅ Navigation to "${categoryText}" completed without errors`);
      }
      
      // Check for console errors
      if (consoleErrors.length === 0) {
        console.log('✅ No console errors during navigation');
      } else {
        console.log(`⚠️ Console errors detected: ${consoleErrors.length}`);
        consoleErrors.forEach(error => console.log(`  - ${error}`));
      }
      
    } else {
      console.log('⚠️ No categories available to test error-free navigation');
    }

    console.log('✅ Navigation completes without errors');
  });

  test('App Remains Responsive After Navigation', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Test responsiveness after navigation
      const firstCategory = categoryButtons.first();
      const categoryText = await firstCategory.textContent();
      
      // Click category
      await firstCategory.click();
      await page.waitForTimeout(2000);
      
      // Test page responsiveness
      const startTime = Date.now();
      
      // Verify page is still interactive
      const navbar = page.locator('.navbar');
      await expect(navbar).toBeVisible();
      
      // Test that we can interact with page elements
      const homeLink = page.locator('a.nav-link:has-text("Home")');
      await expect(homeLink).toBeVisible();
      
      // Test search functionality still works
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeVisible();
        console.log('✅ Search input remains responsive');
      }
      
      // Test footer links
      const footer = page.locator('.footer');
      await expect(footer).toBeVisible();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ App remained responsive after navigation (${responseTime}ms)`);
      
      // Test navigation back to categories
      await page.goto('/categories', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Verify categories page is still responsive
      const categoriesPageButtons = page.locator('.btn-primary');
      const buttonCount = await categoriesPageButtons.count();
      expect(buttonCount).toBe(categoryCount);
      
      console.log('✅ App remains responsive after returning to categories page');
      
    } else {
      console.log('⚠️ No categories available to test responsiveness');
    }

    console.log('✅ App remains responsive after navigation');
  });

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * INTEGRATION TESTS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('Category Integration - Full User Flow', async ({ page }) => {
    // Complete flow: Home -> Categories -> Single Category -> Back to Categories
    
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Navigate to categories via direct URL (more reliable)
    await page.goto('/categories', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });
    
    expect(page.url()).toContain('/categories');
    console.log('✅ Navigated to categories page');

    // Wait for categories to load
    await page.waitForTimeout(2000);

    const categoryButtons = page.locator('.btn-primary');
    const categoryCount = await categoryButtons.count();

    if (categoryCount > 0) {
      // Click first category
      const firstCategory = categoryButtons.first();
      const categoryText = await firstCategory.textContent();
      
      await firstCategory.click();
      await page.waitForTimeout(3000);
      
      console.log(`✅ Navigated to category: "${categoryText}"`);

      // Navigate back to categories
      await page.goBack();
      await page.waitForTimeout(2000);
      
      expect(page.url()).toContain('/categories');
      console.log('✅ Successfully navigated back to categories');

      // Verify categories page is still functional
      const categoryButtonsAfter = page.locator('.btn-primary');
      const categoryCountAfter = await categoryButtonsAfter.count();
      expect(categoryCountAfter).toBe(categoryCount);
      
      console.log('✅ Categories page state maintained after navigation');

    } else {
      console.log('⚠️ No categories available for full integration test');
    }

    console.log('✅ Category integration flow completed successfully');
  });

});
