import { registerController, loginController, forgotPasswordController } from "./authController.js";
import userModel from "../models/userModel.js";
import * as authHelper from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Simple mock response factory
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("registerController", () => {
    test("should return error when name is missing", async () => {
      const req = { body: { email: "a@b.com", password: "123456", phone: "1234567890", address: "addr", answer: "ans" } };
      const res = createRes();

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test("should return message when user already exists", async () => {
      jest.spyOn(userModel, "findOne").mockResolvedValue({ _id: "u1" });

      const req = { body: { name: "John", email: "a@b.com", password: "123456", phone: "1234567890", address: "addr", answer: "ans" } };
      const res = createRes();

      await registerController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Already Register please login" });
    });

    test("should register user and return 201", async () => {
      jest.spyOn(userModel, "findOne").mockResolvedValue(null);
      jest.spyOn(authHelper, "hashPassword").mockResolvedValue("hashed_pwd");
      const savedUser = {
        _id: "user123",
        name: "John",
        email: "a@b.com",
        phone: "1234567890",
        address: "addr",
        role: 0,
      };
      jest.spyOn(userModel.prototype, "save").mockResolvedValue(savedUser);

      const req = { body: { name: "John", email: "a@b.com", password: "123456", phone: "1234567890", address: "addr", answer: "ans" } };
      const res = createRes();

      await registerController(req, res);

      expect(authHelper.hashPassword).toHaveBeenCalledWith("123456");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ success: true, message: "User Register Successfully", user: savedUser });
    });
  });

  describe("loginController", () => {
    test("should return 404 for missing email or password", async () => {
      const res = createRes();
      await loginController({ body: { email: "", password: "" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid email or password" });
    });

    test("should return 404 if user not found", async () => {
      jest.spyOn(userModel, "findOne").mockResolvedValue(null);

      const req = { body: { email: "a@b.com", password: "123456" } };
      const res = createRes();

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is not registerd" });
    });

    test("should return 200 if password does not match", async () => {
      jest.spyOn(userModel, "findOne").mockResolvedValue({ _id: "u1", password: "hashed" });
      jest.spyOn(authHelper, "comparePassword").mockResolvedValue(false);

      const req = { body: { email: "a@b.com", password: "wrong" } };
      const res = createRes();

      await loginController(req, res);

      expect(authHelper.comparePassword).toHaveBeenCalledWith("wrong", "hashed");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid Password" });
    });

    test("should login successfully and return token", async () => {
      const user = {
        _id: "u1",
        name: "John",
        email: "a@b.com",
        phone: "1234567890",
        address: "addr",
        role: 0,
        password: "hashed",
      };
      jest.spyOn(userModel, "findOne").mockResolvedValue(user);
      jest.spyOn(authHelper, "comparePassword").mockResolvedValue(true);
      jest.spyOn(JWT, "sign").mockReturnValue("mock.jwt.token");

      const req = { body: { email: "a@b.com", password: "123456" } };
      const res = createRes();

      await loginController(req, res);

      expect(JWT.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "login successfully",
        user: {
          _id: "u1",
          name: "John",
          email: "a@b.com",
          phone: "1234567890",
          address: "addr",
          role: 0,
        },
        token: "mock.jwt.token",
      });
    });
  });

  describe("forgotPasswordController", () => {
    test("testForgotPasswordResetsPasswordOnValidEmailAndAnswer", async () => {
      const req = {
        body: {
          email: "user@example.com",
          answer: "pet",
          newPassword: "newStrongPass123",
        },
      };
      const res = createRes();

      const mockUser = { _id: "user123" };

      jest.spyOn(userModel, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(authHelper, "hashPassword").mockResolvedValue("hashed_new_password");
      jest.spyOn(userModel, "findByIdAndUpdate").mockResolvedValue({});

      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "user@example.com", answer: "pet" });
      expect(authHelper.hashPassword).toHaveBeenCalledWith("newStrongPass123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", { password: "hashed_new_password" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });
  });
});