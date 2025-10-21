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

// Mock axios
jest.mock("axios");
const mockedAxios = axios;

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  Toaster: () => null,
}));

const adminUser = {
  name: "Dashboard Admin",
  email: "admin@example.com",
  role: 1,
};

const mockCategories = [
  { _id: "cat-001", name: "Accessories", slug: "accessories" },
  { _id: "cat-002", name: "Apparel", slug: "apparel" },
];

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

describe("Users admin route integration", () => {
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

  afterEach(() => {
    cleanup();
    localStorage.clear();
    jest.useRealTimers();
  });

  it("allows an authenticated admin to view the Users dashboard", async () => {
    render(withProviders());

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth")
    );

    expect(
      await screen.findByRole("heading", { name: /all users/i })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(document.title).toContain("Dashboard - All Users")
    );

    expect(screen.getByText("Create Category")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: /dashboard\s+admin/i })
    ).toBeInTheDocument();
  });

  it("renders header categories retrieved from the API", async () => {
    render(withProviders());

    expect(
      await screen.findByRole("link", { name: "Accessories" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Apparel" })
    ).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("falls back to the loading spinner when admin auth fails", async () => {
    jest.useFakeTimers();

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

    expect(
      await screen.findByRole("heading", { name: /redirecting to you in/i })
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
  });

  it("does not request admin users when the Users page renders", async () => {
    render(withProviders());

    expect(
      axios.get.mock.calls.some(([url]) =>
        url.includes("/api/v1/auth/all-users")
      )
    ).toBe(false);

    expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob Buyer")).not.toBeInTheDocument();
  });
});

describe("Integration Test #4: User Management API Integration", () => {
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

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("should integrate with user management APIs when implemented", async () => {
    // Mock users API response (this would be used if Users component fetched data)
    const mockUsers = [
      {
        _id: "user001",
        name: "John Customer",
        email: "john@customer.com",
        role: 0,
        phone: "1234567890",
        address: "123 Customer St",
        createdAt: "2023-12-01T10:30:00Z",
      },
      {
        _id: "user002",
        name: "Admin User",
        email: "admin@admin.com",
        role: 1,
        phone: "0987654321",
        address: "456 Admin Ave",
        createdAt: "2023-11-15T14:45:00Z",
      },
    ];

    // Setup mocks for all expected API calls
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/auth/admin-auth")) {
        return Promise.resolve({ data: { ok: true } });
      }
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({ data: { category: mockCategories } });
      }
      if (url.includes("/api/v1/auth/all-users")) {
        return Promise.resolve({ data: { users: mockUsers } });
      }
      return Promise.resolve({ data: {} });
    });

    render(withProviders());

    // Wait for admin auth verification
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
    });

    // Verify the Users page renders (currently just shows "All Users" heading)
    expect(
      await screen.findByRole("heading", { name: /all users/i })
    ).toBeInTheDocument();

    // NOTE: Currently the Users component doesn't fetch user data
    // This test verifies the component structure exists for future enhancement

    // Verify admin navigation is accessible
    expect(screen.getByText("Create Category")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });
});
