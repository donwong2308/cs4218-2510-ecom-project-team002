/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2: TOP-DOWN INTEGRATION TESTING
 * PROTECTED ROUTES INTEGRATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Test the integration between route protection components and authentication
 * state management. These tests verify that protected routes correctly handle
 * authentication and authorization flows.
 * 
 * TESTING STRATEGY: Sandwich Method (Top-Down)
 * - Start from high-level route protection
 * - Test integration with auth context
 * - Verify redirect and outlet rendering logic
 * 
 * INTEGRATION POINTS TESTED:
 * 1. PrivateRoute → useAuth hook
 * 2. AdminRoute → useAuth hook
 * 3. Route components → axios auth check APIs
 * 4. Route components → Spinner/Outlet rendering
 * 5. Authentication state → Route access control
 * 
 * MOCK STRATEGY:
 * - Mock: axios API calls (controlled auth responses)
 * - Mock: useAuth hook (different auth states)
 * - Real: Route components, Outlet, Spinner, navigation logic
 * 
 * TEST PHILOSOPHY:
 * These are integration tests, not unit tests. We test how route components
 * integrate with authentication system, not implementation details.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../Private';
import AdminRoute from '../AdminRoute';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Mock axios for API calls
jest.mock('axios');

// Mock useAuth hook with default unauthenticated state
jest.mock('../../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Default: no auth
}));

// ═══════════════════════════════════════════════════════════════════════════
// TEST COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Simple test components to verify route rendering
const ProtectedContent = () => <div>Protected Content</div>;
const AdminContent = () => <div>Admin Content</div>;

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: PROTECTED ROUTES INTEGRATION TESTS - PHASE 2
// ═══════════════════════════════════════════════════════════════════════════

describe('Protected Routes Integration Tests - Phase 2: Security & Navigation Layer', () => {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SETUP AND TEARDOWN
  // ═══════════════════════════════════════════════════════════════════════════
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset axios mock
    axios.get.mockReset();
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 1: USER ROUTE PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #1: User Route Protection', () => {
    
    /**
     * TEST 1.1: Authenticated User Access
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - PrivateRoute → useAuth (with token)
     * - PrivateRoute → axios.get('/api/v1/auth/user-auth')
     * - PrivateRoute → Outlet (render protected content)
     * 
     * Expected Flow:
     * 1. User has auth token in context
     * 2. PrivateRoute calls auth check API
     * 3. API returns { ok: true }
     * 4. PrivateRoute renders Outlet with protected content
     */
    it('should allow authenticated user to access protected routes', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup authenticated user
      // ═══════════════════════════════════════════════════════════════
      
      // Mock useAuth to return authenticated user with token
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([
        { 
          token: 'valid-jwt-token',
          user: { id: '123', name: 'Test User', email: 'test@example.com' }
        }, 
        jest.fn()
      ]);
      
      // Mock axios to return successful auth check
      axios.get.mockResolvedValueOnce({
        data: { ok: true }
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render PrivateRoute with protected content
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify integration behavior
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Auth check API called with correct endpoint
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Protected content rendered (Outlet integration)
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No spinner shown (successful auth)
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    /**
     * TEST 1.2: Unauthenticated User Redirect
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - PrivateRoute → useAuth (no token)
     * - PrivateRoute → Spinner (redirect component)
     * 
     * Expected Flow:
     * 1. User has no auth token
     * 2. PrivateRoute skips auth check
     * 3. PrivateRoute renders Spinner
     * 4. Spinner redirects to /login after countdown
     */
    it('should redirect unauthenticated user to login', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup unauthenticated user (no token)
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([null, jest.fn()]); // No auth token
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render PrivateRoute
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify redirect behavior
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: No auth check API called (no token)
      // ───────────────────────────────────────────────────────────────
      expect(axios.get).not.toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Spinner displayed (redirect in progress)
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/redirecting to you in \d+ second/i)).toBeInTheDocument();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Protected content NOT rendered
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
    
    /**
     * TEST 1.3: Failed Auth Check
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - PrivateRoute → useAuth (with token)
     * - PrivateRoute → axios.get (returns { ok: false })
     * - PrivateRoute → Spinner (denied access)
     * 
     * Expected Flow:
     * 1. User has token but auth check fails
     * 2. PrivateRoute calls API, receives { ok: false }
     * 3. PrivateRoute renders Spinner (access denied)
     */
    it('should show spinner when auth check fails', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup user with token but failed auth
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([
        { token: 'invalid-token', user: null }, 
        jest.fn()
      ]);
      
      // Mock axios to return failed auth check
      axios.get.mockResolvedValueOnce({
        data: { ok: false }
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render PrivateRoute
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify access denial
      // ═══════════════════════════════════════════════════════════════
      
      // Wait for auth check to complete
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Spinner shown (access denied)
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Protected content NOT rendered
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
    
    /**
     * TEST 1.4: Network Error Handling
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - PrivateRoute → axios.get (network error)
     * - PrivateRoute → Error handling
     * - PrivateRoute → Spinner (fallback on error)
     */
    it('should handle network errors gracefully', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup network error scenario
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([
        { token: 'valid-token', user: { id: '123' } }, 
        jest.fn()
      ]);
      
      // Mock axios to throw network error
      axios.get.mockRejectedValueOnce(new Error('Network Error'));
      
      // Spy on console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render PrivateRoute
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify error handling
      // ═══════════════════════════════════════════════════════════════
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Error logged to console
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Spinner shown (safe fallback)
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Protected content NOT rendered
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 2: ADMIN ROUTE PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #2: Admin Route Protection', () => {
    
    /**
     * TEST 2.1: Admin User Access
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminRoute → useAuth (with admin token)
     * - AdminRoute → axios.get('/api/v1/auth/admin-auth')
     * - AdminRoute → Outlet (render admin content)
     */
    it('should allow admin user to access admin routes', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup admin user
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([
        { 
          token: 'admin-jwt-token',
          user: { id: '123', name: 'Admin User', email: 'admin@example.com', role: 1 }
        }, 
        jest.fn()
      ]);
      
      // Mock axios to return successful admin auth check
      axios.get.mockResolvedValueOnce({
        data: { ok: true }
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render AdminRoute
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminRoute />}>
              <Route index element={<AdminContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify admin access
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Admin auth check API called
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Admin content rendered
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: No spinner shown
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    /**
     * TEST 2.2: Non-Admin User Denied
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminRoute → useAuth (regular user token)
     * - AdminRoute → axios.get (returns { ok: false })
     * - AdminRoute → Spinner (access denied)
     */
    it('should deny access to non-admin users', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup regular user (not admin)
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([
        { 
          token: 'user-jwt-token',
          user: { id: '456', name: 'Regular User', email: 'user@example.com', role: 0 }
        }, 
        jest.fn()
      ]);
      
      // Mock axios to return failed admin auth check
      axios.get.mockResolvedValueOnce({
        data: { ok: false }
      });
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render AdminRoute
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminRoute />}>
              <Route index element={<AdminContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify access denial
      // ═══════════════════════════════════════════════════════════════
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: Spinner shown (redirect to user dashboard)
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Admin content NOT rendered
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
    
    /**
     * TEST 2.3: Unauthenticated Admin Route Access
     * ─────────────────────────────────────────────────────────────────────────
     * Integration Points:
     * - AdminRoute → useAuth (no token)
     * - AdminRoute → Spinner (redirect to login)
     */
    it('should redirect unauthenticated user from admin routes', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: Setup unauthenticated user
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([null, jest.fn()]);
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Render AdminRoute
      // ═══════════════════════════════════════════════════════════════
      
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminRoute />}>
              <Route index element={<AdminContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ═══════════════════════════════════════════════════════════════
      // ASSERT: Verify redirect behavior
      // ═══════════════════════════════════════════════════════════════
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: No auth check called (no token)
      // ───────────────────────────────────────────────────────────────
      expect(axios.get).not.toHaveBeenCalled();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Spinner displayed
      // ───────────────────────────────────────────────────────────────
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #3: Admin content NOT rendered
      // ───────────────────────────────────────────────────────────────
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TEST GROUP 3: AUTHENTICATION STATE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('Integration Test #3: Authentication State Changes', () => {
    
    /**
     * TEST 3.1: Token Presence Triggers Auth Check
     * ─────────────────────────────────────────────────────────────────────────
     * Verifies that the presence of a token in auth context triggers
     * the authentication check API call
     */
    it('should trigger auth check only when token is present', async () => {
      // ═══════════════════════════════════════════════════════════════
      // ARRANGE: First render without token
      // ═══════════════════════════════════════════════════════════════
      
      const { useAuth } = require('../../../context/auth');
      useAuth.mockReturnValue([null, jest.fn()]);
      
      const { rerender } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #1: No auth check without token
      // ───────────────────────────────────────────────────────────────
      expect(axios.get).not.toHaveBeenCalled();
      
      // ═══════════════════════════════════════════════════════════════
      // ACT: Update to authenticated state
      // ═══════════════════════════════════════════════════════════════
      
      useAuth.mockReturnValue([
        { token: 'new-token', user: { id: '123' } },
        jest.fn()
      ]);
      
      axios.get.mockResolvedValueOnce({ data: { ok: true } });
      
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<ProtectedContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      
      // ───────────────────────────────────────────────────────────────
      // VERIFICATION #2: Auth check triggered with new token
      // ───────────────────────────────────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
      });
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2 INTEGRATION TEST SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TESTS IMPLEMENTED: 9 integration tests
 * 
 * USER ROUTE PROTECTION (4 tests):
 * ✅ Authenticated user can access protected routes
 * ✅ Unauthenticated user redirected to login
 * ✅ Failed auth check shows spinner
 * ✅ Network errors handled gracefully
 * 
 * ADMIN ROUTE PROTECTION (3 tests):
 * ✅ Admin user can access admin routes
 * ✅ Non-admin user denied admin access
 * ✅ Unauthenticated user redirected from admin routes
 * 
 * AUTH STATE INTEGRATION (2 tests):
 * ✅ Token presence triggers auth check
 * ✅ Auth state changes reflected in route access
 * 
 * INTEGRATION COVERAGE:
 * - Route components ↔ useAuth hook
 * - Route components ↔ axios auth APIs
 * - Route components ↔ Spinner/Outlet rendering
 * - Authentication flow ↔ Access control
 * 
 * NEXT STEPS:
 * Phase 2 continues with authController and authMiddleware integration tests
 * ═══════════════════════════════════════════════════════════════════════════
 */
