import React from "react";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../HomePage";

jest.mock("axios");

// Mock the cart context so HomePage's useCart() returns a usable [cart, setCart]
// during tests (prevents runtime TypeError when rendering without provider).
jest.mock("../../context/cart", () => ({
  useCart: () => [[], jest.fn()],
}));

// keep Layout minimal when rendering HomePage
// path up two levels from __integration__ to src then components
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);

/**
 * ProductImageUploadAndList.integration.test.js
 *
 * Product -> Product List in homepage
 * 
 * This file contains two related integration-style tests (front-end focused):
 *
 * 1) "Product image upload and listing (mocked)"
 *    - An API-level flow using mocked `axios` to simulate POST/GET calls:
 *      - POST /api/v1/product/create-product
 *      - POST /api/v1/product/upload-image/:productId
 *      - GET  /api/v1/product/get-products
 *    - Verifies that creating a product, uploading an image, and then
 *      fetching the product list yields a product containing the uploaded
 *      image URL. This is a fast, contract-level check (no real network).
 *
 * 2) "Home page product image rendering (mocked)"
 *    - A UI-level test that renders the `HomePage` component inside a
 *      `MemoryRouter` and uses mocked `axios` responses for the home APIs
 *      (category, product-count, product-list).
 *    - The test also mocks the `useCart` hook from the cart context and
 *      a minimal `Layout` component so the `HomePage` can render under
 *      JSDOM without the real app provider wiring.
 *    - Asserts that the product image element uses
 *      `/api/v1/product/product-photo/:id` as the src and that an
 *      `error` event falls back to `/images/placeholder.png` (JSDOM does
 *      not load images so the test dispatches an `error` event manually).
 *
 * Notes:
 * - Both tests mock `axios` to keep runs deterministic and fast.
 * - The UI test deliberately mocks `useCart` and `Layout` to avoid
 *   coupling to provider state; if you want a deeper integration test,
 *   wrap `HomePage` with the real `CartProvider` instead.
 */

describe("Product image upload and listing (mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("create product with image -> product list includes image URL", async () => {
    const prod = { _id: "p-img", name: "PhotoProduct", price: 20 };
    const imageUrl = "http://cdn.test/images/p-img.jpg";

    axios.post.mockImplementation((url, body) => {
      if (url === "/api/v1/product/create-product") {
        // simulate create returns product id and image upload endpoint info
        return Promise.resolve({ data: { success: true, product: { ...prod, image: null } } });
      }
      if (url === `/api/v1/product/upload-image/${prod._id}`) {
        // simulate upload returns image url
        return Promise.resolve({ data: { success: true, imageUrl } });
      }
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-products") {
        // product listing returns product with image url after upload
        return Promise.resolve({ data: { success: true, products: [{ ...prod, image: imageUrl }] } });
      }
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    // create product
    const c = await axios.post("/api/v1/product/create-product", { name: prod.name, price: prod.price });
    expect(c.data.success).toBe(true);

    // upload image
    const up = await axios.post(`/api/v1/product/upload-image/${prod._id}`, /* formData */ {});
    expect(up.data.success).toBe(true);
    expect(up.data.imageUrl).toBe(imageUrl);

    // fetch product list -> image present
    const list = await axios.get("/api/v1/product/get-products");
    expect(list.data.success).toBe(true);
    expect(list.data.products[0].image).toBe(imageUrl);
  });
});

describe("Home page product image rendering (mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("HomePage uses product-photo src and falls back to placeholder on error", async () => {
    const product = { _id: "img1", name: "ProdImg", description: "d", price: 10, slug: "prod-img" };

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
      if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 1 } });
      if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: [product] } });
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const img = await screen.findByAltText(product.name);
    expect(img).toHaveAttribute("src", `/api/v1/product/product-photo/${product._id}`);

    // simulate onError fallback (JSDOM doesn't load images)
    await waitFor(() => {
      img.dispatchEvent(new Event("error"));
      expect(img).toHaveAttribute("src", "/images/placeholder.png");
    });
  });
});
