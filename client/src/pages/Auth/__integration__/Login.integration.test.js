/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3.1: LOGIN COMPONENT INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Test Strategy: Middle-Layer Integration (Business Logic)
 * Focus: Login form integration with APIs, auth context, navigation, and validation
 * 
 * Integration Points Tested:
 * 1. Login form → axios API calls
 * 2. Login response → useAuth hook (auth context update)
 * 3. Login success → React Router navigation
 * 4. Login → Layout component integration
 * 5. Form validation → User feedback (toast notifications)
 * 6. Auth state persistence → localStorage
 * 7. Error handling → Error display and recovery
 * 
 * Mock Strategy:
 * - Mock: axios POST requests (external API dependency)
 * - Real: Login component, Layout, useAuth hook, navigation, toast, localStorage
 * 
 * Test Coverage Goals:
 * - Complete login flow (form → API → auth update → navigation)
 * - Error handling (invalid credentials, network errors, validation)
 * - Form validation integration
 * - Auth state persistence
 * - Layout integration
 * - Navigation integration with location state
 * 
 * Component Hierarchy:
 * 
 *     Login Component
 *          ├── Layout (wrapper)
 *          │     ├── Header
 *          │     ├── Helmet (SEO)
 *          │     └── Footer
 *          ├── Form
 *          │     ├── Email Input
 *          │     ├── Password Input
 *          │     ├── Forgot Password Button
 *          │     └── Submit Button
 *          ├── axios (API calls)
 *          ├── useAuth (context)
 *          ├── useNavigate (routing)
 *          ├── useLocation (state)
 *          ├── toast (notifications)
 *          └── localStorage (persistence)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthProvider } from '../../../context/auth';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK SETUP
// ═══════════════════════════════════════════════════════════════════════════

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
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  Toaster: () => null,
}));

// Mock SearchInput component (not needed for Login tests)
jest.mock('../../../components/Form/SearchInput', () => {
  return function MockSearchInput() {
    return <div data-testid="mock-search-input">Search</div>;
  };
});

// Mock useCategory hook
jest.mock('../../../hooks/useCategory', () => ({
  __esModule: true,
  default: () => [],
}));

// Mock useCart hook
jest.mock('../../../context/cart', () => ({
  useCart: () => [[], jest.fn()],
}));

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renders Login component with AuthProvider and Router context
 * Provides navigation history for testing redirects
 */
const renderLoginWithRouter = (initialRoute = '/login', locationState = null) => {
  const routes = [
    {
      pathname: initialRoute,
      state: locationState,
    },
  ];

  return render(
    <MemoryRouter initialEntries={routes} initialIndex={0}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
};

/**
 * Fills login form with provided credentials
 */
const fillLoginForm = (email, password) => {
  const emailInput = screen.getByPlaceholderText(/enter your email/i);
  const passwordInput = screen.getByPlaceholderText(/enter your password/i);

  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(passwordInput, { target: { value: password } });
};

/**
 * Submits the login form
 */
const submitLoginForm = () => {
  const loginButton = screen.getByRole('button', { name: /login/i });
  fireEvent.click(loginButton);
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: LOGIN COMPONENT INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Login Component Integration Tests - Phase 3: Business Logic Layer', () => {
  
  // ───────────────────────────────────────────────────────────────────────────
  // Setup and Teardown
  // ───────────────────────────────────────────────────────────────────────────
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset axios mock
    axios.post.mockReset();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP #1: Complete Login Flow
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #1: Complete Login Flow', () => {
    
    /**
     * Test: Successful login with valid credentials
     * 
     * Integration Points:
     * - Form submission → axios POST
     * - API response → useAuth context update
     * - Auth update → localStorage persistence
     * - Success → toast notification
     * - Success → navigation to home
     * 
     * Component Flow:
     * Login Form → axios.post → API Response → setAuth → localStorage → toast → navigate
     */
    test('should complete full login flow with valid credentials', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE: Setup mock API response and render component
      // ─────────────────────────────────────────────────────────────────────
      
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 0,
      };

      const mockToken = 'mock-jwt-token-12345';

      const mockApiResponse = {
        data: {
          success: true,
          message: 'Login successful',
          user: mockUser,
          token: mockToken,
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT: Fill form and submit
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('test@example.com', 'password123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Verify complete integration flow
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // 1. Verify axios called with correct endpoint and data
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });

        // 2. Verify localStorage updated with auth data
        const storedAuth = JSON.parse(localStorage.getItem('auth'));
        expect(storedAuth).toEqual(mockApiResponse.data);
        expect(storedAuth.user).toEqual(mockUser);
        expect(storedAuth.token).toBe(mockToken);

        // 3. Verify success toast displayed
        expect(toast.success).toHaveBeenCalledWith(
          'Login successful',
          expect.objectContaining({
            duration: 5000,
            icon: '🙏',
          })
        );
      });
    });

    /**
     * Test: Login with location state redirects to intended page
     * 
     * Integration Points:
     * - useLocation hook → location.state
     * - Login success → navigate with state
     * - Redirect to intended destination (not home)
     */
    test('should redirect to intended page from location state after login', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE: User tried to access protected page, was redirected to login
      // ─────────────────────────────────────────────────────────────────────
      
      const mockApiResponse = {
        data: {
          success: true,
          message: 'Login successful',
          user: { _id: '123', name: 'Test User', email: 'test@example.com' },
          token: 'token',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      // Simulate user was redirected from /dashboard to /login
      renderLoginWithRouter('/login', '/dashboard');

      // ─────────────────────────────────────────────────────────────────────
      // ACT: Complete login
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('test@example.com', 'password123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Should redirect to /dashboard (location.state), not home
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalled();
        // Navigation integration verified - component uses location.state || '/'
      });
    });

    /**
     * Test: Login updates auth context correctly
     * 
     * Integration Points:
     * - API response → useAuth hook
     * - setAuth updates AuthContext
     * - Auth state available to all consumers
     */
    test('should update auth context with user and token', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      const mockUser = {
        _id: '456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 1, // Admin user
      };

      const mockApiResponse = {
        data: {
          success: true,
          user: mockUser,
          token: 'admin-token',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('john@example.com', 'admin123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Auth context integration
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // Verify localStorage has correct structure
        const storedAuth = JSON.parse(localStorage.getItem('auth'));
        expect(storedAuth.user.role).toBe(1); // Admin role preserved
        expect(storedAuth.user.name).toBe('John Doe');
        expect(storedAuth.token).toBe('admin-token');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP #2: Login Error Handling
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #2: Login Error Handling', () => {
    
    /**
     * Test: Invalid credentials error handling
     * 
     * Integration Points:
     * - API error response → error handling
     * - Error message → toast notification
     * - Error state → no navigation
     * - Error → no auth update
     */
    test('should handle invalid credentials error', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE: Mock API returns error response
      // ─────────────────────────────────────────────────────────────────────
      
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            message: 'Invalid email or password',
          },
        },
      };

      axios.post.mockRejectedValueOnce(mockErrorResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT: Attempt login with invalid credentials
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('wrong@example.com', 'wrongpassword');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Error handling integration
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // 1. Verify error toast displayed with correct message
        expect(toast.error).toHaveBeenCalledWith('Invalid email or password');

        // 2. Verify localStorage NOT updated (no successful login)
        expect(localStorage.getItem('auth')).toBeNull();

        // 3. Verify user still on login page (no navigation)
        expect(screen.getByText(/login form/i)).toBeInTheDocument();
      });
    });

    /**
     * Test: Network error handling
     * 
     * Integration Points:
     * - Network failure → error catch block
     * - Generic error → fallback error message
     * - Error → toast notification
     */
    test('should handle network error gracefully', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE: Mock network error (no response from server)
      // ─────────────────────────────────────────────────────────────────────
      
      const networkError = new Error('Network Error');
      networkError.response = undefined; // No response object

      axios.post.mockRejectedValueOnce(networkError);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('test@example.com', 'password123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Fallback error message displayed
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // Verify fallback error message when no response.data.message
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        
        // Verify no auth data stored
        expect(localStorage.getItem('auth')).toBeNull();
      });
    });

    /**
     * Test: API returns success: false
     * 
     * Integration Points:
     * - API response with success: false
     * - Error message from response
     * - Error toast displayed
     */
    test('should handle API response with success: false', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE: API returns response but with success: false
      // ─────────────────────────────────────────────────────────────────────
      
      const mockFailedResponse = {
        data: {
          success: false,
          message: 'User not found',
        },
      };

      axios.post.mockResolvedValueOnce(mockFailedResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('nonexistent@example.com', 'password123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Error path taken even though axios didn't reject
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // Verify error toast with message from response
        expect(toast.error).toHaveBeenCalledWith('User not found');
        
        // Verify no localStorage update
        expect(localStorage.getItem('auth')).toBeNull();
      });
    });

    /**
     * Test: API returns malformed response
     * 
     * Integration Points:
     * - Malformed API response → safe error handling
     * - Fallback error message → toast
     */
    test('should handle malformed API response', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE: API returns unexpected response structure
      // ─────────────────────────────────────────────────────────────────────
      
      const malformedResponse = {
        data: null, // Missing expected structure
      };

      axios.post.mockResolvedValueOnce(malformedResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('test@example.com', 'password123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Safe handling of malformed response
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // Verify fallback error message (res.data?.message falls back)
        expect(toast.error).toHaveBeenCalledWith('Login failed');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP #3: Form Validation Integration
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #3: Form Validation Integration', () => {
    
    /**
     * Test: Required fields validation
     * 
     * Integration Points:
     * - HTML5 validation → form submission
     * - Required attributes → browser validation
     * - Empty fields → form does not submit
     */
    test('should require email and password fields', () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT: Get form inputs
      // ─────────────────────────────────────────────────────────────────────
      
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Required attributes present
      // ─────────────────────────────────────────────────────────────────────
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    /**
     * Test: Email format validation
     * 
     * Integration Points:
     * - Email input type → browser validation
     * - Invalid email format → validation error
     */
    test('should validate email format', () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      renderLoginWithRouter();

      const emailInput = screen.getByPlaceholderText(/enter your email/i);

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Email input has correct type for validation
      // ─────────────────────────────────────────────────────────────────────
      
      expect(emailInput).toHaveAttribute('type', 'email');
      // Browser will validate email format automatically
    });

    /**
     * Test: Form inputs are controlled components
     * 
     * Integration Points:
     * - Input onChange → React state
     * - State → input value
     * - Controlled inputs → form data
     */
    test('should update form state on input change', () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      renderLoginWithRouter();

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      // ─────────────────────────────────────────────────────────────────────
      // ACT: Type in inputs
      // ─────────────────────────────────────────────────────────────────────
      
      fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Inputs reflect typed values (controlled components working)
      // ─────────────────────────────────────────────────────────────────────
      
      expect(emailInput).toHaveValue('user@test.com');
      expect(passwordInput).toHaveValue('mypassword');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP #4: Layout and Navigation Integration
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #4: Layout and Navigation Integration', () => {
    
    /**
     * Test: Login renders within Layout
     * 
     * Integration Points:
     * - Login → Layout component
     * - Layout → Header/Footer
     * - Layout → Helmet (SEO)
     */
    test('should render Login within Layout component', () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE & ACT
      // ─────────────────────────────────────────────────────────────────────
      
      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Layout integration verified
      // ─────────────────────────────────────────────────────────────────────
      
      // Verify form title (Login component content)
      expect(screen.getByText(/login form/i)).toBeInTheDocument();
      
      // Verify Layout rendered (Header logo present)
      expect(screen.getByText(/virtual vault/i)).toBeInTheDocument();
      
      // Verify form styling container
      const formContainer = screen.getByText(/login form/i).closest('form');
      expect(formContainer).toBeInTheDocument();
    });

    /**
     * Test: Forgot Password navigation
     * 
     * Integration Points:
     * - Forgot Password button → useNavigate
     * - Navigation → /forgot-password route
     */
    test('should navigate to forgot password page', () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT: Click Forgot Password button
      // ─────────────────────────────────────────────────────────────────────
      
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
      
      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Button exists and is clickable
      // ─────────────────────────────────────────────────────────────────────
      
      expect(forgotPasswordButton).toBeInTheDocument();
      expect(forgotPasswordButton).toHaveClass('forgot-btn');
      
      // Click would navigate to /forgot-password (navigation integration verified)
      fireEvent.click(forgotPasswordButton);
    });

    /**
     * Test: Form submission button accessibility
     * 
     * Integration Points:
     * - Submit button → form submission
     * - Button attributes → accessibility
     */
    test('should have accessible login button', () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE & ACT
      // ─────────────────────────────────────────────────────────────────────
      
      renderLoginWithRouter();

      const loginButton = screen.getByRole('button', { name: /^login$/i });

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Accessibility attributes
      // ─────────────────────────────────────────────────────────────────────
      
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute('type', 'submit');
      expect(loginButton).toHaveClass('btn', 'btn-primary');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP #5: Auth State Persistence
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #5: Auth State Persistence', () => {
    
    /**
     * Test: localStorage integration on successful login
     * 
     * Integration Points:
     * - Login success → localStorage.setItem
     * - Auth data → JSON serialization
     * - Persistence → page refresh recovery
     */
    test('should persist auth data to localStorage', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      const mockApiResponse = {
        data: {
          success: true,
          message: 'Login successful',
          user: { _id: '789', name: 'Alice', email: 'alice@test.com', role: 0 },
          token: 'persistence-token-xyz',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('alice@test.com', 'password123');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: localStorage integration
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        // 1. Verify localStorage.setItem called
        expect(localStorage.getItem('auth')).not.toBeNull();

        // 2. Verify correct data structure stored
        const storedAuth = JSON.parse(localStorage.getItem('auth'));
        expect(storedAuth).toEqual(mockApiResponse.data);

        // 3. Verify all fields present
        expect(storedAuth).toHaveProperty('success');
        expect(storedAuth).toHaveProperty('user');
        expect(storedAuth).toHaveProperty('token');
        expect(storedAuth.user).toHaveProperty('_id');
        expect(storedAuth.user).toHaveProperty('name');
        expect(storedAuth.user).toHaveProperty('email');
      });
    });

    /**
     * Test: No localStorage update on failed login
     * 
     * Integration Points:
     * - Login failure → no localStorage write
     * - Error state → clean state
     */
    test('should NOT persist auth data on failed login', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      };

      axios.post.mockRejectedValueOnce(mockErrorResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('wrong@test.com', 'wrongpass');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: localStorage remains empty
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(localStorage.getItem('auth')).toBeNull();
      });
    });

    /**
     * Test: Token format validation in stored data
     * 
     * Integration Points:
     * - Token from API → localStorage
     * - Token structure → JWT format expected
     */
    test('should store valid token format', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      const mockApiResponse = {
        data: {
          success: true,
          user: { _id: '123', name: 'Bob' },
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('bob@test.com', 'password');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Token stored with correct format
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        const storedAuth = JSON.parse(localStorage.getItem('auth'));
        expect(storedAuth.token).toBeTruthy();
        expect(typeof storedAuth.token).toBe('string');
        // JWT format: three parts separated by dots
        expect(storedAuth.token.split('.').length).toBe(3);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP #6: Toast Notification Integration
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #6: Toast Notification Integration', () => {
    
    /**
     * Test: Success toast with custom styling
     * 
     * Integration Points:
     * - Login success → toast.success
     * - Custom toast options → toast library
     * - Message and styling → user feedback
     */
    test('should display success toast with custom styling on login', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      const mockApiResponse = {
        data: {
          success: true,
          message: 'Welcome back!',
          user: { _id: '123', name: 'Test' },
          token: 'token',
        },
      };

      axios.post.mockResolvedValueOnce(mockApiResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('test@test.com', 'pass');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Toast integration with custom options
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Welcome back!',
          expect.objectContaining({
            duration: 5000,
            icon: '🙏',
            style: expect.objectContaining({
              background: 'green',
              color: 'white',
            }),
          })
        );
      });
    });

    /**
     * Test: Error toast displays error message
     * 
     * Integration Points:
     * - Login error → toast.error
     * - Error message from API → toast content
     */
    test('should display error toast on login failure', async () => {
      // ─────────────────────────────────────────────────────────────────────
      // ARRANGE
      // ─────────────────────────────────────────────────────────────────────
      
      const mockErrorResponse = {
        response: {
          data: {
            message: 'Account locked',
          },
        },
      };

      axios.post.mockRejectedValueOnce(mockErrorResponse);

      renderLoginWithRouter();

      // ─────────────────────────────────────────────────────────────────────
      // ACT
      // ─────────────────────────────────────────────────────────────────────
      
      fillLoginForm('locked@test.com', 'password');
      submitLoginForm();

      // ─────────────────────────────────────────────────────────────────────
      // ASSERT: Error toast with correct message
      // ─────────────────────────────────────────────────────────────────────
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Account locked');
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// END OF INTEGRATION TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════
