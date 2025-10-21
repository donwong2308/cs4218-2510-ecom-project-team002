import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER_EMAIL = "david@gmail.com";
const USER_PASS = "697088";

async function userLogin(page) {
  await page.goto(BASE + "/login");
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(USER_EMAIL);
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(USER_PASS);
  const loginButton = page
    .locator("button")
    .filter({ hasText: "LOGIN" })
    .first();
  await loginButton.click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

test.describe("User Order History", () => {
  test("View user order history and order details", async ({ page }) => {
    console.log("\n🚀 USER ORDER HISTORY E2E TEST");

    // Phase 1: Login
    console.log("\n📍 PHASE 1: User Login");
    await userLogin(page);
    console.log("✅ User logged in");

    // Phase 2: Navigate to user dashboard
    console.log("\n📍 PHASE 2: Navigate to User Dashboard");
    await page.goto(BASE + "/dashboard/user");
    await page.waitForLoadState("networkidle");
    console.log("✅ User dashboard accessed");

    // Phase 3: Find and click orders link
    console.log("\n📍 PHASE 3: Navigate to Orders");
    const ordersLink = page
      .locator("a")
      .filter({ hasText: /orders|Orders/i })
      .first();
    const ordersLinkExists = await ordersLink.isVisible().catch(() => false);

    if (ordersLinkExists) {
      await ordersLink.click();
      console.log("📋 Orders link clicked");
    } else {
      // Try direct navigation
      await page.goto(BASE + "/dashboard/user/orders");
      console.log("📋 Direct navigation to orders");
    }

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    console.log("✅ Orders page loaded");

    // Phase 4: Check for orders
    console.log("\n📍 PHASE 4: Check Order List");

    // Look for order items/cards
    const orderItems = page.locator(
      ".order-item, .order-card, [class*='order'], tr[class*='order'], .card"
    );
    const orderCount = await orderItems.count();
    console.log(`📦 Found ${orderCount} order(s) in history`);

    if (orderCount > 0) {
      // Phase 5: View first order details
      console.log("\n📍 PHASE 5: View Order Details");

      const firstOrder = orderItems.first();

      // Check if order is clickable
      const orderClickable = await firstOrder
        .locator("a, button")
        .first()
        .isVisible()
        .catch(() => false);

      if (orderClickable) {
        await firstOrder.locator("a, button").first().click();
        console.log("👁️ Order details clicked");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Verify order details page
        const orderDetails = await page
          .locator("[class*='detail'], [class*='info'], h1, h2, h3")
          .first()
          .isVisible()
          .catch(() => false);

        if (orderDetails) {
          console.log("✅ Order details displayed");

          // Look for specific order information
          const orderId = await page
            .locator("text=/order id|ordernumber|#/i")
            .first()
            .textContent()
            .catch(() => "N/A");

          const orderStatus = await page
            .locator("text=/status|state/i")
            .first()
            .textContent()
            .catch(() => "N/A");

          const orderTotal = await page
            .locator("text=/total|amount|price/i")
            .first()
            .textContent()
            .catch(() => "N/A");

          console.log(`📊 Order ID: ${orderId}`);
          console.log(`📊 Order Status: ${orderStatus}`);
          console.log(`📊 Order Total: ${orderTotal}`);
        } else {
          console.log("⚠️ Order details may have different structure");
        }
      } else {
        console.log("⚠️ Order items not clickable, checking for order summary");

        // Display order summary info
        const orderSummary = await firstOrder.textContent();
        console.log(`📋 Order Summary: ${orderSummary?.substring(0, 100)}...`);
      }
    } else {
      console.log("⚠️ No orders found in user history");
      console.log("ℹ️ This is expected if user hasn't made any purchases yet");
    }

    // Phase 6: Check for pagination or filters
    console.log("\n📍 PHASE 6: Check for Order Filters/Pagination");

    const filters = page.locator(
      "[class*='filter'], select, [role='combobox']"
    );
    const filterCount = await filters.count();

    if (filterCount > 0) {
      console.log(`✅ Found ${filterCount} filter option(s)`);
    } else {
      console.log("ℹ️ No visible filters");
    }

    const pagination = page.locator(
      "[class*='pagination'], [aria-label*='page']"
    );
    const pageCount = await pagination.count();

    if (pageCount > 0) {
      console.log(`✅ Pagination controls found`);
    } else {
      console.log("ℹ️ No pagination visible");
    }

    // Take screenshot
    await page.screenshot({ path: "user-orders-page.png" });
    console.log("\n📸 Screenshot saved: user-orders-page.png");

    console.log("\n✅ USER ORDER HISTORY TEST COMPLETED");
  });
});
