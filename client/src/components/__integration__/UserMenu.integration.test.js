import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import UserMenu from "../UserMenu";

describe("UserMenu Integration Tests", () => {
  const renderUserMenu = () => {
    return render(
      <BrowserRouter>
        <UserMenu />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Integration Test #1: Basic Component Rendering", () => {
    test("should render UserMenu component without crashing", () => {
      renderUserMenu();

      // Component should render without throwing errors
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("Integration Test #2: Heading Structure", () => {
    test("should render Dashboard heading correctly", () => {
      renderUserMenu();

      // Check if Dashboard heading is rendered as H4
      const heading = screen.getByRole("heading", { name: "Dashboard" });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H4");
    });
  });

  describe("Integration Test #3: Navigation Links", () => {
    test("should render all navigation links correctly", () => {
      renderUserMenu();

      // Check for Profile link
      const profileLink = screen.getByRole("link", { name: "Profile" });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");

      // Check for Orders link
      const ordersLink = screen.getByRole("link", { name: "Orders" });
      expect(ordersLink).toBeInTheDocument();
      expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
    });
  });

  describe("Integration Test #4: React Router NavLink Integration", () => {
    test("should integrate properly with React Router NavLink", () => {
      renderUserMenu();

      // Verify NavLinks are rendered correctly within Router context
      const profileLink = screen.getByRole("link", { name: "Profile" });
      const ordersLink = screen.getByRole("link", { name: "Orders" });

      // Check that links have the proper CSS classes from NavLink
      expect(profileLink).toHaveClass(
        "list-group-item",
        "list-group-item-action"
      );
      expect(ordersLink).toHaveClass(
        "list-group-item",
        "list-group-item-action"
      );

      // Verify links are clickable (not disabled)
      expect(profileLink).not.toHaveAttribute("disabled");
      expect(ordersLink).not.toHaveAttribute("disabled");
    });
  });

  describe("Integration Test #5: Component Structure and Content Integration", () => {
    test("should integrate all content elements properly", () => {
      renderUserMenu();

      // Verify heading is present
      const heading = screen.getByText("Dashboard");
      expect(heading).toBeInTheDocument();

      // Verify both navigation links are present and accessible
      const profileLink = screen.getByRole("link", { name: "Profile" });
      const ordersLink = screen.getByRole("link", { name: "Orders" });

      expect(profileLink).toBeInTheDocument();
      expect(ordersLink).toBeInTheDocument();

      // Verify content hierarchy - all elements should be accessible
      expect(heading.tagName).toBe("H4");
      expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
      expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
    });
  });

  describe("Integration Test #6: Navigation Link Interaction", () => {
    test("should handle navigation link clicks without errors", () => {
      renderUserMenu();

      const profileLink = screen.getByRole("link", { name: "Profile" });
      const ordersLink = screen.getByRole("link", { name: "Orders" });

      // Test that links can be clicked without throwing errors
      expect(() => fireEvent.click(profileLink)).not.toThrow();
      expect(() => fireEvent.click(ordersLink)).not.toThrow();

      // Verify links maintain their attributes after interaction
      expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
      expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
    });
  });

  describe("Integration Test #7: Accessibility Features", () => {
    test("should have proper accessibility attributes", () => {
      renderUserMenu();

      // Check for proper heading hierarchy
      const heading = screen.getByRole("heading", { level: 4 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Dashboard");

      // Check that links are accessible via role
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);

      // Verify links have accessible names
      expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();

      // Verify links are keyboard navigable (have href attributes)
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });

  describe("Integration Test #8: Router Context Compatibility", () => {
    test("should work seamlessly within React Router context", () => {
      // Test that component doesn't break when rendered within BrowserRouter
      expect(() => renderUserMenu()).not.toThrow();

      // Verify NavLinks function properly in router context
      const profileLink = screen.getByRole("link", { name: "Profile" });
      const ordersLink = screen.getByRole("link", { name: "Orders" });

      // Verify links have proper router integration
      expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
      expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");

      // Verify all content is accessible in router context
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });
  });

  describe("Integration Test #9: Component Stability and Re-renders", () => {
    test("should render consistently and handle re-renders", () => {
      const { rerender } = renderUserMenu();

      // Verify initial render
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();

      // Test re-render with same props
      rerender(
        <BrowserRouter>
          <UserMenu />
        </BrowserRouter>
      );

      // Verify component is stable after re-render
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();

      // Verify links maintain proper attributes
      expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
        "href",
        "/dashboard/user/profile"
      );
      expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
        "href",
        "/dashboard/user/orders"
      );
    });
  });

  describe("Integration Test #10: Performance and Component Cleanup", () => {
    test("should render efficiently and clean up properly", () => {
      const { unmount } = renderUserMenu();

      // Verify initial state
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // Test that component renders quickly (no heavy operations)
      const startTime = performance.now();
      // Perform a simple operation to test performance
      expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
      const operationTime = performance.now() - startTime;

      // Operation should be fast (under 50ms for this simple component)
      expect(operationTime).toBeLessThan(50);

      // Verify all navigation elements are efficiently accessible
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);

      // Test that links are properly structured for performance
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
        expect(link).toHaveClass("list-group-item");
      });

      // Test cleanup
      expect(() => unmount()).not.toThrow();
    });
  });
});
