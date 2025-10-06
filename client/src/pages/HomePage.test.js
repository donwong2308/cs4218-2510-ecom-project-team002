import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HomePage from "./HomePage";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../context/cart");

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock react-icons
jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => <span data-testid="reload-icon">ReloadIcon</span>,
}));

// Mock Layout component
jest.mock("../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  );
});

// Mock Prices component
jest.mock("../components/Prices", () => ({
  Prices: [
    { _id: 0, name: "$0 to 19", array: [0, 19] },
    { _id: 1, name: "$20 to 39", array: [20, 39] },
    { _id: 2, name: "$40 to 59", array: [40, 59] },
    { _id: 3, name: "$60 to 79", array: [60, 79] },
    { _id: 4, name: "$80 to 99", array: [80, 99] },
    { _id: 5, name: "$100 or more", array: [100, 9999] },
  ],
}));

describe("HomePage Component", () => {
  // Mock data
  const mockProducts = [
    {
      _id: "1",
      name: "Test Product 1",
      description:
        "This is a test product description that's longer than 60 characters to test the substring functionality.",
      price: 29.99,
      slug: "test-product-1",
      category: { name: "Test Category" },
    },
    {
      _id: "2",
      name: "Test Product 2",
      description: "Another test product description.",
      price: 49.99,
      slug: "test-product-2",
      category: { name: "Test Category" },
    },
  ];

  const mockCategories = [
    { _id: "cat1", name: "Test Category 1" },
    { _id: "cat2", name: "Test Category 2" },
  ];

  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the useCart hook
    const mockCart = [];
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([mockCart, mockSetCart]);

    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    axios.post.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-filters")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  test("renders the home page with correct title", async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const layout = screen.getByTestId("mock-layout");
    expect(layout).toBeInTheDocument();
    expect(layout.getAttribute("data-title")).toBe(
      "ALL Products - Best offers "
    );

    // Wait for API calls
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count")
    );
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );
  });

  test("displays filter sections", async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for key elements to appear one by one
    await screen.findByText("Filter By Category");
    expect(screen.getByText("Filter By Price")).toBeInTheDocument();
    expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
  });

  test("displays products when loaded", async () => {
    // Mock axios to properly resolve product list request
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for products heading and verify product data
    await screen.findByText("All Products");

    // Verify the products are rendered with their details
    await waitFor(() => {
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    });
    expect(screen.getByText(mockProducts[1].name)).toBeInTheDocument();
    expect(
      screen.getByText(`${mockProducts[0].description.substring(0, 60)}...`)
    ).toBeInTheDocument();

    // Verify API calls
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
  });

  test("filters products by price when radio button is clicked", async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for filter section to load
    await screen.findByText("Filter By Price");

    // Now click the radio button - these seem to be visible in the DOM
    const priceRadios = screen.getAllByRole("radio");
    fireEvent.click(priceRadios[0]);

    // Wait for filter API call
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: [],
          radio: expect.any(Array),
        }
      )
    );
  });

  test("resets filters when reset button is clicked", async () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for the reset button to be available
    await screen.findByText("RESET FILTERS");

    // Now click the button
    const resetButton = screen.getByText("RESET FILTERS");
    fireEvent.click(resetButton);

    expect(mockReload).toHaveBeenCalled();
  });

  test("filters products by category when checkbox is clicked", async () => {
    // Mock axios to properly resolve product list request
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for filter section to load
    await screen.findByText("Filter By Category");

    // Find and click the category checkbox
    const checkboxes = await screen.findAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Verify filter API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining([mockCategories[0]._id]),
        })
      );
    });
  });

  test("handles error when category API call fails", async () => {
    // Mock category API to fail but other calls to succeed
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.reject(new Error("Category API Error"));
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Mock console.log to track error logging
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Verify error is logged
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    // Verify that product API is still called
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test("handles error when product count API call fails", async () => {
    // Mock product count API to fail but other calls to succeed
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.reject(new Error("Product Count API Error"));
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Mock console.log to track error logging
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Verify error is logged
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    // Verify that product API is still called
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test("loads more products when Load More button is clicked", async () => {
    // Mock products data with length less than total
    const nextPageProducts = [
      {
        _id: "3",
        name: "Test Product 3",
        description: "Another product description",
        price: 59.99,
        slug: "test-product-3",
        category: { name: "Test Category" },
      },
    ];

    // Setup mocks with proper implementation for page navigation
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({ data: { products: mockProducts } });
      } else if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.resolve({ data: { products: nextPageProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for initial products to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });

    // Find and click the loadmore button
    const loadMoreButton = await screen.findByText(/Loadmore/i);
    expect(loadMoreButton).toBeInTheDocument();

    // Simulate clicking the load more button
    fireEvent.click(loadMoreButton);

    // Verify page state update and API call
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    });
  });

  test("handles errors when API calls fail", async () => {
    // Mock console.log to track error logging
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    // Force API calls to fail
    axios.get.mockRejectedValue(new Error("API Error"));

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for error handling to occur
    await waitFor(() =>
      expect(console.log).toHaveBeenCalledWith(expect.any(Error))
    );

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test("adds product to cart when ADD TO CART button is clicked", async () => {
    // Setup cart mock
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for products to load
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    // Find and click the ADD TO CART button
    const addToCartButtons = await screen.findAllByText("ADD TO CART");
    fireEvent.click(addToCartButtons[0]);

    // Verify cart update and localStorage
    expect(mockSetCart).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      expect.any(String)
    );
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("navigates to product details when More Details button is clicked", async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for products to load
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    // Find and click the More Details button
    const moreDetailsButtons = await screen.findAllByText("More Details");
    fireEvent.click(moreDetailsButtons[0]);

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith(
      `/product/${mockProducts[0].slug}`
    );
  });

  test("handles error when loadMore API call fails", async () => {
    // Setup mock for axios
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({ data: { products: mockProducts } });
      } else if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.reject(new Error("LoadMore API Error"));
      }
      return Promise.reject(new Error("Not found"));
    });

    // Mock console.log to track error logging
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for initial products to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });

    // Find and click the loadmore button
    const loadMoreButton = await screen.findByText(/Loadmore/i);
    expect(loadMoreButton).toBeInTheDocument();

    // Click load more to trigger page increment and API call
    fireEvent.click(loadMoreButton);

    // Verify error is logged
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test("properly handles unchecking a category filter", async () => {
    // Mock axios to properly resolve product list request
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for filter section to load
    await screen.findByText("Filter By Category");

    // Find and click the category checkbox to check it
    const checkboxes = await screen.findAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Verify filter API call for checking
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining([mockCategories[0]._id]),
        })
      );
    });

    // Click the checkbox again to uncheck it
    fireEvent.click(checkboxes[0]);

    // Verify that getAllProducts is called after filter is cleared
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  test("handles error when filter API call fails", async () => {
    // Mock successful category fetch but failed filter API
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Make the filter API call fail
    axios.post.mockRejectedValueOnce(new Error("Filter API Error"));

    // Mock console.log to track error logging
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for filter section to load
    await screen.findByText("Filter By Price");

    // Click the radio button to trigger filter
    const priceRadios = screen.getAllByRole("radio");
    fireEvent.click(priceRadios[0]);

    // Verify error is logged
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test("handles category API response with success=false", async () => {
    // Mock category API to return success=false
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: false, message: "Failed to get categories" },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for products to load (categories won't be loaded due to success=false)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Verify that categories state remains empty
    // We can indirectly test this by checking that no checkboxes are rendered
    await waitFor(() => {
      const checkboxes = screen.queryAllByRole("checkbox");
      expect(checkboxes.length).toBe(0);
    });
  });

  test("tests useEffect dependency tracking for filters", async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for initial render
    await screen.findByText("Filter By Category");

    // Clear previous API call tracking
    axios.get.mockClear();
    axios.post.mockClear();

    // First click a price radio filter
    const priceRadios = screen.getAllByRole("radio");
    fireEvent.click(priceRadios[0]);

    // Verify filter API was called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          radio: expect.any(Array),
        })
      );
    });

    // Clear API call tracking again
    axios.post.mockClear();

    // Now click a category checkbox as well
    const checkboxes = await screen.findAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Verify filter API was called again with both filters
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining([mockCategories[0]._id]),
          radio: expect.any(Array),
        })
      );
    });

    // Now uncheck all filters
    fireEvent.click(checkboxes[0]); // Uncheck category

    // Verify getAllProducts is called when filters are cleared
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });
});
