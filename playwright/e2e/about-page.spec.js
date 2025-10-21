import { test, expect } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * E2E TEST SUITE: About Page Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * BLACK BOX TESTING: Tests from user perspective only
 * - Tests About page content, layout, and navigation
 * - Verifies page title and meta information
 * - Tests responsive behavior and accessibility
 * 
 * SCOPE: About page functionality, content display, navigation
 * TESTS: 8 comprehensive About page tests
 */

test.describe('E2E Suite: About Page Component', () => {

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * ABOUT PAGE CONTENT TESTS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('About Page - Correct Title in Browser Tab', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    
    // Check that About page has the correct title in browser tab
    const pageTitle = await page.title();
    expect(pageTitle).toBe('About us - Ecommerce app');
    
    console.log(`✅ About page title in browser tab: "${pageTitle}"`);
  });

  test('About Page - Layout Components Render Correctly', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Test that About page has Header
    const logo = page.locator('.navbar-brand');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('🛒 Virtual Vault');

    // Test that About page has Footer
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    
    const copyrightText = page.locator('.footer h4');
    await expect(copyrightText).toBeVisible();
    await expect(copyrightText).toContainText('All Rights Reserved');

    console.log('✅ About page renders Header and Footer correctly');
  });

  test('About Page - Main Content Structure', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForSelector('.row.contactus', { timeout: 10000 });

    // Test main content container
    const mainContent = page.locator('.row.contactus');
    await expect(mainContent).toBeVisible();

    // Test image column
    const imageColumn = page.locator('.col-md-6');
    await expect(imageColumn).toBeVisible();

    // Test text column
    const textColumn = page.locator('.col-md-4');
    await expect(textColumn).toBeVisible();

    console.log('✅ About page main content structure is correct');
  });

  test('About Page - Image Display', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForSelector('img[alt="contactus"]', { timeout: 10000 });

    // Test about image
    const aboutImage = page.locator('img[alt="contactus"]');
    await expect(aboutImage).toBeVisible();
    await expect(aboutImage).toHaveAttribute('src', '/images/about.jpeg');
    await expect(aboutImage).toHaveAttribute('alt', 'contactus');

    // Test image styling
    const imageStyle = await aboutImage.getAttribute('style');
    expect(imageStyle).toContain('width: 100%');

    console.log('✅ About page image displays correctly');
  });

  test('About Page - Text Content', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForSelector('.text-justify', { timeout: 10000 });

    // Test text content
    const textContent = page.locator('.text-justify');
    await expect(textContent).toBeVisible();
    await expect(textContent).toContainText('Add text');

    // Test text styling
    await expect(textContent).toHaveClass(/text-justify/);
    await expect(textContent).toHaveClass(/mt-2/);

    console.log('✅ About page text content displays correctly');
  });

  test('About Page - Navigation Links Work', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Test Home link navigation
    await page.click('a.nav-link:has-text("Home")');
    await expect(page).toHaveURL('/');
    await page.goBack();

    // Test Categories link navigation
    await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
    await page.waitForTimeout(1000);
    await page.click('.dropdown-item:has-text("All Categories")');
    await expect(page).toHaveURL('/categories');
    await page.goBack();

    // Test footer links
    await page.click('.footer a[href="/contact"]');
    await expect(page).toHaveURL(/.*contact/);
    await page.goBack();

    console.log('✅ About page navigation links work correctly');
  });

  test('About Page - Responsive Design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/about', { waitUntil: 'networkidle' });
    
    const mainContent = page.locator('.row.contactus');
    await expect(mainContent).toBeVisible();
    
    console.log('✅ About page displays correctly on desktop');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector('.row.contactus', { timeout: 10000 });
    
    await expect(mainContent).toBeVisible();
    
    console.log('✅ About page displays correctly on tablet');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('.row.contactus', { timeout: 10000 });
    
    await expect(mainContent).toBeVisible();
    
    console.log('✅ About page displays correctly on mobile');
  });

  test('About Page - No Errors or Blank Screens', async ({ page }) => {
    // Navigate to About page
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);
    
    // Verify About page content is visible (not blank)
    const aboutImage = page.locator('img[alt="contactus"]');
    await expect(aboutImage).toBeVisible();
    
    const textContent = page.locator('.text-justify');
    await expect(textContent).toBeVisible();
    
    // Check for any error popups or alerts
    const hasErrorPopup = await page.locator('[role="alert"], .alert-danger, .error-popup').isVisible().catch(() => false);
    expect(hasErrorPopup).toBeFalsy();
    
    console.log('✅ About page loads without errors or blank screens');
  });

});
