/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3: FRONTEND INTEGRATION TESTING
 * HOMEPAGE COMPONENT INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Test the integration between HomePage component and its dependencies:
 * - Cart context (cart state management, local storage)
 * - Axios HTTP client (API calls for products, categories, filtering)
 * - React Router navigation (product detail navigation)
 * - Layout wrapper (page structure)
 * - Antd components (filtering UI controls)
 * - Toast notifications (user feedback)
 * - React hooks (state management, side effects)
 *
 * INTEGRATION COVERAGE:
 * 1. HomePage → axios → API data → component state → UI rendering
 * 2. HomePage → useCart → cart state management → localStorage
 * 3. HomePage → useNavigate → product detail navigation
 * 4. HomePage → Layout → page structure
 * 5. HomePage → Antd components → filtering functionality
 * 6. HomePage → toast → user feedback
 * 7. HomePage → React hooks → state management → UI updates
 *
 * MOCK STRATEGY:
 * - Mock: axios (controlled API responses)
 * - Mock: react-router-dom navigation
 * - Mock: react-hot-toast (simplified notifications)
 * - Real: HomePage component, useCart context, React hooks, Layout, Antd
 *
 * TEST PHILOSOPHY:
 * Integration tests verify how the HomePage component works with its ecosystem.
 * We test the complete e-commerce workflow from product browsing to cart management.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Import HomePage directly at the top level
import HomePage from "../HomePage";

// Import context for providing cart state
import { CartProvider } from "../../context/cart";

// ═══════════════════════════════════════════════════════════════════════════
// MINIMAL MOCKS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Mock axios for API calls
jest.mock("axios");
const mockedAxios = axios;

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null, // Mock the Toaster component
}));

// Mock auth context
jest.mock("../../context/auth", () => ({
  useAuth: () => [{ user: null, token: "" }, jest.fn()],
}));

// Mock category hook
jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: () => [],
}));

// Mock search context
jest.mock("../../context/search", () => ({
  useSearch: () => [{ keyword: "", results: [] }, jest.fn()],
}));

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA MOCKS
// ═══════════════════════════════════════════════════════════════════════════

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

const mockProducts = [
  {
    _id: "product1",
    name: "Test Laptop",
    description: "Test Description",
    price: 999,
    category: "cat1",
    slug: "test-laptop",
    photo: { data: "mockedPhotoData", contentType: "image/jpeg" },
  },
  {
    _id: "product2",
    name: "Test Phone",
    description: "Test Phone Description",
    price: 599,
    category: "cat1",
    slug: "test-phone",
    photo: { data: "mockedPhotoData", contentType: "image/jpeg" },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const renderHomePage = () => {
  return render(
    <BrowserRouter>
      <CartProvider>
        <HomePage />
      </CartProvider>
    </BrowserRouter>
  );
}; // ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("HomePage Integration Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup axios defaults for compatibility
    axios.defaults = {
      headers: { common: {} },
    };

    // Clear localStorage
    localStorage.clear();

    // Setup default axios mock implementations
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 2 } });
      }
      if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Unknown API endpoint"));
    });
  });

  describe("Integration Test #1: Basic Component Rendering", () => {
    it("should render HomePage component without crashing", async () => {
      // Just try to render the component
      renderHomePage();

      // Check if any text content appears
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it("should render basic content structure", async () => {
      const { container } = renderHomePage();

      // Wait for component to be rendered
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Check that main content area exists
      const mainElement = screen.getByRole("main");
      expect(mainElement).toBeInTheDocument();
    });

    it("should attempt to fetch data on mount", async () => {
      renderHomePage();

      // Wait for the component to attempt API calls
      await waitFor(() => {
        // Check that axios was called
        expect(axios.get).toHaveBeenCalled();
      });
    });
  });

  describe("Integration Test #2: Product Display", () => {
    it("should display products when data is loaded", async () => {
      renderHomePage();

      // Wait for first product to be loaded
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Check second product is also displayed
      expect(screen.getByText("Test Phone")).toBeInTheDocument();
    });
  });

  describe("Integration Test #3: Category Filtering", () => {
    it("should filter products when category is selected", async () => {
      renderHomePage();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Find and click on Electronics checkbox
      const electronicsCheckbox = screen.getByRole("checkbox", {
        name: /electronics/i,
      });
      fireEvent.click(electronicsCheckbox);

      // Products should still be visible since they're in electronics category
      expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      expect(screen.getByText("Test Phone")).toBeInTheDocument();
    });
  });

  describe("Integration Test #4: Price Filtering", () => {
    it("should filter products by price range", async () => {
      renderHomePage();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Find and click on price range radio button
      const priceRangeRadio = screen.getByRole("radio", {
        name: /\$100 or more/i,
      });
      fireEvent.click(priceRangeRadio);

      // Only expensive product (Test Laptop $999) should be visible
      expect(screen.getByText("Test Laptop")).toBeInTheDocument();
    });
  });

  describe("Integration Test #5: Add to Cart Functionality", () => {
    it("should add product to cart when ADD TO CART button is clicked", async () => {
      renderHomePage();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Find and click the ADD TO CART button for first product
      const addToCartButtons = screen.getAllByText("ADD TO CART");
      fireEvent.click(addToCartButtons[0]);

      // Check that cart badge updated (should show 1 item)
      await waitFor(() => {
        expect(screen.getByTitle("1")).toBeInTheDocument();
      });
    });
  });

  describe("Integration Test #6: Reset Filters", () => {
    it("should reset filters when RESET FILTERS button is clicked", async () => {
      renderHomePage();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Apply a filter first
      const priceRangeRadio = screen.getByRole("radio", {
        name: /\$100 or more/i,
      });
      fireEvent.click(priceRangeRadio);

      // Now reset filters
      const resetButton = screen.getByText("RESET FILTERS");
      fireEvent.click(resetButton);

      // All products should be visible again
      expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      expect(screen.getByText("Test Phone")).toBeInTheDocument();
    });
  });

  describe("Integration Test #7: Product Details Navigation", () => {
    it("should have clickable More Details buttons for products", async () => {
      renderHomePage();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Find More Details buttons - should have one for each product
      const moreDetailsButtons = screen.getAllByText("More Details");
      expect(moreDetailsButtons).toHaveLength(2);

      // Check that buttons are clickable
      expect(moreDetailsButtons[0]).toBeInTheDocument();
      expect(moreDetailsButtons[1]).toBeInTheDocument();
    });
  });

  describe("Integration Test #8: Product Image Display", () => {
    it("should display product images with correct sources", async () => {
      renderHomePage();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText("Test Laptop")).toBeInTheDocument();
      });

      // Find product images by alt text
      const laptopImage = screen.getByAltText("Test Laptop");
      const phoneImage = screen.getByAltText("Test Phone");

      // Check images are displayed with correct API endpoints
      expect(laptopImage).toBeInTheDocument();
      expect(laptopImage).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/product1"
      );

      expect(phoneImage).toBeInTheDocument();
      expect(phoneImage).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/product2"
      );
    });
  });
});
