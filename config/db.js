import mongoose from "mongoose";
import colors from "colors";

// Production Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

// Test Database Utilities
let testConnection = null;

export const connectToTestDb = async (testDbName = "test-ecommerce") => {
  try {
    const testDbUrl =
      process.env.MONGO_TEST_URL || `mongodb://localhost:27017/${testDbName}`;

    if (testConnection && testConnection.readyState === 1) {
      return testConnection;
    }

    const connection = await mongoose.connect(testDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    testConnection = connection.connection;
    console.log(`✅ Test DB Connected: ${testDbName}`);
    return testConnection;
  } catch (error) {
    console.error(`❌ Test DB Connection Failed: ${error.message}`);
    throw error;
  }
};

export const resetTestDb = async () => {
  try {
    if (!testConnection) return;

    const collections = await testConnection.db.collections();
    const deletePromises = collections.map((collection) =>
      collection.deleteMany({})
    );
    await Promise.all(deletePromises);

    console.log("🧹 Test DB Reset Complete");
  } catch (error) {
    console.error(`❌ Test DB Reset Failed: ${error.message}`);
    throw error;
  }
};

export const disconnectFromTestDb = async () => {
  try {
    if (testConnection) {
      await mongoose.disconnect();
      testConnection = null;
      console.log("✅ Test DB Disconnected");
    }
  } catch (error) {
    console.error(`❌ Test DB Disconnect Failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
