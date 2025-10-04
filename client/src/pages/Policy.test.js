import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Policy from './Policy';
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
}));// Tests for the Policy page
// The Policy component uses the application's Layout component; rendering
// inside MemoryRouter prevents any routing-related errors during tests.
describe('Policy Page', () => {
  // Verify the hero image and its accessible alt text are present
  test('renders policy image with correct alt text', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Policy />
        </AuthProvider>
      </MemoryRouter>
    );

    // image is expected to be present with alt="contactus" (matches the component)
    const img = screen.getByAltText('contactus');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/contactus.jpeg');
  });

  // Verify that the actual policy content paragraphs are rendered
  test('renders policy paragraphs', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Policy />
        </AuthProvider>
      </MemoryRouter>
    );

    // The Policy component currently renders placeholder paragraphs.
    // Check that multiple occurrences of the placeholder text exist.
    const paragraphs = screen.getAllByText(/add privacy policy/i);
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });
});
