import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Categories from './Categories';
import useCategory from '../hooks/useCategory';
import Layout from '../components/Layout';

// Mock the dependencies
jest.mock('../hooks/useCategory');
jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

describe('Categories Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render with correct title', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  test('should render categories correctly', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' },
      { _id: '3', name: 'Books', slug: 'books' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Check if all category names are rendered
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  test('should render category links with correct href', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Check if links have correct href attributes
    const electronicsLink = screen.getByRole('link', { name: 'Electronics' });
    const clothingLink = screen.getByRole('link', { name: 'Clothing' });

    expect(electronicsLink).toHaveAttribute('href', '/category/electronics');
    expect(clothingLink).toHaveAttribute('href', '/category/clothing');
  });

  test('should render empty state when no categories', () => {
    useCategory.mockReturnValue([]);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Should still render the layout and title
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    
    // Should not render any category links
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('should render with correct CSS classes', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Check container classes
    const container = screen.getByText('Electronics').closest('.container');
    expect(container).toBeInTheDocument();

    // Check row classes
    const row = screen.getByText('Electronics').closest('.row');
    expect(row).toBeInTheDocument();

    // Check column classes
    const column = screen.getByText('Electronics').closest('.col-md-6');
    expect(column).toBeInTheDocument();
    expect(column).toHaveClass('mt-5', 'mb-3', 'gx-3', 'gy-3');

    // Check button classes
    const button = screen.getByRole('link', { name: 'Electronics' });
    expect(button).toHaveClass('btn', 'btn-primary');
  });

  test('should call useCategory hook', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(useCategory).toHaveBeenCalledTimes(1);
  });

  test('should handle single category', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Electronics' })).toHaveAttribute('href', '/category/electronics');
  });

  test('should handle categories with special characters in names', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics & Gadgets', slug: 'electronics-gadgets' },
      { _id: '2', name: 'Home & Garden', slug: 'home-garden' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
    expect(screen.getByText('Home & Garden')).toBeInTheDocument();
    
    expect(screen.getByRole('link', { name: 'Electronics & Gadgets' })).toHaveAttribute('href', '/category/electronics-gadgets');
    expect(screen.getByRole('link', { name: 'Home & Garden' })).toHaveAttribute('href', '/category/home-garden');
  });

  test('should handle categories with long names', () => {
    const mockCategories = [
      { _id: '1', name: 'Very Long Category Name That Might Wrap', slug: 'very-long-category-name' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText('Very Long Category Name That Might Wrap')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Very Long Category Name That Might Wrap' })).toHaveAttribute('href', '/category/very-long-category-name');
  });

  test('should render Layout component with correct props', () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];

    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Check if Layout is rendered
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  test('should handle undefined categories gracefully', () => {
    useCategory.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Should not crash and should render layout
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    
    // Should not render any category links when categories is undefined
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('should handle null categories gracefully', () => {
    useCategory.mockReturnValue(null);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Should not crash and should render layout
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    
    // Should not render any category links when categories is null
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
