import axios from "axios";

jest.mock("axios");


/**
 * UpdateCategoryReflectsOnHome.integration.test.js
 *
 * Category update -> Homepage/Product Listing
 * 
 * Purpose:
 * - Ensure category create/update/delete actions are reflected on the
 *   home endpoint and product listings (category names propagate to
 *   products and deletions hide associated products).
 * - Uses a mocked `axios` implementation to simulate the category and
 *   product lifecycle without network calls.
 *
 * Scope:
 * - Front-end integration-style checks for data propagation and API
 *   contract correctness. No external network requests are performed.
 */
describe("Category CRUD reflected on home (mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("create/update/delete category -> home and product listing reflect changes", async () => {
    const cat = { _id: "c1", name: "Electronics" };
    const prod = { _id: "p1", name: "Widget", category: cat._id, price: 10 };

    let catName = cat.name;
    let catDeleted = false;

    axios.post.mockImplementation((url, body) => {
      if (url === "/api/v1/category/create-category") return Promise.resolve({ data: { success: true, category: cat } });
      if (url === "/api/v1/product/create-product") return Promise.resolve({ data: { success: true, product: prod } });
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/home") {
        // home returns categories list and product list joined
        const categories = catDeleted ? [] : [{ ...cat, name: catName }];
        const products = catDeleted ? [] : [{ ...prod, categoryName: catName }];
        return Promise.resolve({ data: { success: true, categories, products } });
      }
      return Promise.reject(new Error("Unexpected GET " + url));
    });

    axios.put.mockImplementation((url, body) => {
      if (url === `/api/v1/category/update-category/${cat._id}`) {
        catName = body.name || catName;
        return Promise.resolve({ data: { success: true, category: { ...cat, name: catName } } });
      }
      return Promise.reject(new Error("Unexpected PUT " + url));
    });

    axios.delete.mockImplementation((url) => {
      if (url === `/api/v1/category/delete-category/${cat._id}`) {
        catDeleted = true;
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.reject(new Error("Unexpected DELETE " + url));
    });

    // create category & product
    const cResp = await axios.post("/api/v1/category/create-category", { name: cat.name });
    expect(cResp.data.success).toBe(true);

    const pResp = await axios.post("/api/v1/product/create-product", { name: prod.name, category: cat._id, price: prod.price });
    expect(pResp.data.success).toBe(true);

    // home reflects category and product
    const home1 = await axios.get("/api/v1/home");
    expect(home1.data.categories.find((c) => c._id === cat._id)).toBeTruthy();
    expect(home1.data.products.find((p) => p._id === prod._id)).toBeTruthy();

    // update category name
    const newName = "Gadgets";
    const upd = await axios.put(`/api/v1/category/update-category/${cat._id}`, { name: newName });
    expect(upd.data.success).toBe(true);

    const home2 = await axios.get("/api/v1/home");
    expect(home2.data.categories.some((c) => c.name === newName)).toBe(true);
    expect(home2.data.products.some((p) => p.categoryName === newName)).toBe(true);

    // delete category -> product hidden or moved (we simulate hidden)
    const del = await axios.delete(`/api/v1/category/delete-category/${cat._id}`);
    expect(del.data.success).toBe(true);

    const home3 = await axios.get("/api/v1/home");
    expect(home3.data.categories.find((c) => c._id === cat._id)).toBeUndefined();
    expect(home3.data.products.find((p) => p._id === prod._id)).toBeUndefined();
  });
});
