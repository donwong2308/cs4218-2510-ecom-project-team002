import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Spinner from './Spinner';

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/protected-route' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Spinner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should render spinner with default countdown', () => {
    renderWithRouter(<Spinner />);
    
    expect(screen.getByText('redirecting to you in 3 second')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should render spinner with custom path', () => {
    renderWithRouter(<Spinner path="dashboard" />);
    
    expect(screen.getByText('redirecting to you in 3 second')).toBeInTheDocument();
  });

  test('should countdown from 3 to 0', () => {
    renderWithRouter(<Spinner />);
    
    // Initial state
    expect(screen.getByText('redirecting to you in 3 second')).toBeInTheDocument();
    
    // After 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('redirecting to you in 2 second')).toBeInTheDocument();
    
    // After 2 seconds
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('redirecting to you in 1 second')).toBeInTheDocument();
    
    // After 3 seconds
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('redirecting to you in 0 second')).toBeInTheDocument();
  });

  test('should navigate to default path after countdown', () => {
    renderWithRouter(<Spinner />);
    
    // Advance timers to complete countdown
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: mockLocation.pathname,
    });
  });

  test('should navigate to custom path after countdown', () => {
    renderWithRouter(<Spinner path="dashboard" />);
    
    // Advance timers to complete countdown
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
      state: mockLocation.pathname,
    });
  });

  test('should render with correct CSS classes', () => {
    renderWithRouter(<Spinner />);
    
    const container = screen.getByText('redirecting to you in 3 second').closest('div');
    expect(container).toHaveClass('d-flex', 'flex-column', 'justify-content-center', 'align-items-center');
    expect(container).toHaveStyle({ height: '100vh' });
  });

  test('should render spinner with correct Bootstrap classes', () => {
    renderWithRouter(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-border');
    
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toHaveClass('visually-hidden');
  });

  test('should render heading with correct text', () => {
    renderWithRouter(<Spinner />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('Text-center');
    expect(heading).toHaveTextContent('redirecting to you in 3 second');
  });

  test('should clean up interval on unmount', () => {
    const { unmount } = renderWithRouter(<Spinner />);
    
    // Advance timer partially
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Unmount component
    unmount();
    
    // Advance timer further - should not cause any issues
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Navigation should not be called after unmount
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('should handle multiple rapid timer advances', () => {
    renderWithRouter(<Spinner />);
    
    // Advance all timers at once
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: mockLocation.pathname,
    });
  });

  test('should use current location pathname in navigation state', () => {
    renderWithRouter(<Spinner />);
    
    // Advance timers to complete countdown
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: mockLocation.pathname,
    });
  });

  test('should render with empty path', () => {
    renderWithRouter(<Spinner path="" />);
    
    expect(screen.getByText('redirecting to you in 3 second')).toBeInTheDocument();
    
    // Advance timers to complete countdown
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: mockLocation.pathname,
    });
  });
});
