import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "../Private";

// Mock axios
jest.mock("axios");
const mockedAxios = axios;

// Mock Spinner component
jest.mock("../../Spinner", () => {
  return function MockSpinner({ path }) {
    return (
      <div data-testid="spinner">Loading... {path && `Path: ${path}`}</div>
    );
  };
});

// Mock useAuth hook
const mockAuth = {
  user: { id: 1, name: "Test User" },
  token: "mock-token",
};

const mockSetAuth = jest.fn();

jest.mock("../../../context/auth", () => ({
  useAuth: () => [mockAuth, mockSetAuth],
}));

// Mock Outlet component
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div data-testid="outlet">Protected Content</div>,
}));

describe("Private Integration Tests", () => {
  const renderPrivateRoute = () => {
    return render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Integration Test #1: Basic Component Rendering", () => {
    test("should render PrivateRoute component without crashing", () => {
      // Mock successful auth response
      mockedAxios.get.mockResolvedValueOnce({
        data: { ok: true },
      });

      renderPrivateRoute();

      // Component should render without throwing errors
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });

  describe("Integration Test #2: Authentication Success Flow", () => {
    test("should render Outlet when authentication is successful", async () => {
      // Mock successful auth response
      mockedAxios.get.mockResolvedValueOnce({
        data: { ok: true },
      });

      renderPrivateRoute();

      // Initially should show spinner
      expect(screen.getByTestId("spinner")).toBeInTheDocument();

      // Wait for auth check to complete and Outlet to render
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });

      // Spinner should no longer be visible
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
  });

  describe("Integration Test #3: Authentication Failure Flow", () => {
    test("should render Spinner when authentication fails", async () => {
      // Mock failed auth response
      mockedAxios.get.mockResolvedValueOnce({
        data: { ok: false },
      });

      renderPrivateRoute();

      // Initially should show spinner
      expect(screen.getByTestId("spinner")).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        // Should still show spinner (not authenticated)
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });

      // Outlet should not be rendered
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    });
  });

  describe("Integration Test #4: API Error Handling", () => {
    test("should render Spinner when API call fails", async () => {
      // Mock API error
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      renderPrivateRoute();

      // Initially should show spinner
      expect(screen.getByTestId("spinner")).toBeInTheDocument();

      // Wait for error handling to complete
      await waitFor(
        () => {
          // Should still show spinner (error occurred, auth failed)
          expect(screen.getByTestId("spinner")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Outlet should not be rendered due to error
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    });
  });

  describe("Integration Test #5: Auth Context Integration", () => {
    test("should integrate properly with useAuth context hook", async () => {
      // Mock successful auth response
      mockedAxios.get.mockResolvedValueOnce({
        data: { ok: true },
      });

      renderPrivateRoute();

      // Verify that axios is called with the correct endpoint
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
      });

      // Verify that authentication succeeds and Outlet is rendered
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });
    });
  });

  describe("Integration Test #6: Spinner Component Integration", () => {
    test("should render Spinner with correct props", async () => {
      // Mock failed auth response to keep spinner visible
      mockedAxios.get.mockResolvedValueOnce({
        data: { ok: false },
      });

      renderPrivateRoute();

      // Check that Spinner component is rendered
      const spinner = screen.getByTestId("spinner");
      expect(spinner).toBeInTheDocument();

      // Verify Spinner content and props
      expect(spinner).toHaveTextContent("Loading...");

      // Wait for auth check to complete, spinner should remain
      await waitFor(() => {
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
      });
    });
  });

  describe("Integration Test #7: React Router Outlet Integration", () => {
    test("should render Outlet when authentication succeeds", async () => {
      // Mock successful auth response
      mockedAxios.get.mockResolvedValueOnce({
        data: { ok: true },
      });

      renderPrivateRoute();

      // Wait for authentication to complete and Outlet to render
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });

      // Verify Outlet content
      expect(screen.getByText("Protected Content")).toBeInTheDocument();

      // Verify Spinner is no longer visible
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
  });

  describe("Integration Test #8: Async Behavior and Token Dependency", () => {
    test("should handle multiple authentication attempts gracefully", async () => {
      // Mock successful auth response
      mockedAxios.get.mockResolvedValue({
        data: { ok: true },
      });

      // Render component multiple times to test stability
      const { unmount } = renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });

      // Unmount and remount to test component stability
      unmount();
      renderPrivateRoute();

      // Should handle re-authentication
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });

      // Verify multiple API calls were made
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe("Integration Test #9: Component State Management", () => {
    test("should maintain consistent state during authentication lifecycle", async () => {
      // Mock delayed authentication response
      mockedAxios.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { ok: true } }), 100)
          )
      );

      renderPrivateRoute();

      // Initially should show spinner
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });

      // State should be consistent - no spinner, outlet visible
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();

      // Verify proper API call was made
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
  });

  describe("Integration Test #10: Complete Component Integration", () => {
    test("should provide comprehensive authentication route guard functionality", async () => {
      // Mock successful authentication after delay
      mockedAxios.get.mockResolvedValue({
        data: { ok: true },
      });

      renderPrivateRoute();

      // Verify initial loading state
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
      });

      // Verify final authenticated state
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();

      // Verify integration with auth context
      expect(mockAuth.token).toBe("mock-token");
      expect(mockAuth.user).toEqual({ id: 1, name: "Test User" });

      // Verify API integration
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");

      // Verify router integration
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
  });
});
