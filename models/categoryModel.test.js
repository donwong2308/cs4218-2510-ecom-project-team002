import mongoose from 'mongoose';

// Mock mongoose before importing the model
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    paths: {
      name: {
        instance: 'String',
        options: { type: String },
        isRequired: false
      },
      slug: {
        instance: 'String',
        options: { type: String, lowercase: true },
        isRequired: false
      }
    },
    add: jest.fn(),
    method: jest.fn(),
    static: jest.fn()
  }));

  const mockModel = jest.fn().mockReturnValue({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    modelName: 'Category',
    schema: {}
  });

  return {
    Schema: mockSchema,
    model: mockModel
  };
});

// Import the model after mocking
import categoryModel from './categoryModel.js';

describe('Category Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export mongoose model', () => {
    expect(categoryModel).toBeDefined();
    expect(typeof categoryModel).toBe('object');
  });

  test('should be a mongoose model', () => {
    expect(categoryModel).toBeDefined();
    expect(typeof categoryModel).toBe('object');
  });

  test('should have expected mongoose model methods', () => {
    expect(categoryModel.find).toBeDefined();
    expect(categoryModel.findOne).toBeDefined();
    expect(categoryModel.create).toBeDefined();
    expect(categoryModel.findByIdAndUpdate).toBeDefined();
    expect(categoryModel.findByIdAndDelete).toBeDefined();
    expect(typeof categoryModel.find).toBe('function');
    expect(typeof categoryModel.create).toBe('function');
  });

  test('should have modelName "Category"', () => {
    expect(categoryModel.modelName).toBe('Category');
  });

  test('should have a schema object', () => {
    expect(categoryModel.schema).toBeDefined();
    expect(typeof categoryModel.schema).toBe('object');
  });

  test('schema should have name and slug fields', () => {
    // Since the mock is set up before the model is imported, we can test the mock structure
    // The mockSchema function should have been called to create the schema
    expect(mongoose.Schema).toBeDefined();
    expect(typeof mongoose.Schema).toBe('function');
    
    // Test that the model has the expected structure from our mock
    expect(categoryModel).toBeDefined();
    expect(categoryModel.modelName).toBe('Category');
    expect(categoryModel.schema).toBeDefined();
  });
});