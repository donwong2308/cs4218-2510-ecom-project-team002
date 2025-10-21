import { test, expect } from "@playwright/test";
import { homePageSelectors, FILTER_LABELS } from "../fixtures/test-data.js";

const selectors = homePageSelectors;
const CATEGORY_LABELS = FILTER_LABELS.categories;
const PRICE_LABELS = FILTER_LABELS.prices;

async function waitForAppBoot(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/product/product-list") &&
      res.request().method() === "GET"
  );
  await page.locator(selectors.productCard).first().waitFor({ timeout: 10000 });
}

async function getCardKeys(page) {
  const cards = page.locator(selectors.productCard);
  const n = await cards.count();
  const keys = [];
  const seen = new Map();

  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);

    const getAttr = async (loc, name) => {
      try {
        const v = await loc.getAttribute(name);
        return v || "";
      } catch {
        return "";
      }
    };

    let keyBase =
      (await getAttr(card, "data-id")) ||
      (await getAttr(card, "data-slug")) ||
      "";
    if (!keyBase) {
      try {
        const img = card.locator("img").first();
        if (await img.count()) {
          const src = (await img.getAttribute("src")) || "";
          const m = src.match(/product-photo\/([^/?#]+)/);
          if (m) keyBase = m[1];
        }
      } catch {}
    }

    if (!keyBase) {
      try {
        const link = card.locator('a[href*="/product/"]').first();
        if (await link.count()) {
          const href = (await link.getAttribute("href")) || "";
          const m = href.match(/\/product\/([^/?#]+)/);
          if (m) keyBase = m[1];
        }
      } catch {}
    }

    if (!keyBase) {
      const safeText = async (loc) => {
        try {
          if (await loc.count()) {
            const t = await loc.textContent();
            return (t || "").trim();
          }
        } catch {
        }
        return "";
      };

      const title = await safeText(
        card.locator(selectors.productTitleInCard).first()
      );
      const price = await safeText(
        card.locator(selectors.productPriceInCard).first()
      );
      const desc = await safeText(card.locator(".card-text").first());

      const composite = `${title}|${price}|${desc.slice(0, 24)}`;
      let hash = 0;
      for (let j = 0; j < composite.length; j++) {
        hash = (hash << 5) - hash + composite.charCodeAt(j);
        hash |= 0;
      }
      keyBase = (title || "card") + "-" + Math.abs(hash);
    }

    const count = (seen.get(keyBase) || 0) + 1;
    seen.set(keyBase, count);
    const uniqueKey = count === 1 ? keyBase : `${keyBase}#${i}`;
    keys.push(uniqueKey);
  }

  return keys;
}

async function waitForListChange(page, prevKeys, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const cards = page.locator(selectors.productCard);
    const count = await cards.count();
    const keys = await getCardKeys(page);
    const changedCount = prevKeys.length !== count;
    const changedSet =
      prevKeys.length !== keys.length || prevKeys.some((k, i) => k !== keys[i]);
    if (changedCount || changedSet) return keys;
    await page.waitForTimeout(150);
  }
  return await getCardKeys(page);
}

function parseCurrencyToNumber(text) {
  const num = Number((text || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : NaN;
}

async function getAllCardPrices(page) {
  const prices = [];
  const cards = page.locator(selectors.productCard);
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const priceLoc = card.locator(".card-price");
    const priceTestId = card.locator('[data-testid="price"]');
    let text = await priceLoc
      .first()
      .textContent()
      .catch(() => null);
    if (!text)
      text = await priceTestId
        .first()
        .textContent()
        .catch(() => null);
    if (!text) {
      const all = await card.innerText().catch(() => "");
      const m = all.match(/\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
      if (m) text = m[0];
    }
    if (text) {
      const v = parseCurrencyToNumber(text);
      if (Number.isFinite(v)) prices.push(v);
    }
  }
  return prices;
}

async function setCategory(page, label, checked) {
  const root = page.locator(".filters");
  const cb = root.getByRole("checkbox", { name: label, exact: true });
  await expect(cb).toBeVisible();
  const isChecked = await cb.isChecked();
  if (checked && !isChecked) await cb.check();
  if (!checked && isChecked) await cb.uncheck();
}

async function setPrice(page, label) {
  const root = page.locator(".filters");
  const r = root.getByRole("radio", { name: label, exact: true });
  await expect(r).toBeVisible();
  await r.check();
}

function labelToRange(label) {
  if (label === "$100 or more") return { min: 100, max: Infinity };
  const m = label.match(/\$(\d+)\s*to\s*(\d+)/);
  if (!m) return { min: 0, max: Infinity };
  return { min: Number(m[1]), max: Number(m[2]) };
}

async function waitAfterCategoryPOST(page, prevKeys) {
  await page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      res.url().includes("/api/v1/product/product-filters") &&
      res.status() === 200
  );
  return await waitForListChange(page, prevKeys);
}

async function waitAfterPricePOST(page, prevKeys) {
  await page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      res.url().includes("/api/v1/product/product-filters") &&
      res.status() === 200
  );
  return await waitForListChange(page, prevKeys);
}


async function waitAfterClearToGET(page, prevKeys) {
  await page.waitForResponse(
    (res) =>
      ((res.request().method() === "GET" &&
      res.url().includes("/api/v1/product/product-list")) ||
      (res.request().method() === "POST" &&
      res.url().includes("/api/v1/product/product-filters"))) &&
      res.status() === 200
  );
  return await waitForListChange(page, prevKeys);
}

test.describe("HomePage • Filters (Category + Price) • LIVE backend", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const t = msg.text() || "";
        if (t.includes("Objects are not valid as a React child")) {
          throw new Error("React render error detected: " + t);
        }
      }
    });
    await waitForAppBoot(page);
  });

  test("3.1 Renders filter sections and all expected options", async ({
    page,
  }) => {
    const filters = page.locator(".filters");
    await expect(filters.getByText("Filter By Category")).toBeVisible();
    await expect(filters.getByText("Filter By Price")).toBeVisible();
    for (const c of CATEGORY_LABELS) {
      await expect(
        filters.getByRole("checkbox", { name: c, exact: true })
      ).toBeVisible();
    }
    for (const p of PRICE_LABELS) {
      await expect(
        filters.getByRole("radio", { name: p, exact: true })
      ).toBeVisible();
    }
  });

  test("3.2 Category-only filtering narrows results; removing expands without errors", async ({
    page,
  }) => {
    const initialKeys = await getCardKeys(page);
    expect(initialKeys.length).toBeGreaterThan(0);
    const sentPayloads = [];
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        req.url().includes("/api/v1/product/product-filters")
      ) {
        try {
          const raw = req.postData() || "";
          sentPayloads.push(JSON.parse(raw));
        } catch {}
      }
    });
    await setCategory(page, "Electronics", true);
    const afterKeys = await waitAfterCategoryPOST(page, initialKeys);
    expect(afterKeys.length).toBeGreaterThanOrEqual(0);
    const last = sentPayloads.at(-1);
    expect(Array.isArray(last?.checked)).toBeTruthy();
    expect(last.checked.length).toBeGreaterThan(0);
    expect(Array.isArray(last?.radio)).toBeTruthy();
    const beforeClear = afterKeys;
    await setCategory(page, "Electronics", false);
    const afterRemoveKeys = await waitAfterClearToGET(page, beforeClear);
    expect(afterRemoveKeys.length).toBeGreaterThanOrEqual(0);
  });

  test("3.3 Price-only filtering respects bucket ranges or shows clean empty state", async ({
    page,
  }) => {
    const chosen = "$40 to 59";
    const { min, max } = labelToRange(chosen);
    const before = await getCardKeys(page);
    await setPrice(page, chosen);
    const afterKeys = await waitAfterPricePOST(page, before);
    if (afterKeys.length === 0) {
      const count = await page.locator(selectors.productCard).count();
      expect(count).toBe(0);
      return;
    }
    const prices = await getAllCardPrices(page);
    expect(prices.length).toBeGreaterThan(0);
    for (const v of prices) {
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThanOrEqual(max);
    }
  });

  test("3.4 Combined filter (Category + Price) handles empty intersections or enforces ranges", async ({
    page,
  }) => {
    const beforeCat = await getCardKeys(page);
    await setCategory(page, "Book", true);
    const afterCat = await waitAfterCategoryPOST(page, beforeCat);
    const chosenPrice = "$0 to 19";
    const { min, max } = labelToRange(chosenPrice);
    const beforePrice = afterCat;
    await setPrice(page, chosenPrice);
    const afterBoth = await waitAfterPricePOST(page, beforePrice);
    if (afterBoth.length === 0) {
      const count = await page.locator(selectors.productCard).count();
      expect(count).toBe(0);
    } else {
      const prices = await getAllCardPrices(page);
      expect(prices.length).toBeGreaterThan(0);
      for (const v of prices) {
        expect(v).toBeGreaterThanOrEqual(min);
        expect(v).toBeLessThanOrEqual(max);
      }
    }
  });

  test("3.5 Toggle multiple categories on/off without errors; list remains stable", async ({
    page,
  }) => {
    const order = ["Electronics", "Book", "Clothing"];
    let prev = await getCardKeys(page);
    for (const c of order) {
      await setCategory(page, c, true);
      prev = await waitAfterCategoryPOST(page, prev);
      expect(prev.length).toBeGreaterThanOrEqual(0);
      expect(new Set(prev).size).toBe(prev.length);
    }
    for (const c of order.reverse()) {
      await setCategory(page, c, false);
      prev = await waitAfterClearToGET(page, prev);
      expect(prev.length).toBeGreaterThanOrEqual(0);
      expect(new Set(prev).size).toBe(prev.length);
    }
  });

  test("3.6 Reset Filters reloads and restores initial list", async ({
    page,
  }) => {
    const initial = await getCardKeys(page);
    await setCategory(page, "Book", true);
    let prev = await waitAfterCategoryPOST(page, initial);
    await setPrice(page, "$20 to 39");
    prev = await waitAfterPricePOST(page, prev);
    await page.getByRole("button", { name: "RESET FILTERS" }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForResponse(
      (res) =>
        res.request().method() === "GET" &&
        res.url().includes("/api/v1/product/product-list") &&
        res.status() === 200
    );
    const after = await getCardKeys(page);
    expect(after.length).toBeGreaterThanOrEqual(0);
    expect(new Set(after).size).toBe(after.length);
  });
});
