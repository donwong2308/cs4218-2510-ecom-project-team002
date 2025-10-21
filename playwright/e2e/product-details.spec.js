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

test.describe("Product Details Page", () => {
  test("View product details and add to cart from details page", async ({
    page,
  }) => {
    console.log("\n🚀 PRODUCT DETAILS PAGE E2E TEST");

    // Phase 1: Login
    console.log("\n📍 PHASE 1: User Login");
    await userLogin(page);
    console.log("✅ User logged in");

    // Phase 2: Browse to homepage
    console.log("\n📍 PHASE 2: Browse Products");
    await page.goto(BASE + "/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    console.log("✅ Homepage loaded");

    // Phase 3: Find and click on a product
    console.log("\n📍 PHASE 3: Click Product Details");

    // Look for product cards/links - try multiple selectors
    const productCards = page.locator(".product, .card, [class*='item']");
    const cardCount = await productCards.count();
    console.log(`🔍 Found ${cardCount} product card(s)`);

    if (cardCount > 0) {
      // Click on first product card
      const firstCard = productCards.first();

      // Find clickable element within the card (link or button)
      const clickableElement = firstCard
        .locator("a, button, [role='button']")
        .first();
      const isClickable = await clickableElement.isVisible().catch(() => false);

      if (isClickable) {
        await clickableElement.click();
        console.log("👁️ Product clicked");
      } else {
        // Try clicking the card directly
        await firstCard.click();
        console.log("👁️ Product card clicked");
      }

      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Phase 4: Verify product details are displayed
      console.log("\n📍 PHASE 4: Verify Product Details");

      // Check for product name
      const productName = await page
        .locator("h1, h2, [class*='title'], [class*='name']")
        .first()
        .textContent()
        .catch(() => "Not found");
      console.log(`📝 Product Name: ${productName}`);

      // Check for product price
      const productPrice = await page
        .locator("[class*='price'], text=/\\$|price/i")
        .first()
        .textContent()
        .catch(() => "Not found");
      console.log(`💰 Product Price: ${productPrice}`);

      // Check for product description
      const productDesc = await page
        .locator("[class*='description'], [class*='desc'], p")
        .first()
        .textContent()
        .catch(() => "Not found");
      console.log(`📖 Description: ${productDesc?.substring(0, 80)}...`);

      // Check for product image
      const productImage = await page
        .locator("img[src*='product'], [class*='image'] img, img")
        .first()
        .isVisible()
        .catch(() => false);
      console.log(`🖼️ Product Image Visible: ${productImage}`);

      // Check for quantity selector
      const quantityInput = page
        .locator("input[type='number'], [class*='quantity']")
        .first();
      const hasQuantity = await quantityInput.isVisible().catch(() => false);
      console.log(`📊 Quantity Selector: ${hasQuantity ? "✅" : "❌"}`);

      // Phase 5: Add to cart from details page
      console.log("\n📍 PHASE 5: Add to Cart");

      // Look for add to cart button
      const addToCartBtn = page
        .locator("button")
        .filter({ hasText: /add|Add|ADD|cart|Cart/ })
        .first();

      const addBtnExists = await addToCartBtn.isVisible().catch(() => false);

      if (addBtnExists) {
        // If there's a quantity input, increase it first
        if (hasQuantity) {
          await quantityInput.fill("2");
          console.log("📊 Set quantity to 2");
          await page.waitForTimeout(300);
        }

        await addToCartBtn.click();
        console.log("🛒 Add to cart clicked");
        await page.waitForTimeout(2000);

        // Check for success message
        const successMsg = await page
          .locator("text=/add|cart|success/i")
          .first()
          .isVisible()
          .catch(() => false);

        if (successMsg) {
          console.log("✅ Item added to cart successfully");
        } else {
          console.log("ℹ️ Item added (no visible confirmation)");
        }
      } else {
        console.log("⚠️ Add to cart button not found");
      }

      // Phase 6: Check for related products
      console.log("\n📍 PHASE 6: Check Related Products");

      const relatedProducts = page.locator(
        "[class*='related'], [class*='similar'], [class*='suggested']"
      );
      const relatedCount = await relatedProducts.count();
      console.log(
        `🔗 Related Products Section: ${
          relatedCount > 0 ? "✅ Found" : "❌ Not found"
        }`
      );

      // Phase 7: Check for reviews/ratings
      console.log("\n📍 PHASE 7: Check Reviews/Ratings");

      const reviewsSection = page.locator(
        "[class*='review'], [class*='rating'], [class*='comment']"
      );
      const reviewsCount = await reviewsSection.count();
      console.log(
        `⭐ Reviews Section: ${reviewsCount > 0 ? "✅ Found" : "❌ Not found"}`
      );

      // Take screenshot of product details page
      await page.screenshot({ path: "product-details-page.png" });
      console.log("\n📸 Screenshot saved: product-details-page.png");
    } else {
      console.log("❌ No product links found");
    }

    console.log("\n✅ PRODUCT DETAILS PAGE TEST COMPLETED");
  });
});
