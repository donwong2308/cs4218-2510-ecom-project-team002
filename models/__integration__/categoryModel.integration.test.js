import categoryModel from "../categoryModel.js";

describe("Category Model Integration (schema behavior without DB)", () => {
  test("lowercases slug when set", async () => {
    const doc = new categoryModel({ name: "Wearables", slug: "WeArAbLeS" });
    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.slug).toBe("wearables");
  });

  test("name is optional in current schema", async () => {
    const doc = new categoryModel({ slug: "misc" });
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  test("toObject contains expected fields", async () => {
    const doc = new categoryModel({ name: "Phones", slug: "PHONES" });
    await doc.validate();
    const obj = doc.toObject();
    expect(obj).toMatchObject({ name: "Phones", slug: "phones" });
  });
});


