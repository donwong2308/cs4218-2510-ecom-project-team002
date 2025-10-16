import {
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
  testController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import * as authHelper from "../helpers/authHelper.js";
import { hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

/**
 * Unit tests for authentication controllers
 *
 * These tests cover the main authentication endpoints:
 * 1. registerController: User registration with validation and duplicate checks
 * 2. loginController: User login with password verification and JWT generation
 * 3. forgotPasswordController: Password reset functionality
 *
 * Test Strategy: Communication-based testing using mocks and stubs
 * - Mocks: External dependencies (userModel, authHelper, JWT)
 * - Stubs: Controlled responses for various scenarios
 */

// Mock response factory - creates Express.js response object for testing
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res); // Chainable status method
  res.send = jest.fn().mockReturnValue(res); // Chainable send method
  res.json = jest.fn().mockReturnValue(res); // Chainable json method
  return res;
};

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");

describe("updateProfileController", () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "newpassword123",
        address: "123 Test St",
        phone: "1234567890",
      },
      user: {
        _id: "user123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Mock user model methods
    userModel.findById.mockResolvedValue({
      _id: "user123",
      name: "Original Name",
      password: "hashedoldpassword",
      phone: "0987654321",
      address: "Original Address",
    });

    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      name: "Test User",
      password: "hashednewpassword",
      phone: "1234567890",
      address: "123 Test St",
    });

    // Mock hash password function
    hashPassword.mockResolvedValue("hashednewpassword");
  });

  test("should update user profile successfully with all fields", async () => {
    // Call the controller
    await updateProfileController(req, res);

    // Assert user was found by ID
    expect(userModel.findById).toHaveBeenCalledWith("user123");

    // Assert password was hashed
    expect(hashPassword).toHaveBeenCalledWith("newpassword123");

    // Assert user was updated with new values
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "Test User",
        password: "hashednewpassword",
        phone: "1234567890",
        address: "123 Test St",
      },
      { new: true }
    );

    // Assert response was sent with success
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: expect.any(Object),
    });
  });

  test("should update user profile with only provided fields", async () => {
    // Set up request with only some fields
    req.body = {
      name: "New Name Only",
    };

    // Call the controller
    await updateProfileController(req, res);

    // Assert user was found by ID
    expect(userModel.findById).toHaveBeenCalledWith("user123");

    // Assert password was not hashed (since not provided)
    expect(hashPassword).not.toHaveBeenCalled();

    // Assert user was updated with mix of new and existing values
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "New Name Only",
        password: "hashedoldpassword", // Original value
        phone: "0987654321", // Original value
        address: "Original Address", // Original value
      },
      { new: true }
    );

    // Assert response was sent with success
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: expect.any(Object),
    });
  });

  test("should reject update if password is too short", async () => {
    // Set up request with short password
    req.body = {
      password: "short",
    };

    // Call the controller
    await updateProfileController(req, res);

    // Assert user was found by ID
    expect(userModel.findById).toHaveBeenCalledWith("user123");

    // Assert password was not hashed
    expect(hashPassword).not.toHaveBeenCalled();

    // Assert user was not updated
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();

    // Assert error response was sent
    expect(res.json).toHaveBeenCalledWith({
      error: "Passsword is required and 6 character long",
    });
  });

  test("should handle errors during update", async () => {
    // Mock error during update
    userModel.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

    // Call the controller
    await updateProfileController(req, res);

    // Assert error response was sent
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Update profile",
      error: expect.any(Error),
    });
  });
});

describe("getOrdersController", () => {
  let req;
  let res;
  let mockPopulateChain;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object with authenticated user
    req = {
      user: {
        _id: "user123",
      },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Setup mock orders data
    const mockOrders = [
      {
        _id: "order1",
        products: [{ name: "Product 1", price: 19.99 }],
        buyer: { name: "User Name" },
        status: "Processing",
        payment: {},
      },
      {
        _id: "order2",
        products: [{ name: "Product 2", price: 29.99 }],
        buyer: { name: "User Name" },
        status: "Shipped",
        payment: {},
      },
    ];

    // Create proper mock for orderModel with chained methods
    mockPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Set final populate call to resolve with orders
    mockPopulateChain.populate.mockImplementationOnce(() => mockPopulateChain);
    mockPopulateChain.populate.mockImplementationOnce(() =>
      Promise.resolve(mockOrders)
    );

    // Assign the mock to orderModel
    orderModel.find = jest.fn(() => mockPopulateChain);
  });

  test("should retrieve orders successfully for authenticated user", async () => {
    // Call the controller
    await getOrdersController(req, res);

    // Assert orderModel.find was called with correct user ID
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });

    // Assert populate methods were called
    expect(mockPopulateChain.populate).toHaveBeenCalledWith(
      "products",
      "-photo"
    );
    expect(mockPopulateChain.populate).toHaveBeenCalledWith("buyer", "name");

    // Assert response contains orders
    expect(res.json).toHaveBeenCalled();
  });

  test("should handle errors when retrieving orders fails", async () => {
    // Mock error in database query
    orderModel.find = jest.fn(() => {
      throw new Error("Database error");
    });

    // Call the controller
    await getOrdersController(req, res);

    // Assert error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: expect.any(Error),
    });
  });

  test("should return empty array when user has no orders", async () => {
    // Setup mock for empty orders result
    const emptyPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
    };

    emptyPopulateChain.populate.mockImplementationOnce(
      () => emptyPopulateChain
    );
    emptyPopulateChain.populate.mockImplementationOnce(() =>
      Promise.resolve([])
    );

    // Replace the orderModel mock
    orderModel.find = jest.fn(() => emptyPopulateChain);

    // Call the controller
    await getOrdersController(req, res);

    // Assert response contains empty array
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe("getAllOrdersController", () => {
  let req;
  let res;
  let mockPopulateChain;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object (doesn't need authentication for this endpoint)
    req = {};

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Setup mock orders data
    const mockOrders = [
      {
        _id: "order1",
        products: [{ name: "Product 1", price: 19.99 }],
        buyer: { name: "User 1" },
        status: "Processing",
        payment: {},
        createdAt: new Date("2023-01-15"),
      },
      {
        _id: "order2",
        products: [{ name: "Product 2", price: 29.99 }],
        buyer: { name: "User 2" },
        status: "Shipped",
        payment: {},
        createdAt: new Date("2023-01-20"),
      },
    ];

    // Create proper mock for orderModel with chained methods
    mockPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
    };

    // Set up chained methods to resolve with orders
    mockPopulateChain.populate.mockImplementationOnce(() => mockPopulateChain);
    mockPopulateChain.populate.mockImplementationOnce(() => mockPopulateChain);
    mockPopulateChain.sort.mockImplementationOnce(() =>
      Promise.resolve(mockOrders)
    );

    // Assign the mock to orderModel
    orderModel.find = jest.fn(() => mockPopulateChain);
  });

  test("should retrieve all orders successfully", async () => {
    // Call the controller
    await getAllOrdersController(req, res);

    // Assert orderModel.find was called with empty object to get all orders
    expect(orderModel.find).toHaveBeenCalledWith({});

    // Assert populate methods were called with correct parameters
    expect(mockPopulateChain.populate).toHaveBeenCalledWith(
      "products",
      "-photo"
    );
    expect(mockPopulateChain.populate).toHaveBeenCalledWith("buyer", "name");

    // Assert sort was called with correct parameters
    expect(mockPopulateChain.sort).toHaveBeenCalledWith({ createdAt: "-1" });

    // Assert response contains orders
    expect(res.json).toHaveBeenCalled();
  });

  test("should handle errors when retrieving all orders fails", async () => {
    // Mock error in database query
    orderModel.find = jest.fn(() => {
      throw new Error("Database error");
    });

    // Call the controller
    await getAllOrdersController(req, res);

    // Assert error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: expect.any(Error),
    });
  });

  test("should return empty array when there are no orders", async () => {
    // Setup mock for empty orders result
    const emptyPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
    };

    emptyPopulateChain.populate.mockImplementationOnce(
      () => emptyPopulateChain
    );
    emptyPopulateChain.populate.mockImplementationOnce(
      () => emptyPopulateChain
    );
    emptyPopulateChain.sort.mockImplementationOnce(() => Promise.resolve([]));

    // Replace the orderModel mock
    orderModel.find = jest.fn(() => emptyPopulateChain);

    // Call the controller
    await getAllOrdersController(req, res);

    // Assert response contains empty array
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe("orderStatusController", () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object with order ID parameter and status in body
    req = {
      params: {
        orderId: "order123",
      },
      body: {
        status: "Completed",
      },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Mock order data that would be returned after update
    const updatedOrder = {
      _id: "order123",
      products: [{ name: "Product 1", price: 19.99 }],
      buyer: { name: "User 1" },
      status: "Completed",
      payment: {},
    };

    // Mock findByIdAndUpdate to return the updated order
    orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);
  });

  test("should update order status successfully", async () => {
    // Call the controller
    await orderStatusController(req, res);

    // Assert findByIdAndUpdate was called with correct parameters
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order123",
      { status: "Completed" },
      { new: true }
    );

    // Assert response contains updated order
    expect(res.json).toHaveBeenCalled();
  });

  test("should handle errors when updating order status fails", async () => {
    // Mock database error during update
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

    // Call the controller
    await orderStatusController(req, res);

    // Assert error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Updateing Order",
      error: expect.any(Error),
    });
  });

  test("should update to different status values", async () => {
    // Test with different status values
    const statusValues = ["Processing", "Shipped", "Delivered", "Cancelled"];

    for (const statusValue of statusValues) {
      // Reset mocks for each iteration
      jest.clearAllMocks();

      // Set status in request body
      req.body.status = statusValue;

      // Mock updated order with this status
      const updatedOrder = {
        _id: "order123",
        status: statusValue,
      };
      orderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);

      // Call the controller
      await orderStatusController(req, res);

      // Assert findByIdAndUpdate was called with correct status
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "order123",
        { status: statusValue },
        { new: true }
      );

      // Assert response contains updated order
      expect(res.json).toHaveBeenCalledWith(updatedOrder);
    }
  });
});

describe("testController - Protected Routes Test", () => {
  /**
   * Test: Successful protected route access
   * Purpose: Verify that the testController returns success message for protected routes
   * Approach: Output-based testing - verify the response message
   * Expected: Controller should send "Protected Routes" message
   */
  test("should return Protected Routes message successfully", async () => {
    const req = {}; // No parameters needed for this controller
    const res = createRes();

    // Call the actual controller function
    await testController(req, res);

    // Verify the response message
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  /**
   * Test: Error handling in protected route
   * Purpose: Verify that the controller handles unexpected errors gracefully
   * Approach: Communication-based testing - mock res.send to throw error
   * Expected: Controller should catch error and send error response
   */
  test("should handle errors and send error response", async () => {
    const req = {};
    const res = {
      send: jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error in response");
      }),
    };

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Call the controller - it should catch the error
    await testController(req, res);

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();
    const loggedError = consoleSpy.mock.calls[0][0];
    expect(loggedError).toBeInstanceOf(Error);

    consoleSpy.mockRestore();
  });
});

describe("Authentication Controllers", () => {
  beforeAll(() => {
    // Ensure JWT_SECRET is available for token generation tests
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  });

  afterEach(() => {
    // Clean up mocks after each test to prevent interference
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("registerController", () => {
    /**
     * Test input validation - missing required name field
     * Bug Found: Controller should validate all required fields before processing
     * Test Type: State-based (input validation)
     */
    test("should return error when name is missing", async () => {
      // Missing 'name' field in request body
      const req = {
        body: {
          email: "a@b.com",
          password: "123456",
          phone: "1234567890",
          address: "addr",
          answer: "ans",
        },
      };
      const res = createRes();

      await registerController(req, res);

      // Verify proper error response for missing name
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    /**
     * Test duplicate user handling
     * Bug Found: System should prevent duplicate email registrations
     * Test Type: Communication-based (database interaction)
     */
    test("should return message when user already exists", async () => {
      // Mock findOne to return existing user (simulating duplicate email)
      jest.spyOn(userModel, "findOne").mockResolvedValue({ _id: "u1" });

      const req = {
        body: {
          name: "John",
          email: "a@b.com",
          password: "123456",
          phone: "1234567890",
          address: "addr",
          answer: "ans",
        },
      };
      const res = createRes();

      await registerController(req, res);

      // Verify database was checked for existing user
      expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
      // Verify appropriate response for duplicate user
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
    });

    /**
     * Test successful user registration
     * Tests complete registration flow: validation -> password hashing -> user creation
     * Test Type: Communication-based (full integration with mocked dependencies)
     */
    test("should register user successfully and return 201", async () => {
      // Mock successful registration flow
      jest.spyOn(userModel, "findOne").mockResolvedValue(null); // No existing user
      jest.spyOn(authHelper, "hashPassword").mockResolvedValue("hashed_pwd");

      const savedUser = {
        _id: "user123",
        name: "John",
        email: "a@b.com",
        phone: "1234567890",
        address: "addr",
        role: 0,
      };
      jest.spyOn(userModel.prototype, "save").mockResolvedValue(savedUser);

      const req = {
        body: {
          name: "John",
          email: "a@b.com",
          password: "123456",
          phone: "1234567890",
          address: "addr",
          answer: "ans",
        },
      };
      const res = createRes();

      await registerController(req, res);

      // Verify password was properly hashed
      expect(authHelper.hashPassword).toHaveBeenCalledWith("123456");
      // Verify successful registration response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "User Register Successfully",
        user: savedUser,
      });
    });
  });

  describe("loginController", () => {
    /**
     * Test input validation for login credentials
     * Bug Found: Missing email or password should return appropriate error
     * Test Type: State-based (input validation)
     */
    test("should return 404 for missing email or password", async () => {
      const res = createRes();
      // Test with empty email and password
      await loginController({ body: { email: "", password: "" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    /**
     * Test user existence check
     * Bug Found: Non-existent email should be handled gracefully
     * Test Type: Communication-based (database query)
     */
    test("should return 404 if user not found", async () => {
      // Mock database to return null (user not found)
      jest.spyOn(userModel, "findOne").mockResolvedValue(null);

      const req = { body: { email: "a@b.com", password: "123456" } };
      const res = createRes();

      await loginController(req, res);

      // Verify database query was made
      expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
      // Verify appropriate error response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd",
      });
    });

    /**
     * Test password verification
     * Bug Found: Incorrect password should be rejected with proper message
     * Test Type: Communication-based (password comparison)
     */
    test("should return 200 if password does not match", async () => {
      // Mock user exists but password comparison fails
      jest
        .spyOn(userModel, "findOne")
        .mockResolvedValue({ _id: "u1", password: "hashed" });
      jest.spyOn(authHelper, "comparePassword").mockResolvedValue(false);

      const req = { body: { email: "a@b.com", password: "wrong" } };
      const res = createRes();

      await loginController(req, res);

      // Verify password comparison was attempted
      expect(authHelper.comparePassword).toHaveBeenCalledWith(
        "wrong",
        "hashed"
      );
      // Verify appropriate error response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });

    /**
     * Test successful login flow
     * Tests complete authentication: user lookup -> password verification -> JWT generation
     * Test Type: Communication-based (full integration with mocked dependencies)
     */
    test("should login successfully and return JWT token", async () => {
      // Mock successful login scenario
      const user = {
        _id: "u1",
        name: "John",
        email: "a@b.com",
        phone: "1234567890",
        address: "addr",
        role: 0,
        password: "hashed",
      };
      jest.spyOn(userModel, "findOne").mockResolvedValue(user);
      jest.spyOn(authHelper, "comparePassword").mockResolvedValue(true);
      jest.spyOn(JWT, "sign").mockReturnValue("mock.jwt.token");

      const req = { body: { email: "a@b.com", password: "123456" } };
      const res = createRes();

      await loginController(req, res);

      // Verify JWT token was generated
      expect(JWT.sign).toHaveBeenCalled();
      // Verify successful login response (excluding sensitive password field)
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "login successfully",
        user: {
          _id: "u1",
          name: "John",
          email: "a@b.com",
          phone: "1234567890",
          address: "addr",
          role: 0,
        },
        token: "mock.jwt.token",
      });
    });
  });

  describe("forgotPasswordController", () => {
    /**
     * Test successful password reset flow
     * Tests security question verification and password update process
     * Test Type: Communication-based (database operations and password hashing)
     */
    test("should reset password successfully when email and security answer are valid", async () => {
      const req = {
        body: {
          email: "user@example.com",
          answer: "pet", // Security question answer
          newPassword: "newStrongPass123",
        },
      };
      const res = createRes();

      const mockUser = { _id: "user123" };

      // Mock successful user lookup with security answer
      jest.spyOn(userModel, "findOne").mockResolvedValue(mockUser);
      // Mock password hashing for new password
      jest
        .spyOn(authHelper, "hashPassword")
        .mockResolvedValue("hashed_new_password");
      // Mock database update operation
      jest.spyOn(userModel, "findByIdAndUpdate").mockResolvedValue({});

      await forgotPasswordController(req, res);

      // Verify user was found using email AND security answer
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "user@example.com",
        answer: "pet",
      });
      // Verify new password was hashed before storage
      expect(authHelper.hashPassword).toHaveBeenCalledWith("newStrongPass123");
      // Verify password was updated in database
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        password: "hashed_new_password",
      });
      // Verify success response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });
  });
});
