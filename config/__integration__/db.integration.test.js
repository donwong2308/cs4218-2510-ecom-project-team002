/**
 * Combined Integration Test:
 * - Real in-memory MongoDB (mongodb-memory-server)
 * - Real connectDB() (no mongoose.connect mocking)
 * - Verifies env wiring, successful boot log, and model persistence behavior
 */

/**
 * @jest-environment node
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Adjust the import paths to your project structure:
import connectDB from '../../config/db.js';
import categoryModel from '../../models/categoryModel.js';

describe('E2E Integration: connectDB wiring + Category model (in-memory MongoDB)', () => {
  let mongo;
  const originalEnv = process.env;
  let consoleLogSpy;

  beforeAll(async () => {
    // start in-memory Mongo
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    // set env that connectDB reads
    process.env = { ...originalEnv, MONGO_URL: uri };

    // spy on console.log to verify boot message (
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // call your real connectDB (no mocks)
    await connectDB();

    // sanity: ensure mongoose is connected
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  }, 60_000);

  afterAll(async () => {
    // drop DB and close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongo) await mongo.stop();

    // restore env + console
    if (consoleLogSpy) consoleLogSpy.mockRestore();
    process.env = originalEnv;
  });

  afterEach(async () => {
    // clean all collections between tests
    if (mongoose.connection?.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  });

  it('connectDB reads MONGO_URL and logs success once connected', async () => {

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Connected To Mongodb Database')
    );

    const { host } = mongoose.connection;
    expect(host).toBeTruthy(); // host string from the active connection
  });

  it('persists & retrieves Category; slug normalization is enforced by the schema', async () => {
    const created = await categoryModel.create({
      name: 'Wearables',
      slug: 'WeArAbLeS',
    });

    expect(created._id).toBeDefined();
    expect(created.slug).toBe('wearables');

    const fetched = await categoryModel.findOne({ name: 'Wearables' }).lean();
    expect(fetched).not.toBeNull();
    expect(fetched.slug).toBe('wearables');
  });

  it('enforces validation / unique constraints (if defined on schema)', async () => {
    // This test only triggers if your schema has a unique index on name or slug.
    
    
    await categoryModel.create({ name: 'Gadgets', slug: 'gadgets' });

    let threw = false;
    try {
      await categoryModel.create({ name: 'Gadgets', slug: 'gadgets-dup' });
    } catch (err) {
      threw = true;
      // Mongo duplicate key error code:
      expect(err?.code === 11000 || /duplicate key/i.test(err?.message)).toBe(true);
    }
    // If your schema isn't unique, replace this with a validator test instead.
    expect(threw).toBe(true);
  });
});
