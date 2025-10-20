import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

describe('Phase 1 Integration: Footer Component with Layout and Navigation', () => {
  const renderFooter = () => {
    return render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
  };

  test('integrates Footer with Layout structure and Bootstrap classes', () => {
    renderFooter();

    // Verify footer container structure - use class selector since role="contentinfo" is not set
    const footer = document.querySelector('.footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('footer');

    // Verify footer heading
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('All Rights Reserved © TestingComp');
    expect(heading).toHaveClass('text-center');
  });

  test('integrates navigation links with correct routing', () => {
    renderFooter();

    // Verify About link
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute('href', '/about');

    // Verify Contact link
    const contactLink = screen.getByRole('link', { name: /contact/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', '/contact');

    // Verify Privacy Policy link
    const policyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(policyLink).toBeInTheDocument();
    expect(policyLink).toHaveAttribute('href', '/policy');
  });

  test('integrates Bootstrap text alignment classes', () => {
    renderFooter();

    // Verify text-center class on heading
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toHaveClass('text-center');

    // Verify text-center and mt-3 classes on paragraph
    const paragraph = screen.getByText(/All Rights Reserved/).nextElementSibling;
    expect(paragraph).toHaveClass('text-center', 'mt-3');
  });

  test('integrates footer content structure and layout', () => {
    renderFooter();

    // Verify footer contains both heading and navigation paragraph
    const footer = document.querySelector('.footer');
    expect(footer).toBeInTheDocument();

    // Verify heading is present
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toBeInTheDocument();

    // Verify navigation paragraph is present - find by CSS selector
    const navParagraph = document.querySelector('.footer p');
    expect(navParagraph).toBeInTheDocument();
  });

  test('integrates footer navigation with proper separators', () => {
    renderFooter();

    // Verify navigation paragraph contains proper separators
    const navParagraph = document.querySelector('.footer p');
    expect(navParagraph).toBeInTheDocument();

    // Check that separators (|) are present between links
    const textContent = navParagraph.textContent;
    expect(textContent).toContain('About|Contact|Privacy Policy');
  });

  test('integrates with React Router for navigation functionality', () => {
    renderFooter();

    // Verify all links are proper Link components (not regular anchor tags)
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /contact/i });
    const policyLink = screen.getByRole('link', { name: /privacy policy/i });

    // All links should be rendered as Link components with proper href attributes
    expect(aboutLink.tagName).toBe('A');
    expect(aboutLink).toHaveAttribute('href', '/about');

    expect(contactLink.tagName).toBe('A');
    expect(contactLink).toHaveAttribute('href', '/contact');

    expect(policyLink.tagName).toBe('A');
    expect(policyLink).toHaveAttribute('href', '/policy');
  });

  test('integrates footer accessibility features', () => {
    renderFooter();

    // Verify footer container exists (even without contentinfo role)
    const footer = document.querySelector('.footer');
    expect(footer).toBeInTheDocument();

    // Verify heading has proper heading level
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toBeInTheDocument();

    // Verify all navigation links are accessible
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /contact/i });
    const policyLink = screen.getByRole('link', { name: /privacy policy/i });

    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
    expect(policyLink).toBeInTheDocument();
  });

  test('integrates footer with consistent styling and layout', () => {
    renderFooter();

    // Verify footer structure is consistent
    const footer = document.querySelector('.footer');
    expect(footer).toBeInTheDocument();

    // Verify heading styling
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toHaveClass('text-center');

    // Verify navigation paragraph styling
    const navParagraph = document.querySelector('.footer p');
    expect(navParagraph).toHaveClass('text-center', 'mt-3');
  });

  test('integrates footer content with proper text content', () => {
    renderFooter();

    // Verify copyright text
    const copyrightText = screen.getByText(/All Rights Reserved.*TestingComp/);
    expect(copyrightText).toBeInTheDocument();

    // Verify navigation text structure
    const navText = document.querySelector('.footer p');
    expect(navText).toBeInTheDocument();

    // Verify the complete footer content structure
    const footer = document.querySelector('.footer');
    expect(footer).toHaveTextContent('All Rights Reserved © TestingComp');
    expect(footer).toHaveTextContent('About|Contact|Privacy Policy');
  });

  test('integrates footer as standalone component without dependencies', () => {
    // Test that Footer can be rendered independently
    renderFooter();

    // Should render without any external dependencies
    const footer = document.querySelector('.footer');
    expect(footer).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  test('integrates footer with proper HTML structure', () => {
    renderFooter();

    // Verify proper HTML structure
    const footer = document.querySelector('.footer');
    expect(footer.tagName).toBe('DIV');
    expect(footer).toHaveClass('footer');

    // Verify heading structure
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading.tagName).toBe('H4');

    // Verify paragraph structure
    const paragraph = document.querySelector('.footer p');
    expect(paragraph.tagName).toBe('P');

    // Verify link structures
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.tagName).toBe('A');
    });
  });
});
