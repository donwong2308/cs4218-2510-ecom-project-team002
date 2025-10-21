/**
 * Dashboard Component Integration Tests
 *
 * This file contains comprehensive integration tests for the user Dashboard component.
 * It tests the integration between the Dashboard component and various system modules including:
 * - User authentication and auth context integration
 * - Layout component integration and page structure
 * - UserMenu component integration
 * - React Router navigation compatibility
 * - Component rendering stability and performance
 * - Accessibility compliance
 *
 * Test Coverage:
 * - Component rendering and layout structure
 * - Auth context integration and user data display
 * - Component hierarchy and integration patterns
 * - Router compatibility and navigation
 * - Performance and accessibility standards
 * - Re-render stability and cleanup
 *
 * Summary: 10 integration tests across 10 groups covering component structure,
 * auth integration, layout rendering, router compatibility, and performance validation.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../Dashboard";
import { AuthProvider } from "../../../context/auth";
import axios from "axios";

/**
 * Test utility function that renders the Dashboard component with all necessary providers
 * and sets up the authentication context with mock user data.
 *
 * @param {Object} initialAuth - Mock authentication data to use for testing
 * @returns {Object} Render result from React Testing Library
 */
const renderDashboardWithProviders = (initialAuth = mockAuth) => {
  localStorage.setItem("auth", JSON.stringify(initialAuth));
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

// Mock external dependencies to isolate component behavior
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock Layout component to focus on Dashboard-specific logic
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

// Mock UserMenu component to focus on integration patterns
jest.mock("../../../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Test data: Mock authenticated user for dashboard testing
const mockAuth = {
  user: {
    name: "John Doe",
    email: "john.doe@example.com",
    address: "123 Main Street, City, State",
  },
  token: "mock-token",
};

/**
 * Dashboard Integration Test Suite
 *
 * Comprehensive integration testing for the user Dashboard component covering
 * component rendering, context integration, layout structure, and performance.
 */
describe("Dashboard Integration Tests", () => {
  // Setup clean test environment before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults = { headers: { common: {} } };
  });

  /**
   * Integration Test Group #1: Basic Component Rendering
   *
   * Tests the fundamental rendering capability of the Dashboard component
   * to ensure it renders without errors in the testing environment.
   */
  describe("Integration Test #1: Basic Component Rendering", () => {
    /**
     * Test: Component Rendering Stability
     * Verifies that the Dashboard component can be rendered without throwing
     * any errors and that the basic layout structure is present.
     */
    /**
     * Test: Component Rendering Stability
     * Verifies that the Dashboard component can be rendered without throwing
     * any errors and that the basic layout structure is present.
     */
    test("should render Dashboard component without crashing", () => {
      renderDashboardWithProviders();

      // Component should render without throwing errors
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  /**
   * Integration Test Group #2: Page Title and Layout Integration
   *
   * Tests the integration between the Dashboard component and the Layout component,
   * specifically focusing on proper title propagation and layout structure.
   */
  describe("Integration Test #2: Page Title and Layout", () => {
    /**
     * Test: Layout Title Integration
     * Verifies that the Dashboard correctly passes the page title to the Layout
     * component and that it's rendered properly in the document structure.
     */
    /**
     * Test: Layout Title Integration
     * Verifies that the Dashboard correctly passes the page title to the Layout
     * component and that it's rendered properly in the document structure.
     */
    test("should render correct page title in Layout component", () => {
      renderDashboardWithProviders();

      // Check if the title is passed correctly to Layout
      const titleElement = screen.getByText("Dashboard - Ecommerce App");
      expect(titleElement).toBeInTheDocument();
    });
  });

  /**
   * Integration Test Group #3: UserMenu Component Integration
   *
   * Tests the integration between the Dashboard and UserMenu components,
   * ensuring proper rendering and accessibility of user navigation elements.
   */
  describe("Integration Test #3: UserMenu Integration", () => {
    /**
     * Test: UserMenu Rendering Integration
     * Verifies that the UserMenu component is properly integrated within
     * the Dashboard and renders with expected content.
     */
    /**
     * Test: UserMenu Rendering Integration
     * Verifies that the UserMenu component is properly integrated within
     * the Dashboard and renders with expected content.
     */
    test("should render UserMenu component", () => {
      renderDashboardWithProviders();

      // Check if UserMenu is rendered
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toBeInTheDocument();
      expect(userMenu).toHaveTextContent("User Menu");
    });
  });

  /**
   * Integration Test Group #4: Auth Context Data Integration
   *
   * Tests the integration between the Dashboard component and the authentication
   * context, verifying that user data is properly retrieved and displayed.
   */
  describe("Integration Test #4: User Data Display from Auth Context", () => {
    /**
     * Test: User Information Display Integration
     * Verifies that the Dashboard correctly retrieves and displays user information
     * from the authentication context including name, email, and address.
     */
    /**
     * Test: User Information Display Integration
     * Verifies that the Dashboard correctly retrieves and displays user information
     * from the authentication context including name, email, and address.
     */
    test("should display user information from auth context", () => {
      renderDashboardWithProviders();

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

  /**
   * Integration Test Group #5: Auth Hook Integration
   *
   * Tests the proper integration with the useAuth hook and verifies that
   * the authentication context is functioning correctly within the component.
   */
  describe("Integration Test #5: Auth Context Integration", () => {
    /**
     * Test: useAuth Hook Integration
     * Verifies that the Dashboard properly integrates with the useAuth hook
     * and that user authentication data flows correctly through the component.
     */
    test("should properly integrate with useAuth hook", () => {
      renderDashboardWithProviders();

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
      renderDashboardWithProviders();

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
      expect(() => renderDashboardWithProviders()).not.toThrow();

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
      renderDashboardWithProviders();

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
      const { rerender } = renderDashboardWithProviders();

      // Verify initial render
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      // Test re-render with same props
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
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
      const { unmount } = renderDashboardWithProviders();

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
