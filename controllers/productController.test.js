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

    test("Invalid Test", async () => {
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
        error: "DB Down"
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

    test("Invalid Test", async () => {
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
        photo: {}, // or { data: null }
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

    test("Valid Test: Photo unavailable", async () => {
      const { pid } = setPhotoNone("p123");
      req = { params: { pid } };

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "There does not exist a photo",
      });
    });

    test("Invalid Test", async () => {
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

})