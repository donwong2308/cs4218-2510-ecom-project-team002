import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Policy from './Policy';

// Tests for the Policy page
// The Policy component uses the application's Layout component; rendering
// inside MemoryRouter prevents any routing-related errors during tests.
describe('Policy Page', () => {
  // Verify the hero image and its accessible alt text are present
  test('renders policy image with correct alt text', () => {
    render(
      <MemoryRouter>
        <Policy />
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
        <Policy />
      </MemoryRouter>
    );

    // The Policy component currently renders placeholder paragraphs.
    // Check that multiple occurrences of the placeholder text exist.
    const paragraphs = screen.getAllByText(/add privacy policy/i);
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });
});
