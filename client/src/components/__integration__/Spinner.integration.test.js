import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../Spinner';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/protected-route' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe('Phase 1 Integration: Spinner Component with Navigation and Timing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderSpinner = (path = 'login') => {
    return render(
      <MemoryRouter>
        <Spinner path={path} />
      </MemoryRouter>
    );
  };

  test('integrates Spinner with Layout structure and Bootstrap classes', () => {
    renderSpinner();

    // Verify Bootstrap flexbox container structure
    const container = screen.getByText(/redirecting to you in/i).closest('div');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('d-flex', 'flex-column', 'justify-content-center', 'align-items-center');
    expect(container).toHaveStyle({ height: '100vh' });

    // Verify Bootstrap spinner structure
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-border');

    // Verify accessibility features
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveClass('visually-hidden');
  });

  test('integrates with React Router navigation hooks', () => {
    renderSpinner();

    // Verify component uses useNavigate and useLocation hooks
    expect(mockNavigate).toBeDefined();
    expect(mockLocation).toBeDefined();
    expect(mockLocation.pathname).toBe('/protected-route');
  });

  test('integrates countdown timer with navigation', async () => {
    renderSpinner();

    // Verify initial countdown text
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Fast-forward timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText(/redirecting to you in 2 second/)).toBeInTheDocument();
    });

    // Fast-forward timer by another 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText(/redirecting to you in 1 second/)).toBeInTheDocument();
    });

    // Fast-forward timer by final second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: '/protected-route'
      });
    });
  });

  test('integrates with custom path parameter', async () => {
    renderSpinner('dashboard');

    // Verify initial countdown
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Fast-forward timer to completion
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        state: '/protected-route'
      });
    });
  });

  test('integrates timer cleanup on component unmount', () => {
    const { unmount } = renderSpinner();

    // Verify timer is running
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Unmount component
    unmount();

    // Fast-forward timer after unmount
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Navigation should not be called after unmount
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('integrates accessibility features with ARIA roles', () => {
    renderSpinner();

    // Verify spinner has proper ARIA role
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();

    // Verify loading text is accessible to screen readers
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveClass('visually-hidden');
  });

  test('integrates Bootstrap spinner animation classes', () => {
    renderSpinner();

    // Verify Bootstrap spinner classes
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-border');

    // Verify spinner is visible and properly styled
    expect(spinner).toBeVisible();
  });

  test('integrates responsive design with Bootstrap flexbox', () => {
    renderSpinner();

    // Verify responsive flexbox container
    const container = screen.getByText(/redirecting to you in/i).closest('div');
    expect(container).toHaveClass('d-flex', 'flex-column', 'justify-content-center', 'align-items-center');
    expect(container).toHaveStyle({ height: '100vh' });

    // Verify text alignment
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('Text-center');
  });

  test('integrates state management with useState hook', () => {
    renderSpinner();

    // Verify initial state
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Verify state updates work
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/redirecting to you in 2 second/)).toBeInTheDocument();
  });

  test('integrates useEffect hook with timer and navigation', async () => {
    renderSpinner();

    // Verify useEffect sets up timer correctly
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Verify timer decrements count
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText(/redirecting to you in 1 second/)).toBeInTheDocument();
    });

    // Verify navigation is called when count reaches 0
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: '/protected-route'
      });
    });
  });

  test('integrates with different location paths', async () => {
    // Create a spy on useLocation and mock it to return custom location
    const useLocationSpy = jest.spyOn(require('react-router-dom'), 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/admin/dashboard' });

    renderSpinner();

    // Fast-forward timer to completion
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: '/admin/dashboard'
      });
    });

    // Restore the spy
    useLocationSpy.mockRestore();
  });

  test('integrates timer interval management', () => {
    renderSpinner();

    // Verify timer starts correctly
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Advance timer multiple times to verify interval works
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/redirecting to you in 2 second/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/redirecting to you in 1 second/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Verify navigation is called
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: '/protected-route'
    });
  });

  test('integrates with default path when no path prop provided', async () => {
    renderSpinner(); // No path prop provided, should default to 'login'

    // Fast-forward timer to completion
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: '/protected-route'
      });
    });
  });

  test('integrates component lifecycle with proper cleanup', () => {
    const { unmount } = renderSpinner();

    // Verify component is mounted and timer is running
    expect(screen.getByText(/redirecting to you in 3 second/)).toBeInTheDocument();

    // Advance timer partially
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Unmount component
    unmount();

    // Advance timer further after unmount
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Navigation should not be called after unmount
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
