import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Pagenotfound from '../pages/Pagenotfound';

// Mock Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Pagenotfound Component', () => {
  test('should render 404 heading', () => {
    renderWithRouter(<Pagenotfound />);
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('404')).toHaveClass('pnf-title');
  });

  test('should render page not found message', () => {
    renderWithRouter(<Pagenotfound />);
    
    expect(screen.getByText('Oops ! Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Oops ! Page Not Found')).toHaveClass('pnf-heading');
  });

  test('should render go back link', () => {
    renderWithRouter(<Pagenotfound />);
    
    const goBackLink = screen.getByText('Go Back');
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveClass('pnf-btn');
    expect(goBackLink.closest('a')).toHaveAttribute('href', '/');
  });

  test('should render with Layout component', () => {
    renderWithRouter(<Pagenotfound />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute('data-title', 'go back- page not found');
  });

  test('should render with correct CSS classes', () => {
    renderWithRouter(<Pagenotfound />);
    
    const container = screen.getByText('404').closest('.pnf');
    expect(container).toBeInTheDocument();
  });

  test('should render all elements in correct structure', () => {
    renderWithRouter(<Pagenotfound />);
    
    // Check main container
    const pnfContainer = screen.getByText('404').closest('.pnf');
    expect(pnfContainer).toBeInTheDocument();
    
    // Check 404 title
    const title404 = screen.getByText('404');
    expect(title404).toBeInTheDocument();
    expect(title404).toHaveClass('pnf-title');
    
    // Check heading
    const heading = screen.getByText('Oops ! Page Not Found');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('pnf-heading');
    
    // Check go back link
    const goBackLink = screen.getByText('Go Back');
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveClass('pnf-btn');
  });

  test('should have correct heading hierarchy', () => {
    renderWithRouter(<Pagenotfound />);
    
    const h1Element = screen.getByRole('heading', { level: 1 });
    const h2Element = screen.getByRole('heading', { level: 2 });
    
    expect(h1Element).toHaveTextContent('404');
    expect(h2Element).toHaveTextContent('Oops ! Page Not Found');
  });

  test('should render as a complete 404 page', () => {
    renderWithRouter(<Pagenotfound />);
    
    // Verify all essential elements are present
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops ! Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test('should have accessible link text', () => {
    renderWithRouter(<Pagenotfound />);
    
    const goBackLink = screen.getByRole('link', { name: 'Go Back' });
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveAttribute('href', '/');
  });

  test('should render with proper semantic structure', () => {
    renderWithRouter(<Pagenotfound />);
    
    // Check that headings are properly structured
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(2);
    
    // Check that link is properly structured
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Go Back');
  });
});
