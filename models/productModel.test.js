jest.mock("mongoose", () => {
  const captured = { def: null, opts: null, modelName: null, modelArg: null };

  class Schema {
    constructor(definition, options) {
      captured.def = definition;
      captured.opts = options;
    }
    index() {
      // no-op, but capture call if needed later
    }
  }

  const mock = {
    Schema,
    model: (name, schemaInstance) => {
      captured.modelName = name;
      captured.modelArg = schemaInstance;
      return { modelName: name, schema: schemaInstance };
    },
    ObjectId: Symbol.for("mongoose.ObjectId"),
    Types: { ObjectId: Symbol.for("mongoose.Types.ObjectId") },
    __captured: captured,
  };

  return mock;
});

import mongoose from "mongoose";
import Product from "./productModel.js";

describe("Products Model (schema-capture)", () => {
  test("exports a mongoose model with correct name", () => {
    expect(Product).toBeDefined();
    expect(Product.modelName).toBe("Products");
    expect(mongoose.__captured.modelName).toBe("Products");
  });

  test("enables timestamps", () => {
    expect(mongoose.__captured.opts?.timestamps).toBe(true);
  });

  test("field: name (String, required)", () => {
    const def = mongoose.__captured.def;
    expect(def.name.type).toBe(String);
    expect(def.name.required).toBe(true);
  });

  test("field: slug (String, required)", () => {
    const def = mongoose.__captured.def;
    expect(def.slug.type).toBe(String);
    expect(def.slug.required).toBe(true);
  });

  test("field: description (String, required)", () => {
    const def = mongoose.__captured.def;
    expect(def.description.type).toBe(String);
    expect(def.description.required).toBe(true);
  });

  test("field: price (Number, required)", () => {
    const def = mongoose.__captured.def;
    expect(def.price.type).toBe(Number);
    expect(def.price.required).toBe(true);
  });

  test('field: category (ObjectId ref "Category", required)', () => {
    const def = mongoose.__captured.def;
    // Accept either mongoose.ObjectId or mongoose.Types.ObjectId
    const oidToken = def.category.type;
    expect([mongoose.ObjectId, mongoose.Types.ObjectId]).toContain(oidToken);
    expect(def.category.ref).toBe("Category");
    expect(def.category.required).toBe(true);
  });

  test("field: quantity (Number, required)", () => {
    const def = mongoose.__captured.def;
    expect(def.quantity.type).toBe(Number);
    expect(def.quantity.required).toBe(true);
  });

  test("field: photo { data: Buffer, contentType: String }", () => {
    const def = mongoose.__captured.def;
    expect(def.photo.data).toBe(Buffer);
    expect(def.photo.contentType).toBe(String);
  });

  test("field: shipping { type: Boolean }", () => {
    const def = mongoose.__captured.def;
    expect(def.shipping.type).toBe(Boolean);
  });
});
