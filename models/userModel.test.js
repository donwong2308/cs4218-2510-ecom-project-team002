import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "./userModel.js";

describe("User Model Integration Tests", () => {
  let mongoServer;
  let mongoUri;

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
    mongoUri = mongoServer.getUri();
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

  describe("User Model", () => {
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

      test("should validate required fields", async () => {
        // Test missing name
        await expect(
          User.create({
            email: "test@test.com",
            password: "password",
            phone: "123456789",
            address: {},
            answer: "answer",
          })
        ).rejects.toThrow();

        // Test missing email
        await expect(
          User.create({
            name: "Test User",
            password: "password",
            phone: "123456789",
            address: {},
            answer: "answer",
          })
        ).rejects.toThrow();
      });
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

    test("should find users by role", async () => {
      // Arrange
      await User.create(createTestUser({ email: "user1@test.com", role: 0 }));
      await User.create(createTestUser({ email: "user2@test.com", role: 0 }));
      await User.create(createTestUser({ email: "admin@test.com", role: 1 }));

      // Act
      const regularUsers = await User.find({ role: 0 });
      const admins = await User.find({ role: 1 });

      // Assert
      expect(regularUsers).toHaveLength(2);
      expect(admins).toHaveLength(1);
      expect(admins[0].role).toBe(1);
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

    test("should handle update of non-existent user", async () => {
      // Act
      const result = await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(),
        { name: "New Name" },
        { new: true }
      );

      // Assert
      expect(result).toBeNull();
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

    test("should return null when deleting non-existent user", async () => {
      // Act
      const result = await User.findByIdAndDelete(
        new mongoose.Types.ObjectId()
      );

      // Assert
      expect(result).toBeNull();
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
          country: "Test Country",
        },
      });

      // Act
      const savedUser = await User.create(userData);

      // Assert
      expect(savedUser.address.street).toBe("123 Main St");
      expect(savedUser.address.city).toBe("Test City");
      expect(savedUser.address.state).toBe("Test State");
      expect(savedUser.address.zipCode).toBe("12345");
      expect(savedUser.address.country).toBe("Test Country");
    });
  });

  describe("Authentication Helper Operations", () => {
    test("should find user for login verification", async () => {
      // Arrange
      const userData = createTestUser();
      const savedUser = await User.create(userData);

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
      const savedUser = await User.create(userData);

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

    test("should not find user with wrong security answer", async () => {
      // Arrange
      const userData = createTestUser();
      await User.create(userData);

      // Act
      const wrongAnswerUser = await User.findOne({
        email: userData.email,
        answer: "wrong answer",
      });

      // Assert
      expect(wrongAnswerUser).toBeNull();
    });
  });

  describe("User Collection Operations", () => {
    test("should count total users", async () => {
      // Arrange
      await User.create(createTestUser({ email: "user1@test.com" }));
      await User.create(createTestUser({ email: "user2@test.com" }));
      await User.create(createTestUser({ email: "user3@test.com" }));

      // Act
      const userCount = await User.countDocuments();

      // Assert
      expect(userCount).toBe(3);
    });

    test("should delete all users", async () => {
      // Arrange
      await User.create(createTestUser({ email: "user1@test.com" }));
      await User.create(createTestUser({ email: "user2@test.com" }));

      // Act
      await User.deleteMany({});
      const remainingUsers = await User.find();

      // Assert
      expect(remainingUsers).toHaveLength(0);
    });
  });
});
