import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from './Contact';
import { AuthProvider } from '../context/auth';

// Mock axios for API calls made by layout components
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { category: [] } })),
  defaults: {
    headers: {
      common: {}
    }
  }
}));

// Mock useCart hook since Header component uses it
jest.mock('../context/cart', () => ({
  useCart: () => [{ items: [] }, jest.fn()]
}));

// Mock useSearch hook since SearchInput component uses it
jest.mock('../context/search', () => ({
  useSearch: () => [{ keyword: '', results: [] }, jest.fn()]
}));

// Mock useCategory hook since Header component uses it
jest.mock('../hooks/useCategory', () => ({
  __esModule: true,
  default: () => []
}));

// Mock react-icons to avoid rendering issues
jest.mock('react-icons/bi', () => ({
  BiMailSend: () => '<BiMailSend />',
  BiPhoneCall: () => '<BiPhoneCall />',
  BiSupport: () => '<BiSupport />'
}));

// Unit tests for the Contact page
// These tests render the Contact page in isolation and assert that
// the key UI elements are present. We wrap the component with
// MemoryRouter because the real `Contact` component uses the app's
// `Layout` which may include links or routing-aware elements.
describe('Contact Page', () => {
  // Verify the page heading and the hero image are rendered
  test('renders contact heading and image', () => {
    // Render the component inside a MemoryRouter so any router
    // children inside Layout don't throw during test rendering.
    render(
      <MemoryRouter>
        <AuthProvider>
          <Contact />
        </AuthProvider>
      </MemoryRouter>
    );

    // The visible heading text should include "CONTACT US".
    // We use a case-insensitive regex to avoid brittle casing checks.
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();

    // The hero/contact image should be present and accessible via its alt text.
    expect(screen.getByAltText('contactus')).toBeInTheDocument();
  });

  // Verify that the contact details shown on the page match the
  // values hard-coded in the component (email, phone and support number).
  test('displays contact details (email, phone, support)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Contact />
        </AuthProvider>
      </MemoryRouter>
    );

    // The component renders plain text strings for contact details.
    // Use regex matches to be resilient to surrounding whitespace.
    expect(screen.getByText(/www\.help@ecommerceapp\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();
    expect(screen.getByText(/1800-0000-0000/i)).toBeInTheDocument();
  });
});
