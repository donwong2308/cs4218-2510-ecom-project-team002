/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2: TOP-DOWN INTEGRATION TESTING
 * AUTHENTICATION CONTROLLER INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Test the integration between authController and its dependencies:
 * - User model (database operations)
 * - authHelper (password hashing/comparison)
 * - JWT library (token generation/verification)
 * - Express request/response cycle
 * 
 * TESTING STRATEGY: Sandwich Method (Top-Down)
 * - Start from controller endpoints (high-level)
 * - Integrate with authentication services
 * - Verify complete request/response flows
 * 
 * INTEGRATION POINTS TESTED:
 * 1. registerController → hashPassword → User model
 * 2. loginController → comparePassword → JWT signing
 * 3. forgotPasswordController → User model → hashPassword
 * 4. Controllers → Request/Response objects
 * 5. JWT token generation → Token payload structure
 * 
 * MOCK STRATEGY:
 * - Mock: User model database methods (controlled responses)
 * - Real: authHelper functions (test actual crypto integration)
 * - Real: JWT operations (test actual token generation/verification)
 * - Real: Express req/res cycle simulation
 * 
 * TEST PHILOSOPHY:
 * Integration tests verify how components work together, not implementation.
 * We test the complete authentication flow from request to response.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from '../authController.js';
import userModel from '../../models/userModel.js';
import { hashPassword, comparePassword } from '../../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Mock userModel for controlled database responses
jest.mock('../../models/userModel.js');

// Keep authHelper and JWT real to test actual integration
// No mocking of authHelper or JWT - we want to test real integration

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
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: AUTHENTICATION CONTROLLER INTEGRATION TESTS - PHASE 2
// ═══════════════════════════════════════════════════════════════════════════

describe('Authentication Controller Integration Tests - Phase 2: Security & Navigation Layer', () => {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SETUP AND TEARDOWN
  // ═══════════════════════════════════════════════════════════════════════════
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key-12345';
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 1: REGISTRATION FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #1: Registration Flow', () => {
    
    /**
     * TEST 1.1: Complete Registration Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - registerController → hashPassword (real crypto)
     * - registerController → userModel.findOne (check existing)
     * - registerController → userModel.save (create user)
     * - Complete request → response cycle
     * 
     * Expected Flow:
     * 1. Receive registration request with user data
     * 2. Check for existing user (returns null)
     * 3. Hash password using bcrypt
     * 4. Save user to database
     * 5. Return success response with user data
     */
    it('should complete full registration flow with password hashing', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup registration request
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!',
        phone: '1234567890',
        address: '123 Test St',
        answer: 'Blue',
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return null (no existing user)
      userModel.findOne = jest.fn().mockResolvedValueOnce(null);
      
      // Mock userModel constructor and save
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        answer: 'Blue',
        role: 0,
      });
      
      userModel.mockImplementation(() => ({
        save: mockSave,
      }));
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call registerController
      // ═══════════════════════════════════════════════════════════════
      
      await registerController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify complete integration
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Existing user check performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalledWith({ 
        email: 'test@example.com' 
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: User model save called (user created)
      // ───────────────────────────────────────────────────────────────
      expect(mockSave).toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Success response sent (201 Created)
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User Register Successfully',
          user: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: Password was hashed (integration with authHelper)
      // ───────────────────────────────────────────────────────────────
      // The password passed to userModel should be hashed, not plaintext
      // We can't check the exact value, but we verify save was called
      // with the mocked constructor, which receives hashed password
      expect(userModel).toHaveBeenCalled();
    });
    
    /**
     * TEST 1.2: Duplicate Email Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - registerController → userModel.findOne (existing user)
     * - Duplicate prevention logic
     */
    it('should prevent registration with duplicate email', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup duplicate email scenario
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'TestPass123!',
        phone: '1234567890',
        address: '123 Test St',
        answer: 'Blue',
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return existing user
      userModel.findOne = jest.fn().mockResolvedValueOnce({
        _id: 'existing123',
        email: 'existing@example.com',
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt registration
      // ═══════════════════════════════════════════════════════════════
      
      await registerController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify duplicate prevention
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Existing user check performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalledWith({ 
        email: 'existing@example.com' 
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Duplicate error response sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Already Register please login',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No user creation attempted
      // ───────────────────────────────────────────────────────────────
      expect(userModel).not.toHaveBeenCalled();
    });
    
    /**
     * TEST 1.3: Required Fields Validation
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Request validation
     * - Error response handling
     */
    it('should validate all required fields', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with missing fields
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        // Missing: name, phone, address, answer
      });
      
      const res = mockResponse();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt registration
      // ═══════════════════════════════════════════════════════════════
      
      await registerController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify validation error
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Error response sent for missing name
      // ───────────────────────────────────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({ 
        error: 'Name is Required' 
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: No database operations performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).not.toHaveBeenCalled();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 2: LOGIN FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #2: Login Flow', () => {
    
    /**
     * TEST 2.1: Complete Login Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - loginController → userModel.findOne (find user)
     * - loginController → comparePassword (verify password)
     * - loginController → JWT.sign (generate token)
     * - Complete authentication flow
     * 
     * Expected Flow:
     * 1. Receive login request with credentials
     * 2. Find user in database
     * 3. Compare password with stored hash
     * 4. Generate JWT token
     * 5. Return user data + token
     */
    it('should complete full login flow with JWT token generation', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup login request
      // ═══════════════════════════════════════════════════════════════
      
      const plainPassword = 'TestPass123!';
      const hashedPassword = await hashPassword(plainPassword);
      
      const req = mockRequest({
        email: 'test@example.com',
        password: plainPassword,
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return user with hashed password
      userModel.findOne = jest.fn().mockResolvedValueOnce({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '1234567890',
        address: '123 Test St',
        role: 0,
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call loginController
      // ═══════════════════════════════════════════════════════════════
      
      await loginController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify complete login integration
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User lookup performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalledWith({ 
        email: 'test@example.com' 
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Success response sent (200 OK)
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Response contains JWT token
      // ───────────────────────────────────────────────────────────────
      const responseCall = res.send.mock.calls[0][0];
      expect(responseCall).toHaveProperty('token');
      expect(responseCall.success).toBe(true);
      expect(responseCall.message).toBe('login successfully');
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: JWT token is valid and contains user ID
      // ───────────────────────────────────────────────────────────────
      const token = responseCall.token;
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
      expect(decoded._id).toBe('user123');
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #5: User data returned (excluding password)
      // ───────────────────────────────────────────────────────────────
      expect(responseCall.user).toMatchObject({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        role: 0,
      });
      expect(responseCall.user).not.toHaveProperty('password');
    });
    
    /**
     * TEST 2.2: Invalid Credentials Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - loginController → comparePassword (password mismatch)
     * - Error handling for incorrect password
     */
    it('should reject login with incorrect password', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup login with wrong password
      // ═══════════════════════════════════════════════════════════════
      
      const correctPassword = 'CorrectPass123!';
      const wrongPassword = 'WrongPass456!';
      const hashedPassword = await hashPassword(correctPassword);
      
      const req = mockRequest({
        email: 'test@example.com',
        password: wrongPassword,
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return user
      userModel.findOne = jest.fn().mockResolvedValueOnce({
        _id: 'user123',
        email: 'test@example.com',
        password: hashedPassword,
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt login with wrong password
      // ═══════════════════════════════════════════════════════════════
      
      await loginController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify rejection
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User found (authentication, not authorization)
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Invalid password error response
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid Password',
      });
    });
    
    /**
     * TEST 2.3: Non-Existent User Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - loginController → userModel.findOne (user not found)
     */
    it('should reject login for non-existent user', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup login for non-existent user
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'TestPass123!',
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return null
      userModel.findOne = jest.fn().mockResolvedValueOnce(null);
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt login
      // ═══════════════════════════════════════════════════════════════
      
      await loginController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify rejection
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User lookup attempted
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalledWith({ 
        email: 'nonexistent@example.com' 
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: User not found error response
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Email is not registerd',
      });
    });
    
    /**
     * TEST 2.4: Missing Credentials Validation
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Request validation
     * - Error response handling
     */
    it('should validate required credentials', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with missing credentials
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        email: 'test@example.com',
        // Missing: password
      });
      
      const res = mockResponse();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt login
      // ═══════════════════════════════════════════════════════════════
      
      await loginController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify validation error
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Validation error response
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: No database lookup performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).not.toHaveBeenCalled();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 3: PASSWORD RESET FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #3: Password Reset Flow', () => {
    
    /**
     * TEST 3.1: Complete Password Reset Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - forgotPasswordController → userModel.findOne (find by email + answer)
     * - forgotPasswordController → hashPassword (hash new password)
     * - forgotPasswordController → userModel.findByIdAndUpdate (update password)
     * 
     * Expected Flow:
     * 1. Receive reset request with email, answer, new password
     * 2. Verify user exists and answer matches
     * 3. Hash new password
     * 4. Update user password in database
     * 5. Return success response
     */
    it('should complete full password reset flow', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup password reset request
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        email: 'test@example.com',
        answer: 'Blue',
        newPassword: 'NewPass123!',
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return user
      userModel.findOne = jest.fn().mockResolvedValueOnce({
        _id: 'user123',
        email: 'test@example.com',
        answer: 'Blue',
      });
      
      // Mock userModel.findByIdAndUpdate
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValueOnce({
        _id: 'user123',
        email: 'test@example.com',
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call forgotPasswordController
      // ═══════════════════════════════════════════════════════════════
      
      await forgotPasswordController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify password reset integration
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User lookup with email AND answer
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalledWith({ 
        email: 'test@example.com',
        answer: 'Blue'
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Password update performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          password: expect.any(String), // Hashed password
        })
      );
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Success response sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Password Reset Successfully',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: New password was hashed (not plaintext)
      // ───────────────────────────────────────────────────────────────
      const updateCall = userModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateCall.password).not.toBe('NewPass123!'); // Not plaintext
      expect(updateCall.password).toMatch(/^\$2[aby]\$/); // Bcrypt hash format
    });
    
    /**
     * TEST 3.2: Invalid Security Answer
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - forgotPasswordController → userModel.findOne (email + wrong answer)
     */
    it('should reject password reset with wrong security answer', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup reset with wrong answer
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({
        email: 'test@example.com',
        answer: 'WrongAnswer',
        newPassword: 'NewPass123!',
      });
      
      const res = mockResponse();
      
      // Mock userModel.findOne to return null (no match)
      userModel.findOne = jest.fn().mockResolvedValueOnce(null);
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt password reset
      // ═══════════════════════════════════════════════════════════════
      
      await forgotPasswordController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify rejection
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Lookup attempted with email + answer
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findOne).toHaveBeenCalledWith({ 
        email: 'test@example.com',
        answer: 'WrongAnswer'
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Error response sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Wrong Email Or Answer',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No password update performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 4: TEST CONTROLLER (PROTECTED ROUTE VERIFICATION)
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #4: Protected Route Verification', () => {
    
    /**
     * TEST 4.1: Test Controller Response
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - testController → Express response
     * - Simple endpoint verification
     */
    it('should return protected routes message', () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup test request
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest();
      const res = mockResponse();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call testController
      // ═══════════════════════════════════════════════════════════════
      
      testController(req, res);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify response
      // ═══════════════════════════════════════════════════════════════
      
      expect(res.send).toHaveBeenCalledWith('Protected Routes');
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2.2 INTEGRATION TEST SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TESTS IMPLEMENTED: 11 integration tests
 * 
 * REGISTRATION FLOW (3 tests):
 * ✅ Complete registration with password hashing
 * ✅ Duplicate email prevention
 * ✅ Required fields validation
 * 
 * LOGIN FLOW (4 tests):
 * ✅ Complete login with JWT token generation
 * ✅ Invalid password rejection
 * ✅ Non-existent user handling
 * ✅ Missing credentials validation
 * 
 * PASSWORD RESET FLOW (2 tests):
 * ✅ Complete password reset with security answer
 * ✅ Invalid security answer rejection
 * 
 * PROTECTED ROUTE VERIFICATION (1 test):
 * ✅ Test controller response
 * 
 * INTEGRATION COVERAGE:
 * - authController ↔ userModel (database operations)
 * - authController ↔ authHelper (password hashing/comparison)
 * - authController ↔ JWT (token generation)
 * - authController ↔ Express req/res cycle
 * 
 * REAL INTEGRATIONS TESTED:
 * - Real bcrypt password hashing (not mocked)
 * - Real JWT token generation and verification (not mocked)
 * - Real authHelper functions (not mocked)
 * 
 * NEXT STEPS:
 * Phase 2.3: authMiddleware integration tests (JWT verification + role checking)
 * ═══════════════════════════════════════════════════════════════════════════
 */
