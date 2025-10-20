/**
 * Phase 1: Bottom-Up Integration Tests - Pagenotfound Component
 * Mirrors Contact/Policy/About integration style with minimal external mocking.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pagenotfound from '../Pagenotfound';
import { AuthProvider } from '../../context/auth';

// Minimal mocks to satisfy Header/Layout dependencies
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { category: [] } })),
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
  default: () => []
}));

describe('Phase 1 Integration: Pagenotfound Component with Layout', () => {
  test('integrates Pagenotfound with Layout (Header + Footer + Content)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Pagenotfound />
        </AuthProvider>
      </MemoryRouter>
    );

    // Header integration
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    const categoriesLinks = screen.getAllByRole('link', { name: /categories/i });
    expect(categoriesLinks.length).toBeGreaterThan(0);

    // 404 content
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops ! Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();

    // Footer integration
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  test('integrates Helmet metadata via Layout (no errors)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Pagenotfound />
        </AuthProvider>
      </MemoryRouter>
    );

    // Successful render implies Helmet integration didn't error; verify content
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs (Header/Footer)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Pagenotfound />
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

  test('displays 404 content with proper structure and Go Back link', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Pagenotfound />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify 404 page structure
    const pnfContainer = screen.getByText('404').closest('.pnf');
    expect(pnfContainer).toBeInTheDocument();

    // Verify heading hierarchy
    const h1Element = screen.getByRole('heading', { level: 1 });
    const h2Element = screen.getByRole('heading', { level: 2 });
    expect(h1Element).toHaveTextContent('404');
    expect(h2Element).toHaveTextContent('Oops ! Page Not Found');

    // Verify Go Back link points to home
    const goBackLink = screen.getByRole('link', { name: 'Go Back' });
    expect(goBackLink).toHaveAttribute('href', '/');
    expect(goBackLink).toHaveClass('pnf-btn');
  });

  test('provides navigation escape route from 404 page', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Pagenotfound />
        </AuthProvider>
      </MemoryRouter>
    );

    // Users should be able to navigate away from 404 page
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');

    const goBackLink = screen.getByRole('link', { name: 'Go Back' });
    expect(goBackLink).toHaveAttribute('href', '/');

    // Footer navigation should also be available
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /contact/i });
    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });
});
