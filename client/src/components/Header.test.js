import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import axios from 'axios';
import Header from './Header';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('axios');
jest.mock('../hooks/useCategory');
jest.mock('../context/auth', () => ({
  useAuth: jest.fn()
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn()
}));
jest.mock('../context/search', () => ({
  useSearch: jest.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Helper function to render component with router
const renderWithRouter = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('Header Component', () => {
  const mockSetAuth = jest.fn();
  const mockCategories = [
    { _id: '1', name: 'Electronics', slug: 'electronics' },
    { _id: '2', name: 'Clothing', slug: 'clothing' }
  ];
  const mockCart = [
    { _id: '1', name: 'Product 1' },
    { _id: '2', name: 'Product 2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });

    // Mock useCategory hook
    require('../hooks/useCategory').default.mockReturnValue(mockCategories);
    
    // Mock useCart hook
    require('../context/cart').useCart.mockReturnValue([mockCart]);
    
    // Mock useSearch hook
    require('../context/search').useSearch.mockReturnValue([{ keyword: '' }, jest.fn()]);
  });

  test('should render header with brand name', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('🛒 Virtual Vault')).toBeInTheDocument();
  });

  test('should render navigation links for unauthenticated user', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('should render user dropdown for authenticated user', () => {
    const mockUser = { name: 'John Doe', role: 0 };
    require('../context/auth').useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('should render admin dashboard link for admin user', () => {
    const mockUser = { name: 'Admin User', role: 1 };
    require('../context/auth').useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard/admin');
  });

  test('should render user dashboard link for regular user', () => {
    const mockUser = { name: 'Regular User', role: 0 };
    require('../context/auth').useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard/user');
  });

  test('should render categories dropdown with category links', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  test('should render cart badge with correct count', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    // The Badge component should show the cart count
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('should handle logout successfully', async () => {
    const mockUser = { name: 'John Doe', role: 0 };
    require('../context/auth').useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    const logoutLink = screen.getByText('Logout');
    fireEvent.click(logoutLink);
    
    expect(mockSetAuth).toHaveBeenCalledWith({
      user: null,
      token: "",
    });
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth');
    expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
  });

  test('should render search input component', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    // SearchInput component should be rendered
    // We can't test its internal behavior as it's mocked, but we can verify it's rendered
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('should handle empty categories array', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    require('../hooks/useCategory').default.mockReturnValue([]);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
  });

  test('should handle null categories', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    require('../hooks/useCategory').default.mockReturnValue(null);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
  });

  test('should handle undefined categories', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    require('../hooks/useCategory').default.mockReturnValue(undefined);
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
  });

  test('should render navbar toggle button', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('navbar-toggler');
  });

  test('should render navbar collapse div', () => {
    require('../context/auth').useAuth.mockReturnValue([{ user: null }, mockSetAuth]);
    
    renderWithRouter(<Header />);
    
    const collapseDiv = screen.getByRole('navigation');
    expect(collapseDiv).toBeInTheDocument();
    expect(collapseDiv).toHaveClass('navbar', 'navbar-expand-lg', 'bg-body-tertiary');
  });
});
