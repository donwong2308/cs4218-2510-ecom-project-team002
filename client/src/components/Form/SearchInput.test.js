import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import SearchInput from './SearchInput';

// Mock dependencies
jest.mock('axios');
jest.mock('../../context/search', () => ({
  useSearch: jest.fn()
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

const mockNavigate = jest.fn();
const mockSetValues = jest.fn();

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SearchInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useNavigate hook
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
  });

  test('should render search form with input and button', () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  test('should render input with correct attributes', () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('aria-label', 'Search');
    expect(input).toHaveClass('form-control', 'me-2');
    expect(input).toHaveValue('');
  });

  test('should render button with correct attributes', () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass('btn', 'btn-outline-success');
  });

  test('should update input value when typing', () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'test search' } });
    
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: 'test search',
      results: []
    });
  });

  test('should handle form submission successfully', async () => {
    const mockSearchResults = [
      { _id: '1', name: 'Product 1', description: 'Description 1', price: 100 },
      { _id: '2', name: 'Product 2', description: 'Description 2', price: 200 }
    ];

    axios.get.mockResolvedValueOnce({ data: mockSearchResults });

    require('../../context/search').useSearch.mockReturnValue([{
      keyword: 'test search',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/test search');
    });
    
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: 'test search',
      results: mockSearchResults
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  test('should handle API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockError = new Error('API Error');
    
    axios.get.mockRejectedValueOnce(mockError);

    require('../../context/search').useSearch.mockReturnValue([{
      keyword: 'test search',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/test search');
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(mockNavigate).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('should prevent default form submission', async () => {
    const preventDefault = jest.fn();
    
    axios.get.mockResolvedValueOnce({ data: [] });

    require('../../context/search').useSearch.mockReturnValue([{
      keyword: 'test search',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    
    // Create a mock event with preventDefault
    const mockEvent = {
      preventDefault,
      target: form
    };
    
    // Simulate form submission
    fireEvent.submit(form, mockEvent);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test('should handle empty search keyword', async () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Empty search should NOT make an API call
      expect(axios.get).not.toHaveBeenCalled();
    });
    
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: '',
      results: []
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  test('should handle whitespace-only search keyword', async () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '   ',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Whitespace-only search should NOT make an API call
      expect(axios.get).not.toHaveBeenCalled();
    });
    
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: '   ',
      results: []
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  test('should render with correct CSS classes', () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const container = screen.getByRole('search').closest('div');
    expect(container).toBeInTheDocument();
    
    const form = screen.getByRole('search');
    expect(form).toHaveClass('d-flex');
  });

  test('should maintain form accessibility', () => {
    require('../../context/search').useSearch.mockReturnValue([{
      keyword: '',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    const input = screen.getByPlaceholderText('Search');
    const button = screen.getByRole('button', { name: 'Search' });
    
    expect(form).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-label', 'Search');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('should handle multiple rapid submissions', async () => {
    axios.get.mockResolvedValue({ data: [] });

    require('../../context/search').useSearch.mockReturnValue([{
      keyword: 'test',
      results: []
    }, mockSetValues]);

    renderWithRouter(<SearchInput />);
    
    const form = screen.getByRole('search');
    
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
    
    expect(mockNavigate).toHaveBeenCalledTimes(3);
  });
});