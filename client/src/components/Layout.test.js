import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Layout from './Layout';

// Mock dependencies
jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>
}));
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));
jest.mock('./Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});
jest.mock('./Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

describe('Layout Component', () => {
  test('should render children content', () => {
    render(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('should render Header component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  test('should render Footer component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('should render Toaster component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  test('should render Helmet with default meta tags', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should render with custom title', () => {
    render(
      <Layout title="Custom Title">
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should render with custom description', () => {
    render(
      <Layout description="Custom Description">
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should render with custom keywords', () => {
    render(
      <Layout keywords="custom,keywords">
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should render with custom author', () => {
    render(
      <Layout author="Custom Author">
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should render with all custom props', () => {
    render(
      <Layout 
        title="Custom Title"
        description="Custom Description"
        keywords="custom,keywords"
        author="Custom Author"
      >
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should render main element with correct styling', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveStyle({ minHeight: '70vh' });
  });

  test('should render multiple children', () => {
    render(
      <Layout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <div data-testid="child3">Child 3</div>
      </Layout>
    );
    
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
    expect(screen.getByTestId('child3')).toBeInTheDocument();
  });

  test('should render with no children', () => {
    render(<Layout />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  test('should have correct component structure', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    // Check that all main components are rendered
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
