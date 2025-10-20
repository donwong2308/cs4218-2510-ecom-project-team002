import request from "supertest";
import express from "express";
import categoryRoutes from "../../routes/categoryRoutes.js";
import categoryModel from "../../models/categoryModel.js";

jest.mock("../../middlewares/authMiddleware.js", () => ({
  __esModule: true,
  requireSignIn: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock("../../models/categoryModel.js", () => {
  const ctor = jest.fn();
  ctor.findOne = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  ctor.find = jest.fn();
  ctor.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: ctor };
});

const app = express();
app.use(express.json());
app.use("/api/v1/category", categoryRoutes);

describe("Category Controller Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/category/get-category", () => {
    it("200 lists all categories", async () => {
      categoryModel.find.mockResolvedValueOnce([
        { _id: "c1", name: "Phones" },
        { _id: "c2", name: "Laptops" },
      ]);

      const res = await request(app).get("/api/v1/category/get-category");

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, category: expect.any(Array) });
      expect(res.body.category).toHaveLength(2);
    });
  });

  describe("GET /api/v1/category/single-category/:slug", () => {
    it("200 returns single category by slug", async () => {
      categoryModel.findOne.mockResolvedValueOnce({ _id: "c3", name: "Wearables", slug: "wearables" });

      const res = await request(app).get("/api/v1/category/single-category/wearables");

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "wearables" });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, category: { slug: "wearables" } });
    });
  });

  describe("Error handling paths", () => {
    it("500 on DB error during listing", async () => {
      categoryModel.find.mockRejectedValueOnce(new Error("DB Down"));

      const res = await request(app).get("/api/v1/category/get-category");

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false, message: expect.stringMatching(/getting all categories/i) });
    });
  });
});


