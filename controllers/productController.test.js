import dotenv from 'dotenv';
dotenv.config();

import { createProductController, updateProductController, deleteProductController } from './productController.js';
import productModel from '../models/productModel.js';
import fs from 'fs';
import slugify from 'slugify';

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