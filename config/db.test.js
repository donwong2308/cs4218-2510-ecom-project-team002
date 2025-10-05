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

    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL,
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      })
    );

    expect(result).toEqual({
      success: true,
      host: 'localhost:27017',
      name: 'testdb'
    });
  });

  test('should throw error when MONGO_URL is not defined', async () => {
    delete process.env.MONGO_URL;

    await expect(connectDB()).rejects.toThrow('MONGO_URL environment variable is not defined');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test('should throw error when MONGO_URL is empty', async () => {
    process.env.MONGO_URL = '';

    await expect(connectDB()).rejects.toThrow('MONGO_URL environment variable is not defined');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test('should handle mongoose connection error', async () => {
    const mockError = new Error('Connection failed');
    mongoose.connect.mockRejectedValue(mockError);

    await expect(connectDB()).rejects.toThrow('Database connection failed: Connection failed');
    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL,
      expect.any(Object)
    );
  });

  test('should handle network timeout error', async () => {
    const mockError = new Error('Server selection timeout');
    mongoose.connect.mockRejectedValue(mockError);

    await expect(connectDB()).rejects.toThrow('Database connection failed: Server selection timeout');
  });

  test('should handle authentication error', async () => {
    const mockError = new Error('Authentication failed');
    mongoose.connect.mockRejectedValue(mockError);

    await expect(connectDB()).rejects.toThrow('Database connection failed: Authentication failed');
  });

  test('should use correct connection options', async () => {
    const mockConnection = {
      connection: {
        host: 'localhost:27017',
        name: 'testdb'
      }
    };

    mongoose.connect.mockResolvedValue(mockConnection);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      }
    );
  });

  test('should return connection info on success', async () => {
    const mockConnection = {
      connection: {
        host: 'mongodb.example.com:27017',
        name: 'production_db'
      }
    };

    mongoose.connect.mockResolvedValue(mockConnection);

    const result = await connectDB();

    expect(result).toEqual({
      success: true,
      host: 'mongodb.example.com:27017',
      name: 'production_db'
    });
  });

  test('should handle invalid connection string', async () => {
    process.env.MONGO_URL = 'invalid-connection-string';
    const mockError = new Error('Invalid connection string');
    mongoose.connect.mockRejectedValue(mockError);

    await expect(connectDB()).rejects.toThrow('Database connection failed: Invalid connection string');
  });
});
