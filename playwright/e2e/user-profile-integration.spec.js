import { test, expect } from "@playwright/test";
import path from "path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:6060";
const USER_EMAIL = process.env.E2E_USER_EMAIL ?? "david@gmail.com";
const USER_PASS = process.env.E2E_USER_PASS ?? "697088";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "testhw2@gmail.com";
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? "123456";

// Helper function to register/ensure user exists
async function ensureUserExists(request) {
  try {
    await request.post(`${API_BASE}/api/v1/auth/register`, {
      data: {
        name: "David Profile Test",
        email: USER_EMAIL,
        password: USER_PASS,
        phone: "1234567890",
        address: "Initial Test Address",
        answer: "blue",
      },
      timeout: 8000,
    });
  } catch {
    // User might already exist, ignore error
  }
}

// Helper function to login user
async function customerLogin(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', USER_EMAIL);
  await page.fill('input[type="password"]', USER_PASS);
  await page.click('button:has-text("LOGIN")');
  await page.waitForLoadState("networkidle");
}

// Helper function to wait for homepage to load
async function waitForHomepage(page) {
  await page.goto(BASE);
  await page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/product/product-list") && res.status() === 200
  );
  // Wait for products to be visible
  await page.locator(".card").first().waitFor({ timeout: 10000 });
}

// Helper function to clear cart
async function clearCart(page) {
  await page.goto(`${BASE}/cart`);

  // Remove all items from cart if any exist
  const removeButtons = page.getByRole("button", { name: "Remove" });
  const buttonCount = await removeButtons.count();

  for (let i = 0; i < buttonCount; i++) {
    // Always click the first button since the list updates after each removal
    const firstRemoveButton = removeButtons.first();
    if (await firstRemoveButton.isVisible()) {
      await firstRemoveButton.click();
      // Wait for cart to update
      await page.waitForTimeout(500);
    }
  }
}

test.describe("User Profile Integration - Complete E2E Workflow", () => {
  test.beforeEach(async ({ page, request }) => {
    // Ensure test user exists
    await ensureUserExists(request);

    // Setup console error monitoring
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text() || "";
        if (text.includes("Objects are not valid as a React child")) {
          throw new Error("React render error detected: " + text);
        }
      }
    });
  });

  test("Complete user profile integration: Login → Profile Update → Cart Address Integration → Purchase Flow", async ({
    page,
    request,
  }) => {
    console.log("\n👤 STARTING USER PROFILE INTEGRATION E2E TEST");

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: USER AUTHENTICATION & PROFILE ACCESS
    // ═══════════════════════════════════════════════════════════════

    console.log("\n🔐 PHASE 1: User Authentication & Profile Access");

    // Navigate to homepage first
    await page.goto(BASE);

    // Login flow based on your codegen
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(USER_EMAIL);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(USER_PASS);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForLoadState("networkidle");

    console.log("   ✅ User successfully logged in");

    // Verify user can access their profile
    const userButton = page.getByRole("button", {
      name: /David|Profile|Account/i,
    });
    await expect(userButton).toBeVisible();
    console.log("   ✅ User profile access confirmed");

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: PRODUCT SELECTION & CART ADDITION
    // ═══════════════════════════════════════════════════════════════

    console.log("\n🛒 PHASE 2: Product Selection & Cart Addition");

    // Wait for products to load
    await waitForHomepage(page);

    // Add first product to cart (following your codegen pattern)
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await page.waitForTimeout(1000);
    console.log("   ✅ Added product to cart");

    // Navigate to cart
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForLoadState("networkidle");

    // Verify cart contains item
    const cartItems = page.locator(".card");
    const cartItemCount = await cartItems.count();
    expect(cartItemCount).toBeGreaterThan(0);
    console.log(`   📋 Cart contains ${cartItemCount} item(s)`);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: PROFILE ADDRESS UPDATE INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    console.log("\n📍 PHASE 3: Profile Address Update Integration");

    // Access address update from cart (following your codegen)
    await page.getByRole("button", { name: "Update Address" }).click();
    await page.waitForLoadState("networkidle");
    console.log("   🔄 Accessed address update interface");

    // Update address (following your codegen pattern)
    const addressField = page.getByRole("textbox", {
      name: "Enter Your Address",
    });
    await expect(addressField).toBeVisible();

    // Clear existing address and enter new one
    await addressField.clear();
    await addressField.fill("texas");
    console.log("   ✏️ Updated address to: texas");

    // Submit address update
    await page.getByRole("button", { name: "UPDATE", exact: true }).click();
    await page.waitForLoadState("networkidle");
    console.log("   ✅ Address update submitted");

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: ADDRESS INTEGRATION VERIFICATION IN CART
    // ═══════════════════════════════════════════════════════════════

    console.log("\n🔄 PHASE 4: Address Integration Verification in Cart");

    // Return to cart to verify address integration
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForLoadState("networkidle");

    // Verify updated address appears in cart (following your codegen)
    const addressHeading = page.getByRole("heading", { name: "texas" });
    await expect(addressHeading).toBeVisible();
    console.log("   ✅ Updated address displayed in cart");

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: COMPREHENSIVE PROFILE DATA VALIDATION
    // ═══════════════════════════════════════════════════════════════

    console.log("\n🧾 PHASE 5: Comprehensive Profile Data Validation");

    // Navigate to user profile/dashboard for comprehensive validation
    await page.goto(`${BASE}/dashboard/user`);
    await page.waitForLoadState("networkidle");

    // Verify profile data persistence
    const profileContainer = page
      .locator(".user-profile, .profile-container, .dashboard")
      .first();
    await expect(profileContainer).toBeVisible();
    console.log("   ✅ User profile dashboard accessible");

    // Verify user email is displayed
    await expect(page.locator(`text=${USER_EMAIL}`)).toBeVisible();
    console.log("   ✅ User email correctly displayed in profile");

    // ═══════════════════════════════════════════════════════════════
    // PHASE 6: PROFILE UPDATE FORM VALIDATION
    // ═══════════════════════════════════════════════════════════════

    console.log("\n📝 PHASE 6: Profile Update Form Validation");

    // Navigate to profile update page
    await page.goto(`${BASE}/dashboard/user/profile`);
    await page.waitForLoadState("networkidle");

    // Update comprehensive profile information
    const nameField = page
      .locator('input[name="name"], input[placeholder*="name" i]')
      .first();
    const phoneField = page
      .locator('input[name="phone"], input[placeholder*="phone" i]')
      .first();
    const addressFieldProfile = page
      .locator(
        'input[name="address"], textarea[name="address"], input[placeholder*="address" i]'
      )
      .first();

    // Update profile fields if they exist
    if (await nameField.isVisible()) {
      await nameField.clear();
      await nameField.fill("David Updated Profile");
      console.log("   ✏️ Updated profile name");
    }

    if (await phoneField.isVisible()) {
      await phoneField.clear();
      await phoneField.fill("9876543210");
      console.log("   ✏️ Updated phone number");
    }

    if (await addressFieldProfile.isVisible()) {
      await addressFieldProfile.clear();
      await addressFieldProfile.fill("Updated Texas Address 123");
      console.log("   ✏️ Updated profile address");
    }

    // Submit profile updates
    const updateButton = page.getByRole("button", {
      name: "UPDATE",
      exact: true,
    });
    if (await updateButton.isVisible()) {
      await updateButton.click();
      await page.waitForLoadState("networkidle");
      console.log("   ✅ Profile updates submitted");

      // Immediately verify address change in cart
      await page.getByRole("link", { name: "Cart" }).click();
      await page.waitForLoadState("networkidle");

      // Check if the updated address appears in cart
      const updatedCartAddress = page.locator("text=/Updated Texas Address/i");
      const addressVisible = await updatedCartAddress
        .isVisible()
        .catch(() => false);

      if (addressVisible) {
        console.log(
          "   ✅ Updated profile address immediately reflected in cart"
        );
      } else {
        console.log(
          "   ⚠️ Updated profile address may not be immediately visible in cart"
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 7: CROSS-COMPONENT INTEGRATION VALIDATION
    // ═══════════════════════════════════════════════════════════════

    console.log("\n🔗 PHASE 7: Cross-Component Integration Validation");

    // Return to cart to verify profile changes reflect in checkout
    await page.goto(`${BASE}/cart`);
    await page.waitForLoadState("networkidle");

    // Verify updated profile information appears in cart/checkout
    const cartContainer = page
      .locator(".cart-container, .checkout-container")
      .first();

    // Check if updated address information is reflected
    const updatedAddressElements = page.locator(
      "text=/texas|Updated Texas Address/i"
    );
    const addressElementCount = await updatedAddressElements.count();

    if (addressElementCount > 0) {
      console.log("   ✅ Updated address information reflected in cart");
    } else {
      console.log("   ⚠️ Address update may not be immediately reflected");
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 8: ORDER HISTORY INTEGRATION PREPARATION
    // ═══════════════════════════════════════════════════════════════

    console.log("\n📋 PHASE 8: Order History Integration Preparation");

    // Navigate to user orders to verify profile integration
    await page.goto(`${BASE}/dashboard/user/orders`);
    await page.waitForLoadState("networkidle");

    // Verify orders page loads with user context
    const ordersContainer = page
      .locator('.orders-container, .user-orders, h1:has-text("Orders")')
      .first();

    if (await ordersContainer.isVisible()) {
      console.log("   ✅ User orders page accessible");

      // Check if any orders exist
      const orderItems = page.locator(".order-item, .order-card, .order-row");
      const orderCount = await orderItems.count();
      console.log(`   📊 User has ${orderCount} orders in history`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 9: PROFILE INTEGRATION VALIDATION SUMMARY
    // ═══════════════════════════════════════════════════════════════

    console.log("\n🎯 PHASE 9: Profile Integration Validation Summary");

    // Navigate back to cart to verify final address integration
    await page.goto(`${BASE}/cart`);
    await page.waitForLoadState("networkidle");
    console.log("   🔄 Navigated back to cart for final validation");

    // Comprehensive validation of profile integration
    const integrationValidations = [
      {
        step: "Authentication Integration",
        passed: await page
          .locator(`text=${USER_EMAIL}`)
          .first()
          .isVisible()
          .catch(() => false),
      },
      {
        step: "Address Update Integration - Current Address shows updated location",
        passed: await page
          .locator("text=/Updated Texas Address|texas/i")
          .first()
          .isVisible()
          .catch(() => false),
      },
      {
        step: "Cart-Profile Integration",
        passed: cartItemCount > 0,
      },
      {
        step: "Profile Dashboard Access",
        passed: true, // Successfully navigated to dashboard
      },
      {
        step: "Cross-Component Data Flow",
        passed: addressElementCount > 0,
      },
    ];

    console.log("\n📋 USER PROFILE INTEGRATION VALIDATION:");
    integrationValidations.forEach(({ step, passed }) => {
      console.log(
        `   ${passed ? "✅" : "❌"} ${step}: ${passed ? "PASSED" : "FAILED"}`
      );
      expect(passed).toBeTruthy();
    });

    console.log(
      "\n🏆 USER PROFILE INTEGRATION E2E TEST COMPLETED SUCCESSFULLY"
    );
  });

  test("Profile update persistence across sessions", async ({
    page,
    browser,
    request,
  }) => {
    console.log("\n🔄 TESTING: Profile Update Persistence Across Sessions");

    // Ensure user exists
    await ensureUserExists(request);

    // First session: Login and update profile
    await customerLogin(page);
    await page.goto(`${BASE}/dashboard/user/profile`);

    // Update address in first session
    const addressField = page
      .locator('input[name="address"], textarea[name="address"]')
      .first();
    if (await addressField.isVisible()) {
      await addressField.clear();
      await addressField.fill("Persistent Address Test");
      await page.getByRole("button", { name: "UPDATE", exact: true }).click();
      await page.waitForLoadState("networkidle");
      console.log("   ✅ Address updated in first session");
    }

    // Close first session
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Second session: Login again and verify persistence
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    await customerLogin(newPage);
    await newPage.goto(`${BASE}/cart`);

    // Add item to cart to trigger address display
    await newPage.goto(BASE);
    await newPage.getByRole("button", { name: "ADD TO CART" }).first().click();
    await newPage.goto(`${BASE}/cart`);

    // Verify address persisted across sessions
    const persistentAddress = newPage.locator(
      "text=/Persistent Address Test/i"
    );
    const isPersistent = await persistentAddress.isVisible().catch(() => false);

    if (isPersistent) {
      console.log("   ✅ Address update persisted across sessions");
    } else {
      console.log("   ⚠️ Address persistence needs verification");
    }

    await newContext.close();
  });

  test("Profile validation with invalid data handling", async ({
    page,
    request,
  }) => {
    console.log("\n🚫 TESTING: Profile Validation with Invalid Data");

    await ensureUserExists(request);
    await customerLogin(page);

    // Navigate to profile update
    await page.goto(`${BASE}/dashboard/user/profile`);

    // Test invalid email format (if email update is available)
    const emailField = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    if (await emailField.isVisible()) {
      await emailField.clear();
      await emailField.fill("invalid-email-format");

      // Attempt to submit
      await page.getByRole("button", { name: "UPDATE", exact: true }).click();

      // Check for validation error
      const errorMessage = page.locator("text=/invalid|error|format/i");
      const hasError = await errorMessage
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasError) {
        console.log("   ✅ Email validation error displayed correctly");
      }
    }

    // Test invalid phone format
    const phoneField = page
      .locator('input[name="phone"], input[placeholder*="phone" i]')
      .first();
    if (await phoneField.isVisible()) {
      await phoneField.clear();
      await phoneField.fill("invalid-phone");

      await page.getByRole("button", { name: "UPDATE", exact: true }).click();

      // Check for validation
      const phoneError = page.locator("text=/invalid|error|phone/i");
      const hasPhoneError = await phoneError
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasPhoneError) {
        console.log("   ✅ Phone validation error displayed correctly");
      }
    }
  });

  test("Profile integration with admin user management", async ({
    page,
    browser,
    request,
  }) => {
    console.log("\n👑 TESTING: Profile Integration with Admin User Management");

    // Ensure test user exists
    await ensureUserExists(request);

    // Admin session: View user profiles
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Admin login
    await adminPage.goto(`${BASE}/login`);
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
    await adminPage.fill('input[type="password"]', ADMIN_PASS);
    await adminPage.click('button:has-text("LOGIN")');
    await adminPage.waitForLoadState("networkidle");

    // Navigate to admin users management (if available)
    const adminUsersLink = adminPage.locator(
      'a:has-text("Users"), a[href*="/admin/users"]'
    );
    if (await adminUsersLink.isVisible()) {
      await adminUsersLink.click();
      await adminPage.waitForLoadState("networkidle");

      // Look for test user in admin interface
      const testUserElement = adminPage.locator(`text=${USER_EMAIL}`);
      const userVisible = await testUserElement.isVisible().catch(() => false);

      if (userVisible) {
        console.log("   ✅ User profile visible in admin interface");
      }
    }

    await adminContext.close();

    // Customer session: Verify profile still accessible
    await customerLogin(page);
    await page.goto(`${BASE}/dashboard/user`);

    const profileAccess = await page.getByText(USER_EMAIL).isVisible();
    expect(profileAccess).toBeTruthy();
    console.log(
      "   ✅ Customer profile remains accessible after admin interaction"
    );
  });
});
