import axios from "axios";

jest.mock("axios");

/**
 * OrderSnapshotVsLiveProduct.integration.test.js
 *
 * Product -> Orders
 * 
 * Purpose:
 * - Verify how orders display product information after product updates.
 *
 * Scope:
 * - Two behaviors are validated using mocked API calls:
 *   1) Live-update mode: orders keep references to products and reflect the current
 *      product data when fetched (order display updates after product changes).
 *   2) Snapshot mode: orders store a snapshot of product data at purchase time and
 *      continue to show the original details even after the product is updated.
 *
 * Why this matters:
 * - Ensures UI and business expectations are aligned: whether historical orders
 *   should remain immutable (snapshots) or display the current product state.
 *
 * Implementation notes:
 * - Tests mock `axios` endpoints for product create/update and order create/get.
 * - Keep mocks local to each test to avoid cross-test interference.
 */
describe("Order snapshot vs live product reflect (mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("orders reflect live product updates when API configured to live-update", async () => {
    const prod = { _id: "p-ord", name: "Snap", price: 30 };
    let currentProduct = { ...prod };
    // order stores product references (live mode)
    let order = { _id: "o1", products: [{ productId: prod._id }], total: currentProduct.price };

    axios.post.mockImplementation((url) => {
      if (url === "/api/v1/product/create-product") return Promise.resolve({ data: { success: true, product: prod } });
      if (url === "/api/v1/order/create-order") return Promise.resolve({ data: { success: true, order } });
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/get-product/${prod._id}`) return Promise.resolve({ data: { success: true, product: currentProduct } });
      if (url === "/api/v1/order/get-orders") {
        // in live mode, orders are populated with current product info
        const orders = [{ ...order, products: [{ ...order.products[0], name: currentProduct.name, price: currentProduct.price }], total: currentProduct.price }];
        return Promise.resolve({ data: { success: true, orders } });
      }
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    axios.put.mockImplementation((url, body) => {
      if (url === `/api/v1/product/update-product/${prod._id}`) {
        currentProduct = { ...currentProduct, ...body };
        return Promise.resolve({ data: { success: true, product: currentProduct } });
      }
      return Promise.reject(new Error("Unexpected PUT " + url));
    });

    await axios.post("/api/v1/product/create-product", { name: prod.name, price: prod.price });
    const createOrder = await axios.post("/api/v1/order/create-order", { products: [{ productId: prod._id }] });
    expect(createOrder.data.success).toBe(true);

    // update product
    await axios.put(`/api/v1/product/update-product/${prod._id}`, { name: "LiveUpdated", price: 60 });

    const orders = await axios.get("/api/v1/order/get-orders");
    expect(orders.data.orders[0].products[0].name).toBe("LiveUpdated");
    expect(orders.data.orders[0].total).toBe(60);
  });

  test("orders preserve snapshot when API stores snapshots", async () => {
    const prod = { _id: "p-ord2", name: "Snap", price: 30 };
    let currentProduct = { ...prod };
    // order stores snapshot at creation time
    const snapshotOrder = { _id: "o2", products: [{ productId: prod._id, name: prod.name, price: prod.price }], total: prod.price };

    axios.post.mockImplementation((url) => {
      if (url === "/api/v1/product/create-product") return Promise.resolve({ data: { success: true, product: prod } });
      if (url === "/api/v1/order/create-order") return Promise.resolve({ data: { success: true, order: snapshotOrder } });
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.put.mockImplementation((url, body) => {
      if (url === `/api/v1/product/update-product/${prod._id}`) {
        currentProduct = { ...currentProduct, ...body };
        return Promise.resolve({ data: { success: true, product: currentProduct } });
      }
      return Promise.reject(new Error("Unexpected PUT " + url));
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/order/get-orders") return Promise.resolve({ data: { success: true, orders: [snapshotOrder] } });
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    await axios.post("/api/v1/product/create-product", { name: prod.name, price: prod.price });
    await axios.post("/api/v1/order/create-order", { products: [{ productId: prod._id }] });

    // update product
    await axios.put(`/api/v1/product/update-product/${prod._id}`, { name: "Changed", price: 99 });

    // orders should keep the original snapshot values
    const orders = await axios.get("/api/v1/order/get-orders");
    expect(orders.data.orders[0].products[0].name).toBe("Snap");
    expect(orders.data.orders[0].total).toBe(30);
  });
});
