import { registerController, loginController, forgotPasswordController } from "./authController.js";
import userModel from "../models/userModel.js";
import * as authHelper from "../helpers/authHelper.js";
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
  res.send = jest.fn().mockReturnValue(res);   // Chainable send method
  res.json = jest.fn().mockReturnValue(res);   // Chainable json method
  return res;
};

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
      const req = { body: { email: "a@b.com", password: "123456", phone: "1234567890", address: "addr", answer: "ans" } };
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

      const req = { body: { name: "John", email: "a@b.com", password: "123456", phone: "1234567890", address: "addr", answer: "ans" } };
      const res = createRes();

      await registerController(req, res);

      // Verify database was checked for existing user
      expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
      // Verify appropriate response for duplicate user
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Already Register please login" });
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

      const req = { body: { name: "John", email: "a@b.com", password: "123456", phone: "1234567890", address: "addr", answer: "ans" } };
      const res = createRes();

      await registerController(req, res);

      // Verify password was properly hashed
      expect(authHelper.hashPassword).toHaveBeenCalledWith("123456");
      // Verify successful registration response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ success: true, message: "User Register Successfully", user: savedUser });
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
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid email or password" });
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
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is not registerd" });
    });

    /**
     * Test password verification
     * Bug Found: Incorrect password should be rejected with proper message
     * Test Type: Communication-based (password comparison)
     */
    test("should return 200 if password does not match", async () => {
      // Mock user exists but password comparison fails
      jest.spyOn(userModel, "findOne").mockResolvedValue({ _id: "u1", password: "hashed" });
      jest.spyOn(authHelper, "comparePassword").mockResolvedValue(false);

      const req = { body: { email: "a@b.com", password: "wrong" } };
      const res = createRes();

      await loginController(req, res);

      // Verify password comparison was attempted
      expect(authHelper.comparePassword).toHaveBeenCalledWith("wrong", "hashed");
      // Verify appropriate error response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid Password" });
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
      jest.spyOn(authHelper, "hashPassword").mockResolvedValue("hashed_new_password");
      // Mock database update operation
      jest.spyOn(userModel, "findByIdAndUpdate").mockResolvedValue({});

      await forgotPasswordController(req, res);

      // Verify user was found using email AND security answer
      expect(userModel.findOne).toHaveBeenCalledWith({ email: "user@example.com", answer: "pet" });
      // Verify new password was hashed before storage
      expect(authHelper.hashPassword).toHaveBeenCalledWith("newStrongPass123");
      // Verify password was updated in database
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", { password: "hashed_new_password" });
      // Verify success response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });
  });
});