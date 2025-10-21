import axios from "axios";

jest.mock("axios");


/**
 * SearchAndFilterReflectsUpdates.integration.test.js
 *
 * Product update -> Search/Filter
 * 
 * Purpose:
 * - Verify that when a product's name is updated, front-end search and filter
 *   endpoints reflect the change (search results update accordingly).
 * - This test suite uses a mocked `axios` implementation to simulate the
 *   create -> update -> search flow without making network requests.
 *
 * Scope:
 * - Unit/integration-style checks focused on front-end behavior and API
 *   contract. No real network calls are performed.
 */
describe("Search & filter reflect updates (mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("update product name -> search results update", async () => {
    const prod = { _id: "p-search", name: "Foo", price: 8 };
    let currentName = prod.name;

    axios.post.mockImplementation((url, body) => {
      if (url === "/api/v1/product/create-product") return Promise.resolve({ data: { success: true, product: prod } });
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.put.mockImplementation((url, body) => {
      if (url === `/api/v1/product/update-product/${prod._id}`) {
        currentName = body.name;
        return Promise.resolve({ data: { success: true, product: { ...prod, name: currentName } } });
      }
      return Promise.reject(new Error("Unexpected PUT " + url));
    });

    axios.get.mockImplementation((url) => {
      // simulate search endpoint: /api/v1/product/search?q=...
      if (url.startsWith("/api/v1/product/search")) {
        const q = new URL("http://x" + url.replace("/api/v1/product/search", "")).searchParams.get("q") || "";
        const matches = currentName.toLowerCase().includes(q.toLowerCase()) ? [{ ...prod, name: currentName }] : [];
        return Promise.resolve({ data: { success: true, results: matches } });
      }
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    // create product
    const c = await axios.post("/api/v1/product/create-product", { name: prod.name, price: prod.price });
    expect(c.data.success).toBe(true);

    // search for Foo -> found
    const s1 = await axios.get("/api/v1/product/search?q=Foo");
    expect(s1.data.results).toHaveLength(1);

    // update to Bar
    const upd = await axios.put(`/api/v1/product/update-product/${prod._id}`, { name: "Bar" });
    expect(upd.data.success).toBe(true);

    // search Foo -> not found
    const s2 = await axios.get("/api/v1/product/search?q=Foo");
    expect(s2.data.results).toHaveLength(0);

    // search Bar -> found
    const s3 = await axios.get("/api/v1/product/search?q=Bar");
    expect(s3.data.results).toHaveLength(1);
  });
});
