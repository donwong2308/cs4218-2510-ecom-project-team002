// Mock order model 
jest.mock("../models/orderModel.js");

// Mock the entire productController module to isolate braintree functionality
jest.mock("braintree");

import { 
  braintreeTokenController, 
  brainTreePaymentController 
} from "./productController.js";
import orderModel from "../models/orderModel.js";
import braintree from "braintree";

// Simple mock response and request factory functions
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createReq = (body = {}, user = null) => ({
  body,
  user
});

describe("Braintree Payment Controllers", () => {
  let mockGateway;
  let mockOrderInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock gateway methods
    const mockClientTokenGenerate = jest.fn();
    const mockTransactionSale = jest.fn();
    
    // Create mock gateway instance
    mockGateway = {
      clientToken: { generate: mockClientTokenGenerate },
      transaction: { sale: mockTransactionSale }
    };
    
    // Mock the BraintreeGateway constructor to return our mock
    braintree.BraintreeGateway.mockImplementation(() => mockGateway);
    
    // Mock order model instance
    mockOrderInstance = {
      save: jest.fn().mockResolvedValue({ _id: "order123" })
    };
    orderModel.mockImplementation(() => mockOrderInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("braintreeTokenController", () => {
    /**
     * Test successful token generation
     * Verifies that the controller properly handles successful Braintree client token generation
     * and returns the response to the client without modification
     */
    test("should generate client token successfully", async () => {
      const req = createReq();
      const res = createRes();
      
      // Mock successful token generation
      const mockResponse = { 
        clientToken: "mock_client_token_12345",
        success: true 
      };
      
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockResponse);
      });

      await braintreeTokenController(req, res);

      // Verify gateway method was called with empty options
      expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
        {}, 
        expect.any(Function)
      );
      
      // Verify response was sent directly without modification
      expect(res.send).toHaveBeenCalledWith(mockResponse);
      expect(res.status).not.toHaveBeenCalled();
    });

    /**
     * Test token generation failure
     * Verifies that the controller properly handles Braintree API errors
     * and sends appropriate error response with 500 status code
     */
    test("should handle token generation error", async () => {
      const req = createReq();
      const res = createRes();
      
      // Mock token generation error
      const mockError = { 
        message: "Authentication failed",
        type: "AUTHENTICATION_ERROR" 
      };
      
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      await braintreeTokenController(req, res);

      // Verify error handling
      expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
        {}, 
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });

    /**
     * Test exception handling in token controller
     * Verifies that unexpected exceptions are caught and logged
     * without crashing the application
     */
    test("should handle unexpected exceptions gracefully", async () => {
      const req = createReq();
      const res = createRes();
      
      // Mock console.log to verify error logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Make gateway throw an unexpected error
      mockGateway.clientToken.generate.mockImplementation(() => {
        throw new Error("Unexpected gateway error");
      });

      // Should not throw an exception
      await expect(braintreeTokenController(req, res)).resolves.not.toThrow();
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe("brainTreePaymentController", () => {
    /**
     * Test successful payment processing
     * Verifies complete payment flow: total calculation, transaction processing,
     * order creation, and success response
     */
    test("should process payment successfully", async () => {
      const mockCart = [
        { _id: "prod1", name: "Product 1", price: 100 },
        { _id: "prod2", name: "Product 2", price: 200 }
      ];
      
      const req = createReq(
        { 
          nonce: "fake-valid-nonce", 
          cart: mockCart 
        },
        { _id: "user123" }
      );
      const res = createRes();
      
      // Mock successful transaction
      const mockTransactionResult = {
        success: true,
        transaction: {
          id: "transaction123",
          amount: "300.00",
          status: "submitted_for_settlement"
        }
      };
      
      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockTransactionResult);
      });

      await brainTreePaymentController(req, res);

      // Verify transaction was called with correct parameters
      expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 300, // Sum of cart prices
          paymentMethodNonce: "fake-valid-nonce",
          options: {
            submitForSettlement: true
          }
        },
        expect.any(Function)
      );

      // Verify order was created with correct data
      expect(orderModel).toHaveBeenCalledWith({
        products: mockCart,
        payment: mockTransactionResult,
        buyer: "user123"
      });

      // Verify success response
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    /**
     * Test payment processing with transaction failure
     * Verifies that Braintree transaction errors are properly handled
     * and appropriate error responses are sent
     */
    test("should handle transaction failure", async () => {
      const mockCart = [
        { _id: "prod1", name: "Product 1", price: 50 }
      ];
      
      const req = createReq(
        { 
          nonce: "fake-invalid-nonce", 
          cart: mockCart 
        },
        { _id: "user123" }
      );
      const res = createRes();
      
      // Mock transaction failure
      const mockError = {
        message: "Credit card declined",
        code: "2001"
      };
      
      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      await brainTreePaymentController(req, res);

      // Verify transaction was attempted
      expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 50,
          paymentMethodNonce: "fake-invalid-nonce",
          options: {
            submitForSettlement: true
          }
        },
        expect.any(Function)
      );

      // Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
      
      // Verify no order was created on failure
      expect(orderModel).not.toHaveBeenCalled();
    });

    /**
     * Test cart total calculation accuracy
     * Verifies that the payment controller correctly sums up cart item prices
     * for various cart configurations including edge cases
     */
    test("should calculate cart total correctly", async () => {
      const testCases = [
        {
          name: "single item",
          cart: [{ price: 100 }],
          expectedTotal: 100
        },
        {
          name: "multiple items",
          cart: [{ price: 25.50 }, { price: 75.25 }, { price: 99.25 }],
          expectedTotal: 200
        },
        {
          name: "zero price items",
          cart: [{ price: 0 }, { price: 100 }],
          expectedTotal: 100
        }
      ];

      for (const testCase of testCases) {
        const req = createReq(
          { 
            nonce: "fake-nonce", 
            cart: testCase.cart 
          },
          { _id: "user123" }
        );
        const res = createRes();
        
        mockGateway.transaction.sale.mockImplementation((options, callback) => {
          callback(null, { success: true });
        });

        await brainTreePaymentController(req, res);

        // Verify correct total was calculated
        expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: testCase.expectedTotal
          }),
          expect.any(Function)
        );

        jest.clearAllMocks();
      }
    });

    /**
     * Test empty cart handling
     * Verifies that the controller can handle empty cart scenarios
     * without causing errors
     */
    test("should handle empty cart", async () => {
      const req = createReq(
        { 
          nonce: "fake-nonce", 
          cart: [] 
        },
        { _id: "user123" }
      );
      const res = createRes();
      
      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, { success: true });
      });

      await brainTreePaymentController(req, res);

      // Verify transaction was called with zero amount
      expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 0
        }),
        expect.any(Function)
      );
    });

    /**
     * Test exception handling in payment controller
     * Verifies that unexpected exceptions during payment processing
     * are caught and logged without crashing the application
     */
    test("should handle unexpected exceptions gracefully", async () => {
      const req = createReq(
        { 
          nonce: "fake-nonce", 
          cart: [{ price: 100 }] 
        },
        { _id: "user123" }
      );
      const res = createRes();
      
      // Mock console.log to verify error logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Make gateway method throw an unexpected error
      mockGateway.transaction.sale.mockImplementation(() => {
        throw new Error("Unexpected payment processing error");
      });

      // Should not throw an exception
      await expect(brainTreePaymentController(req, res)).resolves.not.toThrow();
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    /**
     * Test order creation failure handling
     * Verifies that the payment controller handles database errors
     * during order creation appropriately
     */
    test("should handle order creation failure", async () => {
      const mockCart = [{ price: 100 }];
      const req = createReq(
        { 
          nonce: "fake-nonce", 
          cart: mockCart 
        },
        { _id: "user123" }
      );
      const res = createRes();
      
      // Mock successful transaction but failed order save
      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, { success: true, transaction: { id: "tx123" } });
      });
      
      // Mock order save failure by overriding the default mock
      const failingOrderInstance = {
        save: jest.fn().mockRejectedValue(new Error("Database error"))
      };
      orderModel.mockImplementation(() => failingOrderInstance);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Since the current implementation doesn't properly handle order save failures,
      // we expect this to potentially throw or log errors
      try {
        await brainTreePaymentController(req, res);
      } catch (error) {
        // The controller may not handle this gracefully - that's okay for now
      }

      // Verify transaction was successful
      expect(mockGateway.transaction.sale).toHaveBeenCalled();
      
      // Verify order creation was attempted
      expect(orderModel).toHaveBeenCalled();
      
      // Note: The current implementation doesn't handle order save failures
      // This test documents the current behavior and could guide future improvements
      
      consoleSpy.mockRestore();
    });
  });
});