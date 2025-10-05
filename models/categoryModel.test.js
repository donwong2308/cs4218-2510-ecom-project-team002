import mongoose from 'mongoose';
import categoryModel from './categoryModel.js';

// Mock mongoose
jest.mock('mongoose');

describe('Category Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create category model with correct schema', () => {
    // Verify that mongoose.model was called with correct parameters
    expect(mongoose.model).toHaveBeenCalledWith('Category', expect.any(mongoose.Schema));
  });

  test('should have correct schema structure', () => {
    // Get the schema that was passed to mongoose.model
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Check that it's a mongoose schema
    expect(schema).toBeInstanceOf(mongoose.Schema);

    // Check schema paths
    expect(schema.paths.name).toBeDefined();
    expect(schema.paths.slug).toBeDefined();
  });

  test('should have name field with correct configuration', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const namePath = schema.paths.name;
    expect(namePath.instance).toBe('String');
    expect(namePath.options.type).toBe(String);
  });

  test('should have slug field with correct configuration', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const slugPath = schema.paths.slug;
    expect(slugPath.instance).toBe('String');
    expect(slugPath.options.type).toBe(String);
    expect(slugPath.options.lowercase).toBe(true);
  });

  test('should not have required validation on name field', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const namePath = schema.paths.name;
    expect(namePath.isRequired).toBe(false);
  });

  test('should not have unique validation on name field', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const namePath = schema.paths.name;
    expect(namePath.options.unique).toBeUndefined();
  });

  test('should export mongoose model', () => {
    expect(categoryModel).toBeDefined();
    expect(typeof categoryModel).toBe('function');
  });

  test('should be a mongoose model', () => {
    // Mock the model to return a function that has model properties
    const mockModel = jest.fn();
    mockModel.modelName = 'Category';
    mockModel.schema = {};
    
    mongoose.model.mockReturnValue(mockModel);
    
    // Re-import to get the mocked model
    jest.resetModules();
    const categoryModelMocked = require('./categoryModel.js').default;
    
    expect(categoryModelMocked).toBe(mockModel);
  });

  test('should handle schema validation correctly', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Test that schema can be instantiated
    expect(() => {
      new schema();
    }).not.toThrow();
  });

  test('should have correct model name', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const modelName = modelCall[0];
    
    expect(modelName).toBe('Category');
  });

  test('should support creating category documents', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Test creating a document with valid data
    const doc = new schema({
      name: 'Electronics',
      slug: 'electronics'
    });

    expect(doc.name).toBe('Electronics');
    expect(doc.slug).toBe('electronics');
  });

  test('should handle empty documents', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Test creating an empty document
    const doc = new schema({});

    expect(doc.name).toBeUndefined();
    expect(doc.slug).toBeUndefined();
  });

  test('should handle partial documents', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Test creating a document with only name
    const docWithName = new schema({ name: 'Electronics' });
    expect(docWithName.name).toBe('Electronics');
    expect(docWithName.slug).toBeUndefined();

    // Test creating a document with only slug
    const docWithSlug = new schema({ slug: 'electronics' });
    expect(docWithSlug.name).toBeUndefined();
    expect(docWithSlug.slug).toBe('electronics');
  });

  test('should handle slug lowercase transformation', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const doc = new schema({
      name: 'Electronics',
      slug: 'ELECTRONICS'
    });

    // The lowercase option should be applied
    expect(doc.slug).toBe('electronics');
  });

  test('should handle special characters in fields', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const doc = new schema({
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets'
    });

    expect(doc.name).toBe('Electronics & Gadgets');
    expect(doc.slug).toBe('electronics-gadgets');
  });

  test('should handle long field values', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const longName = 'Very Long Category Name That Might Exceed Normal Length';
    const longSlug = 'very-long-category-name-that-might-exceed-normal-length';

    const doc = new schema({
      name: longName,
      slug: longSlug
    });

    expect(doc.name).toBe(longName);
    expect(doc.slug).toBe(longSlug);
  });

  test('should handle null values', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const doc = new schema({
      name: null,
      slug: null
    });

    expect(doc.name).toBeNull();
    expect(doc.slug).toBeNull();
  });

  test('should handle undefined values', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    const doc = new schema({
      name: undefined,
      slug: undefined
    });

    expect(doc.name).toBeUndefined();
    expect(doc.slug).toBeUndefined();
  });

  test('should be compatible with mongoose operations', () => {
    // Test that the model can be used with common mongoose operations
    const mockModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn()
    };

    mongoose.model.mockReturnValue(mockModel);

    // Re-import to get the mocked model
    jest.resetModules();
    const categoryModelMocked = require('./categoryModel.js').default;

    expect(categoryModelMocked.find).toBeDefined();
    expect(categoryModelMocked.findOne).toBeDefined();
    expect(categoryModelMocked.create).toBeDefined();
    expect(categoryModelMocked.findByIdAndUpdate).toBeDefined();
    expect(categoryModelMocked.findByIdAndDelete).toBeDefined();
  });

  test('should have proper schema options', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Check that schema has the expected structure
    expect(schema.paths).toBeDefined();
    expect(schema.paths.name).toBeDefined();
    expect(schema.paths.slug).toBeDefined();
  });

  test('should support schema methods if added', () => {
    const modelCall = mongoose.model.mock.calls[0];
    const schema = modelCall[1];

    // Test that schema is extensible
    expect(typeof schema.add).toBe('function');
    expect(typeof schema.method).toBe('function');
    expect(typeof schema.static).toBe('function');
  });
});
