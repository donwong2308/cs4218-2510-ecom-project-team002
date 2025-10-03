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

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  })

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe("getProductController", () => {
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

})