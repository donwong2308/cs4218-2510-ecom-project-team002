import fs from "fs";
import mongoose from "mongoose";

// Mock mongoose before importing the model
jest.mock("mongoose", () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    paths: {
      products: {
        instance: "Array",
        options: {
          type: [{ type: "ObjectId", ref: "Products" }],
        },
        isRequired: false,
      },
      payment: {
        instance: "Mixed",
        options: { type: {} },
        isRequired: false,
      },
      buyer: {
        instance: "ObjectID",
        options: {
          type: "ObjectId",
          ref: "users",
        },
        isRequired: false,
      },
      status: {
        instance: "String",
        options: {
          type: String,
          default: "Not Process",
          enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
        },
        isRequired: false,
      },
    },
    add: jest.fn(),
    method: jest.fn(),
    static: jest.fn(),
  }));

  const mockModel = jest.fn().mockReturnValue({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    populate: jest.fn(),
    modelName: "Order",
    schema: {},
  });

  // Create a mock ObjectId
  const mockObjectId = jest.fn();
  mockObjectId.toString = jest.fn().mockReturnValue("mockObjectId");

  return {
    Schema: mockSchema,
    model: mockModel,
    ObjectId: mockObjectId,
  };
});

// Import the model after mocking
import orderModel from "./orderModel.js";

describe("Order Model", () => {
  let fileContent;

  beforeAll(() => {
    // Read the orderModel.js file
    fileContent = fs.readFileSync("./models/orderModel.js", "utf8");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should export mongoose model", () => {
    expect(orderModel).toBeDefined();
    expect(typeof orderModel).toBe("object");
  });

  describe("Schema Field Definitions", () => {
    test("schema has the correct products field definition", () => {
      // Check for products field with array of ObjectId references
      expect(fileContent).toMatch(
        /products:\s*\[\s*{\s*type:\s*mongoose\.ObjectId,\s*ref:\s*["']Products["'],?\s*},?\s*\]/
      );
    });

    test("schema has the correct payment field definition", () => {
      // Check for payment field as empty object
      expect(fileContent).toMatch(/payment:\s*{}/);
    });

    test("schema has the correct buyer field definition", () => {
      // Check for buyer field with ObjectId reference to users
      expect(fileContent).toMatch(
        /buyer:\s*{\s*type:\s*mongoose\.ObjectId,\s*ref:\s*["']users["'],?\s*}/
      );
    });

    test("schema has the correct status field definition", () => {
      // Check for status field with String type, default value, and enum
      expect(fileContent).toMatch(/status:\s*{\s*type:\s*String,/);
      expect(fileContent).toMatch(/default:\s*["']Not Process["']/);
      expect(fileContent).toMatch(
        /enum:\s*\[\s*["']Not Process["'],\s*["']Processing["'],\s*["']Shipped["'],\s*["']deliverd["'],\s*["']cancel["']\s*\]/
      );
    });
  });

  describe("Schema Configuration", () => {
    test("schema has timestamps enabled", () => {
      expect(fileContent).toMatch(/{\s*timestamps:\s*true\s*}/);
    });

    test('model is named "Order"', () => {
      expect(fileContent).toMatch(/mongoose\.model\(\s*["']Order["']/);
    });
  });

  describe("Status Enum Values", () => {
    test("status enum contains all expected values", () => {
      const expectedStatuses = [
        "Not Process",
        "Processing",
        "Shipped",
        "deliverd",
        "cancel",
      ];

      expectedStatuses.forEach((status) => {
        expect(fileContent).toMatch(new RegExp(`["']${status}["']`));
      });
    });

    test('default status is "Not Process"', () => {
      expect(fileContent).toMatch(/default:\s*["']Not Process["']/);
    });
  });

  describe("Field References", () => {
    test('products field references "Products" model', () => {
      expect(fileContent).toMatch(/ref:\s*["']Products["']/);
    });

    test('buyer field references "users" model', () => {
      expect(fileContent).toMatch(/ref:\s*["']users["']/);
    });
  });

  describe("Field Types", () => {
    test("products field is an array of ObjectIds", () => {
      expect(fileContent).toMatch(
        /products:\s*\[\s*{\s*type:\s*mongoose\.ObjectId/
      );
    });

    test("buyer field is an ObjectId", () => {
      expect(fileContent).toMatch(/buyer:\s*{\s*type:\s*mongoose\.ObjectId/);
    });

    test("payment field is an object type", () => {
      expect(fileContent).toMatch(/payment:\s*{}/);
    });

    test("status field is a String type", () => {
      expect(fileContent).toMatch(/status:\s*{\s*type:\s*String/);
    });
  });

  describe("Model Export", () => {
    test("exports default mongoose model", () => {
      expect(fileContent).toMatch(/export\s+default\s+mongoose\.model/);
    });

    test("model export uses correct schema and name", () => {
      expect(fileContent).toMatch(
        /mongoose\.model\(\s*["']Order["'],\s*orderSchema\s*\)/
      );
    });
  });

  describe("Schema Structure Validation", () => {
    test("schema is properly defined with new mongoose.Schema", () => {
      expect(fileContent).toMatch(
        /const\s+orderSchema\s*=\s*new\s+mongoose\.Schema/
      );
    });

    test("schema contains all required fields", () => {
      const requiredFields = ["products", "payment", "buyer", "status"];

      requiredFields.forEach((field) => {
        expect(fileContent).toMatch(new RegExp(`${field}:`));
      });
    });
  });
});
