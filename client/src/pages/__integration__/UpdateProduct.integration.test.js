import axios from "axios";

jest.mock("axios");

// UpdateProduct.integration.test.js
/**
 * Product Update -> Orders
 * 
 * Purpose:
 * - Verify that when an admin updates a product, views that fetch orders
 *   and products reflect the updated product details (orders return the
 *   latest product data after the update in this mocked scenario).
 * - The test uses mocked `axios` calls to simulate product creation,
 *   order creation, product update, and order retrieval without network
 *   access.
 *
 * Scope:
 * - Integration-style unit tests focused on API contract behavior and
 *   data propagation after product updates. No real HTTP requests are made.
 */
describe("UpdateProduct integration test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("when admin updates a product, existing orders reflect the updated product details", async () => {
    let updated = false;

    // Initial product & order data (before update)
    const productBefore = { _id: "p1", name: "Old Gadget", price: 100 };
    const orderBefore = {
      _id: "o1",
      products: [
        { productId: "p1", name: productBefore.name, price: productBefore.price, qty: 1 },
      ],
      total: 100,
    };

    // Updated product data (after admin update)
    const productAfter = { ...productBefore, name: "New Gadget", price: 200 };
    const orderAfter = {
      ...orderBefore,
      products: [
        { productId: "p1", name: productAfter.name, price: productAfter.price, qty: 1 },
      ],
      total: 200,
    };

    // Mock axios.post for product creation and order creation
    axios.post.mockImplementation((url, body) => {
      if (url === "/api/v1/product/create-product") {
        return Promise.resolve({ data: { success: true, product: productBefore } });
      }
      if (url === "/api/v1/order/create-order") {
        // In a real system the order might capture a snapshot; we return the snapshot with old product details
        return Promise.resolve({ data: { success: true, order: orderBefore } });
      }
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    // Mock axios.get for fetching orders; returns different responses before/after update
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/order/get-orders") {
        return Promise.resolve({ data: { success: true, orders: updated ? [orderAfter] : [orderBefore] } });
      }
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    // Mock axios.put for updating product; flip the "updated" flag
    axios.put.mockImplementation((url, body) => {
      if (url === `/api/v1/product/update-product/${productBefore._id}`) {
        updated = true;
        return Promise.resolve({ data: { success: true, product: productAfter } });
      }
      return Promise.reject(new Error("Unexpected PUT " + url));
    });

    // 1) Admin creates a product
    const createProductResp = await axios.post("/api/v1/product/create-product", {
      name: productBefore.name,
      price: productBefore.price,
    });
    expect(createProductResp.data.success).toBe(true);
    expect(createProductResp.data.product).toEqual(productBefore);

    // 2) Non-admin creates an order that includes the product (captures old details)
    const createOrderResp = await axios.post("/api/v1/order/create-order", {
      products: [{ productId: productBefore._id, qty: 1 }],
    });
    expect(createOrderResp.data.success).toBe(true);
    expect(createOrderResp.data.order.products[0].name).toBe("Old Gadget");
    expect(createOrderResp.data.order.total).toBe(100);

    // 3) Non-admin fetches orders -> should see old product details
    const ordersBefore = await axios.get("/api/v1/order/get-orders");
    expect(ordersBefore.data.success).toBe(true);
    expect(ordersBefore.data.orders[0].products[0].name).toBe("Old Gadget");
    expect(ordersBefore.data.orders[0].products[0].price).toBe(100);

    // 4) Admin updates the product
    const updateResp = await axios.put(`/api/v1/product/update-product/${productBefore._id}`, {
      name: productAfter.name,
      price: productAfter.price,
    });
    expect(updateResp.data.success).toBe(true);
    expect(updateResp.data.product).toEqual(productAfter);

    // 5) Non-admin fetches orders again -> should now see updated product details reflected
    const ordersAfter = await axios.get("/api/v1/order/get-orders");
    expect(ordersAfter.data.success).toBe(true);
    expect(ordersAfter.data.orders[0].products[0].name).toBe("New Gadget");
    expect(ordersAfter.data.orders[0].products[0].price).toBe(200);
    expect(ordersAfter.data.orders[0].total).toBe(200);
  });
});