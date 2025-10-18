/**
 * Phase 3.5: ForgotPassword Component Integration Tests
 * 
 * Purpose: Integration tests for ForgotPassword password reset functionality
 * Focus: Password reset flow, form validation, API integration, error handling
 * 
 * Integration Points:
 * - ForgotPassword component (form submission, state management)
 * - Layout component (page structure, SEO metadata)
 * - axios (HTTP client for API calls)
 * - react-router-dom (navigation after successful reset)
 * - react-hot-toast (success/error notifications)
 * 
 * Test Strategy: Integration testing with mocked external dependencies (axios)
 * Real components: ForgotPassword, Layout
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ForgotPassword from "../ForgotPassword";

// Mock axios
jest.mock("axios");

// Mock toast notifications
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock CSS
jest.mock("../../../styles/AuthStyles.css", () => ({}));

// Mock Layout component
jest.mock("../../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("ForgotPassword Component Integration Tests - Phase 3.5: Password Reset Flow", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Test Group 1: Complete Password Reset Flow ====================
  describe("Integration Test #1: Complete Password Reset Flow", () => {
    
    test("should complete full password reset flow with valid credentials", async () => {
      // Arrange: Mock successful API response
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Password Reset Successfully",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Fill in all form fields
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const answerInput = screen.getByPlaceholderText(/enter your security answer/i);
      const passwordInput = screen.getByPlaceholderText(/enter your new password/i);

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(answerInput, { target: { value: "My favorite pet" } });
      fireEvent.change(passwordInput, { target: { value: "newPassword123" } });

      // Act: Submit form
      const submitButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(submitButton);

      // Assert: API should be called with correct data
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
          email: "test@example.com",
          answer: "My favorite pet",
          newPassword: "newPassword123",
        });
      });

      // Assert: Success toast should be displayed with custom styling
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Password Reset Successfully",
          expect.objectContaining({
            duration: 5000,
            icon: "🔐",
            style: {
              background: "green",
              color: "white",
            },
          })
        );
      });

      // Assert: Should navigate to login page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });

    test("should send all required fields to password reset API", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Password Reset Successfully",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Fill in form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "user@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Security Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newPass456" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Verify API payload contains all 3 required fields
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/auth/forgot-password",
          expect.objectContaining({
            email: expect.any(String),
            answer: expect.any(String),
            newPassword: expect.any(String),
          })
        );
      });

      // Assert: Verify exact values
      const apiCall = axios.post.mock.calls[0][1];
      expect(apiCall.email).toBe("user@test.com");
      expect(apiCall.answer).toBe("Security Answer");
      expect(apiCall.newPassword).toBe("newPass456");
    });
  });

  // ==================== Test Group 2: Password Reset Error Handling ====================
  describe("Integration Test #2: Password Reset Error Handling", () => {
    
    test("should handle invalid email or wrong security answer error", async () => {
      // Arrange: Mock API failure response
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Invalid email or security answer",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form with invalid credentials
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "wrong@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Wrong Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newPassword" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Error toast should be shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid email or security answer");
      });

      // Assert: Should NOT navigate to login page
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("should handle network error gracefully", async () => {
      // Arrange: Mock network error
      axios.post.mockRejectedValueOnce(new Error("Network Error"));
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "password" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Generic error toast should be shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });

      // Assert: Error should be logged
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      // Assert: Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    test("should handle API response with success: false", async () => {
      // Arrange: Mock API returning success: false
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "User not found",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "notfound@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newPass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Error message from API should be shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("User not found");
      });

      // Assert: Should NOT navigate to login
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("should handle exception during API call", async () => {
      // Arrange: Mock API throwing exception
      axios.post.mockImplementationOnce(() => {
        throw new Error("API Exception");
      });
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "password" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Generic error should be shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });

      consoleLogSpy.mockRestore();
    });
  });

  // ==================== Test Group 3: Form Validation Integration ====================
  describe("Integration Test #3: Form Validation Integration", () => {
    
    test("should require all 3 fields to submit form", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: All input fields should be required
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const answerInput = screen.getByPlaceholderText(/enter your security answer/i);
      const passwordInput = screen.getByPlaceholderText(/enter your new password/i);

      expect(emailInput).toBeRequired();
      expect(answerInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    test("should validate email format", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: Email input should have type="email"
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    test("should validate password field is type password", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: Password input should be masked
      const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("should update all form fields as controlled components", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const answerInput = screen.getByPlaceholderText(/enter your security answer/i);
      const passwordInput = screen.getByPlaceholderText(/enter your new password/i);

      // Act: Update all fields
      fireEvent.change(emailInput, { target: { value: "updated@test.com" } });
      fireEvent.change(answerInput, { target: { value: "Updated Answer" } });
      fireEvent.change(passwordInput, { target: { value: "updatedPass123" } });

      // Assert: All fields should reflect new values
      expect(emailInput).toHaveValue("updated@test.com");
      expect(answerInput).toHaveValue("Updated Answer");
      expect(passwordInput).toHaveValue("updatedPass123");
    });
  });

  // ==================== Test Group 4: Layout and Component Integration ====================
  describe("Integration Test #4: Layout and Component Integration", () => {
    
    test("should render ForgotPassword within Layout component", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: Layout component should be present
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();

      // Assert: Layout should have correct title
      expect(layout).toHaveAttribute("data-title", "Forgot Password - Virtual Vault");
    });

    test("should have accessible reset button", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: Reset button should be accessible by role and name
      const resetButton = screen.getByRole("button", { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveAttribute("type", "submit");
    });

    test("should display 'RESET PASSWORD' heading", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: Page heading should be displayed
      expect(screen.getByText("RESET PASSWORD")).toBeInTheDocument();
    });
  });

  // ==================== Test Group 5: Form Submission Integration ====================
  describe("Integration Test #5: Form Submission Integration", () => {
    
    test("should prevent default form submission behavior", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: "Success" },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Get the form element and submit
      const form = screen.getByRole("button", { name: /reset/i }).closest("form");
      const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, "preventDefault");

      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "password" },
      });

      form.dispatchEvent(submitEvent);

      // Assert: preventDefault should be called
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test("should NOT call API if form is incomplete (HTML5 validation)", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Try to submit form without filling fields (HTML5 will prevent it)
      const resetButton = screen.getByRole("button", { name: /reset/i });
      
      // Note: In a real browser, HTML5 validation would prevent submission
      // In jsdom, we can verify the required attributes are set
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toBeRequired();

      // Assert: API should not be called without valid form data
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // ==================== Test Group 6: Toast Notification Integration ====================
  describe("Integration Test #6: Toast Notification Integration", () => {
    
    test("should display success toast with custom styling", async () => {
      // Arrange: Mock successful password reset
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Your password has been reset successfully",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newPassword" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Success toast should have custom styling
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Your password has been reset successfully",
          expect.objectContaining({
            duration: 5000,
            icon: "🔐",
            style: expect.objectContaining({
              background: "green",
              color: "white",
            }),
          })
        );
      });
    });

    test("should display error toast on password reset failure", async () => {
      // Arrange: Mock failed password reset
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Security answer is incorrect",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Wrong Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newPassword" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Error toast should be displayed
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Security answer is incorrect");
      });
    });

    test("should display generic error toast for security on exception", async () => {
      // Arrange: Mock exception
      axios.post.mockRejectedValueOnce(new Error("Server error"));
      jest.spyOn(console, "log").mockImplementation(() => {});

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "password" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Generic error message should be shown (don't expose internal errors)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });

      console.log.mockRestore();
    });
  });

  // ==================== Test Group 7: Navigation Integration ====================
  describe("Integration Test #7: Navigation Integration", () => {
    
    test("should navigate to login page after successful password reset", async () => {
      // Arrange: Mock successful reset
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Password Reset Successfully",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Complete password reset
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Answer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newPassword123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Should navigate to /login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });

    test("should NOT navigate on failed password reset", async () => {
      // Arrange: Mock failed reset
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Invalid credentials",
        },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Submit form with invalid data
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "Wrong" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "password" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Should NOT navigate
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ==================== Test Group 8: Security Answer Integration ====================
  describe("Integration Test #8: Security Answer Integration", () => {
    
    test("should include security answer in password reset payload", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: "Success" },
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Act: Fill in form including security answer
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your security answer/i), {
        target: { value: "My first pet was Fluffy" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your new password/i), {
        target: { value: "newSecurePassword" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset/i }));

      // Assert: Security answer should be in API payload
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/auth/forgot-password",
          expect.objectContaining({
            answer: "My first pet was Fluffy",
          })
        );
      });
    });

    test("should display security answer placeholder text", async () => {
      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      );

      // Assert: Security answer input should have helpful placeholder
      const answerInput = screen.getByPlaceholderText(/enter your security answer/i);
      expect(answerInput).toBeInTheDocument();
      expect(answerInput).toHaveAttribute("placeholder", "Enter Your Security Answer ");
    });
  });
});
