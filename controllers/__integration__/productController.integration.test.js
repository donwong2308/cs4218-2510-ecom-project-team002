// __tests__/productController.integration.test.js
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
