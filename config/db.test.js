import mongoose from 'mongoose';
import connectDB from '../config/db.js';

// Mock mongoose
jest.mock('mongoose');

describe('Database Connection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Set a default MONGO_URL for tests that need it
    process.env.MONGO_URL = 'mongodb://localhost:27017/testdb';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should connect to database successfully', async () => {
    const mockConnection = {
      connection: {
        host: 'localhost:27017',
        name: 'testdb'
      }
    };

    mongoose.connect.mockResolvedValue(mockConnection);

    const result = await connectDB();

    // Original function only passes MONGO_URL, no options
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    
    // Original function returns undefined
    expect(result).toBeUndefined();
  });

  test('should handle missing MONGO_URL gracefully', async () => {
    delete process.env.MONGO_URL;

    // Original function doesn't validate MONGO_URL, so it will try to connect to undefined
    mongoose.connect.mockResolvedValue({ connection: { host: 'undefined' } });

    const result = await connectDB();

    // Original function will still call mongoose.connect with undefined
    expect(mongoose.connect).toHaveBeenCalledWith(undefined);
    expect(result).toBeUndefined();
  });

  test('should handle empty MONGO_URL gracefully', async () => {
    process.env.MONGO_URL = '';

    mongoose.connect.mockResolvedValue({ connection: { host: '' } });

    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('');
    expect(result).toBeUndefined();
  });

  test('should handle mongoose connection error', async () => {
    const mockError = new Error('Connection failed');
    mongoose.connect.mockRejectedValue(mockError);

    // Original function catches errors and doesn't throw them
    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    // Original function returns undefined even on error
    expect(result).toBeUndefined();
  });

  test('should handle network timeout error', async () => {
    const mockError = new Error('Server selection timeout');
    mongoose.connect.mockRejectedValue(mockError);

    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(result).toBeUndefined();
  });

  test('should handle authentication error', async () => {
    const mockError = new Error('Authentication failed');
    mongoose.connect.mockRejectedValue(mockError);

    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(result).toBeUndefined();
  });

  test('should use minimal connection options', async () => {
    const mockConnection = {
      connection: {
        host: 'localhost:27017',
        name: 'testdb'
      }
    };

    mongoose.connect.mockResolvedValue(mockConnection);

    await connectDB();

    // Original function only passes the URL, no options object
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  test('should log connection success', async () => {
    const mockConnection = {
      connection: {
        host: 'mongodb.example.com:27017',
        name: 'production_db'
      }
    };

    mongoose.connect.mockResolvedValue(mockConnection);
    
    // Mock console.log to verify it's called
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await connectDB();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Connected To Mongodb Database mongodb.example.com:27017')
    );

    consoleSpy.mockRestore();
  });

  test('should log connection errors', async () => {
    const mockError = new Error('Invalid connection string');
    mongoose.connect.mockRejectedValue(mockError);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await connectDB();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in Mongodb')
    );

    consoleSpy.mockRestore();
  });

  test('should handle invalid connection string', async () => {
    process.env.MONGO_URL = 'invalid-connection-string';
    const mockError = new Error('Invalid connection string');
    mongoose.connect.mockRejectedValue(mockError);

    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('invalid-connection-string');
    expect(result).toBeUndefined();
  });
});