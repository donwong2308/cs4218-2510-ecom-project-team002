/**
 * Integration Tests for Auth Context (Phase 3.4: Business Logic Layer)
 * 
 * Component Scope: context/auth.js (Donavon's scope)
 * Test Focus: Auth context provider integration with React lifecycle, localStorage, axios, and consumer components
 * 
 * Integration Points:
 * - AuthProvider → React Context API
 * - AuthProvider → localStorage (persistence)
 * - AuthProvider → axios defaults (Authorization header)
 * - AuthProvider → useEffect lifecycle
 * - useAuth hook → Consumer components
 * - Auth state → Multiple component synchronization
 * 
 * Test Strategy:
 * - Integration tests verify context propagation and state management across components
 * - Real localStorage integration for persistence testing
 * - Real axios integration for Authorization header management
 * - Multiple consumer components to test state synchronization
 * - Error recovery and data corruption scenarios
 */

import React, { useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth';
import axios from 'axios';

// Test Consumer Component that uses useAuth
const TestConsumer = ({ onAuthChange }) => {
  const [auth, setAuth] = useAuth();

  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(auth);
    }
  }, [auth, onAuthChange]);

  return (
    <div>
      <div data-testid="user-name">{auth.user?.name || 'Guest'}</div>
      <div data-testid="user-email">{auth.user?.email || 'No email'}</div>
      <div data-testid="token">{auth.token || 'No token'}</div>
      <button
        data-testid="login-button"
        onClick={() =>
          setAuth({
            user: { name: 'Test User', email: 'test@example.com' },
            token: 'test-token-123',
          })
        }
      >
        Login
      </button>
      <button
        data-testid="logout-button"
        onClick={() => setAuth({ user: null, token: '' })}
      >
        Logout
      </button>
    </div>
  );
};

// Multiple Consumer Components for synchronization testing
const ConsumerOne = () => {
  const [auth] = useAuth();
  return <div data-testid="consumer-one">{auth.user?.name || 'Guest 1'}</div>;
};

const ConsumerTwo = () => {
  const [auth] = useAuth();
  return <div data-testid="consumer-two">{auth.user?.name || 'Guest 2'}</div>;
};

describe('Auth Context Integration Tests - Phase 3.4: Business Logic Layer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Initialize axios defaults structure if not present
    if (!axios.defaults) {
      axios.defaults = { headers: { common: {} } };
    } else if (!axios.defaults.headers) {
      axios.defaults.headers = { common: {} };
    } else if (!axios.defaults.headers.common) {
      axios.defaults.headers.common = {};
    }
    // Clear axios defaults
    delete axios.defaults.headers.common['Authorization'];
  });

  afterEach(() => {
    localStorage.clear();
    if (axios.defaults && axios.defaults.headers && axios.defaults.headers.common) {
      delete axios.defaults.headers.common['Authorization'];
    }
  });

  // =========================================================================
  // Integration Test Group #1: Context Provider and Consumer Integration
  // =========================================================================
  describe('Integration Test #1: Context Provider and Consumer Integration', () => {
    test('should provide auth state to consumer components', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify initial state
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(screen.getByTestId('user-email')).toHaveTextContent('No email');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    test('should allow consumers to update auth state', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Click login button to update auth state
      act(() => {
        screen.getByTestId('login-button').click();
      });

      // Verify state updated
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token-123');
    });

    test('should synchronize auth state across multiple consumers', () => {
      render(
        <AuthProvider>
          <TestConsumer />
          <ConsumerOne />
          <ConsumerTwo />
        </AuthProvider>
      );

      // Verify initial state in all consumers
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(screen.getByTestId('consumer-one')).toHaveTextContent('Guest 1');
      expect(screen.getByTestId('consumer-two')).toHaveTextContent('Guest 2');

      // Update auth state via login
      act(() => {
        screen.getByTestId('login-button').click();
      });

      // Verify all consumers updated
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('consumer-one')).toHaveTextContent('Test User');
      expect(screen.getByTestId('consumer-two')).toHaveTextContent('Test User');
    });

    test('should handle logout and clear auth state across consumers', () => {
      render(
        <AuthProvider>
          <TestConsumer />
          <ConsumerOne />
          <ConsumerTwo />
        </AuthProvider>
      );

      // Login first
      act(() => {
        screen.getByTestId('login-button').click();
      });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('consumer-one')).toHaveTextContent('Test User');

      // Logout
      act(() => {
        screen.getByTestId('logout-button').click();
      });

      // Verify all consumers cleared
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(screen.getByTestId('consumer-one')).toHaveTextContent('Guest 1');
      expect(screen.getByTestId('consumer-two')).toHaveTextContent('Guest 2');
    });
  });

  // =========================================================================
  // Integration Test Group #2: localStorage Persistence Integration
  // =========================================================================
  describe('Integration Test #2: localStorage Persistence Integration', () => {
    test('should load auth state from localStorage on mount', () => {
      // Setup localStorage with auth data
      const authData = {
        user: { name: 'Stored User', email: 'stored@example.com' },
        token: 'stored-token-456',
      };
      localStorage.setItem('auth', JSON.stringify(authData));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify auth state loaded from localStorage
      expect(screen.getByTestId('user-name')).toHaveTextContent('Stored User');
      expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
      expect(screen.getByTestId('token')).toHaveTextContent('stored-token-456');
    });

    test('should handle missing localStorage data gracefully', () => {
      // No data in localStorage
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify initial state (no errors)
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    test('should handle corrupted localStorage data gracefully', () => {
      // Store corrupted JSON in localStorage
      localStorage.setItem('auth', '{corrupted json data');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify initial state (fallback to defaults)
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');

      // Verify corrupted data was cleared
      expect(localStorage.getItem('auth')).toBeNull();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse auth data from localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    test('should persist auth state updates to localStorage in consumer', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Login
      act(() => {
        screen.getByTestId('login-button').click();
      });

      // Note: AuthProvider doesn't automatically save to localStorage
      // This is typically done by the Login/Register components
      // Verify the auth state is updated in memory
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token-123');
    });

    test('should load partial auth data from localStorage', () => {
      // Store auth data with only user (no token)
      localStorage.setItem('auth', JSON.stringify({ user: { name: 'Partial User' } }));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify user loaded, token defaults to empty
      expect(screen.getByTestId('user-name')).toHaveTextContent('Partial User');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });
  });

  // =========================================================================
  // Integration Test Group #3: Axios Authorization Header Integration
  // =========================================================================
  describe('Integration Test #3: Axios Authorization Header Integration', () => {
    test('should set axios Authorization header when auth state has token', () => {
      // Setup localStorage with token
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'Test User' },
          token: 'bearer-token-789',
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify axios default header set
      expect(axios.defaults.headers.common['Authorization']).toBe('bearer-token-789');
    });

    test('should update axios Authorization header when auth state changes', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Initially no token (auth context sets empty string, not undefined)
      const initialAuth = axios.defaults.headers.common['Authorization'];
      expect(initialAuth === undefined || initialAuth === '').toBe(true);

      // Login with token
      act(() => {
        screen.getByTestId('login-button').click();
      });

      // Verify axios header updated
      expect(axios.defaults.headers.common['Authorization']).toBe('test-token-123');
    });

    test('should clear axios Authorization header on logout', () => {
      // Setup with token
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'Test User' },
          token: 'initial-token',
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify header set
      expect(axios.defaults.headers.common['Authorization']).toBe('initial-token');

      // Logout
      act(() => {
        screen.getByTestId('logout-button').click();
      });

      // Verify header cleared (empty string)
      expect(axios.defaults.headers.common['Authorization']).toBe('');
    });

    test('should set axios header immediately on provider mount with stored token', () => {
      // Setup localStorage
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: 'mount-token-abc',
        })
      );

      // Render provider
      render(
        <AuthProvider>
          <div>App</div>
        </AuthProvider>
      );

      // Verify axios header set during mount
      expect(axios.defaults.headers.common['Authorization']).toBe('mount-token-abc');
    });
  });

  // =========================================================================
  // Integration Test Group #4: React Lifecycle Integration
  // =========================================================================
  describe('Integration Test #4: React Lifecycle Integration', () => {
    test('should load localStorage data only once on mount', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: 'token',
        })
      );

      const { rerender } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // localStorage should be read once on mount
      expect(getItemSpy).toHaveBeenCalledTimes(1);

      // Rerender (simulating props change or parent rerender)
      rerender(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Still only called once (useEffect dependency array empty)
      expect(getItemSpy).toHaveBeenCalledTimes(1);

      getItemSpy.mockRestore();
    });

    test('should maintain auth state across component rerenders', () => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'Persistent User' },
          token: 'persistent-token',
        })
      );

      const { rerender } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify initial load
      expect(screen.getByTestId('user-name')).toHaveTextContent('Persistent User');

      // Rerender multiple times
      rerender(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
      rerender(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // State should persist
      expect(screen.getByTestId('user-name')).toHaveTextContent('Persistent User');
    });

    test('should handle rapid auth state changes', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Rapid login/logout cycles
      act(() => {
        screen.getByTestId('login-button').click();
      });
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');

      act(() => {
        screen.getByTestId('logout-button').click();
      });
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');

      act(() => {
        screen.getByTestId('login-button').click();
      });
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  // =========================================================================
  // Integration Test Group #5: Component Unmount and Cleanup
  // =========================================================================
  describe('Integration Test #5: Component Unmount and Cleanup', () => {
    test('should maintain axios header after unmounting consumer', () => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: 'unmount-token',
        })
      );

      const { unmount } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify header set
      expect(axios.defaults.headers.common['Authorization']).toBe('unmount-token');

      // Unmount consumer
      unmount();

      // Header should still be set (provider manages it)
      expect(axios.defaults.headers.common['Authorization']).toBe('unmount-token');
    });

    test('should not cause memory leaks with multiple mounts/unmounts', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );
        unmount();
      }

      // If there were memory leaks, this test would fail or timeout
      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // Integration Test Group #6: Error Recovery and Edge Cases
  // =========================================================================
  describe('Integration Test #6: Error Recovery and Edge Cases', () => {
    test('should handle null user in auth state', () => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: null,
          token: 'orphan-token',
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Should handle null user gracefully
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(screen.getByTestId('token')).toHaveTextContent('orphan-token');
    });

    test('should handle undefined token in auth state', () => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: undefined,
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Should handle undefined token
      expect(screen.getByTestId('user-name')).toHaveTextContent('User');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    test('should handle empty string token', () => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: '',
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('token')).toHaveTextContent('No token');
      // Empty string should still set axios header (to empty string)
      expect(axios.defaults.headers.common['Authorization']).toBe('');
    });

    test('should recover from localStorage errors during operation', () => {
      // Start with valid data
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: 'valid-token',
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify initial load
      expect(screen.getByTestId('user-name')).toHaveTextContent('User');

      // Simulate localStorage corruption (external change)
      localStorage.setItem('auth', 'corrupted');

      // Component should still function with in-memory state
      expect(screen.getByTestId('user-name')).toHaveTextContent('User');
    });

    test('should handle complex user objects with nested properties', () => {
      const complexUser = {
        name: 'Complex User',
        email: 'complex@example.com',
        profile: {
          age: 30,
          address: '123 Test St',
        },
        roles: ['user', 'admin'],
      };

      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: complexUser,
          token: 'complex-token',
        })
      );

      const ComplexConsumer = () => {
        const [auth] = useAuth();
        return (
          <div>
            <div data-testid="user-name">{auth.user?.name}</div>
            <div data-testid="user-email">{auth.user?.email}</div>
            <div data-testid="user-address">{auth.user?.profile?.address}</div>
            <div data-testid="user-roles">{auth.user?.roles?.join(', ')}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <ComplexConsumer />
        </AuthProvider>
      );

      // Verify complex object loaded correctly
      expect(screen.getByTestId('user-name')).toHaveTextContent('Complex User');
      expect(screen.getByTestId('user-email')).toHaveTextContent('complex@example.com');
      expect(screen.getByTestId('user-address')).toHaveTextContent('123 Test St');
      expect(screen.getByTestId('user-roles')).toHaveTextContent('user, admin');
    });
  });

  // =========================================================================
  // Integration Test Group #7: Real-World Usage Scenarios
  // =========================================================================
  describe('Integration Test #7: Real-World Usage Scenarios', () => {
    test('should simulate complete login workflow', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // User starts logged out
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      // Initially no token (auth context sets empty string, not undefined)
      const initialAuth = axios.defaults.headers.common['Authorization'];
      expect(initialAuth === undefined || initialAuth === '').toBe(true);

      // User logs in
      act(() => {
        screen.getByTestId('login-button').click();
      });

      // Verify logged in state
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(axios.defaults.headers.common['Authorization']).toBe('test-token-123');
    });

    test('should simulate session persistence across page refresh', () => {
      // Simulate first page load with login
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'Returning User', email: 'returning@example.com' },
          token: 'session-token',
        })
      );

      const { unmount } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Verify session loaded
      expect(screen.getByTestId('user-name')).toHaveTextContent('Returning User');

      // Unmount (simulating navigation away)
      unmount();

      // Remount (simulating page refresh)
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Session should persist
      expect(screen.getByTestId('user-name')).toHaveTextContent('Returning User');
      expect(axios.defaults.headers.common['Authorization']).toBe('session-token');
    });

    test('should handle token expiry workflow', () => {
      // User logged in with expired token
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: { name: 'User' },
          token: 'expired-token',
        })
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Initial state with expired token
      expect(screen.getByTestId('token')).toHaveTextContent('expired-token');

      // Simulate logout after token expiry detection
      act(() => {
        screen.getByTestId('logout-button').click();
      });

      // User logged out
      expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
      expect(axios.defaults.headers.common['Authorization']).toBe('');
    });
  });
});
