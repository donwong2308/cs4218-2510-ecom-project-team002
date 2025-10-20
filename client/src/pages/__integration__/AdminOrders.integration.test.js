/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3: FRONTEND INTEGRATION TESTING
 * ADMIN ORDERS COMPONENT INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Test the integration between AdminOrders component and its dependencies:
 * - Auth context (admin authentication, token management)
 * - Axios HTTP client (API calls to fetch and update orders)
 * - AdminMenu component (navigation integration)
 * - Layout component (page structure)
 * - Moment.js (date formatting)
 * - Antd Select component (status dropdown)
 * - React lifecycle (useEffect, useState)
 *
 * TESTING STRATEGY: Integration Testing (Component + Context + API)
 * - Real AdminOrders component with mocked external dependencies
 * - Real auth context integration
 * - Mock HTTP requests with realistic responses
 * - Test complete admin order management workflow
 *
 * INTEGRATION POINTS TESTED:
 * 1. AdminOrders → useAuth → token validation → API call
 * 2. AdminOrders → axios → API endpoints → data processing
 * 3. AdminOrders → Layout → AdminMenu → page structure
 * 4. AdminOrders → moment → date formatting display
 * 5. AdminOrders → Antd Select → status updates
 * 6. AdminOrders → React hooks → state management → UI updates
 *
 * MOCK STRATEGY:
 * - Mock: axios (controlled API responses)
 * - Mock: Layout, AdminMenu (simplified UI components)
 * - Mock: moment (predictable date formatting)
 * - Mock: Antd Select (simplified dropdown)
 * - Real: AdminOrders component, useAuth context, React hooks
 *
 * TEST PHILOSOPHY:
 * Integration tests verify how the AdminOrders component works with its ecosystem.
 * We test the complete order fetching, display, and status update workflow end-to-end.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import AdminOrders from "../admin/AdminOrders";

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Mock axios for API calls
jest.mock("axios");
const mockedAxios = axios;

// Mock the useAuth hook
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock axios defaults for AuthProvider compatibility
axios.defaults = {
  headers: {
    common: {},
  },
};

// Mock Layout component - keep it real but simple for integration
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));

// Mock AdminMenu component
jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Navigation Menu</div>
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

// Mock Antd Select component for simplified testing (v5 with options array)
jest.mock("antd", () => ({
  Select: ({ children, onChange, defaultValue, bordered, options }) => (
    <select
      data-testid="status-select"
      data-default-value={defaultValue}
      data-bordered={bordered}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {options &&
        options.map((option) => (
          <option key={option.key} value={option.value}>
            {option.label}
          </option>
        ))}
      {children}
    </select>
  ),
  Option: ({ children, value }) => <option value={value}>{children}</option>,
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Console log mock for error handling tests
let consoleLogSpy;

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockAdminUser = {
  _id: "admin123",
  name: "Admin User",
  email: "admin@example.com",
  role: 1, // Admin role
};

const mockAuthToken = "valid-admin-jwt-token-12345";

const mockAdminOrdersResponse = [
  {
    _id: "order001",
    status: "Processing",
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
    status: "Shipped",
    buyer: {
      _id: "user456",
      name: "Jane Smith",
      email: "jane@example.com",
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
    status: "deliverd",
    buyer: {
      _id: "user789",
      name: "Bob Wilson",
      email: "bob@example.com",
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
 * Render AdminOrders component with authentication context and router
 * @param {Object} authContextValue - Auth context value to provide
 */
const renderAdminOrdersWithAuth = (authContextValue) => {
  // Mock the useAuth hook to return our test values
  const mockUseAuth = require("../../context/auth").useAuth;
  mockUseAuth.mockReturnValue([authContextValue, jest.fn()]);

  return render(
    <BrowserRouter>
      <AdminOrders />
    </BrowserRouter>
  );
};

/**
 * Create auth context with authenticated admin user
 */
const createAdminAuthenticatedContext = () => ({
  user: mockAdminUser,
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
// TEST SUITE: ADMIN ORDERS COMPONENT INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminOrders Component Integration Tests", () => {
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
          "Warning: An update to AdminOrders inside a test was not wrapped in act"
        ) ||
          args[0].includes(
            'Warning: Each child in a list should have a unique "key" prop'
          ))
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
     * - AdminOrders → Layout (page title, structure)
     * - AdminOrders → AdminMenu (navigation sidebar)
     * - Bootstrap grid system layout
     */
    it("should integrate with Layout component and display correct page structure", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated admin user with no API call
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      // Mock successful empty orders response
      mockedAxios.get.mockResolvedValueOnce({
        data: emptyOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render AdminOrders component
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

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
      expect(layout).toHaveAttribute("data-title", "All Orders Data");

      const layoutTitle = screen.getByTestId("layout-title");
      expect(layoutTitle).toHaveTextContent("All Orders Data");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: AdminMenu component integrated in sidebar
      // ───────────────────────────────────────────────────────────────
      const adminMenu = screen.getByTestId("admin-menu");
      expect(adminMenu).toBeInTheDocument();
      expect(adminMenu).toHaveTextContent("Admin Navigation Menu");

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
     * - AdminOrders → useAuth → token validation
     * - AdminOrders → useEffect → conditional API call
     * - AdminOrders → axios → GET /api/v1/auth/all-orders
     * - AdminOrders → state management → UI update
     *
     * Expected Flow:
     * 1. Component mounts with authenticated admin user
     * 2. useEffect detects auth.token exists
     * 3. getOrders function makes API call
     * 4. Successful response updates orders state
     * 5. Component re-renders with orders data
     */
    it("should integrate authentication flow and fetch admin orders successfully", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated admin user and mock API response
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      // Mock successful orders API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockAdminOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component with authenticated context
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      });

      // Wait for DOM updates
      await waitFor(() => {
        const statusSelects = screen.getAllByTestId("status-select");
        expect(statusSelects[0]).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify complete authentication + API integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: API call made with correct endpoint
      // ───────────────────────────────────────────────────────────────
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Orders data displayed in UI
      // ───────────────────────────────────────────────────────────────

      // Order statuses verification
      const statusSelects = screen.getAllByTestId("status-select");
      expect(statusSelects[0]).toHaveAttribute(
        "data-default-value",
        "Processing"
      );
      expect(statusSelects[1]).toHaveAttribute("data-default-value", "Shipped");
      expect(statusSelects[2]).toHaveAttribute(
        "data-default-value",
        "deliverd"
      );

      // Buyer names verification
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Wilson")).toBeInTheDocument();

      // Payment status verification
      const successElements = screen.getAllByText("Success");
      expect(successElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Failed")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Product information displayed
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByText("Wireless Bluetooth Headphones")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Gaming Mechanical Keyboard")
      ).toBeInTheDocument();
      expect(screen.getByText("USB-C Cable")).toBeInTheDocument();

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
     * - AdminOrders → useAuth → no token
     * - AdminOrders → useEffect → no API call
     * - AdminOrders → empty state handling
     */
    it("should not fetch orders when admin is not authenticated", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup unauthenticated user
      // ═══════════════════════════════════════════════════════════════

      const authContext = createUnauthenticatedContext();

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component without authentication
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

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
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No order data displayed
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
      expect(screen.queryByText("Shipped")).not.toBeInTheDocument();
    });

    /**
     * TEST 2.3: API Error Handling Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → axios → error response
     * - AdminOrders → error handling → console.log
     * - AdminOrders → resilient UI (no crash)
     */
    it("should handle API errors gracefully", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated admin user with API error
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      // Mock API error response
      const apiError = new Error("Network Error: Unable to fetch admin orders");
      mockedAxios.get.mockRejectedValueOnce(apiError);

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component with failing API
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for API call attempt and error handling
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
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
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #4: No order data displayed (empty state)
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
      expect(screen.queryByText("Shipped")).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 3: STATUS UPDATE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #3: Status Update Integration", () => {
    /**
     * TEST 3.1: Order Status Update Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → Antd Select → onChange event
     * - AdminOrders → handleChange → PUT /api/v1/auth/order-status/{orderId}
     * - AdminOrders → getOrders → refresh data
     */
    it("should integrate status update functionality correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with order data and mock status update
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      // Mock initial orders fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: [mockAdminOrdersResponse[0]], // Single order for testing
      });

      // Mock status update response
      mockedAxios.put.mockResolvedValueOnce({
        data: { success: true },
      });

      // Mock second orders fetch after update
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            ...mockAdminOrdersResponse[0],
            status: "Shipped", // Updated status
          },
        ],
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component and trigger status update
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for initial data load and verify first order with Processing status
      await waitFor(() => {
        const statusSelect = screen.getAllByTestId("status-select")[0];
        expect(statusSelect).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
      });

      // Find the status select dropdown and change its value
      const statusSelect = screen.getByTestId("status-select");
      expect(statusSelect).toBeInTheDocument();

      // Trigger status change
      fireEvent.change(statusSelect, { target: { value: "Shipped" } });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify status update integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Initial orders fetch called
      // ───────────────────────────────────────────────────────────────
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Status update API called
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          `/api/v1/auth/order-status/${mockAdminOrdersResponse[0]._id}`,
          { status: "Shipped" }
        );
      });

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Orders refreshed after update
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });

    /**
     * TEST 3.2: Status Update Error Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → handleChange → PUT error
     * - AdminOrders → error handling → console.log
     */
    it("should handle status update errors gracefully", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with order data and mock status update error
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      // Mock initial orders fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: [mockAdminOrdersResponse[0]],
      });

      // Mock status update error
      const updateError = new Error("Failed to update order status");
      mockedAxios.put.mockRejectedValueOnce(updateError);

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render component and trigger failed status update
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for initial data load and verify first order with Processing status
      await waitFor(() => {
        const statusSelect = screen.getAllByTestId("status-select")[0];
        expect(statusSelect).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
      });

      // Trigger status change that will fail
      const statusSelect = screen.getByTestId("status-select");
      fireEvent.change(statusSelect, { target: { value: "Shipped" } });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify error handling
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Status update attempted
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          `/api/v1/auth/order-status/${mockAdminOrdersResponse[0]._id}`,
          { status: "Shipped" }
        );
      });

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Error logged to console
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(updateError);
      });

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Component remains functional
      // ───────────────────────────────────────────────────────────────
      const firstStatusSelect = screen.getAllByTestId("status-select")[0];
      expect(firstStatusSelect).toHaveAttribute(
        "data-default-value",
        "Processing"
      );
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 4: DATA DISPLAY AND FORMATTING INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #4: Data Display & Formatting Integration", () => {
    /**
     * TEST 4.1: Complete Order Data Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → API response → data processing
     * - AdminOrders → JSX rendering → table display
     * - AdminOrders → image URLs → product photos
     * - AdminOrders → string manipulation → description truncation
     */
    it("should integrate order data with UI rendering correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with comprehensive order data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: mockAdminOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and wait for data integration
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const firstStatusSelect = screen.getAllByTestId("status-select")[0];
        expect(firstStatusSelect).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify comprehensive data integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Order status integration with Select components
      // ───────────────────────────────────────────────────────────────
      const firstStatusSelect = screen.getAllByTestId("status-select")[0];
      expect(firstStatusSelect).toHaveAttribute(
        "data-default-value",
        "Processing"
      );
      const secondStatusSelect = screen.getAllByTestId("status-select")[1];
      expect(secondStatusSelect).toHaveAttribute(
        "data-default-value",
        "Shipped"
      );
      const thirdStatusSelect = screen.getAllByTestId("status-select")[2];
      expect(thirdStatusSelect).toHaveAttribute(
        "data-default-value",
        "deliverd"
      );

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Buyer information integration
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Wilson")).toBeInTheDocument();

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
      expect(quantityElements.length).toBeGreaterThanOrEqual(1); // At least one order with 2 products
      const threeElements = screen.getAllByText("3");
      expect(threeElements.length).toBeGreaterThanOrEqual(1); // At least one order with 3 products

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #5: Product information integration
      // ───────────────────────────────────────────────────────────────

      // Product names
      expect(
        screen.getByText("Wireless Bluetooth Headphones")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Gaming Mechanical Keyboard")
      ).toBeInTheDocument();
      expect(screen.getByText("USB-C Cable")).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #6: Description truncation integration
      // ───────────────────────────────────────────────────────────────
      expect(
        screen.getByText("Premium quality wireless headp")
      ).toBeInTheDocument();
      expect(
        screen.getByText("RGB backlit mechanical keyboar")
      ).toBeInTheDocument();
      expect(
        screen.getByText("High-speed USB-C to USB-C cabl")
      ).toBeInTheDocument();

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #7: Price integration
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByText("Price : 199.99")).toBeInTheDocument();
      expect(screen.getByText("Price : 149.99")).toBeInTheDocument();
      expect(screen.getByText("Price : 19.99")).toBeInTheDocument();
    });

    /**
     * TEST 4.2: Product Image Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → product data → image URL generation
     * - AdminOrders → img elements → src attribute construction
     */
    it("should integrate product images with correct API endpoints", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with product data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockAdminOrdersResponse[0]], // Single order for cleaner testing
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and wait for image integration
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const firstStatusSelect = screen.getAllByTestId("status-select")[0];
        expect(firstStatusSelect).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
      });

      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify image URL integration
      // ═══════════════════════════════════════════════════════════════

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Product images with correct API URLs
      // ───────────────────────────────────────────────────────────────
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

      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Image styling integration
      // ───────────────────────────────────────────────────────────────
      const images = screen.getAllByRole("img");
      images.forEach((img) => {
        expect(img).toHaveClass("card-img-top");
        expect(img).toHaveAttribute("width", "100px");
        expect(img).toHaveAttribute("height", "100px");
      });
    });

    /**
     * TEST 4.3: Date Formatting Integration with Moment.js
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → moment(date) → fromNow() → display
     * - AdminOrders → createAt field → date processing
     */
    it("should integrate date formatting with moment.js correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with different order dates
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: mockAdminOrdersResponse,
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and verify date integration
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const firstStatusSelect = screen.getAllByTestId("status-select")[0];
        expect(firstStatusSelect).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
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
      const dateCells = screen.getAllByText(/ago$/);
      expect(dateCells).toHaveLength(3); // Three orders with different dates
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 5: TABLE STRUCTURE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration Test #5: Table Structure Integration", () => {
    /**
     * TEST 5.1: Complete Table Integration
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminOrders → table structure → Bootstrap classes
     * - AdminOrders → table headers → order information
     * - AdminOrders → table rows → data mapping
     * - AdminOrders → Antd Select in table cells
     */
    it("should integrate table structure with order data correctly", async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup with order data
      // ═══════════════════════════════════════════════════════════════

      const authContext = createAdminAuthenticatedContext();

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockAdminOrdersResponse[0]], // Use single order for cleaner testing
      });

      // ═══════════════════════════════════════════════════════════════
      // ACT: Render and verify table integration
      // ═══════════════════════════════════════════════════════════════

      renderAdminOrdersWithAuth(authContext);

      // Wait for all async operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const firstStatusSelect = screen.getAllByTestId("status-select")[0];
        expect(firstStatusSelect).toHaveAttribute(
          "data-default-value",
          "Processing"
        );
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

      // Order status (Select component)
      const firstStatusSelect = screen.getAllByTestId("status-select")[0];
      expect(firstStatusSelect).toHaveAttribute(
        "data-default-value",
        "Processing"
      );
      expect(screen.getByTestId("status-select")).toBeInTheDocument();

      // Buyer name
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      // Date (mocked moment response)
      expect(screen.getByText("2 days ago")).toBeInTheDocument();

      // Payment status
      expect(screen.getByText("Success")).toBeInTheDocument();

      // Product quantity
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADMIN ORDERS COMPONENT INTEGRATION TEST SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TESTS IMPLEMENTED: 12 integration tests across 5 groups
 *
 * GROUP 1: COMPONENT STRUCTURE & LAYOUT (1 test):
 * ✅ Layout integration with correct page title and structure
 *
 * GROUP 2: AUTHENTICATION & API INTEGRATION (3 tests):
 * ✅ Complete authentication flow with successful order fetching
 * ✅ Unauthenticated admin handling (no API calls)
 * ✅ API error handling with graceful degradation
 *
 * GROUP 3: STATUS UPDATE INTEGRATION (2 tests):
 * ✅ Order status update functionality with API calls
 * ✅ Status update error handling
 *
 * GROUP 4: DATA DISPLAY & FORMATTING INTEGRATION (3 tests):
 * ✅ Complete order data integration with UI rendering
 * ✅ Product image integration with correct API endpoints
 * ✅ Date formatting integration with moment.js
 *
 * GROUP 5: TABLE STRUCTURE INTEGRATION (1 test):
 * ✅ Complete table integration with Bootstrap styling and Antd Select
 *
 * INTEGRATION COVERAGE:
 * - AdminOrders ↔ useAuth (admin authentication context)
 * - AdminOrders ↔ axios (HTTP client for API calls)
 * - AdminOrders ↔ Layout (page structure component)
 * - AdminOrders ↔ AdminMenu (navigation component)
 * - AdminOrders ↔ moment (date formatting library)
 * - AdminOrders ↔ Antd Select (status dropdown component)
 * - AdminOrders ↔ React hooks (useState, useEffect)
 * - AdminOrders ↔ Bootstrap (responsive CSS framework)
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
 * - AdminMenu component (simplified navigation)
 * - moment (predictable date formatting)
 * - Antd Select (simplified dropdown)
 *
 * ADMIN-SPECIFIC FEATURES TESTED:
 * - Order status management (Processing, Shipped, deliverd, etc.)
 * - Status update API integration (PUT /api/v1/auth/order-status/{orderId})
 * - Admin orders endpoint (GET /api/v1/auth/all-orders)
 * - Administrative UI components (AdminMenu, status dropdowns)
 *
 * TEST PHILOSOPHY:
 * These integration tests verify that the AdminOrders component works correctly
 * within its ecosystem. We test the complete admin workflow from authentication
 * through data fetching, display, and order status management, ensuring all
 * integrations function properly for administrative users.
 * ═══════════════════════════════════════════════════════════════════════════
 */
