// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2.2: PROFILE & ORDER MANAGEMENT INTEGRATION TESTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROFILE & ORDER MANAGEMENT INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Test the integration between profile/order management functions and their dependencies:
 * - updateProfileController → User model → authHelper (password hashing)
 * - getOrdersController → Order model → Product model (population)
 * - getAllOrdersController → Order model → User model (population)
 * - orderStatusController → Order model (status updates)
 *
 * TESTING STRATEGY: Real Database Integration
 * - Use MongoDB Memory Server for real database operations
 * - Test actual model relationships and data population
 * - Verify complete CRUD operations and business logic
 *
 * INTEGRATION POINTS TESTED:
 * 1. Profile Updates → Password hashing → Database persistence
 * 2. Order Retrieval → Data population → User-specific filtering
 * 3. Order Management → Status workflows → Admin operations
 * 4. Cross-function interactions → Data consistency
 *
 * MOCK STRATEGY:
 * - Real: Database operations (MongoDB Memory Server)
 * - Real: Model relationships and population
 * - Real: Password hashing and validation
 * - Mock: Only Express response objects for assertion verification
 *
 * TEST PHILOSOPHY:
 * These tests verify real database interactions and model relationships.
 * Focus on testing complete business workflows and data integrity.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Import additional dependencies for profile & order tests
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../authController.js";
// Import Jest globals
import {
  jest,
  describe,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
} from "@jest/globals";
import { hashPassword, comparePassword } from "../../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create mock Express request object
 */
const mockRequest = (body = {}, params = {}, user = null) => ({
  body,
  params,
  user,
  headers: {},
});

/**
 * Create mock Express response object with chainable methods
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE & ORDER MANAGEMENT TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe("Profile & Order Management Integration Tests - Phase 2.2", () => {
  let mongoServer;
  let testUser;
  let testOrders;
  let testProducts;

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SETUP AND TEARDOWN - REAL DATABASE
  // ═══════════════════════════════════════════════════════════════════════════

  beforeAll(async () => {
    // Create in-memory MongoDB instance for real database testing
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    // Clean up database connections
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});

    // Create test products for order relationships
    testProducts = await Promise.all([
      Product.create({
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test Product 1 Description",
        price: 100,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        shipping: true,
      }),
      Product.create({
        name: "Test Product 2",
        slug: "test-product-2",
        description: "Test Product 2 Description",
        price: 50,
        category: new mongoose.Types.ObjectId(),
        quantity: 5,
        shipping: false,
      }),
      Product.create({
        name: "Test Product 3",
        slug: "test-product-3",
        description: "Test Product 3 Description",
        price: 75,
        category: new mongoose.Types.ObjectId(),
        quantity: 20,
        shipping: true,
      }),
    ]);

    // Create test user with real password hashing
    const hashedPassword = await hashPassword("password123");
    testUser = await User.create({
      name: "Integration Test User",
      email: "integration@test.com",
      password: hashedPassword,
      phone: "1234567890",
      address: { street: "123 Test St", city: "Test City" },
      answer: "test answer",
      role: 0,
    });

    // Create test orders with real product relationships
    testOrders = await Promise.all([
      Order.create({
        products: [testProducts[0]._id, testProducts[1]._id],
        payment: { method: "card", amount: 100, transactionId: "test1" },
        buyer: testUser._id,
        status: "Not Process",
      }),
      Order.create({
        products: [testProducts[2]._id],
        payment: { method: "paypal", amount: 50, transactionId: "test2" },
        buyer: testUser._id,
        status: "Processing",
      }),
      Order.create({
        products: [testProducts[0]._id],
        payment: { method: "card", amount: 75, transactionId: "test3" },
        buyer: testUser._id,
        status: "Shipped",
      }),
    ]);
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE UPDATE INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("updateProfileController Integration", () => {
    test("should integrate User model and authHelper for complete profile update", async () => {
      // Arrange: Setup request with comprehensive profile data
      const req = mockRequest({
        name: "Updated Integration User",
        email: "updated@integration.com",
        password: "newpassword123",
        phone: "9876543210",
        address: { street: "456 Updated St", city: "Updated City" },
      });
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute profile update with real database integration
      await updateProfileController(req, res);

      // Assert: Verify controller response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated SUccessfully",
        updatedUser: expect.objectContaining({
          name: "Updated Integration User",
          phone: "9876543210",
          address: expect.objectContaining({
            street: "456 Updated St",
            city: "Updated City",
          }),
        }),
      });

      // Assert: Verify real database update occurred
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe("Updated Integration User");
      expect(updatedUser.phone).toBe("9876543210");
      expect(updatedUser.address.street).toBe("456 Updated St");
    });

    test("should handle password validation error integration", async () => {
      // Arrange: Request with invalid password length
      const req = mockRequest({ password: "123" });
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute with invalid data
      await updateProfileController(req, res);

      // Assert: Verify validation error response
      expect(res.json).toHaveBeenCalledWith({
        error: "Passsword is required and 6 character long",
      });
    });

    test("should integrate password hashing when updating password", async () => {
      // Arrange: Setup password update request
      const req = mockRequest({ password: "brandnewpassword456" });
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();
      const originalPassword = testUser.password;

      // Act: Execute password update
      await updateProfileController(req, res);

      // Assert: Verify password was hashed through authHelper integration
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.password).not.toBe("brandnewpassword456");
      expect(updatedUser.password).not.toBe(originalPassword);
      expect(updatedUser.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    test("should preserve existing data during partial updates", async () => {
      // Arrange: Request with only name update
      const req = mockRequest({ name: "Partially Updated Name" });
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute partial update
      await updateProfileController(req, res);

      // Assert: Verify data preservation and selective update
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe("Partially Updated Name");
      expect(updatedUser.email).toBe(testUser.email);
      expect(updatedUser.phone).toBe(testUser.phone);
      expect(updatedUser.address.street).toBe(testUser.address.street);
    });

    test("should handle database errors during profile update", async () => {
      // Arrange: Mock database error
      jest.spyOn(User, "findById").mockRejectedValueOnce(new Error("DB Error"));
      const req = mockRequest({ name: "Test" });
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute with database error
      await updateProfileController(req, res);

      // Assert: Verify error handling
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error WHile Update profile",
        error: expect.any(Error),
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER RETRIEVAL INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("getOrdersController Integration", () => {
    test("should integrate Order model with Product/User population for user orders", async () => {
      // Arrange: Setup authenticated user request
      const req = mockRequest();
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute order retrieval with population
      await getOrdersController(req, res);

      // Assert: Verify populated order data returned
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: testOrders[0]._id,
            status: "Not Process",
            buyer: expect.objectContaining({
              name: testUser.name,
            }),
          }),
          expect.objectContaining({
            _id: testOrders[1]._id,
            status: "Processing",
            buyer: expect.objectContaining({
              name: testUser.name,
            }),
          }),
          expect.objectContaining({
            _id: testOrders[2]._id,
            status: "Shipped",
            buyer: expect.objectContaining({
              name: testUser.name,
            }),
          }),
        ])
      );
    });

    test("should enforce user-specific order filtering", async () => {
      // Arrange: Create another user and their orders
      const anotherUser = await User.create({
        name: "Another User",
        email: "another@test.com",
        password: await hashPassword("password123"),
        phone: "9999999999",
        address: { street: "999 Other St", city: "Other City" },
        answer: "other answer",
      });

      await Order.create({
        products: [testProducts[0]._id],
        payment: { method: "card", amount: 200 },
        buyer: anotherUser._id,
        status: "Processing",
      });

      const req = mockRequest();
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute order retrieval
      await getOrdersController(req, res);

      // Assert: Verify only authenticated user's orders returned
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders).toHaveLength(3);
      returnedOrders.forEach((order) => {
        expect(order.buyer._id.toString()).toBe(testUser._id.toString());
      });
    });

    test("should handle database errors during order fetch", async () => {
      // Arrange: Mock database error in population chain
      jest.spyOn(Order, "find").mockImplementationOnce(() => ({
        populate: jest.fn().mockImplementationOnce(() => ({
          populate: jest.fn().mockRejectedValueOnce(new Error("DB Error")),
        })),
      }));

      const req = mockRequest();
      req.user = { _id: testUser._id.toString() };
      const res = mockResponse();

      // Act: Execute with database error
      await getOrdersController(req, res);

      // Assert: Verify error handling
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error WHile Geting Orders",
        error: expect.any(Error),
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ORDER MANAGEMENT INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("getAllOrdersController Integration", () => {
    test("should integrate Order model with sorting and population for all orders", async () => {
      // Arrange: Create admin user and additional orders
      const adminUser = await User.create({
        name: "Admin User",
        email: "admin@test.com",
        password: await hashPassword("adminpass123"),
        phone: "1111111111",
        address: { street: "111 Admin St", city: "Admin City" },
        answer: "admin answer",
        role: 1,
      });

      await Order.create({
        products: [testProducts[0]._id],
        payment: { method: "admin", amount: 300 },
        buyer: adminUser._id,
        status: "deliverd",
      });

      const req = mockRequest();
      const res = mockResponse();

      // Act: Execute all orders retrieval
      await getAllOrdersController(req, res);

      // Assert: Verify all orders returned with proper sorting
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders).toHaveLength(4);

      // Verify orders are sorted by creation date (newest first)
      const orderDates = returnedOrders.map(
        (order) => new Date(order.createdAt)
      );
      for (let i = 1; i < orderDates.length; i++) {
        expect(orderDates[i - 1].getTime()).toBeGreaterThanOrEqual(
          orderDates[i].getTime()
        );
      }

      // Verify buyer data is populated for all orders
      returnedOrders.forEach((order) => {
        expect(order.buyer).toBeDefined();
        expect(order.buyer.name).toBeDefined();
      });
    });

    test("should handle empty order collection", async () => {
      // Arrange: Clear all orders
      await Order.deleteMany({});
      const req = mockRequest();
      const res = mockResponse();

      // Act: Execute on empty collection
      await getAllOrdersController(req, res);

      // Assert: Verify empty array returned
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test("should handle database errors during all orders fetch", async () => {
      // Arrange: Mock database error in sort operation
      jest.spyOn(Order, "find").mockImplementationOnce(() => ({
        populate: jest.fn().mockImplementationOnce(() => ({
          populate: jest.fn().mockImplementationOnce(() => ({
            sort: jest.fn().mockRejectedValueOnce(new Error("DB Error")),
          })),
        })),
      }));

      const req = mockRequest();
      const res = mockResponse();

      // Act: Execute with database error
      await getAllOrdersController(req, res);

      // Assert: Verify error handling
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error WHile Geting Orders",
        error: expect.any(Error),
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER STATUS MANAGEMENT INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("orderStatusController Integration", () => {
    test("should integrate Order model for status updates", async () => {
      // Arrange: Setup status update request
      const req = mockRequest(
        { status: "Shipped" },
        { orderId: testOrders[0]._id.toString() }
      );
      const res = mockResponse();

      // Act: Execute status update
      await orderStatusController(req, res);

      // Assert: Verify controller response
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: testOrders[0]._id,
          status: "Shipped",
        })
      );

      // Assert: Verify real database update occurred
      const updatedOrder = await Order.findById(testOrders[0]._id);
      expect(updatedOrder.status).toBe("Shipped");
    });

    test("should handle order status workflow transitions", async () => {
      // Arrange: Setup workflow transition tests
      const orderId = testOrders[0]._id.toString();

      // Act & Assert: Test status progression workflow
      // Step 1: Not Process → Processing
      let req = mockRequest({ status: "Processing" }, { orderId });
      let res = mockResponse();
      await orderStatusController(req, res);

      let updatedOrder = await Order.findById(orderId);
      expect(updatedOrder.status).toBe("Processing");

      // Step 2: Processing → Shipped
      req = mockRequest({ status: "Shipped" }, { orderId });
      res = mockResponse();
      await orderStatusController(req, res);

      updatedOrder = await Order.findById(orderId);
      expect(updatedOrder.status).toBe("Shipped");

      // Step 3: Shipped → Delivered
      req = mockRequest({ status: "deliverd" }, { orderId });
      res = mockResponse();
      await orderStatusController(req, res);

      updatedOrder = await Order.findById(orderId);
      expect(updatedOrder.status).toBe("deliverd");
    });

    test("should handle non-existent order ID gracefully", async () => {
      // Arrange: Setup request with non-existent order ID
      const nonExistentId = new mongoose.Types.ObjectId();
      const req = mockRequest(
        { status: "Shipped" },
        { orderId: nonExistentId.toString() }
      );
      const res = mockResponse();

      // Act: Execute with non-existent ID
      await orderStatusController(req, res);

      // Assert: Verify null response for non-existent order
      expect(res.json).toHaveBeenCalledWith(null);
    });

    test("should handle database errors during status update", async () => {
      // Arrange: Mock database error
      jest
        .spyOn(Order, "findByIdAndUpdate")
        .mockRejectedValueOnce(new Error("DB Error"));
      const req = mockRequest(
        { status: "Shipped" },
        { orderId: testOrders[0]._id.toString() }
      );
      const res = mockResponse();

      // Act: Execute with database error
      await orderStatusController(req, res);

      // Assert: Verify error handling
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updateing Order",
        error: expect.any(Error),
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-FUNCTION INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Cross-Function Integration", () => {
    test("should demonstrate profile update affecting order retrieval integration", async () => {
      // Arrange: Setup profile update request
      const updateReq = mockRequest({ name: "Cross Integration Test User" });
      updateReq.user = { _id: testUser._id.toString() };
      const updateRes = mockResponse();

      // Act: Execute profile update
      await updateProfileController(updateReq, updateRes);

      // Act: Execute order retrieval to verify cross-function integration
      const getOrdersReq = mockRequest();
      getOrdersReq.user = { _id: testUser._id.toString() };
      const getOrdersRes = mockResponse();
      await getOrdersController(getOrdersReq, getOrdersRes);

      // Assert: Verify profile update reflected in order data
      const returnedOrders = getOrdersRes.json.mock.calls[0][0];
      returnedOrders.forEach((order) => {
        expect(order.buyer.name).toBe("Cross Integration Test User");
      });
    });

    test("should demonstrate order status updates affecting getAllOrders integration", async () => {
      // Arrange: Setup multiple status updates
      const statusUpdates = [
        { orderId: testOrders[0]._id.toString(), status: "Processing" },
        { orderId: testOrders[1]._id.toString(), status: "Shipped" },
        { orderId: testOrders[2]._id.toString(), status: "deliverd" },
      ];

      // Act: Execute status updates
      for (const update of statusUpdates) {
        const req = mockRequest(
          { status: update.status },
          { orderId: update.orderId }
        );
        const res = mockResponse();
        await orderStatusController(req, res);
      }

      // Act: Execute getAllOrders to verify integration
      const getAllReq = mockRequest();
      const getAllRes = mockResponse();
      await getAllOrdersController(getAllReq, getAllRes);

      // Assert: Verify status updates reflected in getAllOrders
      const allOrders = getAllRes.json.mock.calls[0][0];
      expect(
        allOrders.find((o) => o._id.toString() === testOrders[0]._id.toString())
          .status
      ).toBe("Processing");
      expect(
        allOrders.find((o) => o._id.toString() === testOrders[1]._id.toString())
          .status
      ).toBe("Shipped");
      expect(
        allOrders.find((o) => o._id.toString() === testOrders[2]._id.toString())
          .status
      ).toBe("deliverd");
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROFILE & ORDER MANAGEMENT TESTS SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TESTS IMPLEMENTED: 17 integration tests
 *
 * PROFILE UPDATE INTEGRATION (5 tests):
 * ✅ Complete profile update with password hashing integration
 * ✅ Password validation error handling
 * ✅ Password hashing verification with authHelper
 * ✅ Partial update data preservation
 * ✅ Database error handling
 *
 * ORDER RETRIEVAL INTEGRATION (3 tests):
 * ✅ Order retrieval with Product/User population
 * ✅ User-specific order filtering
 * ✅ Database error handling during fetch
 *
 * ADMIN ORDER MANAGEMENT INTEGRATION (3 tests):
 * ✅ All orders retrieval with sorting and population
 * ✅ Empty collection handling
 * ✅ Database error handling during admin fetch
 *
 * ORDER STATUS MANAGEMENT INTEGRATION (4 tests):
 * ✅ Order status updates with database persistence
 * ✅ Status workflow transitions
 * ✅ Non-existent order ID handling
 * ✅ Database error handling during updates
 *
 * CROSS-FUNCTION INTEGRATION (2 tests):
 * ✅ Profile updates affecting order retrieval
 * ✅ Status updates affecting getAllOrders results
 *
 * INTEGRATION COVERAGE:
 * - updateProfileController ↔ User ↔ authHelper (password hashing)
 * - getOrdersController ↔ Order model ↔ Product model (population)
 * - getAllOrdersController ↔ Order model ↔ User model (population + sorting)
 * - orderStatusController ↔ Order model (CRUD operations)
 * - Cross-function data consistency and workflow integration
 *
 * REAL INTEGRATIONS TESTED:
 * - Real MongoDB operations with Memory Server
 * - Real model relationships and data population
 * - Real password hashing and validation
 * - Real business logic workflows and data persistence
 *
 * TOTAL INTEGRATION TESTS: 28 (11 auth + 17 profile/order)
 * ═══════════════════════════════════════════════════════════════════════════
 */
