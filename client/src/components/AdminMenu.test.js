import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminMenu from './AdminMenu'; // adjust relative path

describe('AdminMenu', () => {
  it('renders admin panel heading and expected nav links with correct hrefs', () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // Heading
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();

    // Links by visible text
    const createCategory = screen.getByText(/Create Category/i);
    const createProduct = screen.getByText(/Create Product/i);
    const products = screen.getByText(/^Products$/i); // exact
    const orders = screen.getByText(/Orders/i);

    expect(createCategory).toBeInTheDocument();
    expect(createProduct).toBeInTheDocument();
    expect(products).toBeInTheDocument();
    expect(orders).toBeInTheDocument();

    // NavLink renders an <a> element with href — verify the hrefs
    expect(createCategory.closest('a')).toHaveAttribute('href', '/dashboard/admin/create-category');
    expect(createProduct.closest('a')).toHaveAttribute('href', '/dashboard/admin/create-product');
    expect(products.closest('a')).toHaveAttribute('href', '/dashboard/admin/products');
    expect(orders.closest('a')).toHaveAttribute('href', '/dashboard/admin/orders');
  });

  it('does not render commented-out Users link', () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // That Users link was commented out in your component; assert it's absent
    expect(screen.queryByText(/Users/i)).not.toBeInTheDocument();
  });
});
