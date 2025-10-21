import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from '../About';
import { AuthProvider } from '../../context/auth';

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

describe('Phase 1 Integration: About Component with Layout', () => {
  test('integrates About with Layout (Header + Footer + Content)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <About />
        </AuthProvider>
      </MemoryRouter>
    );

    // AC4: Page loads without errors and Layout header present
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    const categoriesLinks = screen.getAllByRole('link', { name: /categories/i });
    expect(categoriesLinks.length).toBeGreaterThan(0);

    // AC1: Large image on the left side (image present; width 100% implies large)
    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
    expect(image).toHaveStyle({ width: '100%' });
    
    // AC2: Short paragraph of text appears on the right side
    expect(screen.getByText('Add text')).toBeInTheDocument();

    // AC4: Layout footer present
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  test('integrates Helmet metadata via Layout (no errors)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <About />
        </AuthProvider>
      </MemoryRouter>
    );

    // AC4: Page loads without errors (content renders)
    expect(screen.getByText('Add text')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs (Header/Footer)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <About />
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

  test('displays About content within Bootstrap grid', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <About />
        </AuthProvider>
      </MemoryRouter>
    );

    const mainRow = screen.getByText('Add text').closest('.row');
    expect(mainRow).toBeInTheDocument();
    expect(mainRow).toHaveClass('contactus');

    // AC3: Page layout looks balanced on desktop: image in .col-md-6 (left), text in .col-md-4 (right)
    const imageCol = screen.getByAltText('contactus').closest('.col-md-6');
    const textCol = screen.getByText('Add text').closest('.col-md-4');
    expect(imageCol).toBeInTheDocument();
    expect(textCol).toBeInTheDocument();
  });
});


