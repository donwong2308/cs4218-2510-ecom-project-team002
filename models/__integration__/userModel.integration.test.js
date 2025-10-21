import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../userModel.js";

describe("User Model Integration Tests", () => {
  let mongoServer;

  // Helper function to create test user data
  const createTestUser = (overrides = {}) => ({
    name: "Test User",
    email: "test@example.com",
    password: "hashedPassword123",
    phone: "1234567890",
    address: { street: "123 Test St", city: "Test City" },
    answer: "test answer",
    ...overrides,
  });

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    // Ensure indexes are created for unique constraints
    await User.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("User Creation and Validation", () => {
    test("should create a user successfully with valid data", async () => {
      // Arrange
      const userData = createTestUser();

      // Act
      const savedUser = await User.create(userData);

      // Assert
      expect(savedUser).toBeDefined();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(0); // default role
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test("should apply default role when not specified", async () => {
      // Arrange
      const userData = createTestUser();
      delete userData.role;

      // Act
      const savedUser = await User.create(userData);

      // Assert
      expect(savedUser.role).toBe(0);
    });

    test("should allow admin role assignment", async () => {
      // Arrange
      const adminData = createTestUser({
        email: "admin@example.com",
        role: 1,
      });

      // Act
      const savedAdmin = await User.create(adminData);

      // Assert
      expect(savedAdmin.role).toBe(1);
    });

    test("should enforce unique email constraint", async () => {
      // Arrange
      const userData1 = createTestUser();
      const userData2 = createTestUser(); // same email

      // Act & Assert
      await User.create(userData1);
      await expect(User.create(userData2)).rejects.toThrow();
    });
  });

  describe("User Query Operations", () => {
    test("should find user by email", async () => {
      // Arrange
      const userData = createTestUser();
      const savedUser = await User.create(userData);

      // Act
      const foundUser = await User.findOne({ email: userData.email });

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser._id.toString()).toBe(savedUser._id.toString());
    });

    test("should find user by id", async () => {
      // Arrange
      const userData = createTestUser();
      const savedUser = await User.create(userData);

      // Act
      const foundUser = await User.findById(savedUser._id);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(savedUser._id.toString());
      expect(foundUser.name).toBe(userData.name);
    });

    test("should return null for non-existent user", async () => {
      // Act
      const foundUser = await User.findById(new mongoose.Types.ObjectId());

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe("User Update Operations", () => {
    test("should update user profile successfully", async () => {
      // Arrange
      const userData = createTestUser();
      const savedUser = await User.create(userData);
      const updateData = {
        name: "Updated Name",
        phone: "9876543210",
        address: { street: "456 New St", city: "New City" },
      };

      // Act
      const updatedUser = await User.findByIdAndUpdate(
        savedUser._id,
        updateData,
        { new: true }
      );

      // Assert
      expect(updatedUser.name).toBe("Updated Name");
      expect(updatedUser.phone).toBe("9876543210");
      expect(updatedUser.address.street).toBe("456 New St");
      expect(updatedUser.email).toBe(userData.email); // unchanged
    });

    test("should update user role", async () => {
      // Arrange
      const userData = createTestUser({ role: 0 });
      const savedUser = await User.create(userData);

      // Act
      const promotedUser = await User.findByIdAndUpdate(
        savedUser._id,
        { role: 1 },
        { new: true }
      );

      // Assert
      expect(promotedUser.role).toBe(1);
    });
  });

  describe("User Deletion Operations", () => {
    test("should delete user successfully", async () => {
      // Arrange
      const userData = createTestUser();
      const savedUser = await User.create(userData);

      // Act
      const deletedUser = await User.findByIdAndDelete(savedUser._id);

      // Assert
      expect(deletedUser).toBeDefined();
      expect(deletedUser._id.toString()).toBe(savedUser._id.toString());

      // Verify user is actually deleted
      const foundUser = await User.findById(savedUser._id);
      expect(foundUser).toBeNull();
    });
  });

  describe("Authentication Helper Operations", () => {
    test("should find user for login verification", async () => {
      // Arrange
      const userData = createTestUser();
      await User.create(userData);

      // Act
      const loginUser = await User.findOne({
        email: userData.email,
      });

      // Assert
      expect(loginUser).toBeDefined();
      expect(loginUser.email).toBe(userData.email);
      expect(loginUser.password).toBe(userData.password);
    });

    test("should find user for password recovery", async () => {
      // Arrange
      const userData = createTestUser();
      await User.create(userData);

      // Act
      const recoveryUser = await User.findOne({
        email: userData.email,
        answer: userData.answer,
      });

      // Assert
      expect(recoveryUser).toBeDefined();
      expect(recoveryUser.email).toBe(userData.email);
      expect(recoveryUser.answer).toBe(userData.answer);
    });
  });

  describe("Schema Field Behavior", () => {
    test("should trim whitespace from name field", async () => {
      // Arrange
      const userData = createTestUser({
        name: "  Trimmed User  ",
        email: "trim@test.com",
      });

      // Act
      const savedUser = await User.create(userData);

      // Assert
      expect(savedUser.name).toBe("Trimmed User");
    });

    test("should handle complex address object", async () => {
      // Arrange
      const userData = createTestUser({
        email: "address@test.com",
        address: {
          street: "123 Main St",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
        },
      });

      // Act
      const savedUser = await User.create(userData);

      // Assert
      expect(savedUser.address.street).toBe("123 Main St");
      expect(savedUser.address.city).toBe("Test City");
      expect(savedUser.address.state).toBe("Test State");
      expect(savedUser.address.zipCode).toBe("12345");
    });
  });
});
