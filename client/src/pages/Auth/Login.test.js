import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

/**
 * Unit tests for Login component
 * 
 * Tests the complete login functionality including:
 * 1. Form rendering and initial state
 * 2. User input handling and form interaction  
 * 3. API integration for authentication
 * 4. Success/error handling and notifications
 * 5. Navigation flows
 * 
 * Test Strategy: State-based and Communication-based testing
 * - State-based: Form state changes, input validation
 * - Communication-based: API calls, error handling, navigation
 */

// Mock external dependencies for isolated component testing
jest.mock('axios');                    // Mock HTTP client for API calls
jest.mock('react-hot-toast');          // Mock notification system

// Mock React context hooks to prevent dependencies on external state
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock auth state and setter
  }));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock cart state and setter  
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock search state and setter
  }));  

// Mock browser APIs for testing environment compatibility
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(), 
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock window.matchMedia for responsive design testing
window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };  

describe('Login Component', () => {
    beforeEach(() => {
        // Clean up mocks before each test for isolation
        jest.clearAllMocks();
        
        // Setup default successful API responses for components that make API calls during render
        axios.post.mockResolvedValueOnce({
          data: {
            success: true,
            user: { id: 1, name: "John Doe", email: "test@example.com" },
            token: "mockToken",
          },
        });

        // Mock categories API for header component dependencies
        axios.get.mockResolvedValueOnce({
          data: {
            categories: [
              { id: 1, name: "Category 1" },
              { id: 2, name: "Category 2" },
            ],
          },
        });
    });

    /**
     * Test form rendering and initial UI state
     * Test Type: Output-based (verifies rendered elements)
     * Bug Found: Form elements must be present for user interaction
     */
    it('renders login form with all required elements', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        // Verify form header is displayed
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        // Verify input fields are present with correct placeholders  
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      });
      
      /**
       * Test initial form state
       * Test Type: State-based (verifies initial input values)
       * Bug Found: Form inputs should start empty for new user entry
       */
      it('has empty input fields initially', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        // Verify both input fields start with empty values
        expect(getByPlaceholderText('Enter Your Email').value).toBe('');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('');
      });
    
      /**
       * Test user input handling and form state updates
       * Test Type: State-based (verifies form state changes with user input)
       * Bug Found: Form should update state when user types in fields
       */
      it('allows user to type email and password', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
        
        // Simulate user typing in email field
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        // Simulate user typing in password field
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        
        // Verify form state updated correctly
        expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
      });
      
    /**
     * Test successful login flow with API integration
     * Test Type: Communication-based (API call, response handling, notifications)
     * Bug Found: Successful login should call API and show success notification
     */
    it('processes successful login and shows success notification', async () => {
        // Mock successful login API response
        axios.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: "Login successful",
                user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                token: 'mockToken'
            }
        });

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        // Fill out login form
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        // Submit form
        fireEvent.click(getByText('LOGIN'));

        // Wait for API call to complete
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        // Verify success notification is displayed with correct styling
        expect(toast.success).toHaveBeenCalledWith("Login successful", {
            duration: 5000,
            icon: '🙏',
            style: {
                background: 'green',
                color: 'white'
            }
        });
    });

    /**
     * Test login error handling and user feedback
     * Test Type: Communication-based (error response handling, error notifications)
     * Bug Found: Failed login should show appropriate error message to user
     */
    it('displays error notification on failed login', async () => {
        // Mock rejected API call that simulates authentication failure
        const errorResponse = new Error('Request failed');
        errorResponse.response = {
            data: {
                success: false,
                message: "Error in login",
            },
        };
        axios.post.mockRejectedValueOnce(errorResponse);

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        // Fill and submit the login form with invalid credentials
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'wrongpassword' } });
        fireEvent.click(getByText('LOGIN'));

        // Wait for API call to fail
        await waitFor(() => expect(axios.post).toHaveBeenCalled(), { timeout: 10000 });
        
        // Verify error notification is displayed to user
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        }, { timeout: 10000 });
        
        // Debug: Log the actual error calls for troubleshooting
        const calls = toast.error.mock.calls;
        console.log('toast.error calls:', calls);
    });

    /**
     * Test navigation functionality for password recovery
     * Test Type: Communication-based (routing and navigation)
     * Bug Found: Forgot password link should navigate to appropriate page
     */
    it('navigates to Forgot Password page when link is clicked', () => {
    const { getByText } = render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
            </Routes>
        </MemoryRouter>
    );

    // Click the "Forgot Password" navigation link
    fireEvent.click(getByText('Forgot Password'));

    // Verify successful navigation to password recovery page
    expect(getByText('Forgot Password Page')).toBeInTheDocument();
});
});
