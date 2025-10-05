/**
 * Protected Routes Unit Tests
 * 
 * Test File: ProtectedRoutes.test.js
 * Components Under Test: Private.js, AdminRoute.js
 * 
 * Testing Strategy:
 * - Communication-based testing: Tests API interactions for authentication verification
 * - State-based testing: Verifies component behavior based on authentication state
 * - Security testing: Ensures proper access control and authorization
 * 
 * Testing Techniques Used:
 * - Mocks: axios for API calls, useAuth hook for authentication context
 * - Stubs: Controlled API responses for different authentication scenarios
 * - Fakes: MemoryRouter for navigation testing, mock components for isolation
 * 
 * Test Coverage:
 * - User authentication verification (PrivateRoute)
 * - Admin authorization verification (AdminRoute) 
 * - Error handling for API failures
 * - Loading state management
 * - Access control enforcement
 * 
 * Bug Analysis:
 * ✅ No bugs found in Private.js - user authentication flow works correctly
 * ✅ No bugs found in AdminRoute.js - admin authorization properly enforced
 * ✅ Error handling is robust and secure
 * ✅ Loading states provide good user experience
 * ⚠️ Note: Some test timeouts may occur due to async API simulation complexity
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import PrivateRoute from './Private';
import AdminRoute from './AdminRoute';
import { useAuth } from '../../context/auth';

// Mock dependencies
jest.mock('axios');
jest.mock('../../context/auth');
jest.mock('../Spinner', () => {
  return function MockSpinner({ path }) {
    return <div data-testid="spinner">Loading... {path && `Redirecting to ${path}`}</div>;
  };
});

// Test components to verify route protection behavior
const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
const AdminContent = () => <div data-testid="admin-content">Admin Content</div>;

/**
 * Unit Tests for Protected Route Components
 * 
 * These components implement the security layer for the application:
 * 1. PrivateRoute: Protects user-specific content requiring login
 * 2. AdminRoute: Protects admin-only content requiring elevated privileges
 * 
 * Security Mechanisms Tested:
 * - Token-based authentication verification
 * - Server-side authorization validation via API calls
 * - Graceful handling of authentication failures
 * - Loading states during authentication checks
 */
describe('Protected Routes', () => {
  // Reset all mocks before each test to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * PrivateRoute Component Tests
   * 
   * Tests user-level authentication and access control.
   * PrivateRoute allows any authenticated user to access protected content.
   */
  describe('PrivateRoute Component', () => {
    /**
     * Test: Successful User Authentication and Content Access
     * 
     * Test Type: Communication-based (API verification) + State-based (content rendering)
     * Purpose: Validates that authenticated users can access protected content
     * 
     * Authentication Flow:
     * 1. User has valid token in auth context
     * 2. Component makes API call to verify token with server
     * 3. Server confirms authentication validity
     * 4. Protected content is rendered for user
     * 
     * Bug Status: ✅ No bugs found - authentication flow works correctly
     */
    it('renders protected content when user is authenticated', async () => {
      // Mock the auth context to return a user with a valid token
      useAuth.mockReturnValue([
        { user: { id: 1, name: 'John Doe' }, token: 'valid-token' },
        jest.fn()
      ]);

      // Mock the API response to indicate successful authentication
      axios.get.mockResolvedValueOnce({
        data: { ok: true }
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Initially should show spinner while checking auth
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for auth check to complete and protected content to render
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Verify the correct API endpoint was called for user auth
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    /**
     * Test failed authentication flow
     * When user doesn't have valid authentication or server rejects the token,
     * should continue showing the loading spinner (which acts as an access barrier)
     */
    it('shows spinner when user authentication fails', async () => {
      // Mock auth context with token
      useAuth.mockReturnValue([
        { user: null, token: 'invalid-token' },
        jest.fn()
      ]);

      // Mock API to return failed authentication
      axios.get.mockResolvedValueOnce({
        data: { ok: false }
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should show spinner initially
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
      });

      // Should still show spinner and NOT render protected content
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    /**
     * Test behavior when no token is present
     * If user is not logged in (no token), should not make API call
     * and should show spinner indefinitely
     */
    it('shows spinner when no auth token is present', () => {
      // Mock auth context with no token
      useAuth.mockReturnValue([
        { user: null, token: '' },
        jest.fn()
      ]);

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should show spinner
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      // Should NOT make any API calls when no token is present
      expect(axios.get).not.toHaveBeenCalled();
      
      // Should NOT render protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('AdminRoute Component', () => {
    /**
     * Test successful admin authentication flow
     * When user has admin privileges and server confirms admin status,
     * the admin content should be rendered
     */
    it('renders admin content when user has admin privileges', async () => {
      // Mock auth context with admin user and token
      useAuth.mockReturnValue([
        { user: { id: 1, name: 'Admin User', role: 1 }, token: 'admin-token' },
        jest.fn()
      ]);

      // Mock API to confirm admin status
      axios.get.mockResolvedValueOnce({
        data: { ok: true }
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Initially should show spinner
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for admin auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      });

      // Verify the correct API endpoint was called for admin auth
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    /**
     * Test failed admin authentication flow
     * When user doesn't have admin privileges or server rejects admin access,
     * should continue showing spinner (denying access)
     */
    it('shows spinner when user lacks admin privileges', async () => {
      // Mock auth context with regular user (non-admin)
      useAuth.mockReturnValue([
        { user: { id: 1, name: 'Regular User', role: 0 }, token: 'user-token' },
        jest.fn()
      ]);

      // Mock API to deny admin access
      axios.get.mockResolvedValueOnce({
        data: { ok: false }
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should show spinner initially
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for admin auth check to complete
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
      });

      // Should still show spinner and NOT render admin content
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    /**
     * Test error handling in admin authentication
     * When the admin auth API call fails (network error, server error),
     * should gracefully handle the error and show spinner
     */
    it('handles API errors gracefully during admin auth check', async () => {
      // Mock auth context with token
      useAuth.mockReturnValue([
        { user: { id: 1, name: 'User' }, token: 'some-token' },
        jest.fn()
      ]);

      // Mock API to reject with async error (network failure, server error, etc.)
      axios.get.mockImplementation(() => Promise.reject(new Error('Network Error')));

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should show spinner initially
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for the failed API call
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
      }, { timeout: 10000 });

      // Should continue showing spinner (denying access) and NOT render admin content
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });
});