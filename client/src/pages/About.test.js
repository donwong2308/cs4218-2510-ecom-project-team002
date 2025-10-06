import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import About from './About';

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

describe('About Component', () => {
  test('should render about page with Layout', () => {
    render(<About />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute('data-title', 'About us - Ecommerce app');
  });

  test('should render about image', () => {
    render(<About />);
    
    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/about.jpeg');
    expect(image).toHaveStyle({ width: '100%' });
  });

  test('should render about text content', () => {
    render(<About />);
    
    expect(screen.getByText('Add text')).toBeInTheDocument();
  });

  test('should render with correct CSS classes', () => {
    render(<About />);
    
    // Check row container
    const rowContainer = screen.getByText('Add text').closest('.row');
    expect(rowContainer).toBeInTheDocument();
    expect(rowContainer).toHaveClass('contactus');
    
    // Check image column
    const imageColumn = screen.getByAltText('contactus').closest('.col-md-6');
    expect(imageColumn).toBeInTheDocument();
    
    // Check text column
    const textColumn = screen.getByText('Add text').closest('.col-md-4');
    expect(textColumn).toBeInTheDocument();
  });

  test('should render text with correct styling', () => {
    render(<About />);
    
    const textElement = screen.getByText('Add text');
    expect(textElement).toHaveClass('text-justify', 'mt-2');
  });

  test('should render with proper Bootstrap grid structure', () => {
    render(<About />);
    
    // Check main row
    const mainRow = screen.getByText('Add text').closest('.row');
    expect(mainRow).toBeInTheDocument();
    
    // Check columns
    const columns = mainRow.querySelectorAll('[class*="col-md-"]');
    expect(columns).toHaveLength(2);
    
    // Check specific column classes
    expect(columns[0]).toHaveClass('col-md-6');
    expect(columns[1]).toHaveClass('col-md-4');
  });

  test('should render image with correct attributes', () => {
    render(<About />);
    
    const image = screen.getByAltText('contactus');
    expect(image).toHaveAttribute('src', '/images/about.jpeg');
    expect(image).toHaveAttribute('alt', 'contactus');
    expect(image).toHaveStyle({ width: '100%' });
  });

  test('should render complete about page structure', () => {
    render(<About />);
    
    // Verify all essential elements are present
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByAltText('contactus')).toBeInTheDocument();
    expect(screen.getByText('Add text')).toBeInTheDocument();
    
    // Verify Bootstrap structure
    expect(screen.getByText('Add text').closest('.row')).toBeInTheDocument();
  });

  test('should have accessible image', () => {
    render(<About />);
    
    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
    expect(image.tagName).toBe('IMG');
  });

  test('should render with proper semantic structure', () => {
    render(<About />);
    
    // Check that the component renders without errors
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    
    // Check that image and text are properly structured
    const image = screen.getByAltText('contactus');
    const text = screen.getByText('Add text');
    
    expect(image).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  test('should render with correct layout title', () => {
    render(<About />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-title', 'About us - Ecommerce app');
  });

  test('should handle missing image gracefully', () => {
    render(<About />);
    
    const image = screen.getByAltText('contactus');
    expect(image).toHaveAttribute('src', '/images/about.jpeg');
    // The image will show a broken image icon if the file doesn't exist,
    // but the component should still render without errors
    expect(image).toBeInTheDocument();
  });
});
