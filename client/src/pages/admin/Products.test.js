// Products.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock axios and toast
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock Layout and AdminMenu so we focus on the Products output
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-adminmenu">Mock Admin Menu</div>;
  };
});

import Products from './Products'; // adjust path if needed

describe('Products component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading and product cards when API returns products', async () => {
    const fakeProducts = [
      {
        _id: 'p1',
        name: 'Product One',
        description: 'First product',
        slug: 'product-one',
      },
      {
        _id: 'p2',
        name: 'Product Two',
        description: 'Second product',
        slug: 'product-two',
      },
    ];

    // Mock axios.get to resolve with data
    axios.get.mockResolvedValueOnce({
      data: { products: fakeProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    // Heading should render immediately
    expect(screen.getByText(/All Products List/i)).toBeInTheDocument();

    // Wait for the products to appear after useEffect fetch
    await waitFor(() => {
      // Each product name should be shown
      expect(screen.getByText('Product One')).toBeInTheDocument();
      expect(screen.getByText('Product Two')).toBeInTheDocument();
    });

    // Check links have correct hrefs (Link renders as <a href="...">)
    const linkOne = screen.getByText('Product One').closest('a');
    const linkTwo = screen.getByText('Product Two').closest('a');

    expect(linkOne).toHaveAttribute('href', '/dashboard/admin/product/product-one');
    expect(linkTwo).toHaveAttribute('href', '/dashboard/admin/product/product-two');

    // Check that images use the expected src pattern
    const imgOne = screen.getByAltText('Product One');
    expect(imgOne).toHaveAttribute('src', '/api/v1/product/product-photo/p1');

    // Layout and AdminMenu mocks rendered
    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-adminmenu')).toBeInTheDocument();
  });

  it('calls toast.error when API request fails', async () => {
    const error = new Error('Network error');
    axios.get.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    // Wait for effect and error handling
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
      // toast.error should be called at least once
      expect(toast.error).toHaveBeenCalledWith('Someething Went Wrong');
    });
  });
});
