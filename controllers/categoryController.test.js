import { createCategoryController, updateCategoryController, deleteCategoryController, categoryController, singleCategoryController } from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");
jest.mock("slugify");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("categoryController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCategoryController", () => {
    test("should return 401 when name is missing", async () => {
      const req = { body: {} };
      const res = createRes();

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    test("should return 200 when category already exists", async () => {
      categoryModel.findOne.mockResolvedValue({ name: "Test" });

      const req = { body: { name: "Test" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Test" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
    });

    test("should create a new category and return 201", async () => {
      categoryModel.findOne.mockResolvedValue(null);
      slugify.mockReturnValue("test-slug");
      categoryModel.prototype.save = jest.fn().mockResolvedValue({
        name: "Test",
        slug: "test-slug",
      });

      const req = { body: { name: "Test" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(slugify).toHaveBeenCalledWith("Test");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: { name: "Test", slug: "test-slug" },
      });
    });

    test("should handle errors and return 500 in createCategoryController", async () => {
      categoryModel.findOne.mockRejectedValue(new Error("Database error"));

      const req = { body: { name: "Test" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Errro in Category",
      });
    });
  });

  describe("updateCategoryController", () => {
    test("should update category and return 200", async () => {
      slugify.mockImplementation((name) => `${name.toLowerCase()}-slug`);
      categoryModel.findByIdAndUpdate.mockResolvedValue({
        _id: "123",
        name: "Updated",
        slug: "updated-slug",
      });

      const req = { params: { id: "123" }, body: { name: "Updated" } };
      const res = createRes();

      await updateCategoryController(req, res);

      expect(slugify).toHaveBeenCalledWith("Updated");
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        { name: "Updated", slug: "updated-slug" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: { _id: "123", name: "Updated", slug: "updated-slug" },
      });
    });

    test("should handle errors and return 500", async () => {
      categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("Update error"));

      const req = { params: { id: "123" }, body: { name: "Updated" } };
      const res = createRes();

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error while updating category",
      });
    });
  });

  describe("deleteCategoryController", () => {
    test("should delete category and return 200", async () => {
      categoryModel.findByIdAndDelete.mockResolvedValue({});

      const req = { params: { id: "123" } };
      const res = createRes();

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });

    test("should handle errors and return 500", async () => {
      categoryModel.findByIdAndDelete.mockRejectedValue(new Error("Delete error"));

      const req = { params: { id: "123" } };
      const res = createRes();

      await deleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while deleting category",
        error: expect.any(Error),
      });
    });
  });

  describe("categoryController", () => {
    test("should get all categories and return 200", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
        { _id: "2", name: "Clothing", slug: "clothing" },
        { _id: "3", name: "Books", slug: "books" },
      ];
      categoryModel.find.mockResolvedValue(mockCategories);

      const req = {};
      const res = createRes();

      await categoryController(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: mockCategories,
      });
    });

    test("should handle errors and return 500", async () => {
        categoryModel.find.mockRejectedValue(new Error("Database error"));
  
        const req = {};
        const res = createRes();
  
        await categoryController(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(Error),
          message: "Error while getting all categories",
        });
      });
    });

    describe("singleCategoryController", () => {
        test("should get single category by slug and return 200", async () => {
          const mockCategory = {
            _id: "123",
            name: "Electronics",
            slug: "electronics",
          };
          categoryModel.findOne.mockResolvedValue(mockCategory);
    
          const req = { params: { slug: "electronics" } };
          const res = createRes();
    
          await singleCategoryController(req, res);
    
          expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Get SIngle Category SUccessfully",
            category: mockCategory,
          });
        });
    
        test("should handle errors and return 500", async () => {
          categoryModel.findOne.mockRejectedValue(new Error("Database error"));
    
          const req = { params: { slug: "electronics" } };
          const res = createRes();
    
          await singleCategoryController(req, res);
    
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: expect.any(Error),
            message: "Error While getting Single Category",
          });
        });
      });
});