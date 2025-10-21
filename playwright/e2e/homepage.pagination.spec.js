import { test, expect } from "@playwright/test";
import { homePageSelectors } from "../fixtures/test-data.js";

const selectors = homePageSelectors;

async function waitForAppAndBackend(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("body").waitFor({ timeout: 10000 });

  const probes = [
    page.request.get("/api/v1/product/product-count"),
    page.request.get("/api/v1/category/get-category"),
    page.request.get("/api/v1/product/product-list/1"),
  ];

  let ok = false;
  for (const p of probes) {
    try {
      const r = await p;
      if (r && r.ok()) ok = true;
    } catch {}
  }
  if (!ok) {
    await page.waitForTimeout(800);
    const r = await page.request.get("/api/v1/product/product-count");
    if (!r.ok())
      throw new Error("Backend not reachable (product-count failed).");
  }
}

async function readCardKeys(page, cardLocator) {
  const count = await cardLocator.count();
  const keys = [];
  for (let i = 0; i < count; i++) {
    const card = cardLocator.nth(i);
    const dataId = await card.getAttribute("data-id");
    const dataSlug = await card.getAttribute("data-slug");
    let key = dataId || dataSlug;
    if (!key) {
      const title = await card
        .locator(selectors.productTitleInCard)
        .first()
        .textContent()
        .catch(() => "");
      key = (title || "").trim() || `idx-${i}`;
    }
    keys.push(key);
  }
  return keys;
}

function getListParams(urlStr) {
  const url = new URL(urlStr);
  let page = url.searchParams.get("page");
  let limit = url.searchParams.get("limit");
  let pageNum = page ? Number(page) : undefined;

  if (!Number.isFinite(pageNum)) {
    const m = url.pathname.match(/\/product-list\/(\d+)(?:\/|$)/);
    if (m) pageNum = Number(m[1]);
  }
  return {
    page: Number.isFinite(pageNum) ? pageNum : 1,
    limit: limit ? Number(limit) : undefined,
  };
}

test.describe("HomePage • product list/count integration + UI pagination", () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppAndBackend(page);
  });

  test("2.1 loads first page with correct count and page size; hides Load more at end", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/product/product-list") &&
        res.request().method() === "GET"
    );

    const cards = page.locator(selectors.productCard);
    await cards.first().waitFor({ timeout: 10000 });

    let prev = await cards.count();
    expect(prev).toBeGreaterThan(0);

    const loadMore = page.locator(selectors.loadMoreBtn);

    if (await loadMore.isVisible()) {
      await loadMore.click();
      await page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/product/product-list") &&
          res.request().method() === "GET"
      );
      const afterFirst = await cards.count();
      expect(afterFirst).toBeGreaterThan(prev);
      const pageSize = afterFirst - prev;
      prev = afterFirst;

      const safetyMaxPages = 20;
      let steps = 0;
      while ((await loadMore.isVisible()) && steps < safetyMaxPages) {
        steps++;
        await loadMore.click();
        await page.waitForResponse(
          (res) =>
            res.url().includes("/api/v1/product/product-list") &&
            res.request().method() === "GET"
        );
        const curr = await cards.count();
        const added = curr - prev;
        if (await loadMore.isVisible()) {
          expect(added).toBe(pageSize);
        } else {
          expect(added).toBeGreaterThan(0);
          expect(added).toBeLessThanOrEqual(pageSize);
        }
        prev = curr;
      }
    }

    await expect(loadMore).toBeHidden();
  });

  test("2.2 asserts controllers receive correct {page, limit} and respect page boundaries", async ({
    page,
  }) => {
    const seen = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        req.method() === "GET" &&
        url.includes("/api/v1/product/product-list")
      ) {
        const { page, limit } = getListParams(url);
        seen.push({ page, limit });
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const cards = page.locator(selectors.productCard);
    const loadMore = page.locator(selectors.loadMoreBtn);

    await cards.first().waitFor({ timeout: 10000 });

    const safetyMaxPages = 20;
    let clicks = 0;
    while ((await loadMore.isVisible()) && clicks < safetyMaxPages) {
      clicks++;
      await loadMore.click();
      await page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/product/product-list") &&
          res.request().method() === "GET"
      );
    }

    const rawPages = seen.map((s) => s.page).filter((n) => Number.isFinite(n));
    expect(rawPages.length).toBeGreaterThan(0);

    const pages = rawPages.filter((n, i, arr) => i === 0 || n !== arr[i - 1]);

    expect(pages[0]).toBe(1);
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i]).toBe(pages[i - 1] + 1);
    }

    const providedLimits = seen
      .map((s) => s.limit)
      .filter((v) => v !== undefined);
    for (const L of providedLimits) {
      expect(Number.isInteger(L) && L > 0 && L < 1000).toBeTruthy();
    }
  });

  test("2.3 error-state: list endpoint fails on a page → UI recovers; no lost/dup cards", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const cards = page.locator(selectors.productCard);
    const loadMore = page.locator(selectors.loadMoreBtn);

    await cards.first().waitFor({ timeout: 10000 });

    if (!(await loadMore.isVisible())) {
      test.info().annotations.push({
        type: "note",
        description: "Only one page of data; skipping error simulation.",
      });
      return;
    }

    const beforeKeys = new Set(await readCardKeys(page, cards));

    await page.route("**/api/v1/product/product-list**", async (route) => {
      const { page: pg } = getListParams(route.request().url());
      if (pg === 2) {
        await route.abort("failed");
        await page.unroute("**/api/v1/product/product-list**");
      } else {
        await route.fallback();
      }
    });

    await loadMore.click();
    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/product/product-list") &&
        res.request().method() === "GET"
    );

    const countAfterError = await cards.count();
    expect(countAfterError).toBe(beforeKeys.size);
    await expect(loadMore).toBeVisible();

    await loadMore.click();
    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/product/product-list") &&
        res.request().method() === "GET" &&
        res.status() === 200
    );

    const afterRetryKeys = await readCardKeys(page, cards);
    expect(afterRetryKeys.length).toBeGreaterThan(beforeKeys.size);
    const newItems = afterRetryKeys.slice(beforeKeys.size);
    for (const k of newItems) {
      expect(beforeKeys.has(k)).toBeFalsy();
    }
  });

  test("2.4 prev/next behavior: next appends; “prev” simulated by reload", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/product/product-list") &&
        res.request().method() === "GET"
    );

    const cards = page.locator(selectors.productCard);
    await cards.first().waitFor({ timeout: 10000 });

    const initialCount = await cards.count();

    const loadMore = page.locator(selectors.loadMoreBtn);
    if (await loadMore.isVisible()) {
      await loadMore.click();
      await page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/product/product-list") &&
          res.request().method() === "GET"
      );
      const afterNext = await cards.count();
      expect(afterNext).toBeGreaterThan(initialCount);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/product/product-list") &&
        res.request().method() === "GET"
    );
    const afterReload = await cards.count();
    expect(afterReload).toBe(initialCount);
  });
});
