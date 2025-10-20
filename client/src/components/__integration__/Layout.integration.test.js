import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';
import { AuthProvider } from '../../context/auth';
import { CartProvider } from '../../context/cart';
import { SearchProvider } from '../../context/search';

// Mock axios to prevent AuthProvider from failing
jest.mock('axios', () => ({
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster Component</div>
}));

// Mock react-helmet
jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>
}));

// Mock Header component
jest.mock('../Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header Component</div>;
  };
});

// Mock Footer component
jest.mock('../Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer Component</div>;
  };
});

describe('Phase 1 Integration: Layout Component with Header, Footer, and Metadata', () => {
  const renderLayout = (props = {}) => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Layout {...props}>
                <div data-testid="children">Test Children</div>
              </Layout>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  test('integrates Layout with Header, Footer, and main content structure', () => {
    renderLayout();

    // Verify Header integration
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header Component');

    // Verify Footer integration
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer Component');

    // Verify main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ minHeight: '70vh' });

    // Verify children are rendered
    const children = screen.getByTestId('children');
    expect(children).toBeInTheDocument();
    expect(children).toHaveTextContent('Test Children');
  });

  test('integrates with Helmet for metadata management', () => {
    renderLayout();

    // Verify Helmet component is rendered
    const helmet = screen.getByTestId('helmet');
    expect(helmet).toBeInTheDocument();

    // Verify Helmet contains meta tags
    const metaCharset = helmet.querySelector('meta[charset="utf-8"]');
    expect(metaCharset).toBeInTheDocument();

    const metaDescription = helmet.querySelector('meta[name="description"]');
    expect(metaDescription).toBeInTheDocument();

    const metaKeywords = helmet.querySelector('meta[name="keywords"]');
    expect(metaKeywords).toBeInTheDocument();

    const metaAuthor = helmet.querySelector('meta[name="author"]');
    expect(metaAuthor).toBeInTheDocument();

    const title = helmet.querySelector('title');
    expect(title).toBeInTheDocument();
  });

  test('integrates with react-hot-toast Toaster component', () => {
    renderLayout();

    // Verify Toaster component is rendered
    const toaster = screen.getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
    expect(toaster).toHaveTextContent('Toaster Component');

    // Verify Toaster is inside main content area
    const main = screen.getByRole('main');
    expect(main).toContainElement(toaster);
  });

  test('integrates with custom props for metadata', () => {
    const customProps = {
      title: 'Custom Page Title',
      description: 'Custom page description',
      keywords: 'custom,keywords,test',
      author: 'Custom Author'
    };

    renderLayout(customProps);

    const helmet = screen.getByTestId('helmet');

    // Verify custom title
    const title = helmet.querySelector('title');
    expect(title).toHaveTextContent('Custom Page Title');

    // Verify custom description
    const metaDescription = helmet.querySelector('meta[name="description"]');
    expect(metaDescription).toHaveAttribute('content', 'Custom page description');

    // Verify custom keywords
    const metaKeywords = helmet.querySelector('meta[name="keywords"]');
    expect(metaKeywords).toHaveAttribute('content', 'custom,keywords,test');

    // Verify custom author
    const metaAuthor = helmet.querySelector('meta[name="author"]');
    expect(metaAuthor).toHaveAttribute('content', 'Custom Author');
  });

  test('integrates with default props when no props provided', () => {
    renderLayout();

    const helmet = screen.getByTestId('helmet');

    // Verify default title
    const title = helmet.querySelector('title');
    expect(title).toHaveTextContent('Ecommerce app - shop now');

    // Verify default description
    const metaDescription = helmet.querySelector('meta[name="description"]');
    expect(metaDescription).toHaveAttribute('content', 'mern stack project');

    // Verify default keywords
    const metaKeywords = helmet.querySelector('meta[name="keywords"]');
    expect(metaKeywords).toHaveAttribute('content', 'mern,react,node,mongodb');

    // Verify default author
    const metaAuthor = helmet.querySelector('meta[name="author"]');
    expect(metaAuthor).toHaveAttribute('content', 'Techinfoyt');
  });

  test('integrates with partial props (some props provided)', () => {
    const partialProps = {
      title: 'Partial Title',
      description: 'Partial Description'
    };

    renderLayout(partialProps);

    const helmet = screen.getByTestId('helmet');

    // Verify provided props
    const title = helmet.querySelector('title');
    expect(title).toHaveTextContent('Partial Title');

    const metaDescription = helmet.querySelector('meta[name="description"]');
    expect(metaDescription).toHaveAttribute('content', 'Partial Description');

    // Verify default props for missing values
    const metaKeywords = helmet.querySelector('meta[name="keywords"]');
    expect(metaKeywords).toHaveAttribute('content', 'mern,react,node,mongodb');

    const metaAuthor = helmet.querySelector('meta[name="author"]');
    expect(metaAuthor).toHaveAttribute('content', 'Techinfoyt');
  });

  test('integrates with proper HTML structure and semantic elements', () => {
    const { container } = renderLayout();

    // Verify main element has proper role
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main.tagName).toBe('MAIN');

    // Verify proper nesting structure using the render container
    expect(container).toContainElement(screen.getByTestId('header'));
    expect(container).toContainElement(main);
    expect(container).toContainElement(screen.getByTestId('footer'));
    expect(main).toContainElement(screen.getByTestId('toaster'));
    expect(main).toContainElement(screen.getByTestId('children'));
  });

  test('integrates with context providers for Header and Footer', () => {
    renderLayout();

    // Verify Header and Footer are rendered (they depend on context providers)
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    // Verify main content is rendered
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  test('integrates with different children content', () => {
    const TestComponent = () => (
      <div>
        <h1>Test Page</h1>
        <p>This is test content</p>
        <button>Test Button</button>
      </div>
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Layout>
                <TestComponent />
              </Layout>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Header and Footer are still present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    // Verify custom children content is rendered
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('This is test content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  test('integrates with multiple children components', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Layout>
                <div data-testid="child1">Child 1</div>
                <div data-testid="child2">Child 2</div>
                <div data-testid="child3">Child 3</div>
              </Layout>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify all children are rendered
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
    expect(screen.getByTestId('child3')).toBeInTheDocument();

    // Verify Layout structure is maintained
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('integrates with empty children gracefully', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Layout />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Layout structure is still present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();

    // Verify main content area is empty but present
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ minHeight: '70vh' });
  });

  test('integrates with complex metadata scenarios', () => {
    const complexProps = {
      title: 'Complex Title with Special Characters & Symbols',
      description: 'Description with "quotes" and <html> tags',
      keywords: 'keyword1,keyword2,keyword3,special-chars',
      author: 'Author Name with Spaces'
    };

    renderLayout(complexProps);

    const helmet = screen.getByTestId('helmet');

    // Verify complex title is handled
    const title = helmet.querySelector('title');
    expect(title).toHaveTextContent('Complex Title with Special Characters & Symbols');

    // Verify complex description is handled
    const metaDescription = helmet.querySelector('meta[name="description"]');
    expect(metaDescription).toHaveAttribute('content', 'Description with "quotes" and <html> tags');

    // Verify complex keywords are handled
    const metaKeywords = helmet.querySelector('meta[name="keywords"]');
    expect(metaKeywords).toHaveAttribute('content', 'keyword1,keyword2,keyword3,special-chars');

    // Verify complex author is handled
    const metaAuthor = helmet.querySelector('meta[name="author"]');
    expect(metaAuthor).toHaveAttribute('content', 'Author Name with Spaces');
  });

  test('integrates with Layout as a wrapper component', () => {
    const WrappedComponent = () => (
      <div data-testid="wrapped-component">
        <h2>Wrapped Component</h2>
        <p>This component is wrapped by Layout</p>
      </div>
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Layout title="Wrapped Page">
                <WrappedComponent />
              </Layout>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Layout provides the wrapper structure
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Verify wrapped component is rendered inside main
    const wrappedComponent = screen.getByTestId('wrapped-component');
    expect(wrappedComponent).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(wrappedComponent);

    // Verify custom title is applied
    const helmet = screen.getByTestId('helmet');
    const title = helmet.querySelector('title');
    expect(title).toHaveTextContent('Wrapped Page');
  });
});
