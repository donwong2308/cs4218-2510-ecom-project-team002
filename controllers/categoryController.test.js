import { 
  createCategoryController, 
  updateCategoryController, 
  categoryController, 
  singleCategoryController, 
  deleteCategoryController 
} from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

// Mock slugify
jest.mock("slugify");
const mockSlugify = slugify;

// Simple mock response factory
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("categoryController", () => {
  beforeEach(() => {
    mockSlugify.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("createCategoryController", () => {
    test("should return error when name is missing", async () => {
      const req = { body: {} };
      const res = createRes();

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    test("should return error when name is empty string", async () => {
      const req = { body: { name: "" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    test("should return message when category already exists", async () => {
      const existingCategory = {
        _id: "category123",
        name: "Electronics",
        slug: "electronics"
      };

      jest.spyOn(categoryModel, "findOne").mockResolvedValue(existingCategory);

      const req = { body: { name: "Electronics" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exists"
      });
    });

    test("should create new category successfully", async () => {
      const newCategory = {
        _id: "category123",
        name: "Electronics",
        slug: "electronics"
      };

      jest.spyOn(categoryModel, "findOne").mockResolvedValue(null);
      jest.spyOn(categoryModel.prototype, "save").mockResolvedValue(newCategory);

      const req = { body: { name: "Electronics" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
      expect(mockSlugify).toHaveBeenCalledWith("Electronics");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: newCategory
      });
    });

    test("should handle database error during creation", async () => {
      const mockError = new Error("Database connection failed");
      jest.spyOn(categoryModel, "findOne").mockRejectedValue(mockError);

      const req = { body: { name: "Electronics" } };
      const res = createRes();

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error in Category"
      });
    });
  });

  describe("updateCategoryController", () => {
    test("should update category successfully", async () => {
      const updatedCategory = {
        _id: "category123",
        name: "Updated Electronics",
        slug: "updated-electronics"
      };

      jest.spyOn(categoryModel, "findByIdAndUpdate").mockResolvedValue(updatedCategory);

      const req = { 
        body: { name: "Updated Electronics" },
        params: { id: "category123" }
      };
      const res = createRes();

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "category123",
        { name: "Updated Electronics", slug: "updated-electronics" },
        { new: true }
      );
      expect(mockSlugify).toHaveBeenCalledWith("Updated Electronics");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Updated Successfully",
        category: updatedCategory
      });
    });

    test("should return 404 when category not found during update", async () => {
      jest.spyOn(categoryModel, "findByIdAndUpdate").mockResolvedValue(null);

      const req = { 
        body: { name: "Updated Electronics" }, 
        params: { id: "non-existent" } 
      };
      const res = createRes();

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "non-existent",
        { name: "Updated Electronics", slug: "updated-electronics" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found"
      });
    });

    test("should handle database error during update", async () => {
      const mockError = new Error("Database update failed");
      jest.spyOn(categoryModel, "findByIdAndUpdate").mockRejectedValue(mockError);

      const req = { 
        body: { name: "Updated Electronics" }, 
        params: { id: "category123" } 
      };
      const res = createRes();

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error while updating category"
      });
    });
  });

  describe("categoryControlller (get all categories)", () => {
    test("should get all categories successfully", async () => {
      const mockCategories = [
        { _id: "cat1", name: "Electronics", slug: "electronics" },
        { _id: "cat2", name: "Clothing", slug: "clothing" }
      ];

      jest.spyOn(categoryModel, "find").mockResolvedValue(mockCategories);

      const req = {};
      const res = createRes();

      await categoryController(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: mockCategories
      });
    });

    test("should return empty array when no categories exist", async () => {
      jest.spyOn(categoryModel, "find").mockResolvedValue([]);

      const req = {};
      const res = createRes();

      await categoryController(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: []
      });
    });

    test("should handle database error when getting all categories", async () => {
      const mockError = new Error("Database query failed");
      jest.spyOn(categoryModel, "find").mockRejectedValue(mockError);

      const req = {};
      const res = createRes();

      await categoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error while getting all categories"
      });
    });
  });

  describe("singleCategoryController", () => {
    test("should get single category by slug successfully", async () => {
      const mockCategory = {
        _id: "category123",
        name: "Electronics",
        slug: "electronics"
      };

      jest.spyOn(categoryModel, "findOne").mockResolvedValue(mockCategory);

      const req = { params: { slug: "electronics" } };
      const res = createRes();

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get Single Category Successfully",
        category: mockCategory
      });
    });

    test("should return 404 when category not found", async () => {
      jest.spyOn(categoryModel, "findOne").mockResolvedValue(null);

      const req = { params: { slug: "non-existent" } };
      const res = createRes();

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "non-existent" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found"
      });
    });

    test("should handle database error when getting single category", async () => {
      const mockError = new Error("Database query failed");
      jest.spyOn(categoryModel, "findOne").mockRejectedValue(mockError);

      const req = { params: { slug: "electronics" } };
      const res = createRes();

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error While getting Single Category"
      });
    });
  });

  describe("deleteCategoryController", () => {
    test("should delete category successfully", async () => {
      jest.spyOn(categoryModel, "findByIdAndDelete").mockResolvedValue({});

      const req = { params: { id: "category123" } };
      const res = createRes();

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("category123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Deleted Successfully"
      });
    });

    test("should return 404 when category not found during delete", async () => {
      jest.spyOn(categoryModel, "findByIdAndDelete").mockResolvedValue(null);

      const req = { params: { id: "non-existent" } };
      const res = createRes();

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("non-existent");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found"
      });
    });

    test("should handle database error when deleting category", async () => {
      const mockError = new Error("Database delete failed");
      jest.spyOn(categoryModel, "findByIdAndDelete").mockRejectedValue(mockError);

      const req = { params: { id: "category123" } };
      const res = createRes();

      await deleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while deleting category",
        error: mockError
      });
    });

    test("should handle missing id parameter", async () => {
      jest.spyOn(categoryModel, "findByIdAndDelete").mockResolvedValue({});

      const req = { params: {} };
      const res = createRes();

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Deleted Successfully"
      });
    });
  });
});