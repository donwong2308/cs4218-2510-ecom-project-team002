import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";

// Mock the dependencies
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-helmet", () => ({
  Helmet: jest.fn(() => null),
}));

jest.mock("../../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  );
});

jest.mock("../../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="mock-user-menu">User Menu</div>;
  };
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    // Set up mock auth context
    useAuth.mockReturnValue([
      {
        user: {
          name: "Test User",
          email: "test@example.com",
          address: "123 Test Street",
        },
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the dashboard with correct title", () => {
    render(<Dashboard />);

    // Check if Layout is rendered with correct title
    const layout = screen.getByTestId("mock-layout");
    expect(layout).toBeInTheDocument();
    expect(layout.getAttribute("data-title")).toBe("Dashboard - Ecommerce App");
  });

  test("renders UserMenu component", () => {
    render(<Dashboard />);

    const userMenu = screen.getByTestId("mock-user-menu");
    expect(userMenu).toBeInTheDocument();
  });

  test("displays user information from auth context", () => {
    render(<Dashboard />);

    // Check if user details are displayed
    const userName = screen.getByText("Test User");
    const userEmail = screen.getByText("test@example.com");
    const userAddress = screen.getByText("123 Test Street");

    expect(userName).toBeInTheDocument();
    expect(userEmail).toBeInTheDocument();
    expect(userAddress).toBeInTheDocument();
  });
});
