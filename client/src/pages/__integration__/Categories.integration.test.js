import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Categories from '../Categories';
import { AuthProvider } from '../../context/auth';

// Mock axios for API calls - declare before any imports that use it
jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: { headers: { common: {} } }
}));

jest.mock('../../context/cart', () => ({
  useCart: () => [[], jest.fn()]
}));

jest.mock('../../context/search', () => ({
  useSearch: () => [{ keyword: '', results: [] }, jest.fn()]
}));

jest.mock('../../hooks/useCategory', () => ({
  __esModule: true,
  default: () => [
    { _id: '1', name: 'Electronics', slug: 'electronics' },
    { _id: '2', name: 'Clothing', slug: 'clothing' },
    { _id: '3', name: 'Books', slug: 'books' }
  ]
}));

describe('Phase 1 Integration: Categories Component with Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for categories API
    const axios = require('axios');
    axios.get.mockResolvedValue({ data: { category: [] } });
  });

  test('integrates Categories with Layout (Header + Footer + Content)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Header integration
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    const categoriesLinks = screen.getAllByRole('link', { name: /categories/i });
    expect(categoriesLinks.length).toBeGreaterThan(0);

    // Categories content - use getAllByText to handle multiple instances
    const electronicsElements = screen.getAllByText('Electronics');
    expect(electronicsElements.length).toBeGreaterThan(0);
    const clothingElements = screen.getAllByText('Clothing');
    expect(clothingElements.length).toBeGreaterThan(0);
    const booksElements = screen.getAllByText('Books');
    expect(booksElements.length).toBeGreaterThan(0);

    // Footer integration
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  test('integrates Helmet metadata via Layout (no errors)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Successful render implies Helmet integration didn't error; verify content
    const electronicsElements = screen.getAllByText('Electronics');
    expect(electronicsElements.length).toBeGreaterThan(0);
  });

  test('navigation links have correct hrefs (Header/Footer)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    const aboutLinks = screen.getAllByRole('link', { name: /about/i });
    expect(aboutLinks.length).toBeGreaterThan(0);
    const contactLink = screen.getByRole('link', { name: /contact/i });
    expect(contactLink).toHaveAttribute('href', '/contact');
    const policyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(policyLink).toHaveAttribute('href', '/policy');
  });

  test('displays categories with proper structure and navigation', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify categories page structure - use specific selectors for main content
    const electronicsButtons = screen.getAllByRole('link', { name: 'Electronics' });
    const electronicsButton = electronicsButtons.find(link => link.classList.contains('btn-primary'));
    expect(electronicsButton).toBeInTheDocument();
    
    const container = electronicsButton.closest('.container');
    expect(container).toBeInTheDocument();

    const row = electronicsButton.closest('.row');
    expect(row).toBeInTheDocument();

    // Verify category links have correct hrefs - target the main content buttons specifically
    expect(electronicsButton).toHaveAttribute('href', '/category/electronics');
    
    const clothingButtons = screen.getAllByRole('link', { name: 'Clothing' });
    const clothingButton = clothingButtons.find(link => link.classList.contains('btn-primary'));
    expect(clothingButton).toHaveAttribute('href', '/category/clothing');
    
    const booksButtons = screen.getAllByRole('link', { name: 'Books' });
    const booksButton = booksButtons.find(link => link.classList.contains('btn-primary'));
    expect(booksButton).toHaveAttribute('href', '/category/books');
  });

  test('integrates with useCategory hook for category data', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Categories are loaded via useCategory hook - check for main content buttons
    const electronicsButtons = screen.getAllByRole('link', { name: 'Electronics' });
    const electronicsButton = electronicsButtons.find(link => link.classList.contains('btn-primary'));
    expect(electronicsButton).toBeInTheDocument();
    
    const clothingButtons = screen.getAllByRole('link', { name: 'Clothing' });
    const clothingButton = clothingButtons.find(link => link.classList.contains('btn-primary'));
    expect(clothingButton).toBeInTheDocument();
    
    const booksButtons = screen.getAllByRole('link', { name: 'Books' });
    const booksButton = booksButtons.find(link => link.classList.contains('btn-primary'));
    expect(booksButton).toBeInTheDocument();
  });

  test('provides navigation escape routes from categories page', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Users should be able to navigate away from categories page
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');

    // Footer navigation should also be available
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /contact/i });
    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });

  test('displays categories with correct Bootstrap grid classes', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Bootstrap grid structure - target main content buttons specifically
    const electronicsButtons = screen.getAllByRole('link', { name: 'Electronics' });
    const electronicsButton = electronicsButtons.find(link => link.classList.contains('btn-primary'));
    expect(electronicsButton).toBeInTheDocument();
    
    const electronicsCol = electronicsButton.closest('.col-md-6');
    expect(electronicsCol).toBeInTheDocument();
    expect(electronicsCol).toHaveClass('mt-5', 'mb-3', 'gx-3', 'gy-3');

    // Verify button classes
    expect(electronicsButton).toHaveClass('btn', 'btn-primary');
  });

  test('handles empty categories gracefully', () => {
    // Create a spy on the useCategory hook and mock it to return empty array
    const useCategorySpy = jest.spyOn(require('../../hooks/useCategory'), 'default');
    useCategorySpy.mockReturnValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Categories />
        </AuthProvider>
      </MemoryRouter>
    );

    // Should still render layout without errors
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    
    // Should not render any category links in main content
    const categoryButtons = screen.queryAllByRole('link', { name: /electronics|clothing|books/i });
    const mainContentButtons = categoryButtons.filter(link => link.classList.contains('btn-primary'));
    expect(mainContentButtons).toHaveLength(0);
    
    // Should not render any category links in dropdown either
    const dropdownButtons = categoryButtons.filter(link => link.classList.contains('dropdown-item'));
    expect(dropdownButtons).toHaveLength(0);
    
    // Restore the spy
    useCategorySpy.mockRestore();
  });
});
