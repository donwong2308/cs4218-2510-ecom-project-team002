import JWT from 'jsonwebtoken';
import { requireSignIn, isAdmin } from './authMiddleware.js';
import userModel from '../models/userModel.js';

// Mock the dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

/**
 * Unit tests for authentication middleware functions
 * 
 * These middleware functions are used in Express.js routes to:
 * 1. requireSignIn: Verify JWT tokens and authenticate users
 * 2. isAdmin: Check if authenticated users have admin privileges (role = 1)
 * 
 * Middleware functions follow Express.js patterns:
 * - req: request object containing headers, user data, etc.
 * - res: response object for sending HTTP responses
 * - next: function to continue to the next middleware/route handler
 */
describe('Authentication Middleware', () => {
  // Mock request, response, and next function for each test
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock Express.js request object
    req = {
      headers: {},
      user: null
    };

    // Create mock Express.js response object with chainable methods
    res = {
      status: jest.fn().mockReturnThis(), // Return 'this' to allow chaining
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock next function (called to continue to next middleware)
    next = jest.fn();

    // Mock console.log to prevent spam in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log after each test
    console.log.mockRestore();
  });

  describe('requireSignIn Middleware', () => {
    /**
     * Test successful JWT token verification
     * When a valid token is provided in Authorization header,
     * should decode it, attach user info to req.user, and call next()
     */
    it('successfully verifies valid JWT token and calls next()', async () => {
      // Mock valid JWT token in request headers
      req.headers.authorization = 'Bearer valid-jwt-token';

      // Mock JWT.verify to return decoded user data
      const mockDecodedUser = { _id: 'user123', email: 'test@example.com' };
      JWT.verify.mockReturnValue(mockDecodedUser);

      // Execute the middleware
      await requireSignIn(req, res, next);

      // Verify JWT.verify was called with correct parameters
      expect(JWT.verify).toHaveBeenCalledWith(
        'Bearer valid-jwt-token',
        process.env.JWT_SECRET
      );

      // Verify user data is attached to request object
      expect(req.user).toEqual(mockDecodedUser);

      // Verify next() is called to continue to the next middleware
      expect(next).toHaveBeenCalled();

      // Verify no error response is sent
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    /**
     * Test handling of invalid/expired JWT tokens
     * When JWT.verify throws an error (invalid signature, expired token, etc.),
     * should handle gracefully and not crash the application
     */
    it('handles invalid JWT token gracefully', async () => {
      // Mock invalid token in request headers
      req.headers.authorization = 'Bearer invalid-jwt-token';

      // Mock JWT.verify to throw an error (invalid token)
      JWT.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError: invalid token');
      });

      // Execute the middleware
      await requireSignIn(req, res, next);

      // Verify JWT.verify was called
      expect(JWT.verify).toHaveBeenCalledWith(
        'Bearer invalid-jwt-token',
        process.env.JWT_SECRET
      );

      // Verify error is logged (middleware logs errors but doesn't send response)
      expect(console.log).toHaveBeenCalled();

      // Verify req.user is not set when token is invalid
      expect(req.user).toBeNull();

      // Note: The current middleware implementation logs errors but doesn't 
      // send error responses - this might be intentional or could be improved
    });

    /**
     * Test handling when no authorization header is provided
     * Should handle gracefully when Authorization header is missing
     */
    it('handles missing authorization header', async () => {
      // No authorization header in request
      req.headers.authorization = undefined;

      // Execute the middleware
      await requireSignIn(req, res, next);

      // Verify JWT.verify is called (will throw error for undefined token)
      expect(JWT.verify).toHaveBeenCalledWith(
        undefined,
        process.env.JWT_SECRET
      );

      // Should log the error
      expect(console.log).toHaveBeenCalled();
    });

    /**
     * Test handling when JWT_SECRET environment variable is missing
     * Should handle gracefully when required environment variables are not set
     */
    it('handles missing JWT_SECRET environment variable', async () => {
      // Mock valid token
      req.headers.authorization = 'Bearer valid-token';

      // Temporarily delete JWT_SECRET from environment
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Mock JWT.verify to throw error for missing secret
      JWT.verify.mockImplementation(() => {
        throw new Error('secretOrPrivateKey must have a value');
      });

      // Execute the middleware
      await requireSignIn(req, res, next);

      // Should handle the error gracefully
      expect(console.log).toHaveBeenCalled();

      // Restore environment variable
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('isAdmin Middleware', () => {
    /**
     * Test successful admin authorization
     * When user exists and has admin role (role = 1),
     * should call next() to continue to protected admin route
     */
    it('allows access for users with admin role', async () => {
      // Mock authenticated user in request (set by requireSignIn middleware)
      req.user = { _id: 'admin123' };

      // Mock userModel.findById to return admin user
      const mockAdminUser = {
        _id: 'admin123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 1 // Admin role
      };
      userModel.findById.mockResolvedValue(mockAdminUser);

      // Execute the middleware
      await isAdmin(req, res, next);

      // Verify database query for user
      expect(userModel.findById).toHaveBeenCalledWith('admin123');

      // Verify next() is called (allows access to admin route)
      expect(next).toHaveBeenCalled();

      // Verify no error response is sent
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    /**
     * Test access denial for non-admin users
     * When user exists but doesn't have admin role (role != 1),
     * should send 401 Unauthorized response
     */
    it('denies access for users without admin role', async () => {
      // Mock authenticated regular user in request
      req.user = { _id: 'user123' };

      // Mock userModel.findById to return regular user (role = 0)
      const mockRegularUser = {
        _id: 'user123',
        name: 'Regular User',
        email: 'user@example.com',
        role: 0 // Regular user role
      };
      userModel.findById.mockResolvedValue(mockRegularUser);

      // Execute the middleware
      await isAdmin(req, res, next);

      // Verify database query
      expect(userModel.findById).toHaveBeenCalledWith('user123');

      // Verify 401 Unauthorized response is sent
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'UnAuthorized Access'
      });

      // Verify next() is NOT called (access denied)
      expect(next).not.toHaveBeenCalled();
    });

    /**
     * Test handling when user is not found in database
     * When req.user._id doesn't correspond to any user in database,
     * should handle gracefully and send appropriate error response
     */
    it('handles case when user is not found in database', async () => {
      // Mock authenticated user with ID that doesn't exist in database
      req.user = { _id: 'nonexistent123' };

      // Mock userModel.findById to return null (user not found)
      userModel.findById.mockResolvedValue(null);

      // Execute the middleware
      await isAdmin(req, res, next);

      // Verify database query was made
      expect(userModel.findById).toHaveBeenCalledWith('nonexistent123');

      // When user is null, user.role will throw an error, which should be caught
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: 'Error in admin middleware'
      });

      // Verify next() is not called due to error
      expect(next).not.toHaveBeenCalled();
    });

    /**
     * Test handling of database errors
     * When userModel.findById throws an error (database connection issues, etc.),
     * should handle gracefully and send error response
     */
    it('handles database errors gracefully', async () => {
      // Mock authenticated user
      req.user = { _id: 'user123' };

      // Mock database error
      const dbError = new Error('Database connection failed');
      userModel.findById.mockRejectedValue(dbError);

      // Execute the middleware
      await isAdmin(req, res, next);

      // Verify database query was attempted
      expect(userModel.findById).toHaveBeenCalledWith('user123');

      // Verify error response is sent
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: dbError,
        message: 'Error in admin middleware'
      });

      // Verify error is logged
      expect(console.log).toHaveBeenCalledWith(dbError);

      // Verify next() is not called due to error
      expect(next).not.toHaveBeenCalled();
    });

    /**
     * Test edge cases for role values
     * Verify that only exactly role = 1 is considered admin
     */
    it('only accepts role value of exactly 1 as admin', async () => {
      const testCases = [
        { role: 0, shouldAllow: false, description: 'regular user (role 0)' },
        { role: 2, shouldAllow: false, description: 'role 2' },
        { role: '1', shouldAllow: false, description: 'string "1"' },
        { role: true, shouldAllow: false, description: 'boolean true' },
        { role: null, shouldAllow: false, description: 'null role' },
        { role: undefined, shouldAllow: false, description: 'undefined role' }
      ];

      for (const testCase of testCases) {
        // Reset mocks for each test case
        jest.clearAllMocks();
        req.user = { _id: 'testuser' };

        // Mock user with specific role value
        userModel.findById.mockResolvedValue({
          _id: 'testuser',
          role: testCase.role
        });

        // Execute middleware
        await isAdmin(req, res, next);

        if (testCase.shouldAllow) {
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        } else {
          expect(res.status).toHaveBeenCalledWith(401);
          expect(next).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe('Middleware Integration', () => {
    /**
     * Test the typical flow: requireSignIn followed by isAdmin
     * This simulates how these middleware functions work together in admin routes
     */
    it('works correctly when requireSignIn and isAdmin are used together', async () => {
      // Simulate the typical admin route middleware chain

      // Step 1: requireSignIn middleware
      req.headers.authorization = 'Bearer admin-jwt-token';
      const mockDecodedAdmin = { _id: 'admin123' };
      JWT.verify.mockReturnValue(mockDecodedAdmin);

      await requireSignIn(req, res, next);

      // Verify requireSignIn worked correctly
      expect(req.user).toEqual(mockDecodedAdmin);
      expect(next).toHaveBeenCalledTimes(1);

      // Step 2: isAdmin middleware (req.user is now set)
      const mockAdminUser = { _id: 'admin123', role: 1 };
      userModel.findById.mockResolvedValue(mockAdminUser);

      await isAdmin(req, res, next);

      // Verify isAdmin worked correctly
      expect(userModel.findById).toHaveBeenCalledWith('admin123');
      expect(next).toHaveBeenCalledTimes(2); // Called twice: once by each middleware

      // Verify no error responses were sent
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});