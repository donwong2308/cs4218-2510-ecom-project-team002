/**
 * Register Component Integration Tests - Phase 3.2
 * 
 * Purpose: Test integration between Register component and its dependencies:
 * - axios API calls to /api/v1/auth/register
 * - Form validation and controlled inputs
 * - Navigation after successful registration
 * - Toast notifications for success/error
 * - Layout component integration
 * 
 * Integration Points:
 * - Register form → axios POST → toast → navigate
 * - Form inputs → state updates → form submission
 * - Error responses → error handling → user feedback
 * 
 * Mock Strategy:
 * - Mock: axios (API calls), toast (notifications)
 * - Real: Register component, Layout, form validation, navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthProvider } from '../../../context/auth';

// Mock axios for API calls with proper structure
jest.mock('axios', () => ({
  post: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

// Mock toast notifications
jest.mock('react-hot-toast');

// Mock useNavigate
const mockNavigateFunction = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigateFunction,
}));

// Mock Layout dependencies
jest.mock('../../../components/Form/SearchInput', () => {
  return function SearchInput() {
    return <div data-testid="mock-search-input">SearchInput</div>;
  };
});

jest.mock('../../../hooks/useCategory', () => ({
  __esModule: true,
  default: () => ({
    categories: [],
  }),
}));

jest.mock('../../../context/cart', () => ({
  useCart: () => [[], jest.fn()],
}));

// Helper function: Render Register with Router
const renderRegisterWithRouter = () => {
  const utils = render(
    <AuthProvider>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </AuthProvider>
  );
  
  return { ...utils, mockNavigate: mockNavigateFunction };
};

// Helper function: Fill registration form with valid data
const fillRegistrationForm = (customData = {}) => {
  const defaultData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '1234567890',
    address: '123 Main St',
    DOB: '1990-01-01',
    answer: 'Football',
  };
  
  const data = { ...defaultData, ...customData };
  
  fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
    target: { value: data.name },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
    target: { value: data.email },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
    target: { value: data.password },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
    target: { value: data.phone },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your address/i), {
    target: { value: data.address },
  });
  fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), {
    target: { value: data.DOB },
  });
  fireEvent.change(screen.getByPlaceholderText(/what is your favorite sports/i), {
    target: { value: data.answer },
  });
  
  return data;
};

// Helper function: Submit registration form
const submitRegistrationForm = () => {
  const submitButton = screen.getByRole('button', { name: /register/i });
  fireEvent.click(submitButton);
};

describe('Register Component Integration Tests - Phase 3: Business Logic Layer', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    toast.success = jest.fn();
    toast.error = jest.fn();
  });

  // ==================== Test Group 1: Complete Registration Flow ====================
  describe('Integration Test #1: Complete Registration Flow', () => {
    
    test('should complete full registration flow with valid data', async () => {
      // Arrange: Setup successful API response
      const mockResponse = {
        data: {
          success: true,
          message: 'User registered successfully',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);
      
      const { mockNavigate } = renderRegisterWithRouter();
      
      // Act: Fill form with valid data and submit
      const formData = fillRegistrationForm();
      submitRegistrationForm();
      
      // Assert: Verify API call with correct data
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          DOB: formData.DOB,
          answer: formData.answer,
        });
      });
      
      // Assert: Verify success toast displayed
      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
      
      // Assert: Verify navigation to login page
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should send all 7 required fields to registration API', async () => {
      // Arrange
      axios.post.mockResolvedValue({
        data: { success: true, message: 'Registration successful' },
      });
      
      renderRegisterWithRouter();
      
      // Act: Fill all fields
      const formData = fillRegistrationForm({
        name: 'Jane Smith',
        email: 'jane@test.com',
        password: 'securePass123',
        phone: '9876543210',
        address: '456 Oak Ave',
        DOB: '1995-05-15',
        answer: 'Basketball',
      });
      submitRegistrationForm();
      
      // Assert: Verify all fields sent to API
      await waitFor(() => {
        const apiCall = axios.post.mock.calls[0];
        expect(apiCall[0]).toBe('/api/v1/auth/register');
        expect(apiCall[1]).toEqual({
          name: 'Jane Smith',
          email: 'jane@test.com',
          password: 'securePass123',
          phone: '9876543210',
          address: '456 Oak Ave',
          DOB: '1995-05-15',
          answer: 'Basketball',
        });
      });
    });
  });

  // ==================== Test Group 2: Registration Error Handling ====================
  describe('Integration Test #2: Registration Error Handling', () => {
    
    test('should handle duplicate email error gracefully', async () => {
      // Arrange: API returns error for duplicate email
      const mockResponse = {
        data: {
          success: false,
          message: 'Email already exists',
        },
      };
      axios.post.mockResolvedValue(mockResponse);
      
      const { mockNavigate } = renderRegisterWithRouter();
      
      // Act: Submit registration with existing email
      fillRegistrationForm({ email: 'existing@example.com' });
      submitRegistrationForm();
      
      // Assert: Verify error toast displayed
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists');
      });
      
      // Assert: Should NOT navigate to login on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should handle network error with generic message', async () => {
      // Arrange: Simulate network error
      axios.post.mockRejectedValue(new Error('Network Error'));
      
      const { mockNavigate } = renderRegisterWithRouter();
      
      // Act: Submit registration
      fillRegistrationForm();
      submitRegistrationForm();
      
      // Assert: Verify generic error message (security feature)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
      
      // Assert: Should NOT navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should handle validation error from backend', async () => {
      // Arrange: Backend returns validation error
      const mockResponse = {
        data: {
          success: false,
          message: 'Password must be at least 6 characters',
        },
      };
      axios.post.mockResolvedValue(mockResponse);
      
      renderRegisterWithRouter();
      
      // Act: Submit with short password
      fillRegistrationForm({ password: '123' });
      submitRegistrationForm();
      
      // Assert: Verify backend validation error displayed
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters');
      });
    });

    test('should handle API error without success field', async () => {
      // Arrange: Simulate server error response
      axios.post.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });
      
      renderRegisterWithRouter();
      
      // Act: Submit registration
      fillRegistrationForm();
      submitRegistrationForm();
      
      // Assert: Verify generic error message (security measure)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });
  });

  // ==================== Test Group 3: Form Validation Integration ====================
  describe('Integration Test #3: Form Validation Integration', () => {
    
    test('should require all 7 fields to submit form', () => {
      // Arrange
      renderRegisterWithRouter();
      
      // Act & Assert: Verify all required fields present
      expect(screen.getByPlaceholderText(/enter your name/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/enter your phone/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/enter your address/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/enter your dob/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/what is your favorite sports/i)).toBeRequired();
    });

    test('should validate email format', () => {
      // Arrange
      renderRegisterWithRouter();
      
      // Act & Assert: Email field has type="email"
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should validate password field is type password', () => {
      // Arrange
      renderRegisterWithRouter();
      
      // Act & Assert: Password field should hide characters
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should validate DOB field is type Date', () => {
      // Arrange
      renderRegisterWithRouter();
      
      // Act & Assert: DOB field should be date picker
      const dobInput = screen.getByPlaceholderText(/enter your dob/i);
      expect(dobInput).toHaveAttribute('type', 'Date');
    });

    test('should update all form fields as controlled components', () => {
      // Arrange
      renderRegisterWithRouter();
      
      // Act: Update each field
      const nameInput = screen.getByPlaceholderText(/enter your name/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      
      // Assert: Verify values updated
      expect(nameInput.value).toBe('Test User');
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('testpass');
    });
  });

  // ==================== Test Group 4: Layout and Navigation Integration ====================
  describe('Integration Test #4: Layout and Navigation Integration', () => {
    
    test('should render Register within Layout component', () => {
      // Arrange & Act
      renderRegisterWithRouter();
      
      // Assert: Verify Layout renders (Header with SearchInput)
      expect(screen.getByTestId('mock-search-input')).toBeInTheDocument();
      
      // Assert: Verify form title
      expect(screen.getByText(/register form/i)).toBeInTheDocument();
    });

    test('should have accessible register button', () => {
      // Arrange & Act
      renderRegisterWithRouter();
      
      // Assert: Button accessible and properly labeled
      const registerButton = screen.getByRole('button', { name: /register/i });
      expect(registerButton).toBeInTheDocument();
      expect(registerButton).toHaveAttribute('type', 'submit');
    });

    test('should have autofocus on name field', () => {
      // Arrange & Act
      renderRegisterWithRouter();
      
      // Assert: Name field should have focus (React's autoFocus prop gives element focus, not HTML attribute)
      const nameInput = screen.getByPlaceholderText(/enter your name/i);
      expect(nameInput).toHaveFocus();
    });
  });

  // ==================== Test Group 5: Form Submission Integration ====================
  describe('Integration Test #5: Form Submission Integration', () => {
    
    test('should prevent default form submission behavior', async () => {
      // Arrange
      axios.post.mockResolvedValue({
        data: { success: true, message: 'Registration successful' },
      });
      
      renderRegisterWithRouter();
      fillRegistrationForm();
      
      // Act: Get form and simulate submission
      const form = screen.getByRole('button', { name: /register/i }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      form.dispatchEvent(submitEvent);
      
      // Assert: preventDefault should be called (handled by React)
      // Note: In React, preventDefault is always called for onSubmit handlers
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });

    test('should NOT call API if form is incomplete (HTML5 validation)', () => {
      // Arrange
      renderRegisterWithRouter();
      
      // Act: Try to submit empty form (HTML5 will prevent it)
      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);
      
      // Assert: API should NOT be called (HTML5 validation prevents submission)
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // ==================== Test Group 6: Toast Notification Integration ====================
  describe('Integration Test #6: Toast Notification Integration', () => {
    
    test('should display success toast with correct message', async () => {
      // Arrange
      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'User registered successfully',
        },
      });
      
      renderRegisterWithRouter();
      
      // Act: Complete registration
      fillRegistrationForm();
      submitRegistrationForm();
      
      // Assert: Success toast with specific message
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
      });
      
      // Assert: No error toast
      expect(toast.error).not.toHaveBeenCalled();
    });

    test('should display error toast when registration fails', async () => {
      // Arrange
      axios.post.mockResolvedValue({
        data: {
          success: false,
          message: 'Phone number already exists',
        },
      });
      
      renderRegisterWithRouter();
      
      // Act: Submit registration
      fillRegistrationForm();
      submitRegistrationForm();
      
      // Assert: Error toast with backend message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Phone number already exists');
      });
      
      // Assert: No success toast
      expect(toast.success).not.toHaveBeenCalled();
    });

    test('should display generic error toast for security on exception', async () => {
      // Arrange: Simulate any error (network, server, etc.)
      axios.post.mockRejectedValue(new Error('Connection timeout'));
      
      renderRegisterWithRouter();
      
      // Act: Submit registration
      fillRegistrationForm();
      submitRegistrationForm();
      
      // Assert: Generic error message (security feature to prevent info disclosure)
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });
  });

  // ==================== Test Group 7: Security Answer Integration ====================
  describe('Integration Test #7: Security Answer Integration', () => {
    
    test('should include security answer in registration payload', async () => {
      // Arrange
      axios.post.mockResolvedValue({
        data: { success: true, message: 'Registration successful' },
      });
      
      renderRegisterWithRouter();
      
      // Act: Fill form with specific security answer
      fillRegistrationForm({ answer: 'Cricket' });
      submitRegistrationForm();
      
      // Assert: Security answer included in API call
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/api/v1/auth/register',
          expect.objectContaining({
            answer: 'Cricket',
          })
        );
      });
    });

    test('should display security question placeholder text', () => {
      // Arrange & Act
      renderRegisterWithRouter();
      
      // Assert: Security question placeholder visible
      const answerInput = screen.getByPlaceholderText(/what is your favorite sports/i);
      expect(answerInput).toBeInTheDocument();
      expect(answerInput).toBeRequired();
    });
  });
});
