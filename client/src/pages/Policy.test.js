/**
 * Policy Page Unit Tests
 * 
 * Test File: Policy.test.js
 * Component Under Test: Policy.js
 * 
 * Testing Strategy:
 * - Output-based testing: Verifies UI elements and content are rendered correctly
 * - State-based testing: Ensures component structure and placeholder content display
 * 
 * Testing Techniques Used:
 * - Mocks: External dependencies (axios, context hooks, icons) isolated for testing
 * - Stubs: Controlled return values for context hooks and API calls
 * - Fakes: MemoryRouter provides fake routing environment for testing
 * 
 * Test Coverage:
 * - Hero image rendering and accessibility
 * - Policy content placeholder verification
 * - Layout integration validation
 * 
 * Bug Analysis:
 * ✅ No bugs found in Policy.js - component renders placeholder content correctly
 * ⚠️ Note: Component currently shows placeholder text "add privacy policy"
 * ✅ Layout integration and image display work properly
 */

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
}));/**
 * Unit Tests for Policy Page Component
 * 
 * The Policy component integrates with the application's Layout component
 * which includes navigation and routing elements. MemoryRouter wrapping
 * prevents routing-related errors during isolated testing.
 * 
 * Current State: Policy page contains placeholder content that should
 * eventually be replaced with actual privacy policy text.
 */
describe('Policy Page', () => {
  /**
   * Test: Policy Page Hero Image Rendering
   * 
   * Test Type: Output-based testing (UI element verification)
   * Purpose: Ensures the hero image is displayed with correct attributes
   * 
   * What it tests:
   * - Image element presence and accessibility (alt text)
   * - Correct image source path (/images/contactus.jpeg)
   * - Image src attribute validation
   * 
   * Bug Status: ✅ No bugs found - image renders with correct attributes
   */
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

  /**
   * Test: Policy Content Placeholder Verification
   * 
   * Test Type: Output-based testing (content verification)
   * Purpose: Validates that placeholder policy content is displayed
   * 
   * Current Implementation:
   * - Component renders multiple "add privacy policy" placeholder paragraphs
   * - Test verifies at least one placeholder paragraph exists
   * 
   * Future Consideration:
   * - This test should be updated when actual privacy policy content is added
   * - Current test serves as validation that content area is functional
   * 
   * Bug Status: ✅ No bugs found - placeholder content renders as expected
   */
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
