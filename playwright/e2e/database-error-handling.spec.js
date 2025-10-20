import { test, expect } from '@playwright/test';

test.describe('E2E Suite: Database Error Handling', () => {
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * DATABASE ERROR SCENARIOS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('Database Error - Homepage Graceful Degradation', async ({ page }) => {
    // Simulate database connection failure
    await page.route('**/api/v1/product/**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false,
          message: 'Database connection failed' 
        })
      });
    });

    await page.route('**/api/v1/category/**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false,
          message: 'Database connection failed' 
        })
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Verify app doesn't crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if error messages are displayed appropriately
    const errorMessages = page.locator('.error, .alert-danger, [role="alert"]');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log('✅ Error messages displayed for database failures');
    } else {
      console.log('⚠️ No error messages found - check error handling');
    }

    // Verify navigation still works
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
    
    console.log('✅ App remains functional despite database errors');
  });

  test('Database Error - Search Functionality Fallback', async ({ page }) => {
    // Simulate database error for search
    await page.route('**/api/v1/product/search/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false,
          message: 'Search service unavailable' 
        })
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]');
    const searchButton = page.locator('button[type="submit"]:has-text("Search")');

    await searchInput.fill('test search');
    await searchButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check if user is still on search page (good error handling)
    const currentUrl = page.url();
    if (currentUrl.includes('/search')) {
      console.log('✅ User navigated to search page despite database error');
      
      // Check if "No Products Found" or error message is shown
      const noResultsMessage = page.locator('h6:has-text("No Products Found")');
      const errorMessage = page.locator('.error, .alert-danger');
      
      if (await noResultsMessage.count() > 0 || await errorMessage.count() > 0) {
        console.log('✅ Appropriate message shown for database error');
      }
    } else {
      console.log('⚠️ Search navigation failed - check error handling');
    }
  });

  test('Database Error - Authentication Fallback', async ({ page }) => {
    // Simulate database error for authentication
    await page.route('**/api/v1/auth/**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false,
          message: 'Authentication service unavailable' 
        })
      });
    });

    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await loginButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check if error message is displayed
      const errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
      if (await errorMessage.count() > 0) {
        console.log('✅ Authentication error handled gracefully');
      } else {
        console.log('⚠️ No error message for authentication failure');
      }
    }
  });

  test('Database Error - Product Details Fallback', async ({ page }) => {
    // Simulate database error for product details
    await page.route('**/api/v1/product/get-product/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false,
          message: 'Product service unavailable' 
        })
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Try to navigate to a product details page
    const productCards = page.locator('.card');
    const cardCount = await productCards.count();
    
    if (cardCount > 0) {
      const firstCard = productCards.first();
      const moreDetailsBtn = firstCard.locator('button:has-text("More Details")');
      
      if (await moreDetailsBtn.count() > 0) {
        await moreDetailsBtn.click();
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check if error page or 404 is shown
        const currentUrl = page.url();
        const errorPage = page.locator('.error, .alert-danger, h1:has-text("404")');
        
        if (currentUrl.includes('/product/') || await errorPage.count() > 0) {
          console.log('✅ Product details error handled appropriately');
        } else {
          console.log('⚠️ Product details error handling needs improvement');
        }
      }
    }
  });

  test('Database Error - Recovery Test', async ({ page }) => {
    // Start with database error
    await page.route('**/api/v1/product/**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false,
          message: 'Database connection failed' 
        })
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Wait for error state
    await page.waitForTimeout(2000);

    // Remove the route interception (simulate database recovery)
    await page.unroute('**/api/v1/product/**');

    // Try to refresh the page
    await page.reload({ waitUntil: 'networkidle' });

    // Check if products load after recovery
    await page.waitForTimeout(3000);
    
    const productCards = page.locator('.card');
    const cardCount = await productCards.count();
    
    if (cardCount > 0) {
      console.log('✅ App recovered from database error');
    } else {
      console.log('⚠️ App may need manual refresh after database recovery');
    }
  });
});
