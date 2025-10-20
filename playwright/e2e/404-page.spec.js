import { test, expect } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * E2E TEST SUITE: 404 Page Not Found Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * BLACK BOX TESTING: Tests from user perspective only
 * - Tests 404 page content, layout, and navigation
 * - Verifies page title and error handling
 * - Tests responsive behavior and accessibility
 * 
 * SCOPE: 404 page functionality, error display, navigation recovery
 * TESTS: 8 comprehensive 404 page tests
 */

test.describe('E2E Suite: 404 Page Not Found Component', () => {

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 404 PAGE CONTENT TESTS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  test('404 Page - Correct Title in Browser Tab', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    
    // Check that 404 page has the correct title in browser tab
    const pageTitle = await page.title();
    expect(pageTitle).toBe('go back- page not found');
    
    console.log(`✅ 404 page title in browser tab: "${pageTitle}"`);
  });

  test('404 Page - Layout Components Render Correctly', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Test that 404 page has Header
    const logo = page.locator('.navbar-brand');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('🛒 Virtual Vault');

    // Test that 404 page has Footer
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    
    const copyrightText = page.locator('.footer h4');
    await expect(copyrightText).toBeVisible();
    await expect(copyrightText).toContainText('All Rights Reserved');

    console.log('✅ 404 page renders Header and Footer correctly');
  });

  test('404 Page - Main Content Structure', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    await page.waitForSelector('.pnf', { timeout: 10000 });

    // Test main content container
    const mainContent = page.locator('.pnf');
    await expect(mainContent).toBeVisible();

    // Test 404 title
    const pageNotFoundTitle = page.locator('.pnf-title');
    await expect(pageNotFoundTitle).toBeVisible();
    await expect(pageNotFoundTitle).toContainText('404');

    // Test error heading
    const errorHeading = page.locator('.pnf-heading');
    await expect(errorHeading).toBeVisible();
    await expect(errorHeading).toContainText('Oops ! Page Not Found');

    console.log('✅ 404 page main content structure is correct');
  });

  test('404 Page - Error Message Display', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    await page.waitForSelector('.pnf-title', { timeout: 10000 });

    // Test 404 title
    const pageNotFoundTitle = page.locator('.pnf-title');
    await expect(pageNotFoundTitle).toBeVisible();
    await expect(pageNotFoundTitle).toContainText('404');
    await expect(pageNotFoundTitle).toHaveClass('pnf-title');

    // Test error message
    const errorMessage = page.locator('.pnf-heading');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Oops ! Page Not Found');
    await expect(errorMessage).toHaveClass('pnf-heading');

    console.log('✅ 404 page error messages display correctly');
  });

  test('404 Page - Go Back Link Functionality', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    await page.waitForSelector('.pnf-btn', { timeout: 10000 });

    // Test Go Back link
    const goBackLink = page.locator('.pnf-btn');
    await expect(goBackLink).toBeVisible();
    await expect(goBackLink).toContainText('Go Back');
    await expect(goBackLink).toHaveAttribute('href', '/');
    await expect(goBackLink).toHaveClass('pnf-btn');

    // Test Go Back link navigation
    await goBackLink.click();
    await expect(page).toHaveURL('/');

    console.log('✅ 404 page Go Back link works correctly');
  });

  test('404 Page - Navigation Links Work', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
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
    await page.click('.footer a[href="/about"]');
    await expect(page).toHaveURL(/.*about/);
    await page.goBack();

    console.log('✅ 404 page navigation links work correctly');
  });

  test('404 Page - Responsive Design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    
    const mainContent = page.locator('.pnf');
    await expect(mainContent).toBeVisible();
    
    console.log('✅ 404 page displays correctly on desktop');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector('.pnf', { timeout: 10000 });
    
    await expect(mainContent).toBeVisible();
    
    console.log('✅ 404 page displays correctly on tablet');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('.pnf', { timeout: 10000 });
    
    await expect(mainContent).toBeVisible();
    
    console.log('✅ 404 page displays correctly on mobile');
  });

  test('404 Page - Multiple Invalid URLs', async ({ page }) => {
    const invalidUrls = [
      '/invalid-page',
      '/nonexistent-route',
      '/random-path',
      '/test/404',
      '/admin/invalid'
    ];

    for (const url of invalidUrls) {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('.pnf-title', { timeout: 10000 });

      // Verify 404 content appears for each invalid URL
      const pageNotFoundTitle = page.locator('.pnf-title');
      await expect(pageNotFoundTitle).toBeVisible();
      await expect(pageNotFoundTitle).toContainText('404');

      const errorMessage = page.locator('.pnf-heading');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Oops ! Page Not Found');

      console.log(`✅ 404 page handles invalid URL: ${url}`);
    }
  });

  test('404 Page - Accessibility Features', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
    await page.waitForSelector('.pnf-title', { timeout: 10000 });

    // Test heading hierarchy
    const h1Element = page.locator('h1.pnf-title');
    const h2Element = page.locator('h2.pnf-heading');
    
    await expect(h1Element).toBeVisible();
    await expect(h1Element).toContainText('404');
    
    await expect(h2Element).toBeVisible();
    await expect(h2Element).toContainText('Oops ! Page Not Found');

    // Test Go Back link accessibility
    const goBackLink = page.locator('a.pnf-btn');
    await expect(goBackLink).toBeVisible();
    await expect(goBackLink).toHaveAttribute('href', '/');
    
    // Test that link has accessible text
    const linkText = await goBackLink.textContent();
    expect(linkText).toBe('Go Back');

    console.log('✅ 404 page has proper accessibility features');
  });

});
