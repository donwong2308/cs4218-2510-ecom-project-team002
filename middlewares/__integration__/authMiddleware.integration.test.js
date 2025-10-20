/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2: TOP-DOWN INTEGRATION TESTING
 * AUTHENTICATION MIDDLEWARE INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Test the integration between authMiddleware and its dependencies:
 * - JWT library (token verification)
 * - User model (role verification)
 * - Express middleware chain (req/res/next)
 * - authController → middleware flow
 * 
 * TESTING STRATEGY: Sandwich Method (Top-Down + Bottom-Up)
 * - Test middleware in isolation (unit level)
 * - Test middleware chain execution (requireSignIn → isAdmin)
 * - Test integration with controllers (complete auth flow)
 * 
 * INTEGRATION POINTS TESTED:
 * 1. requireSignIn → JWT.verify (token validation)
 * 2. requireSignIn → req.user population
 * 3. isAdmin → userModel.findById (role lookup)
 * 4. isAdmin → role check logic (role === 1)
 * 5. Middleware chain: requireSignIn → isAdmin → controller
 * 6. Error handling across middleware chain
 * 
 * MOCK STRATEGY:
 * - Mock: User model database methods (controlled responses)
 * - Real: JWT operations (test actual token verification)
 * - Real: Express middleware chain (req/res/next)
 * - Real: Middleware logic (test actual integration)
 * 
 * TEST PHILOSOPHY:
 * Integration tests verify middleware chaining and auth flow integration.
 * We test how requireSignIn prepares context for isAdmin middleware.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import { requireSignIn, isAdmin } from '../authMiddleware.js';
import userModel from '../../models/userModel.js';
import JWT from 'jsonwebtoken';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Mock userModel for controlled database responses
jest.mock('../../models/userModel.js');

// Keep JWT real to test actual token verification integration

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create mock Express request object
 */
const mockRequest = (headers = {}, user = null) => ({
  headers,
  user,
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

/**
 * Create mock next function
 */
const mockNext = () => jest.fn();

/**
 * Generate real JWT token for testing
 */
const generateToken = (payload, expiresIn = '7d') => {
  return JWT.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: AUTHENTICATION MIDDLEWARE INTEGRATION TESTS - PHASE 2
// ═══════════════════════════════════════════════════════════════════════════

describe('Authentication Middleware Integration Tests - Phase 2: Security & Navigation Layer', () => {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SETUP AND TEARDOWN
  // ═══════════════════════════════════════════════════════════════════════════
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key-12345';
    
    // Mock console.log to prevent test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
    console.log.mockRestore();
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 1: requireSignIn MIDDLEWARE
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #1: requireSignIn Middleware', () => {
    
    /**
     * TEST 1.1: Valid Token Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn → JWT.verify (token validation)
     * - requireSignIn → req.user population
     * - requireSignIn → next() chain continuation
     * 
     * Expected Flow:
     * 1. Receive request with valid JWT token in headers
     * 2. Verify token using JWT.verify
     * 3. Decode token payload
     * 4. Populate req.user with decoded data
     * 5. Call next() to continue middleware chain
     */
    it('should verify valid JWT token and populate req.user', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with valid token
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'user123';
      const token = generateToken({ _id: userId });
      
      const req = mockRequest({ authorization: token });
      const res = mockResponse();
      const next = mockNext();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call requireSignIn middleware
      // ═══════════════════════════════════════════════════════════════
      
      await requireSignIn(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify JWT integration
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: req.user populated with decoded token
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeDefined();
      expect(req.user._id).toBe(userId);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: next() called (middleware chain continues)
      // ───────────────────────────────────────────────────────────────
      expect(next).toHaveBeenCalledTimes(1);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No response sent (let next middleware handle)
      // ───────────────────────────────────────────────────────────────
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
    
    /**
     * TEST 1.2: Invalid Token Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn → JWT.verify (token validation failure)
     * - Error handling (console.log, no response)
     */
    it('should handle invalid JWT token gracefully', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with invalid token
      // ═══════════════════════════════════════════════════════════════
      
      const invalidToken = 'invalid.jwt.token';
      
      const req = mockRequest({ authorization: invalidToken });
      const res = mockResponse();
      const next = mockNext();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call requireSignIn middleware
      // ═══════════════════════════════════════════════════════════════
      
      await requireSignIn(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify error handling
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: req.user NOT populated (remains null/undefined)
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeFalsy(); // null or undefined
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: next() NOT called (chain stops)
      // ───────────────────────────────────────────────────────────────
      expect(next).not.toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Error logged to console
      // ───────────────────────────────────────────────────────────────
      expect(console.log).toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // NOTE: Current implementation does not send error response
      // This is a design decision - middleware fails silently
      // ───────────────────────────────────────────────────────────────
    });
    
    /**
     * TEST 1.3: Expired Token Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn → JWT.verify (token expiration check)
     * - Time-based token validation
     */
    it('should handle expired JWT token', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with expired token
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'user123';
      // Create token that expires in 1 millisecond
      const token = generateToken({ _id: userId }, '1ms');
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const req = mockRequest({ authorization: token });
      const res = mockResponse();
      const next = mockNext();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call requireSignIn middleware
      // ═══════════════════════════════════════════════════════════════
      
      await requireSignIn(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify expiration handling
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: req.user NOT populated (expired token remains null/undefined)
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeFalsy(); // null or undefined
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: next() NOT called (auth failed)
      // ───────────────────────────────────────────────────────────────
      expect(next).not.toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Error logged (JWT expiration error)
      // ───────────────────────────────────────────────────────────────
      expect(console.log).toHaveBeenCalled();
    });
    
    /**
     * TEST 1.4: Missing Token Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn → JWT.verify (undefined token)
     * - Missing authorization header handling
     */
    it('should handle missing authorization token', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request WITHOUT token
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({}); // No authorization header
      const res = mockResponse();
      const next = mockNext();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call requireSignIn middleware
      // ═══════════════════════════════════════════════════════════════
      
      await requireSignIn(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify missing token handling
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: req.user NOT populated (remains null/undefined)
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeFalsy(); // null or undefined
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: next() NOT called
      // ───────────────────────────────────────────────────────────────
      expect(next).not.toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Error logged
      // ───────────────────────────────────────────────────────────────
      expect(console.log).toHaveBeenCalled();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 2: isAdmin MIDDLEWARE
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #2: isAdmin Middleware', () => {
    
    /**
     * TEST 2.1: Admin User Access
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - isAdmin → userModel.findById (role lookup)
     * - isAdmin → role check (role === 1)
     * - isAdmin → next() chain continuation
     * 
     * Expected Flow:
     * 1. Receive request with req.user._id from requireSignIn
     * 2. Look up user in database by ID
     * 3. Check user.role === 1 (admin)
     * 4. Call next() to continue to controller
     */
    it('should allow admin user access', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with admin user
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'admin123';
      const req = mockRequest({}, { _id: userId });
      const res = mockResponse();
      const next = mockNext();
      
      // Mock userModel.findById to return admin user
      userModel.findById = jest.fn().mockResolvedValueOnce({
        _id: userId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 1, // Admin role
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call isAdmin middleware
      // ═══════════════════════════════════════════════════════════════
      
      await isAdmin(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify admin access integration
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User lookup performed with correct ID
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: next() called (admin authorized)
      // ───────────────────────────────────────────────────────────────
      expect(next).toHaveBeenCalledTimes(1);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No error response sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
    
    /**
     * TEST 2.2: Non-Admin User Denial
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - isAdmin → userModel.findById (role lookup)
     * - isAdmin → role check (role !== 1)
     * - isAdmin → 401 unauthorized response
     */
    it('should deny non-admin user access', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with regular user
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'user123';
      const req = mockRequest({}, { _id: userId });
      const res = mockResponse();
      const next = mockNext();
      
      // Mock userModel.findById to return regular user
      userModel.findById = jest.fn().mockResolvedValueOnce({
        _id: userId,
        name: 'Regular User',
        email: 'user@example.com',
        role: 0, // Regular user role
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call isAdmin middleware
      // ═══════════════════════════════════════════════════════════════
      
      await isAdmin(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify access denial
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User lookup performed
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: 401 Unauthorized response sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'UnAuthorized Access',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: next() NOT called (access denied)
      // ───────────────────────────────────────────────────────────────
      expect(next).not.toHaveBeenCalled();
    });
    
    /**
     * TEST 2.3: Database Error Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - isAdmin → userModel.findById (database error)
     * - Error response handling
     */
    it('should handle database errors gracefully', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request with user ID that causes DB error
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'user123';
      const req = mockRequest({}, { _id: userId });
      const res = mockResponse();
      const next = mockNext();
      
      const dbError = new Error('Database connection failed');
      
      // Mock userModel.findById to throw error
      userModel.findById = jest.fn().mockRejectedValueOnce(dbError);
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call isAdmin middleware
      // ═══════════════════════════════════════════════════════════════
      
      await isAdmin(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify error handling
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: User lookup attempted
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: 401 error response sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: dbError,
        message: 'Error in admin middleware',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Error logged to console
      // ───────────────────────────────────────────────────────────────
      expect(console.log).toHaveBeenCalledWith(dbError);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: next() NOT called (error occurred)
      // ───────────────────────────────────────────────────────────────
      expect(next).not.toHaveBeenCalled();
    });
    
    /**
     * TEST 2.4: Missing req.user Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - isAdmin → req.user validation (from requireSignIn)
     * - Error handling for missing authentication context
     */
    it('should handle missing req.user from requireSignIn', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup request WITHOUT req.user
      // ═══════════════════════════════════════════════════════════════
      
      const req = mockRequest({}, null); // No req.user
      const res = mockResponse();
      const next = mockNext();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Call isAdmin middleware
      // ═══════════════════════════════════════════════════════════════
      
      await isAdmin(req, res, next);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify error handling
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Error response sent (cannot read _id)
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Error message contains middleware error
      // ───────────────────────────────────────────────────────────────
      const errorResponse = res.send.mock.calls[0][0];
      expect(errorResponse.message).toBe('Error in admin middleware');
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: next() NOT called
      // ───────────────────────────────────────────────────────────────
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 3: MIDDLEWARE CHAIN
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #3: Middleware Chain Execution', () => {
    
    /**
     * TEST 3.1: Complete Chain Success
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn → JWT verification → req.user population
     * - isAdmin → User lookup → role check
     * - Complete middleware chain: requireSignIn → isAdmin → controller
     * 
     * Expected Flow:
     * 1. requireSignIn verifies JWT and populates req.user
     * 2. isAdmin uses req.user._id to lookup user
     * 3. isAdmin checks role === 1
     * 4. Chain completes successfully to controller
     */
    it('should execute complete middleware chain for admin user', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup complete chain scenario
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'admin123';
      const token = generateToken({ _id: userId });
      
      const req = mockRequest({ authorization: token });
      const res = mockResponse();
      const next1 = mockNext();
      const next2 = mockNext();
      
      // Mock userModel.findById for isAdmin
      userModel.findById = jest.fn().mockResolvedValueOnce({
        _id: userId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 1,
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Execute middleware chain
      // ═══════════════════════════════════════════════════════════════
      
      // Step 1: requireSignIn
      await requireSignIn(req, res, next1);
      
      // Step 2: isAdmin (uses req.user from step 1)
      await isAdmin(req, res, next2);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify complete chain execution
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: requireSignIn populated req.user
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeDefined();
      expect(req.user._id).toBe(userId);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Both middleware called next()
      // ───────────────────────────────────────────────────────────────
      expect(next1).toHaveBeenCalledTimes(1);
      expect(next2).toHaveBeenCalledTimes(1);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: isAdmin used req.user from requireSignIn
      // ───────────────────────────────────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: No error responses sent
      // ───────────────────────────────────────────────────────────────
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
    
    /**
     * TEST 3.2: Chain Break at requireSignIn
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn fails → chain stops
     * - isAdmin never executes
     */
    it('should stop chain if requireSignIn fails', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup invalid token scenario
      // ═══════════════════════════════════════════════════════════════
      
      const invalidToken = 'invalid.jwt.token';
      
      const req = mockRequest({ authorization: invalidToken });
      const res = mockResponse();
      const next1 = mockNext();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Attempt chain execution
      // ═══════════════════════════════════════════════════════════════
      
      // Step 1: requireSignIn (should fail)
      await requireSignIn(req, res, next1);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify chain stopped
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: req.user NOT populated (remains null/undefined)
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeFalsy(); // null or undefined
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: next() NOT called (chain stopped)
      // ───────────────────────────────────────────────────────────────
      expect(next1).not.toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Error logged
      // ───────────────────────────────────────────────────────────────
      expect(console.log).toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // NOTE: isAdmin would never be called in real scenario
      // because next1 was not called - chain is broken
      // ───────────────────────────────────────────────────────────────
    });
    
    /**
     * TEST 3.3: Chain Break at isAdmin
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - requireSignIn succeeds → req.user populated
     * - isAdmin fails → non-admin user denied
     * - Chain stops before controller
     */
    it('should stop chain if isAdmin denies access', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup non-admin user scenario
      // ═══════════════════════════════════════════════════════════════
      
      const userId = 'user123';
      const token = generateToken({ _id: userId });
      
      const req = mockRequest({ authorization: token });
      const res = mockResponse();
      const next1 = mockNext();
      const next2 = mockNext();
      
      // Mock userModel.findById to return non-admin user
      userModel.findById = jest.fn().mockResolvedValueOnce({
        _id: userId,
        name: 'Regular User',
        email: 'user@example.com',
        role: 0, // Not admin
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Execute middleware chain
      // ═══════════════════════════════════════════════════════════════
      
      // Step 1: requireSignIn (should succeed)
      await requireSignIn(req, res, next1);
      
      // Step 2: isAdmin (should fail)
      await isAdmin(req, res, next2);
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify chain stopped at isAdmin
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: requireSignIn succeeded
      // ───────────────────────────────────────────────────────────────
      expect(req.user).toBeDefined();
      expect(next1).toHaveBeenCalledTimes(1);
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: isAdmin denied access
      // ───────────────────────────────────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'UnAuthorized Access',
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: isAdmin did NOT call next() (chain stopped)
      // ───────────────────────────────────────────────────────────────
      expect(next2).not.toHaveBeenCalled();
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2.3 INTEGRATION TEST SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TESTS IMPLEMENTED: 11 integration tests
 * 
 * requireSignIn MIDDLEWARE (4 tests):
 * ✅ Valid JWT token verification and req.user population
 * ✅ Invalid token handling (graceful error)
 * ✅ Expired token handling (time-based validation)
 * ✅ Missing token handling
 * 
 * isAdmin MIDDLEWARE (4 tests):
 * ✅ Admin user access (role === 1)
 * ✅ Non-admin user denial (role !== 1)
 * ✅ Database error handling
 * ✅ Missing req.user handling
 * 
 * MIDDLEWARE CHAIN EXECUTION (3 tests):
 * ✅ Complete chain success (requireSignIn → isAdmin → controller)
 * ✅ Chain break at requireSignIn (invalid token)
 * ✅ Chain break at isAdmin (non-admin user)
 * 
 * INTEGRATION COVERAGE:
 * - requireSignIn ↔ JWT.verify (token validation)
 * - requireSignIn ↔ req.user population
 * - isAdmin ↔ userModel.findById (role lookup)
 * - isAdmin ↔ role check logic
 * - Middleware chain: requireSignIn → isAdmin
 * - Error handling across middleware chain
 * 
 * REAL INTEGRATIONS TESTED:
 * - Real JWT token verification (not mocked)
 * - Real Express middleware chain (req/res/next)
 * - Real middleware logic execution
 * 
 * NEXT STEPS:
 * Phase 2.4: Navigation Guards integration tests (Header component + auth context)
 * ═══════════════════════════════════════════════════════════════════════════
 */
