import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Footer from './Footer';

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  test('should render footer with copyright text', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('All Rights Reserved © TestingComp')).toBeInTheDocument();
  });

  test('should render footer with correct CSS classes', () => {
    renderWithRouter(<Footer />);
    
    const footerElement = screen.getByText('All Rights Reserved © TestingComp').closest('.footer');
    expect(footerElement).toBeInTheDocument();
    
    const headingElement = screen.getByText('All Rights Reserved © TestingComp');
    expect(headingElement).toHaveClass('text-center');
  });

  test('should render navigation links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  test('should have correct href attributes for links', () => {
    renderWithRouter(<Footer />);
    
    const aboutLink = screen.getByText('About');
    const contactLink = screen.getByText('Contact');
    const policyLink = screen.getByText('Privacy Policy');
    
    expect(aboutLink.closest('a')).toHaveAttribute('href', '/about');
    expect(contactLink.closest('a')).toHaveAttribute('href', '/contact');
    expect(policyLink.closest('a')).toHaveAttribute('href', '/policy');
  });

  test('should render links with correct separators', () => {
    renderWithRouter(<Footer />);
    
    const paragraphElement = screen.getByText('About').closest('p');
    expect(paragraphElement).toBeInTheDocument();
    expect(paragraphElement).toHaveClass('text-center', 'mt-3');
    
    // Check that separators are present
    expect(paragraphElement.textContent).toContain('|');
  });

  test('should render all elements in correct structure', () => {
    renderWithRouter(<Footer />);
    
    // Check main container
    const footerDiv = screen.getByText('All Rights Reserved © TestingComp').closest('.footer');
    expect(footerDiv).toBeInTheDocument();
    
    // Check heading
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('All Rights Reserved © TestingComp');
    
    // Check paragraph with links
    const paragraph = screen.getByText('About').closest('p');
    expect(paragraph).toBeInTheDocument();
  });
});
