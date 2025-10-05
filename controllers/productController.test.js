import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController
} from "../controllers/productController.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");

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

    afterAll(() => {
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
      var mockProducts = makeProducts(1)
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
      console.log(mockProducts.length);
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
    });
  });

  describe("getSingleProductController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req = { params: { slug: "product-0" } };
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterAll(() => {
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

    test("Valid Test: 0 Product", async () => {
      setProductError();

      await getSingleProductController(req, res);

      // expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Eror while getitng single product",
        error: "DB Down"
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

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    const setPhotoProduct = (
      buf,
      contentType = "image/jpeg",
      pid = "p1"
    ) => {
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

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    const makeProduct = (i, cat) => ({
      _id: `product-id-${i}`,
      name: `Product ${i}`,
      description: `Test Description ${i}`,
      price: 10 + i,
      category: cat
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

        if (
          args.price &&
          (args.price.$gte != null || args.price.$lte != null)
        ) {
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

      const products = [makeProduct(0, "c1"), makeProduct(1, "c2")];
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

      const products = [makeProduct(0, "c1"), makeProduct(1, "c2")];
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

      const products = [makeProduct(0, "c1"), makeProduct(1, "c2")];
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

      const products = [makeProduct(0, "c1"), makeProduct(1, "c2")];
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

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    const setCountSuccess = (total = 42) => {
      const estimatedDocumentCount = jest.fn().mockResolvedValue(total);
      productModel.find.mockReturnValue({ estimatedDocumentCount });
      return { calls: { estimatedDocumentCount }, total };
    };

    const setCountError = (msg = "DB Down") => {
      const estimatedDocumentCount = jest
        .fn()
        .mockRejectedValue(new Error(msg));
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

})