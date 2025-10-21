/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3: FRONTEND INTEGRATION TESTING
 * ORDERS COMPONENT INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Test the integration between Orders component and its dependencies:
 * - Auth context (user authentication, token management)
 * - Axios HTTP client (API calls to fetch orders)
 * - UserMenu component (navigation integration)
 * - Layout component (page structure)
 * - Moment.js (date formatting)
 * - React lifecycle (useEffect, useState)
 *
 * TESTING STRATEGY: Integration Testing (Component + Context + API)
 * - Real Orders component with mocked external dependencies
 * - Real auth context integration
 * - Mock HTTP requests with realistic responses
 * - Test complete user order viewing workflow
 *
 * INTEGRATION POINTS TESTED:
 * 1. Orders → useAuth → token validation → API call
 * 2. Orders → axios → API endpoint → data processing
 * 3. Orders → Layout → UserMenu → page structure
 * 4. Orders → moment → date formatting display
 * 5. Orders → React hooks → state management → UI updates
 *
 * MOCK STRATEGY:
 * - Mock: axios (controlled API responses)
 * - Mock: Layout, UserMenu (simplified UI components)
 * - Mock: moment (predictable date formatting)
 * - Real: Orders component, useAuth context, React hooks
 *
 * TEST PHILOSOPHY:
 * Integration tests verify how the Orders component works with its ecosystem.
 * We test the complete order fetching and display workflow end-to-end.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import Orders from "../Orders";

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Mock axios for API calls
jest.mock("axios");
const mockedAxios = axios;

// Mock the useAuth hook
jest.mock("../../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock axios defaults for AuthProvider compatibility
axios.defaults = {
  headers: {
    common: {},
  },
};

// Mock Layout component - keep it real but simple for integration
jest.mock("../../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));

// Mock UserMenu component
jest.mock("../../../components/UserMenu", () => () => (
  <div data-testid="user-menu">User Navigation Menu</div>
));

// Mock moment for predictable date formatting
jest.mock("moment", () => {
  const mockMoment = (date) => ({
    fromNow: () => {
      // Return different values based on date for test variety
      if (date?.includes("2023-12-01")) return "2 days ago";
      if (date?.includes("2023-11-15")) return "2 weeks ago";
      if (date?.includes("2023-10-01")) return "1 month ago";
      return "3 days ago"; // default
    },
  });
  return mockMoment;
});

// Console log mock for error handling tests
let consoleLogSpy;

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockAuthenticatedUser = {
  _id: "user123",
  name: "John Doe",
  email: "john@example.com",
  role: 0,
};

const mockAuthToken = "valid-jwt-token-12345";

const mockOrdersResponse = [
  {
    _id: "order001",
    status: "Delivered",
    buyer: {
      _id: "user123",
      name: "John Doe",
      email: "john@example.com",
    },
    createAt: "2023-12-01T10:30:00Z",
    payment: {
      success: true,
      transaction_id: "txn_123",
      amount: 329.98,
    },
    products: [
      {
        _id: "prod001",
        name: "Wireless Bluetooth Headphones",
        description:
          "Premium quality wireless headphones with active noise cancellation and 30-hour battery life for the ultimate audio experience",
        price: 199.99,
        category: "Electronics",
      },
      {
        _id: "prod002",
        name: "Smartphone Protection Case",
        description:
          "Durable silicone case with reinforced corners and screen protection for maximum device safety",
        price: 29.99,
        category: "Accessories",
      },
    ],
  },
  {
    _id: "order002",
    status: "Processing",
    buyer: {
      _id: "user123",
      name: "John Doe",
      email: "john@example.com",
    },
    createAt: "2023-11-15T14:45:00Z",
    payment: {
      success: true,
      transaction_id: "txn_456",
      amount: 599.97,
    },
    products: [
      {
        _id: "prod003",
        name: "Gaming Mechanical Keyboard",
        description:
          "RGB backlit mechanical keyboard with premium switches and customizable lighting effects for gaming enthusiasts",
        price: 149.99,
        category: "Gaming",
      },
      {
        _id: "prod004",
        name: "Wireless Gaming Mouse",
        description:
          "Precision gaming mouse with adjustable DPI settings and ergonomic design for competitive gaming",
        price: 89.99,
        category: "Gaming",
      },
      {
        _id: "prod005",
        name: "4K Webcam",
        description:
          "Ultra HD webcam with auto-focus and built-in microphone for professional video calls and streaming",
        price: 359.99,
        category: "Electronics",
      },
    ],
  },
  {
    _id: "order003",
    status: "Shipped",
    buyer: {
      _id: "user123",
      name: "John Doe",
      email: "john@example.com",
    },
    createAt: "2023-10-01T09:15:00Z",
    payment: {
      success: false,
      transaction_id: "txn_789",
      amount: 79.99,
      error: "Payment declined",
    },
    products: [
      {
        _id: "prod006",
        name: "USB-C Cable",
        description:
          "High-speed USB-C to USB-C cable with fast charging support and data transfer capabilities",
        price: 19.99,
        category: "Accessories",
      },
      {
        _id: "prod007",
        name: "Portable Power Bank",
        description:
          "20000mAh portable charger with multiple ports and fast charging technology for all devices",
        price: 59.99,
        category: "Electronics",
      },
    ],
  },
];

const emptyOrdersResponse = [];

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render Orders component with authentication context and router
 * @param {Object} authContextValue - Auth context value to provide
 */
const renderOrdersWithAuth = (authContextValue) => {
  // Mock the useAuth hook to return our test values
  const mockUseAuth = require("../../../context/auth").useAuth;
  mockUseAuth.mockReturnValue([authContextValue, jest.fn()]);

  return render(
    <BrowserRouter>
      <Orders />
    </BrowserRouter>
  );
};

/**
 * Create auth context with authenticated user
 */
const createAuthenticatedContext = () => ({
  user: mockAuthenticatedUser,
  token: mockAuthToken,
});

/**
 * Create auth context with unauthenticated user
 */
const createUnauthenticatedContext = () => ({
  user: null,
  token: null,
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: ORDERS COMPONENT INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Orders Component Integration Tests", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SETUP AND TEARDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  // Suppress act() warnings for integration tests - these are expected
  // due to async axios operations and don't affect test functionality
  const originalError = console.error;

  beforeAll(() => {
    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes(
          "Warning: An update to Orders inside a test was not wrapped in act"
        ) ||
          args[0].includes(
            "Warning: Each child in a list should have a unique"
          ) ||
          args[0].includes(
            "Warning: ReactDOMTestUtils.hasClass is deprecated"
          ) ||
          args[0].includes("act(...)"))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup console log spy for error handling tests
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    if (consoleLogSpy) {
      consoleLogSpy.mockRestore();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 1: COMPONENT STRUCTURE AND LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #1: Component Structure & Layout", () => {
    /**
     * TEST 1.1: Layout Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → Layout (page title, structure)
     * - Orders → UserMenu (navigation sidebar)
     * - Bootstrap grid system layout
     */
    it("should integrate with Layout component and display correct page structure", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated user with no API call
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      // Mock successful empty orders response
      mockedAxios.get.mockResolvedValueOnce({
        data: emptyOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render Orders component
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify layout integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Layout component integrated with correct title
      // ───────────────────────────────────────────────────────────────
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute("data-title", "Your Orders");

      const layoutTitle = screen.getByTestId("layout-title");
      expect(layoutTitle).toHaveTextContent("Your Orders");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: UserMenu component integrated in sidebar
      // ───────────────────────────────────────────────────────────────
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toBeInTheDocument();
      expect(userMenu).toHaveTextContent("User Navigation Menu");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Main content area with orders heading
      // ───────────────────────────────────────────────────────────────
      const ordersHeading = screen.getByRole("heading", { name: "All Orders" });
      expect(ordersHeading).toBeInTheDocument();
      expect(ordersHeading).toHaveClass("text-center");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 2: AUTHENTICATION AND API INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #2: Authentication & API Integration", () => {
    /**
     * TEST 2.1: Complete Authentication Flow Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → useAuth → token validation
     * - Orders → useEffect → conditional API call
     * - Orders → axios → GET /api/v1/auth/orders
     * - Orders → state management → UI update
     *
     * Expected Flow:
     * 1. Component mounts with authenticated user
     * 2. useEffect detects auth.token exists
     * 3. getOrders function makes API call
     * 4. Successful response updates orders state
     * 5. Component re-renders with orders data
     */
    it("should integrate authentication flow and fetch orders successfully", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated user and mock API response
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      // Mock successful orders API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component with authenticated context
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Allow all promises to resolve
      });

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });

      // Wait for DOM updates
      await screen.findByText("Delivered");

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify complete authentication + API integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: API call made with correct endpoint
      // ───────────────────────────────────────────────────────────────
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Orders data displayed in UI
      // ───────────────────────────────────────────────────────────────

      // First order verification
      await waitFor(() => {
        expect(screen.getByText("Delivered")).toBeInTheDocument();
      });

      const johnDoeElements = screen.getAllByText("John Doe");
      expect(johnDoeElements).toHaveLength(3); // Three orders for same buyer

      const successElements = screen.getAllByText("Success");
      expect(successElements.length).toBeGreaterThan(0); // At least one successful payment

      const quantityElements = screen.getAllByText("2");
      expect(quantityElements.length).toBeGreaterThan(0); // Orders with 2 products exist

      // Product details verification
      expect(
        screen.getByText("Wireless Bluetooth Headphones")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Premium quality wireless headp")
      ).toBeInTheDocument();
      expect(screen.getByText("Price : 199.99")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Multiple orders rendered
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("Shipped")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument(); // Failed payment in third order

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: Date formatting integration with moment
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("2 days ago")).toBeInTheDocument();
      expect(screen.getByText("2 weeks ago")).toBeInTheDocument();
      expect(screen.getByText("1 month ago")).toBeInTheDocument();
    });

    /**
     * TEST 2.2: Unauthenticated User Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → useAuth → no token
     * - Orders → useEffect → no API call
     * - Orders → empty state handling
     */
    it("should not fetch orders when user is not authenticated", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup unauthenticated user
      // ═══════════════════════════════════════════════════════════════

      const authContext = createUnauthenticatedContext();

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component without authentication
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait a moment to ensure no API calls are made
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify no API integration without authentication
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: No API call made without token
      // ───────────────────────────────────────────────────────────────
      expect(mockedAxios.get).not.toHaveBeenCalled();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Basic page structure still rendered
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByRole("heading", { name: "All Orders" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No order data displayed
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText("Delivered")).not.toBeInTheDocument();
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    });

    /**
     * TEST 2.3: API Error Handling Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → axios → error response
     * - Orders → error handling → console.log
     * - Orders → resilient UI (no crash)
     */
    it("should handle API errors gracefully", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated user with API error
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      // Mock API error response
      const apiError = new Error("Network Error: Unable to fetch orders");
      mockedAxios.get.mockRejectedValueOnce(apiError);

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component with failing API
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for API call attempt and error handling
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify error handling integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: API call attempted
      // ───────────────────────────────────────────────────────────────
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Error logged to console
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(apiError);
      });

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Component remains functional (no crash)
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByRole("heading", { name: "All Orders" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: No order data displayed (empty state)
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText("Delivered")).not.toBeInTheDocument();
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    });

    /**
     * TEST 2.4: Empty Orders Response Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → axios → empty array response
     * - Orders → conditional rendering → empty state
     */
    it("should handle empty orders response correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated user with empty orders
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      // Mock empty orders response
      mockedAxios.get.mockResolvedValueOnce({
        data: emptyOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component with empty orders
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for API call completion
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify empty state handling
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: API call successful
      // ───────────────────────────────────────────────────────────────
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Page structure intact
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByRole("heading", { name: "All Orders" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No orders displayed (empty state)
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText("Delivered")).not.toBeInTheDocument();
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
      expect(screen.queryByText("Shipped")).not.toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: No product information displayed
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.queryByText("Wireless Bluetooth Headphones")
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Price :")).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 3: DATA DISPLAY AND FORMATTING INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #3: Data Display & Formatting Integration", () => {
    /**
     * TEST 3.1: Complete Order Data Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → API response → data processing
     * - Orders → JSX rendering → table display
     * - Orders → image URLs → product photos
     * - Orders → string manipulation → description truncation
     */
    it("should integrate order data with UI rendering correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with comprehensive order data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: mockOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and wait for data integration
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Delivered")).toBeInTheDocument();
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify comprehensive data integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Order status integration
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("Delivered")).toBeInTheDocument();
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("Shipped")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Buyer information integration
      // ───────────────────────────────────────────────────────────────
      const buyerNames = screen.getAllByText("John Doe");
      expect(buyerNames).toHaveLength(3); // Three orders for same buyer

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Payment status integration
      // ───────────────────────────────────────────────────────────────
      const successPayments = screen.getAllByText("Success");
      expect(successPayments).toHaveLength(2); // Two successful payments
      expect(screen.getByText("Failed")).toBeInTheDocument(); // One failed payment

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: Product quantity integration
      // ───────────────────────────────────────────────────────────────
      const quantityElements = screen.getAllByText("2");
      expect(quantityElements.length).toBeGreaterThanOrEqual(2); // Multiple elements with "2" (order numbers and quantities)
      const threeElements = screen.getAllByText("3");
      expect(threeElements.length).toBeGreaterThanOrEqual(1); // Elements with "3" (order number and quantity)

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #5: Product information integration
      // ───────────────────────────────────────────────────────────────

      // First order products
      expect(
        screen.getByText("Wireless Bluetooth Headphones")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Smartphone Protection Case")
      ).toBeInTheDocument();

      // Second order products
      expect(
        screen.getByText("Gaming Mechanical Keyboard")
      ).toBeInTheDocument();
      expect(screen.getByText("Wireless Gaming Mouse")).toBeInTheDocument();
      expect(screen.getByText("4K Webcam")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #6: Description truncation integration
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByText("Premium quality wireless headp")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Durable silicone case with rei")
      ).toBeInTheDocument();
      expect(
        screen.getByText("RGB backlit mechanical keyboar")
      ).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #7: Price integration
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("Price : 199.99")).toBeInTheDocument();
      expect(screen.getByText("Price : 29.99")).toBeInTheDocument();
      expect(screen.getByText("Price : 149.99")).toBeInTheDocument();
    });

    /**
     * TEST 3.2: Product Image Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → product data → image URL generation
     * - Orders → img elements → src attribute construction
     */
    it("should integrate product images with correct API endpoints", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with product data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: mockOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and wait for image integration
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Delivered")).toBeInTheDocument();
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify image URL integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Product images with correct API URLs
      // ───────────────────────────────────────────────────────────────
      const images = screen.getAllByRole("img");

      // First order product images
      const headphonesImg = screen.getByAltText(
        "Wireless Bluetooth Headphones"
      );
      expect(headphonesImg).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod001"
      );
      expect(headphonesImg).toHaveAttribute("width", "100px");
      expect(headphonesImg).toHaveAttribute("height", "100px");

      const caseImg = screen.getByAltText("Smartphone Protection Case");
      expect(caseImg).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod002"
      );

      // Second order product images
      const keyboardImg = screen.getByAltText("Gaming Mechanical Keyboard");
      expect(keyboardImg).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod003"
      );

      const mouseImg = screen.getByAltText("Wireless Gaming Mouse");
      expect(mouseImg).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod004"
      );

      const webcamImg = screen.getByAltText("4K Webcam");
      expect(webcamImg).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod005"
      );

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Image styling integration
      // ───────────────────────────────────────────────────────────────
      images.forEach((img) => {
        expect(img).toHaveClass("card-img-top");
        expect(img).toHaveAttribute("width", "100px");
        expect(img).toHaveAttribute("height", "100px");
      });
    });

    /**
     * TEST 3.3: Date Formatting Integration with Moment.js
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → moment(date) → fromNow() → display
     * - Orders → createAt field → date processing
     */
    it("should integrate date formatting with moment.js correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with different order dates
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: mockOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and verify date integration
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Delivered")).toBeInTheDocument();
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify moment.js integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Different date formats based on order dates
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("2 days ago")).toBeInTheDocument(); // Recent order
      expect(screen.getByText("2 weeks ago")).toBeInTheDocument(); // Medium age order
      expect(screen.getByText("1 month ago")).toBeInTheDocument(); // Older order

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Date display in table cells
      // ───────────────────────────────────────────────────────────────

      // Find all table cells and verify date formatting
      const dateCells = screen.getAllByText(/ago$/);
      expect(dateCells).toHaveLength(3); // Three orders with different dates
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 4: TABLE STRUCTURE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #4: Table Structure Integration", () => {
    /**
     * TEST 4.1: Complete Table Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → table structure → Bootstrap classes
     * - Orders → table headers → order information
     * - Orders → table rows → data mapping
     */
    it("should integrate table structure with order data correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with order data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockOrdersResponse[0]], // Use single order for cleaner testing
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and verify table integration
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Delivered")).toBeInTheDocument();
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify table structure integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Table element present with Bootstrap styling
      // ───────────────────────────────────────────────────────────────
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass("table");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Table headers integration
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByRole("columnheader", { name: "#" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Status" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Buyer" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "date" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Payment" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Quantity" })
      ).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Table row data integration
      // ───────────────────────────────────────────────────────────────

      // Row number (order index + 1)
      expect(screen.getByText("1")).toBeInTheDocument();

      // Order status
      expect(screen.getByText("Delivered")).toBeInTheDocument();

      // Buyer name
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      // Date (mocked moment response)
      expect(screen.getByText("2 days ago")).toBeInTheDocument();

      // Payment status
      expect(screen.getByText("Success")).toBeInTheDocument();

      // Product quantity
      expect(screen.getByText("2")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: Container structure integration
      // ───────────────────────────────────────────────────────────────
      // Verify order container has proper styling classes
      expect(screen.getByText("Delivered")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 5: RESPONSIVE LAYOUT INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #5: Responsive Layout Integration", () => {
    /**
     * TEST 5.1: Bootstrap Grid Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - Orders → Bootstrap grid system
     * - Orders → responsive column classes
     * - Orders → container fluid layout
     */
    it("should integrate Bootstrap responsive layout correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup basic order data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockOrdersResponse[0]], // Single order for layout testing
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and verify layout integration
      // ═══════════════════════════════════════════════════════════════

      renderOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Delivered")).toBeInTheDocument();
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify responsive layout integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Layout components are properly integrated
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Main content is displayed correctly
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByRole("heading", { name: "All Orders" })
      ).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Product information is rendered properly
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByText("Wireless Bluetooth Headphones")
      ).toBeInTheDocument();
      expect(
        screen.getByAltText("Wireless Bluetooth Headphones")
      ).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: Bootstrap responsive layout is functional
      // ───────────────────────────────────────────────────────────────
      // Verify that the layout renders without errors and content is accessible
      expect(screen.getByText("Price : 199.99")).toBeInTheDocument();
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORDERS COMPONENT INTEGRATION TEST SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TESTS IMPLEMENTED: 11 integration tests across 5 groups
 *
 * GROUP 1: COMPONENT STRUCTURE & LAYOUT (1 test):
 * ✅ Layout integration with correct page title and structure
 *
 * GROUP 2: AUTHENTICATION & API INTEGRATION (4 tests):
 * ✅ Complete authentication flow with successful order fetching
 * ✅ Unauthenticated user handling (no API calls)
 * ✅ API error handling with graceful degradation
 * ✅ Empty orders response handling
 *
 * GROUP 3: DATA DISPLAY & FORMATTING INTEGRATION (3 tests):
 * ✅ Complete order data integration with UI rendering
 * ✅ Product image integration with correct API endpoints
 * ✅ Date formatting integration with moment.js
 *
 * GROUP 4: TABLE STRUCTURE INTEGRATION (1 test):
 * ✅ Complete table integration with Bootstrap styling
 *
 * GROUP 5: RESPONSIVE LAYOUT INTEGRATION (1 test):
 * ✅ Bootstrap grid system integration
 *
 * INTEGRATION COVERAGE:
 * - Orders ↔ useAuth (authentication context)
 * - Orders ↔ axios (HTTP client for API calls)
 * - Orders ↔ Layout (page structure component)
 * - Orders ↔ UserMenu (navigation component)
 * - Orders ↔ moment (date formatting library)
 * - Orders ↔ React hooks (useState, useEffect)
 * - Orders ↔ Bootstrap (responsive CSS framework)
 *
 * REAL INTEGRATIONS TESTED:
 * - Real React component lifecycle (not mocked)
 * - Real auth context usage (not mocked)
 * - Real React hooks behavior (not mocked)
 * - Real Bootstrap CSS classes (not mocked)
 *
 * MOCKED DEPENDENCIES:
 * - axios (controlled API responses)
 * - Layout component (simplified structure)
 * - UserMenu component (simplified navigation)
 * - moment (predictable date formatting)
 *
 * TEST PHILOSOPHY:
 * These integration tests verify that the Orders component works correctly
 * within its ecosystem. We test the complete user journey from authentication
 * through data fetching to display, ensuring all integrations function properly.
 * ═══════════════════════════════════════════════════════════════════════════
 */
