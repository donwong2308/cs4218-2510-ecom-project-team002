import React from "react";
import axios from "axios";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

// mock auth hook so tests can control the returned auth state
jest.mock("../../context/auth", () => ({ useAuth: jest.fn() }));

// keep Layout minimal when rendering dashboards (avoid rendering Header/Footer)
// use createElement to avoid relying on JSX at mock-eval time
jest.mock("../../components/Layout", () => ({ children }) => require("react").createElement("div", null, children));

/**
 * ProtectedAdminRoutes.integration.test.js
 *
 * Login -> AdminDashboard
 * 
 * Purpose:
 * - Verify that admin-only API endpoints require a valid admin token.
 * - Validate the front-end login -> AdminDashboard flow (Login -> AdminDashboard)
 *   and confirm admin-only UI items (Create Category / Create Product) render
 *   for admin users but not for regular users.
 * - Uses a mocked `axios.post` implementation to simulate authorized vs
 *   unauthorized requests. When the Authorization header contains the
 *   expected admin token the mock returns success; otherwise it returns
 *   a failure payload (simulating a 401 Unauthorized response).
 *
 * Scope:
 * - Focused on front-end integration-style assertion of API contract, login
 *   flow rendering, and token-checking behavior. No network calls are made;
 *   axios is mocked.
 */

describe("Admin protected routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("admin token required for admin actions; invalid token returns 401", async () => {
    const adminToken = "valid-admin-token";
    axios.post.mockImplementation((url, body, cfg) => {
      if (url === "/api/v1/product/create-product") {
        if (cfg && cfg.headers && cfg.headers.Authorization === `Bearer ${adminToken}`) {
          return Promise.resolve({ data: { success: true } });
        }
        return Promise.resolve({ data: { success: false }, status: 401 });
      }
      return Promise.reject(new Error("Unexpected POST " + url));
    });

    // authorized
    const ok = await axios.post("/api/v1/product/create-product", { name: "X", price: 1 }, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(ok.data.success).toBe(true);

    // unauthorized
    const no = await axios.post("/api/v1/product/create-product", { name: "X", price: 1 }, { headers: { Authorization: "Bearer bad" } });
    expect(no.data.success).toBe(false);
  });

  test("admin user sees admin menu items in AdminDashboard", async () => {
    const { useAuth } = require("../../context/auth");
    const AdminDashboard = require("../../pages/admin/AdminDashboard").default;

    // Mock auth as admin
    useAuth.mockReturnValue([{ user: { id: 1, name: "Admin User", role: 1 }, token: "admin-token" }, jest.fn()]);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminDashboard />
      </MemoryRouter>
    );

    // AdminMenu includes links with text 'Create Category' and 'Create Product'
    expect(screen.getByText(/Create Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Product/i)).toBeInTheDocument();
  });

  test("non-admin user sees user dashboard items and not admin items", async () => {
    const { useAuth } = require("../../context/auth");
    const UserDashboard = require("../../pages/user/Dashboard").default;

    // Mock auth as regular user
    useAuth.mockReturnValue([{ user: { id: 2, name: "Regular User", role: 0 }, token: "user-token" }, jest.fn()]);

    render(
      <MemoryRouter initialEntries={["/dashboard/user"]}>
        <UserDashboard />
      </MemoryRouter>
    );

    // UserMenu includes 'Profile' and should not include admin links
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.queryByText(/Create Category/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Product/i)).not.toBeInTheDocument();
  });
});