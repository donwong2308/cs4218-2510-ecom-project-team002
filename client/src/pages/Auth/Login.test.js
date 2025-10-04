import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };  

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock login API
        axios.post.mockResolvedValueOnce({
          data: {
            success: true,
            user: { id: 1, name: "John Doe", email: "test@example.com" },
            token: "mockToken",
          },
        });

        // Mock categories API
        axios.get.mockResolvedValueOnce({
          data: {
            categories: [
              { id: 1, name: "Category 1" },
              { id: 2, name: "Category 2" },
            ],
          },
        });
    });

    it('renders login form', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      });
      it('inputs should be initially empty', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email').value).toBe('');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('');
      });
    
      it('should allow typing email and password', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
      });
      
    it('should login the user successfully', async () => {
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

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith("Login successful", {
            duration: 5000,
            icon: '🙏',
            style: {
                background: 'green',
                color: 'white'
            }
        });
    });

    it('should display error message on failed login', async () => {
        // Mock a rejected axios call that simulates server error
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

        // Fill and submit the form
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        // Wait for axios call and error toast
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        
        // Check if toast.error was called at all
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        }, { timeout: 5000 });
        
        // If toast.error was called, let's see with what arguments
        const calls = toast.error.mock.calls;
        console.log('toast.error calls:', calls);
    });

    it('should navigate to the Forgot Password page when the button is clicked', () => {
    const { getByText } = render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
            </Routes>
        </MemoryRouter>
    );

    // Click the "Forgot Password" button
    fireEvent.click(getByText('Forgot Password'));

    // Verify navigation to the Forgot Password page
    expect(getByText('Forgot Password Page')).toBeInTheDocument();
});
});
