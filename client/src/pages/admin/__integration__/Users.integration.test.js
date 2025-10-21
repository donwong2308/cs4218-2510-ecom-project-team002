/**
 * Users Component Integration Tests
 *
 * This file contains comprehensive integration tests for the Users admin page component.
 * It tests the integration between the Users component and various system modules including:
 * - Admin authentication and authorization
 * - Layout and AdminMenu components
 * - React Router navigation
 * - Context providers (Auth, Cart, Search)
 * - API integration patterns
 * - Future user management functionality
 *
 * Test Coverage:
 * - Admin route protection and authentication flow
 * - Component rendering and layout integration
 * - Navigation menu integration
 * - Category header integration
 * - Error handling and loading states
 * - Future user management API integration patterns
 *
 * Summary: 5 integration tests across 2 groups covering admin authentication,
 * component structure, navigation integration, and extensibility for future features.
 */

import React from "react";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Users from "../Users";
import AdminRoute from "../../../components/Routes/AdminRoute";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";

// Mock axios for API call interception
jest.mock("axios");
const mockedAxios = axios;

// Mock react-hot-toast to prevent toast notifications during testing
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  Toaster: () => null,
}));

// Test data: Mock admin user for authentication testing
const adminUser = {
  name: "Dashboard Admin",
  email: "admin@example.com",
  role: 1, // Admin role
};

// Test data: Mock categories for header navigation testing
const mockCategories = [
  { _id: "cat-001", name: "Accessories", slug: "accessories" },
  { _id: "cat-002", name: "Apparel", slug: "apparel" },
];

/**
 * Provider wrapper component that sets up all necessary React context providers
 * and routing configuration for integration testing.
 *
 * This wrapper provides:
 * - AuthProvider: User authentication state management
 * - CartProvider: Shopping cart state management
 * - SearchProvider: Search functionality state management
 * - MemoryRouter: In-memory routing for test navigation
 * - Protected admin routes configuration
 */
const withProviders = () => (
  <AuthProvider>
    <CartProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
          <Routes>
            <Route path="/dashboard" element={<AdminRoute />}>
              <Route path="admin/users" element={<Users />} />
            </Route>
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    </CartProvider>
  </AuthProvider>
);

/**
 * Integration Test Group #1: Admin Route Protection and Authentication
 *
 * Tests the integration between the Users component and admin authentication system.
 * Verifies that only authenticated admin users can access the Users management page
 * and that the proper layout and navigation elements are rendered.
 */
describe("Users admin route integration", () => {
  // Setup browser environment for Antd components that require matchMedia
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  // Setup test environment before each test
  beforeEach(() => {
    jest.clearAllMocks();
    axios.defaults = { headers: { common: {} } };

    // Mock authenticated admin user in localStorage
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: adminUser,
        token: "admin-test-token",
      })
    );

    // Setup axios mocks for API calls
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/auth/admin-auth")) {
        return Promise.resolve({ data: { ok: true } });
      }
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  // Cleanup after each test
  afterEach(() => {
    cleanup();
    localStorage.clear();
    jest.useRealTimers();
  });

  /**
   * Test: Admin Authentication and Dashboard Access
   * Verifies that authenticated admin users can successfully access the Users page
   * and that all required UI elements are properly rendered and integrated.
   */
  /**
   * Test: Admin Authentication and Dashboard Access
   * Verifies that authenticated admin users can successfully access the Users page
   * and that all required UI elements are properly rendered and integrated.
   */
  it("allows an authenticated admin to view the Users dashboard", async () => {
    render(withProviders());

    // Verify admin authentication API call
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth")
    );

    // Verify main page heading is rendered
    expect(
      await screen.findByRole("heading", { name: /all users/i })
    ).toBeInTheDocument();

    // Verify page title is set correctly
    await waitFor(() =>
      expect(document.title).toContain("Dashboard - All Users")
    );

    // Verify AdminMenu navigation items are present
    expect(screen.getByText("Create Category")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();

    // Verify admin user dropdown is accessible
    expect(
      await screen.findByRole("button", { name: /dashboard\s+admin/i })
    ).toBeInTheDocument();
  });

  /**
   * Test: Category Header Integration
   * Verifies that the header component successfully integrates with the category API
   * and displays category navigation links properly.
   */
  /**
   * Test: Category Header Integration
   * Verifies that the header component successfully integrates with the category API
   * and displays category navigation links properly.
   */
  it("renders header categories retrieved from the API", async () => {
    render(withProviders());

    // Verify category links are rendered from API data
    expect(
      await screen.findByRole("link", { name: "Accessories" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Apparel" })
    ).toBeInTheDocument();

    // Verify category API was called
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  /**
   * Test: Authentication Failure Handling
   * Verifies that the component properly handles admin authentication failures
   * and displays appropriate loading/redirect states.
   */
  /**
   * Test: Authentication Failure Handling
   * Verifies that the component properly handles admin authentication failures
   * and displays appropriate loading/redirect states.
   */
  it("falls back to the loading spinner when admin auth fails", async () => {
    jest.useFakeTimers();

    // Mock failed admin authentication
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/auth/admin-auth")) {
        return Promise.resolve({ data: { ok: false } });
      }
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
      return Promise.resolve({ data: {} });
    });

    render(withProviders());

    // Verify redirect message is shown when auth fails
    expect(
      await screen.findByRole("heading", { name: /redirecting to you in/i })
    ).toBeInTheDocument();

    // Simulate timer advancement for redirect
    act(() => {
      jest.advanceTimersByTime(3000);
    });
  });

  /**
   * Test: Component Structure Verification
   * Verifies that the Users component renders in its current minimal state
   * and doesn't make unnecessary API calls for user data (since not yet implemented).
   */
  /**
   * Test: Component Structure Verification
   * Verifies that the Users component renders in its current minimal state
   * and doesn't make unnecessary API calls for user data (since not yet implemented).
   */
  it("does not request admin users when the Users page renders", async () => {
    render(withProviders());

    // Verify that no user listing API calls are made (feature not yet implemented)
    expect(
      axios.get.mock.calls.some(([url]) =>
        url.includes("/api/v1/auth/all-users")
      )
    ).toBe(false);

    // Verify that no specific user data is displayed (since not fetched)
    expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob Buyer")).not.toBeInTheDocument();
  });
});

/**
 * Integration Test Group #2: Future User Management API Integration
 *
 * Tests the extensibility patterns for future user management functionality.
 * This test group provides a foundation for when user listing and management
 * features are implemented in the Users component.
 */
describe("Integration Test #2: User Management API Integration", () => {
  // Setup test environment for each test
  beforeEach(() => {
    jest.clearAllMocks();
    axios.defaults = { headers: { common: {} } };
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: adminUser,
        token: "admin-test-token",
      })
    );
  });

  // Cleanup after each test
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  /**
   * Test: Future User Management Integration Patterns
   * Demonstrates how the Users component could integrate with user management APIs
   * when the functionality is implemented. Currently validates component structure
   * and admin navigation accessibility.
   */
  /**
   * Test: Future User Management Integration Patterns
   * Demonstrates how the Users component could integrate with user management APIs
   * when the functionality is implemented. Currently validates component structure
   * and admin navigation accessibility.
   */
  it("should integrate with user management APIs when implemented", async () => {
    // Mock users API response (for future implementation reference)
    const mockUsers = [
      {
        _id: "user001",
        name: "John Customer",
        email: "john@customer.com",
        role: 0, // Customer role
        phone: "1234567890",
        address: "123 Customer St",
        createdAt: "2023-12-01T10:30:00Z",
      },
      {
        _id: "user002",
        name: "Admin User",
        email: "admin@admin.com",
        role: 1, // Admin role
        phone: "0987654321",
        address: "456 Admin Ave",
        createdAt: "2023-11-15T14:45:00Z",
      },
    ];

    // Setup comprehensive API mocks for future integration
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/auth/admin-auth")) {
        return Promise.resolve({ data: { ok: true } });
      }
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
      if (url.includes("/api/v1/auth/all-users")) {
        // Future API endpoint for user listing
        return Promise.resolve({ data: { users: mockUsers } });
      }
      return Promise.resolve({ data: {} });
    });

    render(withProviders());

    // Wait for admin authentication verification
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
    });

    // Verify current component structure (minimal implementation)
    expect(
      await screen.findByRole("heading", { name: /all users/i })
    ).toBeInTheDocument();

    // NOTE: Currently the Users component doesn't fetch user data
    // This test verifies the component structure exists for future enhancement

    // Verify admin navigation integration is working
    expect(screen.getByText("Create Category")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });
});
