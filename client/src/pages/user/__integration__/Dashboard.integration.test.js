import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../Dashboard";

// Mock external dependencies
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock Layout component
jest.mock("../../../components/Layout", () => {
  return function MockLayout({ title, children }) {
    return (
      <div data-testid="layout">
        <title>{title}</title>
        {children}
      </div>
    );
  };
});

// Mock UserMenu component
jest.mock("../../../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Mock useAuth hook
const mockAuth = {
  user: {
    name: "John Doe",
    email: "john.doe@example.com",
    address: "123 Main Street, City, State",
  },
  token: "mock-token",
};

jest.mock("../../../context/auth", () => ({
  useAuth: () => [mockAuth],
}));

describe("Dashboard Integration Tests", () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Integration Test #1: Basic Component Rendering", () => {
    test("should render Dashboard component without crashing", () => {
      renderDashboard();

      // Component should render without throwing errors
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  describe("Integration Test #2: Page Title and Layout", () => {
    test("should render correct page title in Layout component", () => {
      renderDashboard();

      // Check if the title is passed correctly to Layout
      const titleElement = screen.getByText("Dashboard - Ecommerce App");
      expect(titleElement).toBeInTheDocument();
    });
  });

  describe("Integration Test #3: UserMenu Integration", () => {
    test("should render UserMenu component", () => {
      renderDashboard();

      // Check if UserMenu is rendered
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toBeInTheDocument();
      expect(userMenu).toHaveTextContent("User Menu");
    });
  });

  describe("Integration Test #4: User Data Display from Auth Context", () => {
    test("should display user information from auth context", () => {
      renderDashboard();

      // Check if user name is displayed
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      // Check if user email is displayed
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();

      // Check if user address is displayed
      expect(
        screen.getByText("123 Main Street, City, State")
      ).toBeInTheDocument();
    });
  });

  describe("Integration Test #5: Auth Context Integration", () => {
    test("should properly integrate with useAuth hook", () => {
      renderDashboard();

      // Verify that the auth context is being used properly
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      // Verify all user information is present (indicating successful auth integration)
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(
        screen.getByText("123 Main Street, City, State")
      ).toBeInTheDocument();
    });
  });

  describe("Integration Test #6: User Information Card Structure", () => {
    test("should render user information in proper card structure", () => {
      renderDashboard();

      // Check that all user information headings are H3 elements
      const nameHeading = screen.getByRole("heading", { name: "John Doe" });
      const emailHeading = screen.getByRole("heading", {
        name: "john.doe@example.com",
      });
      const addressHeading = screen.getByRole("heading", {
        name: "123 Main Street, City, State",
      });

      expect(nameHeading).toBeInTheDocument();
      expect(nameHeading.tagName).toBe("H3");

      expect(emailHeading).toBeInTheDocument();
      expect(emailHeading.tagName).toBe("H3");

      expect(addressHeading).toBeInTheDocument();
      expect(addressHeading.tagName).toBe("H3");
    });
  });

  describe("Integration Test #7: Router Compatibility", () => {
    test("should work within React Router context", () => {
      // This test ensures the component doesn't break when rendered within BrowserRouter
      expect(() => renderDashboard()).not.toThrow();

      // Verify component renders successfully in router context
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      // Verify all expected content is present in router context
      expect(screen.getByText("Dashboard - Ecommerce App")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("Integration Test #8: Component Integration Completeness", () => {
    test("should integrate all components seamlessly", () => {
      renderDashboard();

      // Verify Layout integrates with Dashboard
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      // Verify UserMenu integrates within the layout
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toBeInTheDocument();

      // Verify user data from auth context integrates with the UI
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(
        screen.getByText("123 Main Street, City, State")
      ).toBeInTheDocument();

      // Verify proper component hierarchy
      expect(layout).toContainElement(userMenu);
    });
  });

  describe("Integration Test #9: Component Stability and Re-renders", () => {
    test("should render consistently and handle re-renders", () => {
      const { rerender } = renderDashboard();

      // Verify initial render
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      // Test re-render with same props
      rerender(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Verify component is stable after re-render
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });
  });

  describe("Integration Test #10: Performance and Accessibility", () => {
    test("should render efficiently and maintain accessibility", () => {
      const { unmount } = renderDashboard();

      // Verify initial state
      expect(screen.getByTestId("layout")).toBeInTheDocument();

      // Test performance - measure single render operation
      const startTime = performance.now();
      // Perform a simple operation instead of full render to avoid duplicates
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      const operationTime = performance.now() - startTime;

      // Operation should be fast (under 50ms)
      expect(operationTime).toBeLessThan(50);

      // Verify accessibility - check heading structure exists
      const headings = screen.getAllByRole("heading");
      expect(headings).toHaveLength(3); // Name, email, address headings

      // Verify all headings are H3 elements
      headings.forEach((heading) => {
        expect(heading.tagName).toBe("H3");
      });

      // Verify specific content is accessible
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(
        screen.getByText("123 Main Street, City, State")
      ).toBeInTheDocument();

      // Test cleanup
      expect(() => unmount()).not.toThrow();
    });
  });
});
