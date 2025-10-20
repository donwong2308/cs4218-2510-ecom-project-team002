
import request from "supertest";
import express from "express";
import productRoutes from "../routes/productRoutes.js";
import * as controller from "../controllers/productController.js";
import productModel from "../models/productModel.js";

// Create an express app for testing
const app = express();
app.use(express.json());
app.use("/api/v1", productRoutes);

// Mock productModel methods
jest.mock("../models/productModel.js", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(() => ({
      select: () => ({
        populate: () => null, // default, can be overridden per test
      }),
    })),
    findById: jest.fn(() => ({
      select: () => ({
        populate: () => null,
      }),
    })),
  },
}));

describe("GET /api/v1/product/get-product/:slug", () => {
  afterEach(() => jest.clearAllMocks());

  test("200 OK when product is found", async () => {
    const fakeProduct = {
      _id: "p123",
      slug: "super-gadget",
      name: "Super Gadget",
      price: 249.99,
      category: { _id: "c9", name: "Gadgets" },
    };

    productModel.findOne.mockReturnValueOnce({
      select: () => ({
        populate: () => fakeProduct,
      }),
    });

    const res = await request(app).get(
      "/api/v1/product/get-product/super-gadget"
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product).toMatchObject({
      slug: "super-gadget",
      name: "Super Gadget",
    });
  });

  test("404 Not Found when product is missing", async () => {
    productModel.findOne.mockReturnValueOnce({
      select: () => ({
        populate: () => null, // simulate not found
      }),
    });

    const res = await request(app).get(
      "/api/v1/product/get-product/unknown-slug"
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe("GET /api/v1/product/get-product-by-id/:id", () => {
  afterEach(() => jest.clearAllMocks());

  test("200 OK when product is found by id", async () => {
    const fakeProduct = { _id: "pid123", name: "By ID" };

    productModel.findById.mockReturnValueOnce({
      select: () => ({
        populate: () => fakeProduct,
      }),
    });

    const res = await request(app).get(
      "/api/v1/product/get-product-by-id/pid123"
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product).toMatchObject({ _id: "pid123", name: "By ID" });
  });

  test("404 Not Found when product id missing", async () => {
    productModel.findById.mockReturnValueOnce({
      select: () => ({
        populate: () => null,
      }),
    });

    const res = await request(app).get(
      "/api/v1/product/get-product-by-id/missing"
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// -------------------- Pagination & Count (server) --------------------
describe("GET /api/v1/product/product-count", () => {
  afterEach(() => jest.clearAllMocks());

  test("200 OK returns the total count", async () => {
    // Wire productModel.find().estimatedDocumentCount()
    const estimatedDocumentCount = jest.fn().mockResolvedValue(23);
    // Ensure .find returns a chain with estimatedDocumentCount
    productModel.find = jest.fn(() => ({ estimatedDocumentCount }));

    const res = await request(app).get("/api/v1/product/product-count");

    expect(res.status).toBe(200);
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(estimatedDocumentCount).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({ success: true, total: 23 });
  });

  test("400 when DB error", async () => {
    const estimatedDocumentCount = jest
      .fn()
      .mockRejectedValue(new Error("DB Down"));
    productModel.find = jest.fn(() => ({ estimatedDocumentCount }));

    const res = await request(app).get("/api/v1/product/product-count");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error in product count",
      error: "DB Down",
    });
  });
});

describe("GET /api/v1/product/product-list/:page", () => {
  afterEach(() => jest.clearAllMocks());

  // Helper to mock the full Mongoose chain:
  const mockFindChain = (allItems) => {
    let capturedSkip = 0;
    let capturedLimit;

    const sort = jest.fn().mockImplementation((sortArg) => {
      // Apply createdAt sort desc if present
      const arr = [...allItems].sort((a, b) =>
        sortArg?.createdAt === -1
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt)
      );
      const start = Number.isFinite(capturedSkip) ? capturedSkip : 0;
      let sliced = arr.slice(start);
      if (Number.isFinite(capturedLimit))
        sliced = sliced.slice(0, capturedLimit);
      return Promise.resolve(sliced);
    });

    const limit = jest.fn().mockImplementation((n) => {
      capturedLimit = n;
      return { sort };
    });

    const skip = jest.fn().mockImplementation((n) => {
      capturedSkip = n;
      return { limit, sort };
    });

    const select = jest.fn().mockReturnValue({ skip, limit, sort });

    productModel.find = jest
      .fn()
      .mockReturnValue({ select, skip, limit, sort });

    return { calls: { select, skip, limit, sort } };
  };

  const makeProduct = (i) => ({
    _id: `p${i}`,
    name: `Prod ${i}`,
    createdAt: new Date(2025, 0, i + 1),
  });

  test("Page 1 loads by default (6 per page); returns items and applies skip/limit/sort", async () => {
    const all = Array.from({ length: 14 }, (_, i) => makeProduct(i));
    const { calls } = mockFindChain(all);

    // Hit page 1
    const res = await request(app).get("/api/v1/product/product-list/1");

    // Controller should have applied chain correctly
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(calls.select).toHaveBeenCalledWith("-photo");
    expect(calls.skip).toHaveBeenCalledWith(0);
    expect(calls.limit).toHaveBeenCalledWith(6);
    expect(calls.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // 6 items on page 1
    expect(res.body.products).toHaveLength(6);
  });

  test("Next page fetches page 2 (items 7–12)", async () => {
    const all = Array.from({ length: 14 }, (_, i) => makeProduct(i));
    const { calls } = mockFindChain(all);

    const res = await request(app).get("/api/v1/product/product-list/2");

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(calls.select).toHaveBeenCalledWith("-photo");
    expect(calls.skip).toHaveBeenCalledWith(6); // (page-1)*6
    expect(calls.limit).toHaveBeenCalledWith(6);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveBeenCalled;
    expect(res.body.products).toHaveLength(6);
  });

  test("Page boundary: last page returns remaining items (e.g., 14 total ⇒ page 3 has 2)", async () => {
    const all = Array.from({ length: 14 }, (_, i) => makeProduct(i));
    const { calls } = mockFindChain(all);

    const res = await request(app).get("/api/v1/product/product-list/3");

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(calls.skip).toHaveBeenCalledWith(12); // (3-1)*6
    expect(calls.limit).toHaveBeenCalledWith(6);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Only 2 items remain on page 3
    expect(res.body.products).toHaveLength(2);
  });

  test("Page out of range returns empty array", async () => {
    const all = Array.from({ length: 12 }, (_, i) => makeProduct(i));
    const { calls } = mockFindChain(all);

    const res = await request(app).get("/api/v1/product/product-list/5");

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(calls.skip).toHaveBeenCalledWith(24); // (5-1)*6
    expect(calls.limit).toHaveBeenCalledWith(6);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(0);
  });

  test("DB error returns 400 and message", async () => {
    const sort = jest.fn().mockRejectedValue(new Error("DB Down"));
    const limit = jest.fn().mockReturnValue({ sort });
    const skip = jest.fn().mockReturnValue({ limit, sort });
    const select = jest.fn().mockReturnValue({ skip, limit, sort });
    productModel.find = jest
      .fn()
      .mockReturnValue({ select, skip, limit, sort });

    const res = await request(app).get("/api/v1/product/product-list/1");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error in per page ctrl",
      error: "DB Down",
    });
  });
});
