import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchInput from '../SearchInput';
import { SearchProvider } from '../../../context/search';

// Mock axios for API calls
jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: { headers: { common: {} } }
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Phase 1 Integration: SearchInput Component with Context and API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSearchInput = () => {
    return render(
      <MemoryRouter>
        <SearchProvider>
          <SearchInput />
        </SearchProvider>
      </MemoryRouter>
    );
  };

  test('integrates SearchInput with Layout structure and Bootstrap classes', () => {
    renderSearchInput();

    // Verify Bootstrap form structure
    const form = screen.getByRole('search');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('d-flex');

    // Verify Bootstrap input classes
    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('form-control', 'me-2');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', 'Search');
    expect(input).toHaveAttribute('aria-label', 'Search');

    // Verify Bootstrap button classes
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-outline-success');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('integrates with search context for state management', () => {
    renderSearchInput();

    // Verify input is connected to search context
    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(''); // Initial empty value from context

    // Verify input updates context state
    fireEvent.change(input, { target: { value: 'test search' } });
    expect(input).toHaveValue('test search');
  });

  test('integrates with React Router navigation', async () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });

    // Enter search term
    fireEvent.change(input, { target: { value: 'electronics' } });

    // Mock successful API response
    const axios = require('axios');
    axios.get.mockResolvedValue({
      data: [
        { _id: '1', name: 'Laptop', price: 999 },
        { _id: '2', name: 'Phone', price: 599 }
      ]
    });

    // Submit form
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('integrates with API calls for search functionality', async () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });

    // Enter search term
    fireEvent.change(input, { target: { value: 'laptop' } });

    // Mock API response
    const axios = require('axios');
    const mockSearchResults = [
      { _id: '1', name: 'Gaming Laptop', price: 1299 },
      { _id: '2', name: 'Business Laptop', price: 899 }
    ];
    axios.get.mockResolvedValue({ data: mockSearchResults });

    // Submit form
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/laptop');
    });
  });

  test('integrates form submission with preventDefault', async () => {
    renderSearchInput();

    const form = screen.getByRole('search');
    const input = screen.getByRole('searchbox');

    // Enter search term
    fireEvent.change(input, { target: { value: 'test' } });

    // Mock API response
    const axios = require('axios');
    axios.get.mockResolvedValue({ data: [] });

    // Mock preventDefault
    const preventDefault = jest.fn();
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    Object.defineProperty(submitEvent, 'preventDefault', {
      value: preventDefault,
      writable: true
    });

    // Submit form
    fireEvent(form, submitEvent);

    await waitFor(() => {
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  test('integrates error handling for API failures', async () => {
    // Mock console.log to verify error logging
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });

    // Enter search term
    fireEvent.change(input, { target: { value: 'error test' } });

    // Mock API error
    const axios = require('axios');
    const mockError = new Error('API Error');
    axios.get.mockRejectedValue(mockError);

    // Submit form
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });

    // Verify navigation is not called on error
    expect(mockNavigate).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('integrates accessibility features with ARIA attributes', () => {
    renderSearchInput();

    // Verify form has proper role
    const form = screen.getByRole('search');
    expect(form).toBeInTheDocument();

    // Verify input has proper ARIA attributes
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search');
    expect(input).toHaveAttribute('type', 'search');

    // Verify button is accessible
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeInTheDocument();
  });

  test('integrates Bootstrap responsive design classes', () => {
    renderSearchInput();

    // Verify responsive flexbox classes
    const form = screen.getByRole('search');
    expect(form).toHaveClass('d-flex');

    // Verify input spacing classes
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('me-2'); // margin-end for spacing

    // Verify button styling classes
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toHaveClass('btn', 'btn-outline-success');
  });

  test('integrates search context state updates', async () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });

    // Test context state updates
    fireEvent.change(input, { target: { value: 'smartphone' } });
    expect(input).toHaveValue('smartphone');

    // Mock API response
    const axios = require('axios');
    const mockResults = [{ _id: '1', name: 'iPhone', price: 999 }];
    axios.get.mockResolvedValue({ data: mockResults });

    // Submit form
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/smartphone');
    });
  });

  test('integrates with different search keywords', async () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });

    // Test multiple search terms
    const searchTerms = ['books', 'clothing', 'electronics'];
    
    for (const term of searchTerms) {
      // Clear previous calls
      jest.clearAllMocks();
      
      // Enter search term
      fireEvent.change(input, { target: { value: term } });
      
      // Mock API response
      const axios = require('axios');
      axios.get.mockResolvedValue({ data: [] });
      
      // Submit form
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/search/${term}`);
        expect(mockNavigate).toHaveBeenCalledWith('/search');
      });
    }
  });

  test('integrates form validation and input handling', () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');

    // Test empty input
    expect(input).toHaveValue('');

    // Test input with spaces
    fireEvent.change(input, { target: { value: '   ' } });
    expect(input).toHaveValue('   ');

    // Test input with special characters
    fireEvent.change(input, { target: { value: 'test@#$%' } });
    expect(input).toHaveValue('test@#$%');

    // Test long input
    const longInput = 'a'.repeat(100);
    fireEvent.change(input, { target: { value: longInput } });
    expect(input).toHaveValue(longInput);
  });

  test('integrates keyboard navigation and form submission', async () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const form = screen.getByRole('search');

    // Enter search term
    fireEvent.change(input, { target: { value: 'keyboard test' } });

    // Mock API response
    const axios = require('axios');
    axios.get.mockResolvedValue({ data: [] });

    // Submit form using Enter key on the form element
    fireEvent.submit(form);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/keyboard test');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('integrates component lifecycle with context provider', () => {
    // Test that component renders properly within SearchProvider
    renderSearchInput();

    // Verify all elements are present
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();

    // Verify initial state from context
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('');
  });

  test('integrates with search results context updates', async () => {
    renderSearchInput();

    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });

    // Enter search term
    fireEvent.change(input, { target: { value: 'context test' } });

    // Mock API response with specific data structure
    const axios = require('axios');
    const mockSearchResults = [
      { _id: '1', name: 'Test Product 1', price: 100 },
      { _id: '2', name: 'Test Product 2', price: 200 }
    ];
    axios.get.mockResolvedValue({ data: mockSearchResults });

    // Submit form
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/context test');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });
});
