import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "../orderModel.js";
import User from "../userModel.js";

describe("Order Model Integration Tests", () => {
  let mongoServer;
  let testUser;
  let testProducts;

  // Helper function to create test order data
  const createTestOrder = (overrides = {}) => ({
    products: testProducts || [new mongoose.Types.ObjectId()],
    payment: { method: "card", amount: 100, transactionId: "test123" },
    buyer: testUser?._id || new mongoose.Types.ObjectId(),
    status: "Not Process",
    ...overrides,
  });

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});

    // Create test user and products for each test
    testUser = await User.create({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
      phone: "1234567890",
      address: { street: "123 Test St", city: "Test City" },
      answer: "test answer",
    });

    testProducts = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
  });

  describe("Order Creation and Validation", () => {
    test("should create an order successfully with valid data", async () => {
      // Arrange
      const orderData = createTestOrder();

      // Act
      const savedOrder = await Order.create(orderData);

      // Assert
      expect(savedOrder).toBeDefined();
      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.products).toHaveLength(2);
      expect(savedOrder.buyer.toString()).toBe(testUser._id.toString());
      expect(savedOrder.status).toBe("Not Process");
      expect(savedOrder.payment).toEqual(orderData.payment);
      expect(savedOrder.createdAt).toBeDefined();
      expect(savedOrder.updatedAt).toBeDefined();
    });

    test("should apply default status when not specified", async () => {
      // Arrange
      const orderData = createTestOrder();
      delete orderData.status;

      // Act
      const savedOrder = await Order.create(orderData);

      // Assert
      expect(savedOrder.status).toBe("Not Process");
    });

    test("should allow valid status values", async () => {
      const validStatuses = [
        "Not Process",
        "Processing",
        "Shipped",
        "deliverd",
        "cancel",
      ];

      for (const status of validStatuses) {
        // Arrange
        const orderData = createTestOrder({ status });

        // Act
        const savedOrder = await Order.create(orderData);

        // Assert
        expect(savedOrder.status).toBe(status);
      }
    });

    test("should create order with empty payment object", async () => {
      // Arrange
      const orderData = createTestOrder({ payment: {} });

      // Act
      const savedOrder = await Order.create(orderData);

      // Assert
      expect(savedOrder.payment).toEqual({});
    });

    test("should create order with single product", async () => {
      // Arrange
      const singleProduct = [new mongoose.Types.ObjectId()];
      const orderData = createTestOrder({ products: singleProduct });

      // Act
      const savedOrder = await Order.create(orderData);

      // Assert
      expect(savedOrder.products).toHaveLength(1);
      expect(savedOrder.products[0].toString()).toBe(
        singleProduct[0].toString()
      );
    });
  });

  describe("Order Query Operations", () => {
    test("should find orders by buyer", async () => {
      // Arrange
      const orderData1 = createTestOrder();
      const orderData2 = createTestOrder({ status: "Processing" });
      await Order.create(orderData1);
      await Order.create(orderData2);

      // Act
      const buyerOrders = await Order.find({ buyer: testUser._id });

      // Assert
      expect(buyerOrders).toHaveLength(2);
      expect(buyerOrders[0].buyer.toString()).toBe(testUser._id.toString());
      expect(buyerOrders[1].buyer.toString()).toBe(testUser._id.toString());
    });

    test("should find order by id", async () => {
      // Arrange
      const orderData = createTestOrder();
      const savedOrder = await Order.create(orderData);

      // Act
      const foundOrder = await Order.findById(savedOrder._id);

      // Assert
      expect(foundOrder).toBeDefined();
      expect(foundOrder._id.toString()).toBe(savedOrder._id.toString());
      expect(foundOrder.status).toBe("Not Process");
    });

    test("should return null for non-existent order", async () => {
      // Act
      const foundOrder = await Order.findById(new mongoose.Types.ObjectId());

      // Assert
      expect(foundOrder).toBeNull();
    });

    test("should find orders by status", async () => {
      // Arrange
      await Order.create(createTestOrder({ status: "Processing" }));
      await Order.create(createTestOrder({ status: "Shipped" }));
      await Order.create(createTestOrder({ status: "Processing" }));

      // Act
      const processingOrders = await Order.find({ status: "Processing" });
      const shippedOrders = await Order.find({ status: "Shipped" });

      // Assert
      expect(processingOrders).toHaveLength(2);
      expect(shippedOrders).toHaveLength(1);
      expect(shippedOrders[0].status).toBe("Shipped");
    });
  });

  describe("Order Update Operations", () => {
    test("should update order status successfully", async () => {
      // Arrange
      const orderData = createTestOrder();
      const savedOrder = await Order.create(orderData);

      // Act
      const updatedOrder = await Order.findByIdAndUpdate(
        savedOrder._id,
        { status: "Shipped" },
        { new: true }
      );

      // Assert
      expect(updatedOrder.status).toBe("Shipped");
      expect(updatedOrder._id.toString()).toBe(savedOrder._id.toString());
    });

    test("should update payment information", async () => {
      // Arrange
      const orderData = createTestOrder();
      const savedOrder = await Order.create(orderData);
      const newPayment = {
        method: "paypal",
        amount: 150,
        transactionId: "paypal456",
      };

      // Act
      const updatedOrder = await Order.findByIdAndUpdate(
        savedOrder._id,
        { payment: newPayment },
        { new: true }
      );

      // Assert
      expect(updatedOrder.payment).toEqual(newPayment);
      expect(updatedOrder.status).toBe(orderData.status); // unchanged
    });

    test("should handle update of non-existent order", async () => {
      // Act
      const result = await Order.findByIdAndUpdate(
        new mongoose.Types.ObjectId(),
        { status: "Shipped" },
        { new: true }
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("Order Deletion Operations", () => {
    test("should delete order successfully", async () => {
      // Arrange
      const orderData = createTestOrder();
      const savedOrder = await Order.create(orderData);

      // Act
      const deletedOrder = await Order.findByIdAndDelete(savedOrder._id);

      // Assert
      expect(deletedOrder).toBeDefined();
      expect(deletedOrder._id.toString()).toBe(savedOrder._id.toString());

      // Verify order is actually deleted
      const foundOrder = await Order.findById(savedOrder._id);
      expect(foundOrder).toBeNull();
    });

    test("should return null when deleting non-existent order", async () => {
      // Act
      const result = await Order.findByIdAndDelete(
        new mongoose.Types.ObjectId()
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("Order Business Logic Operations", () => {
    test("should find all orders for admin view", async () => {
      // Arrange
      await Order.create(createTestOrder({ status: "Processing" }));
      await Order.create(createTestOrder({ status: "Shipped" }));
      await Order.create(createTestOrder({ status: "deliverd" }));

      // Act
      const allOrders = await Order.find({});

      // Assert
      expect(allOrders).toHaveLength(3);
      expect(allOrders.map((o) => o.status)).toContain("Processing");
      expect(allOrders.map((o) => o.status)).toContain("Shipped");
      expect(allOrders.map((o) => o.status)).toContain("deliverd");
    });

    test("should count orders by status", async () => {
      // Arrange
      await Order.create(createTestOrder({ status: "Processing" }));
      await Order.create(createTestOrder({ status: "Processing" }));
      await Order.create(createTestOrder({ status: "Shipped" }));
      await Order.create(createTestOrder({ status: "cancel" }));

      // Act
      const processingCount = await Order.countDocuments({
        status: "Processing",
      });
      const shippedCount = await Order.countDocuments({ status: "Shipped" });
      const cancelledCount = await Order.countDocuments({ status: "cancel" });

      // Assert
      expect(processingCount).toBe(2);
      expect(shippedCount).toBe(1);
      expect(cancelledCount).toBe(1);
    });

    test("should handle order workflow transitions", async () => {
      // Arrange - Create order with default status
      const orderData = createTestOrder();
      const savedOrder = await Order.create(orderData);

      // Act & Assert - Simulate order workflow
      // Step 1: Order is processing
      let updatedOrder = await Order.findByIdAndUpdate(
        savedOrder._id,
        { status: "Processing" },
        { new: true }
      );
      expect(updatedOrder.status).toBe("Processing");

      // Step 2: Order is shipped
      updatedOrder = await Order.findByIdAndUpdate(
        savedOrder._id,
        { status: "Shipped" },
        { new: true }
      );
      expect(updatedOrder.status).toBe("Shipped");

      // Step 3: Order is delivered
      updatedOrder = await Order.findByIdAndUpdate(
        savedOrder._id,
        { status: "deliverd" },
        { new: true }
      );
      expect(updatedOrder.status).toBe("deliverd");
    });
  });

  describe("Order Collection Operations", () => {
    test("should delete all orders", async () => {
      // Arrange
      await Order.create(createTestOrder());
      await Order.create(createTestOrder({ status: "Processing" }));

      // Act
      await Order.deleteMany({});
      const remainingOrders = await Order.find();

      // Assert
      expect(remainingOrders).toHaveLength(0);
    });

    test("should update multiple orders", async () => {
      // Arrange
      await Order.create(createTestOrder({ status: "Processing" }));
      await Order.create(createTestOrder({ status: "Processing" }));
      await Order.create(createTestOrder({ status: "Shipped" }));

      // Act
      const result = await Order.updateMany(
        { status: "Processing" },
        { status: "Shipped" }
      );

      // Assert
      expect(result.modifiedCount).toBe(2);

      const updatedOrders = await Order.find({ status: "Shipped" });
      expect(updatedOrders).toHaveLength(3);
    });
  });
});
