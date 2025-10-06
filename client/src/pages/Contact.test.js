/**
 * Contact Page Unit Tests
 * 
 * Test File: Contact.test.js
 * Component Under Test: Contact.js
 * 
 * Testing Strategy:
 * - Output-based testing: Verifies that specific UI elements are rendered correctly
 * - State-based testing: Ensures proper component structure and content display
 * 
 * Testing Techniques Used:
 * - Mocks: External dependencies (axios, context hooks, icons) to isolate component
 * - Stubs: Simple return values for mocked functions to control test environment
 * - Fakes: MemoryRouter provides fake routing context for testing
 * 
 * Test Coverage:
 * - UI element rendering verification
 * - Static content validation
 * - Component integration with Layout system
 * 
 * Bug Analysis:
 * ✅ No bugs found in Contact.js - component renders static content correctly
 * ✅ All contact information displays as expected
 * ✅ Layout integration works properly
 */

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

/**
 * Unit Tests for Contact Page Component
 * 
 * These tests verify the Contact page renders correctly in isolation.
 * The Contact component uses the application's Layout component which includes
 * navigation and routing elements, so we wrap tests with MemoryRouter.
 * 
 * Mocking Strategy:
 * - axios: Prevents actual API calls during testing
 * - Context hooks: Provides controlled state for layout components
 * - react-icons: Avoids icon rendering issues in test environment
 */
describe('Contact Page', () => {
  /**
   * Test: Contact Page Header and Hero Image Rendering
   * 
   * Test Type: Output-based testing (UI element verification)
   * Purpose: Ensures the main heading and hero image are displayed correctly
   * 
   * What it tests:
   * - Page title "CONTACT US" is rendered and accessible
   * - Contact hero image is present with proper alt text
   * 
   * Bug Status: ✅ No bugs found - static content renders correctly
   */
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

  /**
   * Test: Contact Information Display Verification
   * 
   * Test Type: Output-based testing (content verification)
   * Purpose: Validates that all contact information is displayed correctly
   * 
   * Contact Details Tested:
   * - Email: www.help@ecommerceapp.com
   * - Phone: 012-3456789  
   * - Support: 1800-0000-0000 (toll free)
   * 
   * Testing Technique: Uses regex matching for resilience against whitespace
   * Bug Status: ✅ No bugs found - all contact information displays correctly
   */
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
