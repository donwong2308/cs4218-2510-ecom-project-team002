import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Search from './Search';

// Mock dependencies
jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});
jest.mock('../context/search', () => ({
  useSearch: jest.fn()
}));

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render search page with Layout', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: []
    }, jest.fn()]);

    render(<Search />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute('data-title', 'Search results');
  });

  test('should render search results heading', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: []
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Search Resuts')).toBeInTheDocument();
  });

  test('should display no products found message when results are empty', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: []
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  test('should display product count when results exist', () => {
    const mockResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 },
      { _id: '2', name: 'Product 2', description: 'Description 2', price: 200 }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Found 2')).toBeInTheDocument();
  });

  test('should render product cards when results exist', () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Product 1', 
        description: 'This is a very long description that should be truncated', 
        price: 100 
      },
      { 
        _id: '2', 
        name: 'Product 2', 
        description: 'Another product description', 
        price: 200 
      }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('This is a very long descriptio...')).toBeInTheDocument();
    expect(screen.getByText('Another product description...')).toBeInTheDocument();
    expect(screen.getByText('$ 100')).toBeInTheDocument();
    expect(screen.getByText('$ 200')).toBeInTheDocument();
  });

  test('should render product images with correct src', () => {
    const mockResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    const image = screen.getByAltText('Product 1');
    expect(image).toHaveAttribute('src', '/api/v1/product/product-photo/1');
    expect(image).toHaveClass('card-img-top');
  });

  test('should render action buttons for each product', () => {
    const mockResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 },
      { _id: '2', name: 'Product 2', description: 'Description 2', price: 200 }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    const moreDetailsButtons = screen.getAllByText('More Details');
    const addToCartButtons = screen.getAllByText('ADD TO CART');
    
    expect(moreDetailsButtons).toHaveLength(2);
    expect(addToCartButtons).toHaveLength(2);
    
    moreDetailsButtons.forEach(button => {
      expect(button).toHaveClass('btn', 'btn-primary', 'ms-1');
    });
    
    addToCartButtons.forEach(button => {
      expect(button).toHaveClass('btn', 'btn-secondary', 'ms-1');
    });
  });

  test('should handle undefined results gracefully', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: undefined
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  test('should handle null results gracefully', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: null
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  test('should render with correct CSS classes', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: []
    }, jest.fn()]);

    render(<Search />);
    
    const container = screen.getByText('Search Resuts').closest('.container');
    expect(container).toBeInTheDocument();
    
    const textCenter = screen.getByText('Search Resuts').closest('.text-center');
    expect(textCenter).toBeInTheDocument();
    
    // Find the flex container by looking for the div with d-flex class
    const flexWrap = document.querySelector('.d-flex.flex-wrap.mt-4');
    expect(flexWrap).toBeInTheDocument();
    expect(flexWrap).toHaveClass('d-flex', 'flex-wrap', 'mt-4');
  });

  test('should render product cards with correct structure', () => {
    const mockResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    const card = screen.getByText('Product 1').closest('.card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ width: '18rem' });
    expect(card).toHaveClass('m-2');
    
    const cardBody = screen.getByText('Product 1').closest('.card-body');
    expect(cardBody).toBeInTheDocument();
  });

  test('should truncate long descriptions', () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Product 1', 
        description: 'This is a very long description that definitely exceeds thirty characters', 
        price: 100 
      }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('This is a very long descriptio...')).toBeInTheDocument();
  });

  test('should handle short descriptions without truncation', () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Product 1', 
        description: 'Short desc', 
        price: 100 
      }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Short desc...')).toBeInTheDocument();
  });

  test('should render multiple products correctly', () => {
    const mockResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 },
      { _id: '2', name: 'Product 2', description: 'Description 2', price: 200 },
      { _id: '3', name: 'Product 3', description: 'Description 3', price: 300 }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Found 3')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
    
    const cards = screen.getAllByText(/Product \d/);
    expect(cards).toHaveLength(3);
  });

  test('should handle empty search keyword', () => {
    require('../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  test('should maintain accessibility with proper alt text', () => {
    const mockResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 }
    ];

    require('../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: mockResults
    }, jest.fn()]);

    render(<Search />);
    
    const image = screen.getByAltText('Product 1');
    expect(image).toBeInTheDocument();
  });
});
