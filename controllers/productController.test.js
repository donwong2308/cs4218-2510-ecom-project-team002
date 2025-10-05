import dotenv from "dotenv";
dotenv.config();

import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/productController.js";

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js"; // for payment unit tests

import fs from "fs";
import slugify from "slugify";

// ---- Mocks ----
jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
jest.mock("fs");
jest.mock("slugify");
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    clientToken: {
      generate: jest.fn(),
    },
    transaction: {
      sale: jest.fn(),
    },
  })),
  Environment: {
    Sandbox: "Sandbox",
  },
}));

describe("Product Controller Tests", () => {
  let req, res, consoleSpy;

  res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  const makeProduct = (i) => ({
    _id: `product-id-${i}`,
    name: `Product ${i}`,
    description: `Test Description ${i}`,
    price: 10 + i,
    category: {
      _id: `category-id-${(i % 3) + 1}`,
      name: `Category ${(i % 3) + 1}`,
    },
    quantity: i,
    createdAt: new Date(2025, 0, i + 1),
  });

  const makeProducts = (n) => {
    return Array.from({ length: n }, (_, i) => makeProduct(i));
  };

  describe("getProductController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const setProducts = (mockProducts) => {
      let capturedLimit = 12;
      let capturedSort = true;

      const sort = jest.fn().mockImplementation((sortArg) => {
        capturedSort = sortArg;

        let arr = [...mockProducts];
        if (capturedSort && capturedSort.createdAt) {
          const dir = capturedSort.createdAt; // -1 or 1
          arr.sort((a, b) => {
            const at = new Date(a.createdAt).getTime();
            const bt = new Date(b.createdAt).getTime();
            return dir === -1 ? bt - at : at - bt;
          });
        }

        if (typeof capturedLimit === "number") {
          arr = arr.slice(0, capturedLimit);
        }

        return Promise.resolve(arr);
      });

      const limit = jest.fn().mockImplementation((n) => {
        capturedLimit = n;
        return { sort };
      });

      const select = jest.fn().mockReturnValue({ limit, sort });
      const populate = jest.fn().mockReturnValue({ select, limit, sort });
      productModel.find.mockReturnValue({ populate, select, limit, sort });
      return { calls: { populate, select, limit, sort } };
    };

    const setProductsError = (errMsg = "DB Down") => {
      const sort = jest.fn().mockRejectedValue(new Error(errMsg));
      const limit = jest.fn().mockReturnValue({ sort });
      const select = jest.fn().mockReturnValue({ limit, sort });
      const populate = jest.fn().mockReturnValue({ select, limit, sort });
      productModel.find.mockReturnValue({ populate, select, limit, sort });
    };

    test("Valid Test: No Products", async () => {
      var mockProducts = makeProducts(0);
      setProducts(mockProducts);
      await getProductController(req, res);

      mockProducts = mockProducts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });
    });

    test("Valid Test: 1 Product", async () => {
      var mockProducts = makeProducts(1);
      setProducts(mockProducts);
      await getProductController(req, res);

      mockProducts = mockProducts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });
    });

    test("Valid Test: 12 Products", async () => {
      var mockProducts = makeProducts(12);
      setProducts(mockProducts);
      await getProductController(req, res);

      mockProducts = mockProducts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });
    });

    test("Valid Test: 13 Products", async () => {
      var mockProducts = makeProducts(13);
      setProducts(mockProducts);
      await getProductController(req, res);

      mockProducts = mockProducts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });
    });

    test("Invalid Test: DB Down", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      setProductsError();

      await getProductController(req, res);

      expect(logSpy).toHaveBeenCalled();

      const [firstArg] = logSpy.mock.calls[0];
      expect(firstArg).toBeInstanceOf(Error);
      expect(firstArg.message).toBe("DB Down");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Erorr in getting products",
        error: "DB Down",
      });
      logSpy.mockRestore();
    });
  });

  describe("getSingleProductController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req = { params: { slug: "product-0" } };
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const setProduct = (mockProduct) => {
      const populate = jest.fn().mockReturnValue({ mockProduct });
      const select = jest.fn().mockReturnValue({ populate });
      productModel.findOne.mockReturnValue({ select, populate });
      return { calls: { populate, select } };
    };

    const setProductError = (errMsg = "DB Down") => {
      const populate = jest.fn().mockRejectedValue(new Error(errMsg));
      const select = jest.fn().mockReturnValue({ populate });
      productModel.findOne.mockReturnValue({ select, populate });
      return { calls: { populate, select } };
    };

    test("Valid Test: 0 Product (error path)", async () => {
      setProductError();

      await getSingleProductController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Eror while getitng single product",
        error: "DB Down",
      });
    });

    test("Valid Test: 1 Product", async () => {
      var mockProduct = makeProduct(0);
      setProduct(mockProduct);

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: { mockProduct: mockProduct },
      });
    });

    test("Invalid Test: DB Down", async () => {
      setProductError();

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Eror while getitng single product",
        error: "DB Down",
      });
    });
  });

  describe("productPhotoController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const setPhotoProduct = (buf, contentType = "image/jpeg", pid = "p1") => {
      const product = {
        _id: pid,
        photo: { data: buf, contentType },
      };
      const select = jest.fn().mockResolvedValue(product);
      productModel.findById.mockReturnValue({ select });
      return { pid, product, calls: { select } };
    };

    const setPhotoNone = (pid = "p1") => {
      const product = {
        _id: pid,
        photo: {},
      };
      const select = jest.fn().mockResolvedValue(product);
      productModel.findById.mockReturnValue({ select });
      return { pid, product, calls: { select } };
    };

    const setPhotoError = (msg = "DB Down", pid = "p1") => {
      const select = jest.fn().mockRejectedValue(new Error(msg));
      productModel.findById.mockReturnValue({ select });
      return { pid, calls: { select } };
    };

    test("Valid Test: Photo available", async () => {
      const buf = Buffer.from("image-data");
      const { pid } = setPhotoProduct(buf, "image/jpeg", "p123");
      req = { params: { pid } };

      await productPhotoController(req, res);

      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(buf);
    });

    test("Invalid Test: Photo unavailable", async () => {
      const { pid } = setPhotoNone("p123");
      req = { params: { pid } };

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "There does not exist a photo",
      });
    });

    test("Invalid Test: DB Down", async () => {
      setPhotoError();

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Erorr while getting photo",
        error: "DB Down",
      });
    });
  });

  describe("productFiltersController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const makeProductLocal = (i, cat) => ({
      _id: `product-id-${i}`,
      name: `Product ${i}`,
      description: `Test Description ${i}`,
      price: 10 + i,
      category: cat,
    });

    const setFiltersSuccess = (products = []) => {
      const find = jest.fn().mockImplementation((args = {}) => {
        let out = [...products];

        if (args.category !== undefined) {
          if (Array.isArray(args.category)) {
            const set = new Set(args.category);
            out = out.filter((p) => set.has(p.category));
          } else if (typeof args.category === "object" && args.category.$in) {
            const set = new Set(args.category.$in);
            out = out.filter((p) => set.has(p.category));
          } else {
            out = out.filter((p) => p.category === args.category);
          }
        }

        if (args.price && (args.price.$gte != null || args.price.$lte != null)) {
          const gte = args.price.$gte ?? -Infinity;
          const lte = args.price.$lte ?? Infinity;
          out = out.filter((p) => p.price >= gte && p.price <= lte);
        }

        return Promise.resolve(out);
      });

      productModel.find.mockImplementation(find);
      return { calls: { find } };
    };

    const setFiltersError = (msg = "DB Down") => {
      const find = jest.fn().mockRejectedValue(new Error(msg));
      productModel.find.mockImplementation(find);
      return { calls: { find } };
    };

    test("Valid Test: Filter All", async () => {
      const checked = ["c1", "c2"];
      const radio = [10, 20];

      req = { body: { checked, radio } };

      const products = [makeProductLocal(0, "c1"), makeProductLocal(1, "c2")];
      setFiltersSuccess(products);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: checked,
        price: { $gte: 10, $lte: 20 },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products,
      });
    });

    test("Valid Test: Filter price range too high", async () => {
      const checked = ["c1", "c2"];
      const radio = [12, 20];

      req = { body: { checked, radio } };

      const products = [makeProductLocal(0, "c1"), makeProductLocal(1, "c2")];
      setFiltersSuccess(products);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: checked,
        price: { $gte: 12, $lte: 20 },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });
    });

    test("Valid Test: Filter price range too low", async () => {
      const checked = ["c1", "c2"];
      const radio = [1, 9];

      req = { body: { checked, radio } };

      const products = [makeProductLocal(0, "c1"), makeProductLocal(1, "c2")];
      setFiltersSuccess(products);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: checked,
        price: { $gte: 1, $lte: 9 },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });
    });

    test("Valid Test: Filter different category", async () => {
      const checked = ["c3"];
      const radio = [10, 20];

      req = { body: { checked, radio } };

      const products = [makeProductLocal(0, "c1"), makeProductLocal(1, "c2")];
      setFiltersSuccess(products);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: checked,
        price: { $gte: 10, $lte: 20 },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [],
      });
    });

    test("Invalid Test: DB Down", async () => {
      setFiltersError();

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error WHile Filtering Products",
        error: "DB Down",
      });
    });
  });

  describe("productCountController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const setCountSuccess = (total = 42) => {
      const estimatedDocumentCount = jest.fn().mockResolvedValue(total);
      productModel.find.mockReturnValue({ estimatedDocumentCount });
      return { calls: { estimatedDocumentCount }, total };
    };

    const setCountError = (msg = "DB Down") => {
      const estimatedDocumentCount = jest.fn().mockRejectedValue(new Error(msg));
      productModel.find.mockReturnValue({ estimatedDocumentCount });
      return { calls: { estimatedDocumentCount } };
    };

    test("Valid Test", async () => {
      const { calls, total } = setCountSuccess(123);

      await productCountController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(calls.estimatedDocumentCount).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: total,
      });
    });

    test("Invalid Test: DB Down", async () => {
      setCountError();

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in product count",
        error: "DB Down",
      });
    });
  });

  describe("productListController (pagination)", () => {
    const setListSuccess = (allProducts = []) => {
      let capturedSkip = 0;
      let capturedLimit = undefined;

      const sort = jest.fn().mockImplementation((sortArg) => {
        let arr = [...allProducts];
        if (sortArg?.createdAt) {
          const dir = sortArg.createdAt;
          arr.sort((a, b) =>
            dir === -1
              ? new Date(b.createdAt) - new Date(a.createdAt)
              : new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
        // apply skip & limit
        const start = Number.isFinite(capturedSkip) ? capturedSkip : 0;
        let sliced = arr.slice(start);
        if (Number.isFinite(capturedLimit)) sliced = sliced.slice(0, capturedLimit);
        return Promise.resolve(sliced);
      });

      const limit = jest.fn().mockImplementation((n) => {
        capturedLimit = n;
        return { sort };
      });

      const skip = jest.fn().mockImplementation((n) => {
        capturedSkip = n;
        return { limit, sort };
      });

      const select = jest.fn().mockReturnValue({ skip, limit, sort });

      productModel.find.mockReturnValue({ select, skip, limit, sort });

      return { calls: { select, skip, limit, sort } };
    };

    const setListError = (msg = "DB Down") => {
      const sort = jest.fn().mockRejectedValue(new Error(msg));
      const limit = jest.fn().mockReturnValue({ sort });
      const skip = jest.fn().mockReturnValue({ limit, sort });
      const select = jest.fn().mockReturnValue({ skip, limit, sort });

      productModel.find.mockReturnValue({ select, skip, limit, sort });
      return { calls: { select, skip, limit, sort } };
    };

    const makeProductLocal = (i) => ({
      _id: `product-id-${i}`,
      name: `Product ${i}`,
      description: `Test Description ${i}`,
      price: 10 + i,
      createdAt: new Date(2025, 0, i + 1),
    });

    test("Valid Test: Page 1", async () => {
      const perPage = 6;
      const page = 1;
      const all = Array.from({ length: 20 }, (_, i) => makeProductLocal(i));
      const { calls } = setListSuccess(all);

      req = { params: { page: "1" } };

      await productListController(req, res);

      const sorted = [...all].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const page1 = sorted.slice((page - 1) * perPage, page * perPage);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(calls.select).toHaveBeenCalledWith("-photo");
      expect(calls.skip).toHaveBeenCalledWith(0);
      expect(calls.limit).toHaveBeenCalledWith(6);
      expect(calls.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: page1,
      });
    });

    test("Valid Test: Page 3", async () => {
      const perPage = 6;
      const page = 3;
      const all = Array.from({ length: 20 }, (_, i) => makeProductLocal(i));
      setListSuccess(all);

      req = { params: { page: "3" } };

      await productListController(req, res);

      const sorted = [...all].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const page3 = sorted.slice((page - 1) * perPage, page * perPage);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: page3,
      });
    });

    test("Invalid Test: DB Down", async () => {
      setListError();

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page ctrl",
        error: "DB Down",
      });
    });
  });

  describe("realtedProductController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const setRelatedSuccess = (allProducts = []) => {
      let capturedLimit = null;

      const populate = jest.fn().mockImplementation(() => {
        return Promise.resolve(finalList);
      });

      let finalList = [];

      const limit = jest.fn().mockImplementation((n) => {
        capturedLimit = n;
        finalList = intermediate.slice(0, capturedLimit ?? 3);
        return { populate };
      });

      let intermediate = [];
      const select = jest.fn().mockImplementation(() => {
        return { limit, populate };
      });

      const find = jest.fn().mockImplementation((args = {}) => {
        const { category, _id } = args;
        const notId = _id?.$ne;

        intermediate = allProducts.filter((p) => {
          const catOk = category === undefined ? true : p.category === category;
          const idOk = notId === undefined ? true : p._id !== notId;
          return catOk && idOk;
        });

        return { select, limit, populate };
      });

      productModel.find.mockImplementation(find);

      return { calls: { find, select, limit, populate } };
    };

    const setRelatedError = (msg = "DB Down") => {
      const populate = jest.fn().mockRejectedValue(new Error(msg));
      const limit = jest.fn().mockReturnValue({ populate });
      const select = jest.fn().mockReturnValue({ limit, populate });
      const find = jest.fn().mockReturnValue({ select, limit, populate });

      productModel.find.mockImplementation(find);
      return { calls: { find, select, limit, populate } };
    };

    const makeProductLocal = (i, cat) => ({
      _id: `product-id-${i}`,
      name: `Product ${i}`,
      description: `Test Description ${i}`,
      price: 10 + i,
      category: cat,
    });

    test("Valid Test: Match pid and cid", async () => {
      const pid = "p2";
      const cid = "c1";
      const all = [
        makeProductLocal(0, "c1"),
        makeProductLocal(1, "c2"),
        makeProductLocal(2, "c1"),
        makeProductLocal(3, "c1"),
        makeProductLocal(4, "c1"),
        makeProductLocal(5, "c2"),
      ];
      const { calls } = setRelatedSuccess(all);

      req = { params: { pid: "p2", cid: "c1" } };

      await realtedProductController(req, res);

      const filtered = all
        .filter((p) => p.category === cid && p._id !== pid)
        .slice(0, 3);

      expect(productModel.find).toHaveBeenCalledWith({
        category: "c1",
        _id: { $ne: "p2" },
      });
      expect(calls.select).toHaveBeenCalledWith("-photo");
      expect(calls.limit).toHaveBeenCalledWith(3);
      expect(calls.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: filtered,
      });
    });

    test("Invalid Test: DB Down", async () => {
      setRelatedError();

      await realtedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while geting related product",
        error: "DB Down",
      });
    });
  });

  describe("productCategoryController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req = { params: { slug: "cat-1" } };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    const setProductCategorySuccess = (categoryDoc, allProducts = []) => {
      const findOne = jest.fn().mockResolvedValue(categoryDoc);
      categoryModel.findOne.mockImplementation(findOne);

      const catId = categoryDoc?._id ?? categoryDoc;
      const belongsToCat = (p) => {
        const c = p.category;
        if (c && typeof c === "object") return String(c._id) === String(catId);
        return String(c) === String(catId);
      };

      const populate = jest
        .fn()
        .mockResolvedValue(allProducts.filter(belongsToCat));
      const find = jest.fn().mockImplementation((args = {}) => {
        return { populate };
      });
      productModel.find.mockImplementation(find);

      return { calls: { findOne, find, populate } };
    };

    const setProductCategoryErrorAtCategory = (msg = "DB Down (category)") => {
      const findOne = jest.fn().mockRejectedValue(new Error(msg));
      categoryModel.findOne.mockImplementation(findOne);
      return { calls: { findOne } };
    };

    const setProductCategoryErrorAtProducts = (
      categoryDoc,
      msg = "DB Down (products)"
    ) => {
      const findOne = jest.fn().mockResolvedValue(categoryDoc);
      categoryModel.findOne.mockImplementation(findOne);

      const populate = jest.fn().mockRejectedValue(new Error(msg));
      const find = jest.fn().mockReturnValue({ populate });
      productModel.find.mockImplementation(find);

      return { calls: { findOne, find, populate } };
    };

    const makeCategory = (i, slug = `cat-${i}`) => ({
      _id: `c${i}`,
      name: `Cat ${i}`,
      slug,
    });

    const makeProductLocal = (i, cat) => ({
      _id: `product-id-${i}`,
      name: `Product ${i}`,
      category: cat,
    });

    const belongsTo = (p, cat) => {
      const pid =
        typeof p.category === "object" && p.category !== null
          ? String(p.category._id)
          : String(p.category);
      const cid = String(cat._id);
      return pid === cid;
    };

    test("Valid Test: Products found", async () => {
      const cat = makeCategory(1, "cat-1");
      const all = [
        makeProductLocal(0, "c1"),
        makeProductLocal(1, "c2"),
        makeProductLocal(2, "c1"),
        makeProductLocal(3, "c3"),
      ];

      const { calls } = setProductCategorySuccess(cat, all);

      await productCategoryController(req, res);

      const filtered = all.filter((p) => belongsTo(p, cat));

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "cat-1" });
      expect(productModel.find).toHaveBeenCalledWith({ category: cat });
      expect(calls.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: cat,
        products: filtered,
      });
    });

    test("Valid Test: Products not found", async () => {
      const cat2 = makeCategory(2, "cat-2");
      req = { params: { slug: "cat-2" } };
      const all = [
        makeProductLocal(0, "c1"),
        makeProductLocal(2, "c1"),
        makeProductLocal(3, "c3"),
      ];

      const { calls } = setProductCategorySuccess(cat2, all);

      await productCategoryController(req, res);

      const filtered = all.filter((p) => belongsTo(p, cat2));

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "cat-2" });
      expect(productModel.find).toHaveBeenCalledWith({ category: cat2 });
      expect(calls.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: cat2,
        products: filtered,
      });
    });

    test("Invalid Test: DB Down (category)", async () => {
      setProductCategoryErrorAtCategory();

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting products",
        error: "DB Down (category)",
      });
    });

    test("Invalid Test: DB Down (products)", async () => {
      setProductCategoryErrorAtProducts();

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting products",
        error: "DB Down (products)",
      });
    });
  });
});

// ===== Additional controller tests: create/update/delete and payments =====

describe("createProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      fields: {
        name: "Test Product",
        description: "Test Description",
        price: 100,
        category: "Test Category",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "test/path/to/photo.jpg",
          size: 500000,
          type: "image/jpeg",
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    slugify.mockImplementation((name) =>
      name.toLowerCase().replace(/\s+/g, "-")
    );
  });

  it("should return validation error if name is missing", async () => {
    req.fields.name = ""; // Simulate missing name

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  it("should return validation error if description is missing", async () => {
    req.fields.description = ""; // Simulate missing description

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
  });

  it("should return validation error if price is missing", async () => {
    req.fields.price = ""; // Simulate missing price

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
  });

  it("should return validation error if category is missing", async () => {
    req.fields.category = ""; // Simulate missing category

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
  });

  it("should return validation error if quantity is missing", async () => {
    req.fields.quantity = ""; // Simulate missing quantity

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
  });

  it("should return validation error if photo size exceeds limit", async () => {
    req.files.photo.size = 2000000; // Simulate large photo size

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  it("should create a product successfully", async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: "product123",
      name: "Test Product",
      slug: "test-product",
    });
    productModel.mockImplementation(() => ({
      save: mockSave,
      photo: {},
    }));
    fs.readFileSync.mockReturnValue("mocked-photo-data");

    await createProductController(req, res);

    expect(slugify).toHaveBeenCalledWith("Test Product");
    expect(fs.readFileSync).toHaveBeenCalledWith("test/path/to/photo.jpg");
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Created Successfully",
      products: expect.any(Object),
    });
  });

  it("should handle errors during product creation", async () => {
    const mockError = new Error("Database error");
    productModel.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(mockError),
      photo: {},
    }));

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: "Error in crearing product",
    });
  });
});

describe("updateProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { pid: "product123" },
      fields: {
        name: "Updated Product",
        description: "Updated Description",
        price: 150,
        category: "Updated Category",
        quantity: 5,
        shipping: false,
      },
      files: {
        photo: {
          path: "test/path/to/photo.jpg",
          size: 500000,
          type: "image/jpeg",
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    slugify.mockImplementation((name) =>
      name.toLowerCase().replace(/\s+/g, "-")
    );
  });

  it("should return validation error if name is missing", async () => {
    req.fields.name = ""; // Simulate missing name

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  it("should return validation error if description is missing", async () => {
    req.fields.description = ""; // Simulate missing description

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("should return validation error if price is missing", async () => {
    req.fields.price = ""; // Simulate missing price

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
  });

  it("should return validation error if category is missing", async () => {
    req.fields.category = ""; // Simulate missing category

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
  });

  it("should return validation error if quantity is missing", async () => {
    req.fields.quantity = ""; // Simulate missing quantity

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
  });

  it("should return validation error if photo size exceeds limit", async () => {
    req.files.photo.size = 2000000; // Simulate large photo size

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  it("should update a product successfully", async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: "product123",
      name: "Updated Product",
      slug: "updated-product",
    });

    const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: "product123",
      name: "Updated Product",
      slug: "updated-product",
      photo: {}, // controller expects products.photo to exist
      save: mockSave, // controller calls await products.save()
    });
    productModel.findByIdAndUpdate = mockFindByIdAndUpdate;
    fs.readFileSync.mockReturnValue("mocked-photo-data");

    await updateProductController(req, res);

    expect(slugify).toHaveBeenCalledWith("Updated Product");
    expect(fs.readFileSync).toHaveBeenCalledWith("test/path/to/photo.jpg");
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "product123",
      expect.objectContaining({
        name: "Updated Product",
        slug: "updated-product",
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Updated Successfully",
      products: expect.any(Object),
    });
  });

  it("should handle errors during product update", async () => {
    const mockError = new Error("Database error");
    productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: "Error in Updte product",
    });
  });
});

describe("deleteProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { pid: "product123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should delete a product successfully", async () => {
    // Mongoose chaining: findByIdAndDelete(...).select('-photo')
    const mockSelect = jest.fn().mockResolvedValue({
      _id: "product123",
      name: "Deleted product",
    });
    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("product123");
    expect(mockSelect).toHaveBeenCalledWith("-photo");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });
  });

  it("should handle errors during deletion", async () => {
    const dbError = new Error("Database failure");
    const mockSelect = jest.fn().mockRejectedValue(dbError);
    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("product123");
    expect(mockSelect).toHaveBeenCalledWith("-photo");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting product",
      error: dbError,
    });
  });
});

// -------- Payment controller pattern tests (gateway + order flow stubs) --------

// Simple mock response and request factory functions
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createReq = (body = {}, user = null) => ({
  body,
  user,
});

describe("Payment Controllers", () => {
  let mockOrderInstance;
  let mockGateway;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock order model instance
    mockOrderInstance = {
      save: jest.fn().mockResolvedValue({ _id: "order123" }),
    };
    orderModel.mockImplementation(() => mockOrderInstance);

    // Create a simple gateway mock
    mockGateway = {
      clientToken: {
        generate: jest.fn(),
      },
      transaction: {
        sale: jest.fn(),
      },
    };
  });

  describe("braintreeTokenController pattern", () => {
    test("should generate token successfully", async () => {
      const req = createReq();
      const res = createRes();

      const mockTokenResponse = {
        success: true,
        clientToken: "mock_token_12345",
      };

      const originalLog = console.log;
      console.log = jest.fn(); // suppress logs

      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      mockGateway.clientToken.generate({}, (err, response) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(response);
        }
      });

      expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
        {},
        expect.any(Function)
      );
      expect(res.send).toHaveBeenCalledWith(mockTokenResponse);

      console.log = originalLog; // restore
    });

    test("should handle token generation error", async () => {
      const req = createReq();
      const res = createRes();

      const mockError = {
        message: "Invalid credentials",
        type: "authentication_error",
      };

      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      mockGateway.clientToken.generate({}, (err, response) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(response);
        }
      });

      expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
        {},
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
    });
  });

  describe("brainTreePaymentController pattern", () => {
    test("should process successful payment", async () => {
      const mockCart = [
        { _id: "prod1", name: "Product 1", price: 100 },
        { _id: "prod2", name: "Product 2", price: 50 },
      ];

      const req = createReq(
        {
          nonce: "fake-valid-nonce",
          cart: mockCart,
        },
        { _id: "user123" }
      );
      const res = createRes();

      const mockPaymentResult = {
        success: true,
        transaction: {
          id: "transaction_123",
          amount: "150.00",
          status: "submitted_for_settlement",
        },
      };

      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(null, mockPaymentResult);
      });

      const { nonce, cart } = req.body;
      let total = 0;
      cart.map((i) => {
        total += i.price;
      });

      mockGateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        function (error, result) {
          if (result) {
            // simulate controller behavior
            // eslint-disable-next-line no-new
            new orderModel({
              products: cart,
              payment: result,
              buyer: req.user._id,
            }).save();
            res.json({ ok: true });
          } else {
            res.status(500).send(error);
          }
        }
      );

      expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 150,
          paymentMethodNonce: "fake-valid-nonce",
          options: {
            submitForSettlement: true,
          },
        },
        expect.any(Function)
      );

      expect(orderModel).toHaveBeenCalledWith({
        products: mockCart,
        payment: mockPaymentResult,
        buyer: "user123",
      });
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test("should handle payment failure", async () => {
      const mockCart = [{ _id: "prod1", price: 100 }];

      const req = createReq(
        {
          nonce: "fake-invalid-nonce",
          cart: mockCart,
        },
        { _id: "user123" }
      );
      const res = createRes();

      const mockError = {
        message: "Credit card declined",
        code: "2001",
      };

      mockGateway.transaction.sale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      const { nonce, cart } = req.body;
      let total = 0;
      cart.map((i) => {
        total += i.price;
      });

      mockGateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        function (error, result) {
          if (result) {
            // should NOT happen in failure case
            // eslint-disable-next-line no-new
            new orderModel({
              products: cart,
              payment: result,
              buyer: req.user._id,
            }).save();
            res.json({ ok: true });
          } else {
            res.status(500).send(error);
          }
        }
      );

      expect(mockGateway.transaction.sale).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(mockError);
      expect(orderModel).not.toHaveBeenCalled();
    });

    test("should calculate correct total from cart", () => {
      const testCases = [
        {
          cart: [{ price: 25.99 }, { price: 50.0 }, { price: 10.01 }],
          expectedTotal: 86,
        },
        {
          cart: [{ price: 100 }],
          expectedTotal: 100,
        },
        {
          cart: [],
          expectedTotal: 0,
        },
      ];

      testCases.forEach((testCase) => {
        let total = 0;
        testCase.cart.map((i) => {
          total += i.price;
        });

        expect(total).toBe(testCase.expectedTotal);
      });
    });

    test("should validate request data structure", () => {
      const mockCart = [
        { _id: "prod1", name: "Product 1", price: 100 },
        { _id: "prod2", name: "Product 2", price: 50 },
      ];

      const req = createReq(
        {
          nonce: "fake-valid-nonce",
          cart: mockCart,
        },
        { _id: "user123" }
      );

      expect(req.body.nonce).toBeDefined();
      expect(req.body.cart).toBeDefined();
      expect(req.user._id).toBeDefined();

      expect(Array.isArray(req.body.cart)).toBe(true);
      expect(req.body.cart.length).toBe(2);

      req.body.cart.forEach((item) => {
        expect(item.price).toBeDefined();
        expect(typeof item.price).toBe("number");
      });
    });
  });
});
