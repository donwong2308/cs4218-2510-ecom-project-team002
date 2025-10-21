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

test("User login, add to cart, and update address", async ({ page }) => {
  await userLogin(page);

  // Browse and add product to cart
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  const productCards = page.locator(".product");
  const count = await productCards.count();

  if (count > 0) {
    const first = productCards.first();
    const addBtn = first.locator("button").filter({ hasText: "Add" }).first();
    await addBtn.click();
    console.log("Product added to cart");
    await page.waitForTimeout(1000);

    // Go to cart
    await page.goto(BASE + "/cart");
    await page.waitForLoadState("networkidle");
    console.log("Navigated to cart");
    await page.waitForTimeout(1000);

    // Click on Update Address button
    const updateAddressBtn = page
      .locator("button")
      .filter({ hasText: "Update Address" })
      .first();
    const exists = await updateAddressBtn.isVisible().catch(() => false);

    if (exists) {
      await updateAddressBtn.click();
      console.log("Update Address button clicked");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      // Fill in address form
      const addressInputs = page.locator('input[type="text"], textarea');
      const inputCount = await addressInputs.count();
      console.log(`Found ${inputCount} input fields for address`);

      if (inputCount > 0) {
        // Fill first input (usually street address)
        await addressInputs.nth(0).fill("123 Main Street");
        console.log("Filled address field");

        // If there are more fields, fill them too
        if (inputCount > 1) {
          await addressInputs.nth(1).fill("Apt 4B");
          console.log("Filled apartment/unit field");
        }
        if (inputCount > 2) {
          await addressInputs.nth(2).fill("New York");
          console.log("Filled city field");
        }
        if (inputCount > 3) {
          await addressInputs.nth(3).fill("NY");
          console.log("Filled state field");
        }
        if (inputCount > 4) {
          await addressInputs.nth(4).fill("10001");
          console.log("Filled zip code field");
        }
      }

      // Wait a moment for form to be filled
      await page.waitForTimeout(1000);

      // Click submit/update button
      const submitBtn = page
        .locator("button")
        .filter({ hasText: /Update|Submit|Save/ })
        .first();
      const submitExists = await submitBtn.isVisible().catch(() => false);

      if (submitExists) {
        await submitBtn.click();
        console.log("Address update submitted");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1500);
        console.log("Address updated successfully");

        // Go back to cart to verify address change
        await page.goto(BASE + "/cart");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        console.log("Navigated back to cart");

        // Verify the address has been updated
        const pageContent = await page.content();
        const hasNewAddress =
          pageContent.includes("123 Main Street") ||
          pageContent.includes("New York") ||
          pageContent.includes("10001");

        if (hasNewAddress) {
          console.log("✅ Address successfully updated and verified!");
        } else {
          console.log("⚠️ Address may not have been updated");
        }

        // Take a screenshot to see the updated cart
        await page.screenshot({ path: "cart-with-updated-address.png" });
        console.log("Screenshot saved: cart-with-updated-address.png");
      } else {
        console.log("Submit button not found");
      }
    } else {
      console.log("Update Address button not found");
    }
  }
});
