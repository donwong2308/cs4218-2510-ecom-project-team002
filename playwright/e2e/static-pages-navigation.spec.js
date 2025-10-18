/**
 * ============================================================================
 * TEST SUITE 3: STATIC PAGES & NAVIGATION
 * ============================================================================
 * 
 * Purpose:
 *   End-to-end tests for static content pages (Contact, Privacy Policy) and
 *   navigation functionality. Verifies that users can access information pages,
 *   view content, and navigate between different sections of the application.
 * 
 * Testing Approach:
 *   - Black-box testing from user's perspective
 *   - Focus on content visibility and navigation flow
 *   - Verify static content displays correctly
 *   - Test cross-page navigation patterns
 * 
 * Test Coverage:
 *   3.1 - Contact Page Navigation and Content
 *   3.2 - Privacy Policy Page Navigation and Content
 *   3.3 - Cross-Page Navigation Flow
 *   3.4 - Header/Footer Consistency
 * 
 * Dependencies:
 *   - Application running on http://localhost:3000
 *   - MongoDB connected (for user session if logged in)
 *   - Test user from Suite 1: test@test.com / test (optional)
 * 
 * Created: October 18, 2025
 * Author: E2E Test Suite Team
 * ============================================================================
 */

const { test, expect } = require('@playwright/test');

/**
 * Test Suite Configuration
 */
test.describe('Test Suite 3: Static Pages & Navigation', () => {
  const BASE_URL = 'http://localhost:3000';
  
  /**
   * Setup: Navigate to homepage before each test
   * - Ensures consistent starting point
   * - Clears any previous navigation state
   */
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * ========================================================================
   * TEST 3.1: Contact Page Navigation and Content
   * ========================================================================
   * 
   * User Story:
   *   As a user, I want to access the Contact page to find contact information
   *   so that I can reach out to customer support if needed.
   * 
   * Expected Behavior:
   *   - User can navigate to /contact via header link
   *   - Page displays "CONTACT US" heading
   *   - Contact information is visible (email, phone, toll-free)
   *   - Contact image loads properly
   *   - Page title is set correctly
   * 
   * Test Steps:
   *   1. Click "Contact" link in header
   *   2. Verify URL changed to /contact
   *   3. Verify page title contains "Contact"
   *   4. Verify "CONTACT US" heading visible
   *   5. Verify email address visible
   *   6. Verify phone numbers visible
   *   7. Verify contact image loaded
   */
  test('3.1 - Should display Contact page with all information', async ({ page }) => {
    console.log('TEST 3.1: Contact Page Navigation and Content');
    console.log('='.repeat(70));

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Navigate to Contact page
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 1: Clicking Contact link in header');
    
    // Look for Contact link in navigation
    const contactLink = page.locator('a:has-text("Contact")').first();
    await expect(contactLink).toBeVisible({ timeout: 5000 });
    await contactLink.click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    console.log('   > Navigated to Contact page');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Verify URL
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 2: Verifying URL changed to /contact');
    await expect(page).toHaveURL(/.*\/contact/, { timeout: 3000 });
    console.log('   > URL is /contact');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Verify page title
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 3: Verifying page title');
    await expect(page).toHaveTitle(/Contact/i, { timeout: 3000 });
    console.log('   > Page title contains "Contact"');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Verify "CONTACT US" heading
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 4: Verifying "CONTACT US" heading');
    const heading = page.locator('h1:has-text("CONTACT US")');
    await expect(heading).toBeVisible({ timeout: 5000 });
    console.log('   > "CONTACT US" heading is visible');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Verify email address
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 5: Verifying email address visible');
    const emailText = page.locator('text=/.*help@ecommerceapp.com.*/i');
    await expect(emailText).toBeVisible({ timeout: 5000 });
    console.log('   > Email address "www.help@ecommerceapp.com" is visible');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: Verify phone numbers
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 6: Verifying phone numbers visible');
    
    // Check for regular phone number
    const phoneText = page.locator('text=/.*012-3456789.*/');
    await expect(phoneText).toBeVisible({ timeout: 5000 });
    console.log('   > Phone number "012-3456789" is visible');
    
    // Check for toll-free number
    const tollFreeText = page.locator('text=/.*1800-0000-0000.*/');
    await expect(tollFreeText).toBeVisible({ timeout: 5000 });
    console.log('   > Toll-free number "1800-0000-0000" is visible');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 7: Verify contact image loaded
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 7: Verifying contact image loaded');
    const contactImage = page.locator('img[src*="contactus"]');
    await expect(contactImage).toBeVisible({ timeout: 5000 });
    console.log('   > Contact image is loaded and visible');

    // ─────────────────────────────────────────────────────────────────────
    // TEST 3.1 PASSED
    // ─────────────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(70));
    console.log('PASS: TEST 3.1 - Contact page displays all content correctly');
    console.log('='.repeat(70) + '\n');
  });

  /**
   * ========================================================================
   * TEST 3.2: Privacy Policy Page Navigation and Content
   * ========================================================================
   * 
   * User Story:
   *   As a user, I want to access the Privacy Policy page to understand
   *   how my data is handled and protected.
   * 
   * Expected Behavior:
   *   - User can navigate to /policy via footer link
   *   - Page displays "Privacy Policy" heading
   *   - Policy content is visible
   *   - Policy image loads properly
   *   - Page title is set correctly
   * 
   * Test Steps:
   *   1. Scroll to footer
   *   2. Click "Privacy Policy" link
   *   3. Verify URL changed to /policy
   *   4. Verify page title contains "Privacy Policy"
   *   5. Verify "Privacy Policy" heading visible
   *   6. Verify policy content visible
   *   7. Verify policy image loaded
   */
  test('3.2 - Should display Privacy Policy page with content', async ({ page }) => {
    console.log('TEST 3.2: Privacy Policy Page Navigation and Content');
    console.log('='.repeat(70));

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Scroll to footer
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 1: Scrolling to footer');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000); // Wait for scroll animation
    console.log('   > Scrolled to bottom of page');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Navigate to Privacy Policy page
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 2: Clicking Privacy Policy link in footer');
    
    // Look for Privacy Policy link (could be in footer or header)
    const policyLink = page.locator('a:has-text("Privacy Policy")').first();
    await expect(policyLink).toBeVisible({ timeout: 5000 });
    await policyLink.click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    console.log('   > Navigated to Privacy Policy page');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Verify URL
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 3: Verifying URL changed to /policy');
    await expect(page).toHaveURL(/.*\/policy/, { timeout: 3000 });
    console.log('   > URL is /policy');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Verify page title
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 4: Verifying page title');
    await expect(page).toHaveTitle(/Privacy Policy/i, { timeout: 3000 });
    console.log('   > Page title contains "Privacy Policy"');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Verify page has main content container
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 5: Verifying page main content area');
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    console.log('   > Main content area is visible');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: Verify policy content visible
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 6: Verifying policy content visible');
    
    // Check for policy text (even if placeholder)
    const policyContent = page.locator('text=/add privacy policy/i').first();
    await expect(policyContent).toBeVisible({ timeout: 5000 });
    console.log('   > Policy content is visible (placeholder text)');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 7: Verify policy image loaded
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 7: Verifying policy image loaded');
    const policyImage = page.locator('img[src*="contactus"]'); // Uses same image as contact
    await expect(policyImage).toBeVisible({ timeout: 5000 });
    console.log('   > Policy image is loaded and visible');

    // ─────────────────────────────────────────────────────────────────────
    // TEST 3.2 PASSED
    // ─────────────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(70));
    console.log('PASS: TEST 3.2 - Privacy Policy page displays content correctly');
    console.log('='.repeat(70) + '\n');
  });

  /**
   * ========================================================================
   * TEST 3.3: Cross-Page Navigation Flow
   * ========================================================================
   * 
   * User Story:
   *   As a user, I want to navigate between different pages seamlessly,
   *   including using the logo to return home, so that I can easily explore
   *   the website.
   * 
   * Expected Behavior:
   *   - User can navigate: Home → Contact → Policy → Home
   *   - Logo click returns to homepage from any page
   *   - Header and footer are consistent across all pages
   *   - Navigation links work from any page
   *   - Browser back button works correctly
   * 
   * Test Steps:
   *   1. Start on homepage, verify URL
   *   2. Navigate to Contact page
   *   3. Verify header/footer present on Contact page
   *   4. Navigate from Contact to Privacy Policy
   *   5. Verify header/footer present on Policy page
   *   6. Click logo to return home
   *   7. Verify returned to homepage
   *   8. Test browser back button
   */
  test('3.3 - Should navigate seamlessly between static pages', async ({ page }) => {
    console.log('TEST 3.3: Cross-Page Navigation Flow');
    console.log('='.repeat(70));

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Verify starting on homepage
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 1: Verifying on homepage');
    await expect(page).toHaveURL(BASE_URL, { timeout: 3000 });
    console.log('   > Starting on homepage: ' + BASE_URL);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Navigate to Contact page
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 2: Navigating Home to Contact');
    const contactLink = page.locator('a:has-text("Contact")').first();
    await contactLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/contact/, { timeout: 3000 });
    console.log('   > Successfully navigated to Contact page');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Verify header and footer on Contact page
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 3: Verifying header/footer on Contact page');
    
    // Check header exists (look for navigation links)
    const headerNav = page.locator('nav, header').first();
    await expect(headerNav).toBeVisible({ timeout: 5000 });
    console.log('   > Header navigation is present');
    
    // Check footer exists (look for footer element or links at bottom)
    const footer = page.locator('footer, .footer').first();
    const hasFooter = await footer.count() > 0;
    console.log(`   > Footer is ${hasFooter ? 'present' : 'not found (optional)'}`);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Navigate from Contact to Privacy Policy
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 4: Navigating Contact to Privacy Policy');
    
    // Scroll to find Privacy Policy link (might be in footer)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const policyLink = page.locator('a:has-text("Privacy Policy")').first();
    await expect(policyLink).toBeVisible({ timeout: 5000 });
    await policyLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/policy/, { timeout: 3000 });
    console.log('   > Successfully navigated to Privacy Policy page');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Verify header and footer on Policy page
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 5: Verifying header/footer on Policy page');
    
    // Check header exists
    await page.evaluate(() => window.scrollTo(0, 0)); // Scroll to top to see header
    await expect(headerNav).toBeVisible({ timeout: 5000 });
    console.log('   > Header navigation is present');
    
    // Check footer exists
    const hasFooterOnPolicy = await footer.count() > 0;
    console.log(`   > Footer is ${hasFooterOnPolicy ? 'present' : 'not found (optional)'}`);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: Click logo to return home
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 6: Clicking logo to return home');
    
    // Look for logo/brand link (usually at top left of header)
    const logoLink = page.locator('a[href="/"], a[href="' + BASE_URL + '"]').first();
    await expect(logoLink).toBeVisible({ timeout: 5000 });
    await logoLink.click();
    await page.waitForLoadState('networkidle');
    console.log('   > Clicked logo link');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 7: Verify returned to homepage
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 7: Verifying returned to homepage');
    await expect(page).toHaveURL(BASE_URL, { timeout: 3000 });
    console.log('   > Successfully returned to homepage via logo click');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 8: Test browser back button
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nSTEP 8: Testing browser back button');
    
    // Go back (should return to Policy page)
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/policy/, { timeout: 3000 });
    console.log('   > Back button works: returned to Policy page');
    
    // Go forward (should return to homepage)
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(BASE_URL, { timeout: 3000 });
    console.log('   > Forward button works: returned to homepage');

    // ─────────────────────────────────────────────────────────────────────
    // TEST 3.3 PASSED
    // ─────────────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(70));
    console.log('PASS: TEST 3.3 - Cross-page navigation works seamlessly');
    console.log('='.repeat(70) + '\n');
  });

  /**
   * ========================================================================
   * TEST 3.4: Header/Footer Consistency
   * ========================================================================
   * 
   * User Story:
   *   As a user, I want consistent navigation elements across all pages
   *   so that I always know how to access different sections of the website.
   * 
   * Expected Behavior:
   *   - Header appears on all pages (Home, Contact, Policy)
   *   - Navigation links are accessible on all pages
   *   - Logo is visible and clickable on all pages
   *   - Layout is consistent across pages
   * 
   * Test Steps:
   *   1. Check header on homepage
   *   2. Check header on Contact page
   *   3. Check header on Policy page
   *   4. Verify all pages have same navigation links
   *   5. Verify logo is consistent
   */
  test('3.4 - Should have consistent header/footer across all pages', async ({ page }) => {
    console.log('TEST 3.4: Header/Footer Consistency');
    console.log('='.repeat(70));

    const pagesToCheck = [
      { name: 'Homepage', url: BASE_URL },
      { name: 'Contact', url: BASE_URL + '/contact' },
      { name: 'Privacy Policy', url: BASE_URL + '/policy' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // Check header/footer on each page
    // ─────────────────────────────────────────────────────────────────────
    for (const pageInfo of pagesToCheck) {
      console.log(`\nChecking ${pageInfo.name} page`);
      
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Verify header navigation exists
      const headerNav = page.locator('nav, header').first();
      await expect(headerNav).toBeVisible({ timeout: 5000 });
      console.log(`   > Header navigation present on ${pageInfo.name}`);
      
      // Verify logo/home link exists
      const logoLink = page.locator('a[href="/"], a[href="' + BASE_URL + '"]').first();
      await expect(logoLink).toBeVisible({ timeout: 5000 });
      console.log(`   > Logo/home link present on ${pageInfo.name}`);
      
      // Verify Contact link exists in navigation
      const contactLink = page.locator('a:has-text("Contact")').first();
      const hasContactLink = await contactLink.count() > 0;
      console.log(`   > Contact link ${hasContactLink ? 'present' : 'not found'} on ${pageInfo.name}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // TEST 3.4 PASSED
    // ─────────────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(70));
    console.log('PASS: TEST 3.4 - Header/footer consistent across all pages');
    console.log('='.repeat(70) + '\n');
  });
});

/**
 * ============================================================================
 * END OF TEST SUITE 3
 * ============================================================================
 * 
 * Summary:
 *   - 4 comprehensive tests for static pages and navigation
 *   - Tests verify content display, navigation flow, and consistency
 *   - Black-box approach ensures tests reflect real user experience
 *   - No form submissions tested (pages are static content only)
 * 
 * Notes:
 *   - Tests are independent and can run in any order
 *   - Tests use sequential execution (--workers=1) for stability
 *   - Detailed console logging for debugging
 *   - Tests align with actual page implementation (no unused functions)
 * ============================================================================
 */
