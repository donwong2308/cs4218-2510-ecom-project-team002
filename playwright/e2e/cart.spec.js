import { test, expect } from "@playwright/test";

const selectors = {
  cartItem: ".cart-page .card.flex-row",
  cartTotal: ".cart-total",
  removeBtn: ".cart-remove-btn .btn-danger",
};

async function seedCart(page, items) {
  await page.addInitScript((seed) => {
    const alreadySeeded = sessionStorage.getItem("__seeded_cart");
    const hasCart = !!localStorage.getItem("cart");

    if (!alreadySeeded && !hasCart) {
      localStorage.setItem("cart", JSON.stringify(seed));
      sessionStorage.setItem("__seeded_cart", "1");
    }
  }, items);
}


async function stubBraintreeToken(page, token = "fake-token") {
  await page.route("**/api/v1/product/braintree/token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ clientToken: token }),
    })
  );
}

async function waitForCartStable(page, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const expectedLen = await page.evaluate(
      () => (JSON.parse(localStorage.getItem("cart") || "[]") || []).length
    );
    const domLen = await page.locator(selectors.cartItem).count();
    if (domLen === expectedLen) return expectedLen;
    await page.waitForTimeout(200);
  }
  return await page.locator(selectors.cartItem).count();
}

async function waitForProductPhotos(page, expectedCount, timeout = 15000) {
  if (expectedCount <= 0) return;
  const end = Date.now() + timeout;
  let seen = 0;

  while (seen < expectedCount) {
    const remaining = Math.max(1, end - Date.now());
    if (remaining === 1) throw new Error(`Timed out waiting for ${expectedCount} product photos`);

    await page.waitForResponse(
      (r) =>
        r.url().includes("/api/v1/product/product-photo/") &&
        r.request().method() === "GET" &&
        r.status() >= 200 &&
        r.status() < 400,
      { timeout: remaining }
    );
    seen += 1;
  }
}

function parseUsd(text) {
  const m = (text || "").match(/([\d.,]+)$/);
  if (!m) return NaN;
  return Number(m[1].replace(/,/g, ""));
}

const ITEMS = [
  {
    _id: "66db427fdb0119d9234b27f1",
    name: "Textbook",
    slug: "textbook",
    description: "A comprehensive textbook",
    price: 79.99,
    category: "66db427fdb0119d9234b27ef",
    shipping: false,
  },
  {
    _id: "66db427fdb0119d9234b27f3",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop",
    price: 1499.99,
    category: "66db427fdb0119d9234b27ed",
    shipping: true,
  },
];

test.describe("CartPage • UI flow (seed cart via localStorage)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const t = msg.text() || "";
        if (t.includes("Objects are not valid as a React child")) {
          throw new Error("React render error detected: " + t);
        }
      }
    });
    await stubBraintreeToken(page);
  });

  test("1) Renders seeded items and computes totals correctly", async ({ page }) => {
    await seedCart(page, ITEMS);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    const expected = await waitForCartStable(page);
    await waitForProductPhotos(page, expected);

    const cards = page.locator(selectors.cartItem);
    await expect(cards).toHaveCount(2);

    // Assert titles inside each card to avoid strict-mode text collisions
    for (let i = 0; i < ITEMS.length; i++) {
      await expect(cards.nth(i).locator(".card-title")).toHaveText(ITEMS[i].name);
      await expect(cards.nth(i).locator(".card-text")).toContainText(
        ITEMS[i].description.slice(0, 30)
      );
    }

    const totalText = await page.locator(selectors.cartTotal).innerText();
    const totalNum = parseUsd(totalText);
    expect(totalNum).toBeCloseTo(79.99 + 1499.99, 2); // 1579.98
  });

  test("2) Remove an item updates list + total; persists after reload", async ({ page }) => {
    await seedCart(page, ITEMS);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    let expected = await waitForCartStable(page);
    await waitForProductPhotos(page, expected);

    const cards = page.locator(selectors.cartItem);
    await expect(cards).toHaveCount(2);

    await cards.nth(0).locator(selectors.removeBtn).click();

    expected = await waitForCartStable(page);

    await expect(page.locator(selectors.cartItem)).toHaveCount(1);
    await expect(page.locator(selectors.cartItem).nth(0).locator(".card-title")).toHaveText(
      "Laptop"
    );

    const totalText = await page.locator(selectors.cartTotal).innerText();
    const totalNum = parseUsd(totalText);
    expect(totalNum).toBeCloseTo(1499.99, 2);

    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem("cart") || "[]")
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Laptop");
  
    await page.reload({ waitUntil: "domcontentloaded" });
    expected = await waitForCartStable(page);
    await expect(page.locator(selectors.cartItem)).toHaveCount(1);
    await expect(page.locator(selectors.cartItem).nth(0).locator(".card-title")).toHaveText(
      "Laptop"
    );
  });

  test("3) Empty cart shows ‘Your Cart Is Empty’ and total $0.00", async ({ page }) => {
    await seedCart(page, []);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    const expected = await waitForCartStable(page); // 0 items
    // no photos expected

    await expect(page.getByText("Your Cart Is Empty", { exact: false })).toBeVisible();
    const totalText = await page.locator(selectors.cartTotal).innerText();
    const totalNum = parseUsd(totalText);
    expect(totalNum).toBe(0);
  });
});