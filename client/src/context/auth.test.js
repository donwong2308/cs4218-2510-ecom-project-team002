import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';

// Mock axios to control its behavior in tests
jest.mock('axios');

// Mock localStorage since it's not available in the Jest test environment
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

/**
 * Test component that uses the useAuth hook
 * This allows us to test the hook's behavior by observing the rendered output
 */
const TestComponent = () => {
  const [auth, setAuth] = useAuth();
  
  return (
    <div>
      <div data-testid="user-name">{auth.user?.name || 'No user'}</div>
      <div data-testid="token">{auth.token || 'No token'}</div>
      <button 
        data-testid="set-auth" 
        onClick={() => setAuth({ user: { name: 'Test User' }, token: 'test-token' })}
      >
        Set Auth
      </button>
      <button 
        data-testid="clear-auth" 
        onClick={() => setAuth({ user: null, token: '' })}
      >
        Clear Auth
      </button>
    </div>
  );
};

/**
 * Unit tests for the authentication context system
 * 
 * The AuthProvider component is responsible for:
 * 1. Managing global authentication state (user and token)
 * 2. Setting axios default headers for authenticated requests
 * 3. Persisting auth state to localStorage and restoring it on app initialization
 * 4. Providing the useAuth hook for components to access and update auth state
 */
describe('Authentication Context', () => {
  // Clean up mocks and reset state before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    delete axios.defaults.headers.common['Authorization'];
  });

  describe('AuthProvider Component', () => {
    /**
     * Test initial state when no stored authentication data exists
     * Should initialize with empty user and token
     */
    it('initializes with empty auth state when localStorage is empty', () => {
      // Mock localStorage to return null (no stored auth data)
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth');
    });

    /**
     * Test state restoration from localStorage on component mount
     * When valid auth data exists in localStorage, should restore it to state
     */
    it('restores auth state from localStorage on initialization', () => {
      // Mock localStorage to return valid stored auth data
      const storedAuth = JSON.stringify({
        user: { id: 1, name: 'Stored User', email: 'stored@example.com' },
        token: 'stored-token-123'
      });
      mockLocalStorage.getItem.mockReturnValue(storedAuth);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should display the restored user information
      expect(screen.getByTestId('user-name')).toHaveTextContent('Stored User');
      expect(screen.getByTestId('token')).toHaveTextContent('stored-token-123');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth');
    });

    /**
     * Test handling of corrupted localStorage data
     * If localStorage contains invalid JSON, should handle gracefully and not crash
     */
    it('handles corrupted localStorage data gracefully', () => {
      // Mock localStorage to return invalid JSON
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data');
      
      // Mock console.error to prevent error spam in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should fall back to empty state when localStorage data is corrupted
      expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
      
      consoleSpy.mockRestore();
    });

    /**
     * Test axios header configuration
     * When auth state contains a token, should set it as the default Authorization header
     */
    it('sets axios authorization header when auth state changes', () => {
      const storedAuth = JSON.stringify({
        user: { id: 1, name: 'User' },
        token: 'test-token-123'
      });
      mockLocalStorage.getItem.mockReturnValue(storedAuth);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify that axios default Authorization header is set with the token
      expect(axios.defaults.headers.common['Authorization']).toBe('test-token-123');
    });
  });

  describe('useAuth Hook', () => {
    /**
     * Test that useAuth provides access to auth state and setter function
     * Components should be able to read current auth state and update it
     */
    it('provides auth state and setter function to components', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should show empty state
      expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');

      // Should provide buttons that can interact with the auth state
      expect(screen.getByTestId('set-auth')).toBeInTheDocument();
      expect(screen.getByTestId('clear-auth')).toBeInTheDocument();
    });

    /**
     * Test updating auth state through the hook
     * When setAuth is called, should update the state and reflect in UI
     */
    it('allows updating auth state through setAuth function', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Click button to set auth state
      act(() => {
        screen.getByTestId('set-auth').click();
      });

      // State should be updated and reflected in the UI
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
    });

    /**
     * Test clearing auth state
     * When auth is cleared, should reset to empty state
     */
    it('allows clearing auth state', () => {
      // Start with some auth data
      const storedAuth = JSON.stringify({
        user: { id: 1, name: 'Initial User' },
        token: 'initial-token'
      });
      mockLocalStorage.getItem.mockReturnValue(storedAuth);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify initial state is loaded
      expect(screen.getByTestId('user-name')).toHaveTextContent('Initial User');
      expect(screen.getByTestId('token')).toHaveTextContent('initial-token');

      // Clear the auth state
      act(() => {
        screen.getByTestId('clear-auth').click();
      });

      // Should be cleared
      expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    /**
     * Test error handling when useAuth is used outside AuthProvider
     * Should throw meaningful error to help developers debug context usage
     */
    it('throws error when used outside AuthProvider', () => {
      // Mock console.error to prevent error spam in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // This should throw an error because TestComponent is not wrapped in AuthProvider
      expect(() => {
        render(<TestComponent />);
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration Behavior', () => {
    /**
     * Test the complete flow of authentication state management
     * From initialization, through updates, to persistence
     */
    it('maintains axios headers consistency with auth state changes', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially no authorization header should be set (empty token)
      expect(axios.defaults.headers.common['Authorization']).toBe('');

      // Set auth state with token
      act(() => {
        screen.getByTestId('set-auth').click();
      });

      // Axios header should be updated to match the new token
      expect(axios.defaults.headers.common['Authorization']).toBe('test-token');

      // Clear auth state
      act(() => {
        screen.getByTestId('clear-auth').click();
      });

      // Axios header should be cleared
      expect(axios.defaults.headers.common['Authorization']).toBe('');
    });
  });
});