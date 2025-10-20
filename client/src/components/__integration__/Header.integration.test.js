import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { AuthProvider } from '../../context/auth';
import { CartProvider } from '../../context/cart';
import { SearchProvider } from '../../context/search';

// Mock axios for API calls
jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: { headers: { common: {} } }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock useCategory hook
jest.mock('../../hooks/useCategory', () => ({
  __esModule: true,
  default: () => [
    { _id: '1', name: 'Electronics', slug: 'electronics' },
    { _id: '2', name: 'Clothing', slug: 'clothing' },
    { _id: '3', name: 'Books', slug: 'books' }
  ]
}));

// Mock SearchInput component
jest.mock('../Form/SearchInput', () => {
  return function MockSearchInput() {
    return <input data-testid="search-input" placeholder="Search products..." />;
  };
});

describe('Phase 1 Integration: Header Component with Layout and Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  const renderHeader = (initialAuth = null) => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Header />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  test('integrates Header with Layout structure and Bootstrap classes', () => {
    renderHeader();

    // Verify Bootstrap navbar structure
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveClass('navbar', 'navbar-expand-lg', 'bg-body-tertiary');

    // Verify navbar brand
    const brandLink = screen.getByRole('link', { name: /🛒 Virtual Vault/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
    expect(brandLink).toHaveClass('navbar-brand');

    // Verify navbar toggle button
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('navbar-toggler');
  });

  test('integrates navigation links with correct routing', () => {
    renderHeader();

    // Verify main navigation links
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('nav-link');

    // Verify categories dropdown - use getAllByRole to handle multiple matches
    const categoriesLinks = screen.getAllByRole('link', { name: /categories/i });
    const categoriesDropdownToggle = categoriesLinks.find(link => 
      link.classList.contains('dropdown-toggle')
    );
    expect(categoriesDropdownToggle).toBeInTheDocument();
    expect(categoriesDropdownToggle).toHaveAttribute('href', '/categories');
    expect(categoriesDropdownToggle).toHaveClass('nav-link', 'dropdown-toggle');

    // Verify cart link
    const cartLink = screen.getByRole('link', { name: /cart/i });
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute('href', '/cart');
    expect(cartLink).toHaveClass('nav-link');
  });

  test('integrates with useCategory hook for dropdown categories', () => {
    renderHeader();

    // Verify categories dropdown contains category links
    const electronicsLinks = screen.getAllByRole('link', { name: 'Electronics' });
    const electronicsDropdownLink = electronicsLinks.find(link => 
      link.classList.contains('dropdown-item')
    );
    expect(electronicsDropdownLink).toBeInTheDocument();
    expect(electronicsDropdownLink).toHaveAttribute('href', '/category/electronics');

    const clothingLinks = screen.getAllByRole('link', { name: 'Clothing' });
    const clothingDropdownLink = clothingLinks.find(link => 
      link.classList.contains('dropdown-item')
    );
    expect(clothingDropdownLink).toBeInTheDocument();
    expect(clothingDropdownLink).toHaveAttribute('href', '/category/clothing');

    const booksLinks = screen.getAllByRole('link', { name: 'Books' });
    const booksDropdownLink = booksLinks.find(link => 
      link.classList.contains('dropdown-item')
    );
    expect(booksDropdownLink).toBeInTheDocument();
    expect(booksDropdownLink).toHaveAttribute('href', '/category/books');
  });

  test('integrates authentication context for unauthenticated users', () => {
    renderHeader();

    // Verify register and login links for unauthenticated users
    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
    expect(registerLink).toHaveClass('nav-link');

    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
    expect(loginLink).toHaveClass('nav-link');

    // Verify user dropdown is not present for unauthenticated users
    const userDropdown = screen.queryByRole('link', { name: /dashboard/i });
    expect(userDropdown).not.toBeInTheDocument();
  });

  test('integrates authentication context for authenticated users', () => {
    // Mock authenticated user
    const mockAuth = {
      user: { name: 'John Doe', role: 0 },
      token: 'mock-token'
    };

    // Mock localStorage to return auth data
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockAuth));

    renderHeader();

    // Verify user dropdown is present - it has role="button" not role="link"
    const userDropdown = screen.getByRole('button', { name: /john doe/i });
    expect(userDropdown).toBeInTheDocument();
    expect(userDropdown).toHaveClass('nav-link', 'dropdown-toggle');

    // Verify dashboard link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard/user');
    expect(dashboardLink).toHaveClass('dropdown-item');

    // Verify logout link
    const logoutLink = screen.getByRole('link', { name: /logout/i });
    expect(logoutLink).toBeInTheDocument();
    expect(logoutLink).toHaveAttribute('href', '/login');
    expect(logoutLink).toHaveClass('dropdown-item');

    // Verify register and login links are not present for authenticated users
    const registerLink = screen.queryByRole('link', { name: /register/i });
    const loginLink = screen.queryByRole('link', { name: /login/i });
    expect(registerLink).not.toBeInTheDocument();
    expect(loginLink).not.toBeInTheDocument();
  });

  test('integrates with cart context for cart badge', () => {
    renderHeader();

    // Verify cart badge is present
    const cartLink = screen.getByRole('link', { name: /cart/i });
    expect(cartLink).toBeInTheDocument();

    // The Badge component should be present (cart count)
    const badge = cartLink.closest('[class*="ant-badge"]');
    expect(badge).toBeInTheDocument();
  });

  test('integrates SearchInput component', () => {
    renderHeader();

    // Verify SearchInput is rendered
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search products...');
  });

  test('integrates Bootstrap dropdown functionality', () => {
    renderHeader();

    // Verify dropdown structure - use getAllByRole to handle multiple matches
    const categoriesLinks = screen.getAllByRole('link', { name: /categories/i });
    const categoriesDropdown = categoriesLinks.find(link => 
      link.classList.contains('dropdown-toggle')
    );
    expect(categoriesDropdown).toHaveAttribute('data-bs-toggle', 'dropdown');

    // Verify dropdown menu structure
    const dropdownMenu = categoriesDropdown.nextElementSibling;
    expect(dropdownMenu).toHaveClass('dropdown-menu');

    // Verify "All Categories" link in dropdown
    const allCategoriesLink = screen.getByRole('link', { name: /all categories/i });
    expect(allCategoriesLink).toBeInTheDocument();
    expect(allCategoriesLink).toHaveAttribute('href', '/categories');
    expect(allCategoriesLink).toHaveClass('dropdown-item');
  });

  test('integrates with admin role for dashboard routing', () => {
    // Mock admin user
    const mockAuth = {
      user: { name: 'Admin User', role: 1 },
      token: 'mock-token'
    };

    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockAuth));

    renderHeader();

    // Verify admin dashboard link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard/admin');
  });

  test('integrates logout functionality with localStorage and toast', async () => {
    // Mock authenticated user
    const mockAuth = {
      user: { name: 'John Doe', role: 0 },
      token: 'mock-token'
    };

    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockAuth));

    renderHeader();

    // Find and click logout link
    const logoutLink = screen.getByRole('link', { name: /logout/i });
    expect(logoutLink).toBeInTheDocument();

    // Mock the toast.success function
    const toast = require('react-hot-toast');
    
    fireEvent.click(logoutLink);

    // Verify localStorage.removeItem was called
    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth');
    });

    // Verify toast.success was called
    expect(toast.default.success).toHaveBeenCalledWith('Logout Successfully');
  });

  test('integrates responsive design with Bootstrap classes', () => {
    renderHeader();

    // Verify responsive navbar classes
    const navbarCollapse = screen.getByRole('navigation').querySelector('.navbar-collapse');
    expect(navbarCollapse).toBeInTheDocument();
    expect(navbarCollapse).toHaveClass('collapse', 'navbar-collapse');

    // Verify navbar nav classes
    const navbarNav = screen.getByRole('navigation').querySelector('.navbar-nav');
    expect(navbarNav).toBeInTheDocument();
    expect(navbarNav).toHaveClass('navbar-nav', 'ms-auto', 'mb-2', 'mb-lg-0');
  });

  test('handles empty categories gracefully', () => {
    // Create a spy on the useCategory hook and mock it to return empty array
    const useCategorySpy = jest.spyOn(require('../../hooks/useCategory'), 'default');
    useCategorySpy.mockReturnValue([]);

    renderHeader();

    // Should still render header without errors
    expect(screen.getByRole('link', { name: /🛒 Virtual Vault/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();

    // Should not render any category dropdown items
    const categoryDropdownItems = screen.queryAllByRole('link', { name: /electronics|clothing|books/i });
    const dropdownItems = categoryDropdownItems.filter(link => 
      link.classList.contains('dropdown-item') && 
      !link.textContent.includes('All Categories')
    );
    expect(dropdownItems).toHaveLength(0);

    // "All Categories" link should still be present
    const allCategoriesLink = screen.getByRole('link', { name: /all categories/i });
    expect(allCategoriesLink).toBeInTheDocument();

    // Restore the spy
    useCategorySpy.mockRestore();
  });
});
