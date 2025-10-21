import axios from "axios";

jest.mock("axios");

/**
 * DeletedProductNotInCart.integration.test.js
 * 
 * Product -> Cart
 *
 * Purpose:
 * - Verify that when an admin deletes a product, existing non-admin carts are sanitized
 *   and checkout attempts for removed items fail.
 *
 * Scope:
 * - Simulates product creation, adding to cart, admin deletion, cart fetch and checkout.
 * - Uses mocked axios for deterministic, fast integration tests of front-end logic.
 *
 * Flow validated:
 * 1) Create product and add to cart.
 * 2) Confirm cart contains the product.
 * 3) Admin deletes the product.
 * 4) Confirm cart is sanitized (product removed, totals updated).
 * 5) Confirm checkout fails when ordering a deleted product (simulated error/404).
 *
 * Notes:
 * - Keep mock implementations local to each test so they don't collide across tests.
 * - Adjust endpoint paths/response shapes if backend differs.
 */
describe("Deleted product flows - integration (mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("admin deletes product -> existing cart is sanitized and checkout fails", async () => {
    const prod = { _id: "p-del", name: "Removable", price: 50 };
    const cartBefore = { products: [{ productId: prod._id, name: prod.name, price: prod.price, qty: 1 }], total: 50 };
    const cartAfter = { products: [], total: 0 };

    let deleted = false;

    axios.post.mockImplementation((url, body) => {
      if (url === "/api/v1/product/create-product") return Promise.resolve({ data: { success: true, product: prod } });
      if (url === "/api/v1/cart/add") return Promise.resolve({ data: { success: true, cart: cartBefore } });
      if (url === "/api/v1/order/create-order") {
        if (deleted) return Promise.resolve({ data: { success: false, message: "product not found" }, status: 404 });
        return Promise.resolve({ data: { success: true, order: { _id: "o1", cart: cartBefore } } });
      }
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/cart") return Promise.resolve({ data: { success: true, cart: deleted ? cartAfter : cartBefore } });
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    axios.delete.mockImplementation((url) => {
      if (url === `/api/v1/product/delete-product/${prod._id}`) {
        deleted = true;
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.reject(new Error("Unexpected DELETE " + url));
    });

    // flow
    const createResp = await axios.post("/api/v1/product/create-product", { name: prod.name, price: prod.price });
    expect(createResp.data.success).toBe(true);

    const addResp = await axios.post("/api/v1/cart/add", { productId: prod._id, qty: 1 });
    expect(addResp.data.success).toBe(true);
    expect(addResp.data.cart.products).toHaveLength(1);

    const cartBeforeResp = await axios.get("/api/v1/cart");
    expect(cartBeforeResp.data.cart.products).toHaveLength(1);

    const delResp = await axios.delete(`/api/v1/product/delete-product/${prod._id}`);
    expect(delResp.data.success).toBe(true);

    const cartAfterResp = await axios.get("/api/v1/cart");
    expect(cartAfterResp.data.cart.products).toHaveLength(0);
    expect(cartAfterResp.data.cart.total).toBe(0);

    const checkout = await axios.post("/api/v1/order/create-order", { payment: "mock" });
    expect(checkout.data.success).toBe(false);
    expect(checkout.data.message).toMatch(/not found/i);
  });

  test("admin deletes product -> non-admin cart no longer contains product (minimal)", async () => {
    const prod = { _id: "p-del-2", name: "Removable2", price: 50 };
    const cartBefore = { products: [{ productId: prod._id, name: prod.name, price: prod.price, qty: 1 }] };
    const cartAfter = { products: [] };

    let deleted = false;

    axios.post.mockImplementation((url) => {
      if (url === "/api/v1/product/create-product") return Promise.resolve({ data: { success: true, product: prod } });
      if (url === "/api/v1/cart/add") return Promise.resolve({ data: { success: true, cart: cartBefore } });
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/cart") return Promise.resolve({ data: { success: true, cart: deleted ? cartAfter : cartBefore } });
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    axios.delete.mockImplementation((url) => {
      if (url === `/api/v1/product/delete-product/${prod._id}`) {
        deleted = true;
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.reject(new Error("Unexpected DELETE " + url));
    });

    await axios.post("/api/v1/product/create-product", { name: prod.name, price: prod.price });
    await axios.post("/api/v1/cart/add", { productId: prod._id, qty: 1 });

    const before = await axios.get("/api/v1/cart");
    expect(before.data.cart.products.length).toBe(1);

    await axios.delete(`/api/v1/product/delete-product/${prod._id}`);
    const after = await axios.get("/api/v1/cart");
    expect(after.data.cart.products.length).toBe(0);
  });
});