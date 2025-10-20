import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Users from "../admin/Users";

// Mock external dependencies
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock Layout component
jest.mock("../../components/Layout", () => {
  return function MockLayout({ title, children }) {
    return (
      <div data-testid="layout">
        <title>{title}</title>
        {children}
      </div>
    );
  };
});

// Mock AdminMenu component
jest.mock("../../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});

describe("Users Integration Tests", () => {
  const renderUsers = () => {
    return render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Integration Test #1: Basic Component Rendering", () => {
    test("should render Users component without crashing", async () => {
      renderUsers();

      // Component should render without throwing errors
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  describe("Integration Test #2: Page Title and Layout", () => {
    test("should render correct page title in Layout component", () => {
      renderUsers();

      // Check if the title is passed correctly to Layout
      const titleElement = screen.getByText("Dashboard - All Users");
      expect(titleElement).toBeInTheDocument();
    });
  });

  describe("Integration Test #3: AdminMenu Integration", () => {
    test("should render AdminMenu component", () => {
      renderUsers();

      // Check if AdminMenu is rendered
      const adminMenu = screen.getByTestId("admin-menu");
      expect(adminMenu).toBeInTheDocument();
      expect(adminMenu).toHaveTextContent("Admin Menu");
    });
  });

  describe("Integration Test #4: Main Content Structure", () => {
    test("should render main content with correct heading", () => {
      renderUsers();

      // Check for main heading
      const heading = screen.getByRole("heading", { name: /all users/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });
  });

  describe("Integration Test #5: Component Integration", () => {
    test("should integrate Layout and AdminMenu components properly", () => {
      renderUsers();

      // Verify Layout component receives the correct props
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      // Verify AdminMenu is integrated within the layout
      const adminMenu = screen.getByTestId("admin-menu");
      expect(adminMenu).toBeInTheDocument();

      // Verify both title and heading content are present
      expect(screen.getByText("Dashboard - All Users")).toBeInTheDocument();
      expect(screen.getByText("All Users")).toBeInTheDocument();
    });
  });

  describe("Integration Test #6: Accessibility Features", () => {
    test("should have proper accessibility attributes", () => {
      renderUsers();

      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent("All Users");

      // Check that the page title is accessible
      expect(screen.getByText("Dashboard - All Users")).toBeInTheDocument();
    });
  });

  describe("Integration Test #7: Router Compatibility", () => {
    test("should work within React Router context", () => {
      // This test ensures the component doesn't break when rendered within BrowserRouter
      expect(() => renderUsers()).not.toThrow();

      // Verify component renders successfully in router context
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      // Verify all expected content is present in router context
      expect(screen.getByText("Dashboard - All Users")).toBeInTheDocument();
      expect(screen.getByText("All Users")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  describe("Integration Test #8: Component Stability", () => {
    test("should render consistently and handle re-renders", () => {
      const { rerender } = renderUsers();

      // Verify initial render
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("All Users")).toBeInTheDocument();

      // Test re-render with same props
      rerender(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );

      // Verify component is stable after re-render
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("All Users")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  describe("Integration Test #9: Props Flow Validation", () => {
    test("should pass correct props to child components", () => {
      renderUsers();

      // Verify Layout receives the correct title prop
      expect(screen.getByText("Dashboard - All Users")).toBeInTheDocument();

      // Verify AdminMenu is rendered (indicating it receives no props and works independently)
      const adminMenu = screen.getByTestId("admin-menu");
      expect(adminMenu).toBeInTheDocument();
      expect(adminMenu).toHaveTextContent("Admin Menu");

      // Verify the component structure maintains proper hierarchy
      const layout = screen.getByTestId("layout");
      expect(layout).toContainElement(adminMenu);
    });
  });

  describe("Integration Test #10: Performance and Cleanup", () => {
    test("should render efficiently and clean up properly", () => {
      const { unmount } = renderUsers();

      // Verify initial state
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("All Users")).toBeInTheDocument();

      // Test that component renders quickly (no heavy operations)
      const startTime = performance.now();
      renderUsers();
      const renderTime = performance.now() - startTime;

      // Render should be fast (under 100ms for this simple component)
      expect(renderTime).toBeLessThan(100);

      // Test cleanup
      expect(() => unmount()).not.toThrow();
    });
  });
});
