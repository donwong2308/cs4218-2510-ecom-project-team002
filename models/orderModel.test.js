import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import orderModel from "./orderModel.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await orderModel.deleteMany({});
});

describe("Order Model", () => {
  //
  // Model Creation & Field Defaults
  //
  describe("Model Creation & Field Defaults", () => {
    test("creates new order with default status value", async () => {
      const newOrder = await orderModel.create({});
      expect(newOrder.status).toMatch("Not Process");
    });

    test("creates order with specified processing status", async () => {
      const processingOrder = await orderModel.create({ status: "Processing" });
      expect(processingOrder.status).toMatch("Processing");
    });

    test("prevents creation with non-enumerated status", async () => {
      const invalidCreation = orderModel.create({ status: "InvalidStatus" });
      await expect(invalidCreation).rejects.toThrow();
    });

    test("handles empty product collection", async () => {
      const orderWithEmptyProducts = await orderModel.create({ products: [] });
      expect(orderWithEmptyProducts.products).toHaveLength(0);
    });

    test("stores single product reference", async () => {
      const singleProductOrder = await orderModel.create({
        products: [new mongoose.Types.ObjectId()],
      });
      expect(singleProductOrder.products).toHaveLength(1);
    });

    test("validates ObjectId format in product references", async () => {
      const invalidProductCreation = orderModel.create({
        products: ["invalid-objectid"],
      });
      await expect(invalidProductCreation).rejects.toThrow();
    });
  });

  //
  // Order Field Behavior Testing
  //
  describe("Order Field Behavior Testing", () => {
    test("automatically assigns timestamp fields on creation", async () => {
      const timestampedOrder = await orderModel.create({});
      expect(timestampedOrder.createdAt).toBeTruthy();
      expect(timestampedOrder.updatedAt).toBeTruthy();
    });

    test("maintains payment data structure integrity", async () => {
      const paymentOrder = await orderModel.create({
        payment: { method: "card", amount: 200 },
      });
      expect(paymentOrder.payment).toMatchObject({
        method: "card",
        amount: 200,
      });
    });

    test("correctly assigns buyer reference field", async () => {
      const customerRef = new mongoose.Types.ObjectId();
      const customerOrder = await orderModel.create({ buyer: customerRef });
      expect(customerOrder.buyer).toStrictEqual(customerRef);
    });

    test("verifies all permitted status enum values", async () => {
      const allowedStatuses = [
        "Not Process",
        "Processing",
        "Shipped",
        "deliverd",
        "cancel",
      ];

      for (const statusValue of allowedStatuses) {
        const statusOrder = await orderModel.create({ status: statusValue });
        expect(statusOrder.status).toEqual(statusValue);
      }
    });

    test("handles multiple product references in array", async () => {
      const multipleProductRefs = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];

      const multiProductOrder = await orderModel.create({
        products: multipleProductRefs,
      });
      expect(multiProductOrder.products).toHaveLength(3);
      expect(multiProductOrder.products[0]).toEqual(multipleProductRefs[0]);
      expect(multiProductOrder.products[1]).toEqual(multipleProductRefs[1]);
      expect(multiProductOrder.products[2]).toEqual(multipleProductRefs[2]);
    });
  });

  //
  // Input Validation & Error Cases
  //
  describe("Input Validation & Error Cases", () => {
    test("throws error when buyer contains invalid ObjectId", async () => {
      const invalidBuyerCreation = orderModel.create({ buyer: "invalid-id" });
      await expect(invalidBuyerCreation).rejects.toThrow();
    });

    test("rejects mixed invalid ObjectId in products collection", async () => {
      const mixedInvalidCreation = orderModel.create({
        products: [new mongoose.Types.ObjectId(), "invalid-id"],
      });
      await expect(mixedInvalidCreation).rejects.toThrow();
    });

    test("blocks non-enum status values", async () => {
      const badStatusCreation = orderModel.create({ status: "Pending" });
      await expect(badStatusCreation).rejects.toThrow();
    });

    test("prevents non-array product field assignment", async () => {
      const nonArrayCreation = orderModel.create({ products: "not-an-array" });
      await expect(nonArrayCreation).rejects.toThrow();
    });
  });

  //
  // Payment Data Structure Tests
  //
  describe("Payment Data Structure Tests", () => {
    test("accepts empty payment object without issues", async () => {
      const emptyPaymentOrder = await orderModel.create({ payment: {} });
      expect(emptyPaymentOrder.payment).toEqual({});
    });

    test("stores complex payment information correctly", async () => {
      const detailedPaymentInfo = {
        method: "credit_card",
        amount: 150.75,
        currency: "USD",
        transactionId: "txn_123456",
        gateway: "stripe",
      };

      const complexPaymentOrder = await orderModel.create({
        payment: detailedPaymentInfo,
      });
      expect(complexPaymentOrder.payment).toEqual(detailedPaymentInfo);
    });

    test("handles nested payment object structures", async () => {
      const nestedPaymentOrder = await orderModel.create({
        payment: { nested: { deep: { value: "test" } } },
      });
      expect(nestedPaymentOrder.payment.nested.deep.value).toBe("test");
    });

    test("allows null payment values", async () => {
      const nullPaymentOrder = await orderModel.create({ payment: null });
      expect(nullPaymentOrder.payment).toBeNull();
    });
  });

  //
  // Model Reference Testing
  //
  describe("Model Reference Testing", () => {
    test("validates product model reference linkage", async () => {
      const productReference = new mongoose.Types.ObjectId();
      const productLinkedOrder = await orderModel.create({
        products: [productReference],
      });

      // Verify reference storage integrity
      expect(productLinkedOrder.products[0]).toEqual(productReference);
      expect(
        mongoose.Types.ObjectId.isValid(productLinkedOrder.products[0])
      ).toBe(true);
    });

    test("confirms buyer user model reference", async () => {
      const userReference = new mongoose.Types.ObjectId();
      const userLinkedOrder = await orderModel.create({ buyer: userReference });

      // Verify buyer reference storage
      expect(userLinkedOrder.buyer).toEqual(userReference);
      expect(mongoose.Types.ObjectId.isValid(userLinkedOrder.buyer)).toBe(true);
    });

    test("permits undefined buyer field", async () => {
      const noBuyerOrder = await orderModel.create({});
      expect(noBuyerOrder.buyer).toBeUndefined();
    });

    test("permits empty products collection", async () => {
      const noProductsOrder = await orderModel.create({ products: [] });
      expect(noProductsOrder.products).toEqual([]);
    });
  });

  //
  // Timestamp Behavior Testing
  //
  describe("Timestamp Behavior Testing", () => {
    test("initializes createdAt and updatedAt timestamps", async () => {
      const timestampOrder = await orderModel.create({});

      expect(timestampOrder.createdAt).toBeInstanceOf(Date);
      expect(timestampOrder.updatedAt).toBeInstanceOf(Date);
      expect(timestampOrder.createdAt).toEqual(timestampOrder.updatedAt);
    });

    test("updates timestamp when order is modified", async () => {
      const modifiableOrder = await orderModel.create({});
      const originalUpdatedAt = modifiableOrder.updatedAt;

      // Wait briefly to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      modifiableOrder.status = "Processing";
      await modifiableOrder.save();

      expect(modifiableOrder.updatedAt).not.toEqual(originalUpdatedAt);
      expect(modifiableOrder.updatedAt > originalUpdatedAt).toBe(true);
    });
  });
});
