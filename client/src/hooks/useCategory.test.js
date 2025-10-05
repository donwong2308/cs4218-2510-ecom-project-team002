import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import useCategory from './useCategory';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('useCategory Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with empty categories array', () => {
    const { result } = renderHook(() => useCategory());
    
    expect(result.current).toEqual([]);
  });

  test('should fetch categories successfully', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' },
      { _id: '3', name: 'Books', slug: 'books' }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: mockCategories
      }
    });

    const { result } = renderHook(() => useCategory());

    // Initially should be empty
    expect(result.current).toEqual([]);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // Verify axios was called with correct endpoint
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('should handle API response with undefined category data', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: undefined
      }
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('should handle API response with null category data', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: null
      }
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toBeNull();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('should handle API response with empty category array', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: []
      }
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('should handle API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const mockError = new Error('Network Error');
    mockedAxios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useCategory());

    // Should remain empty array even after error
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    
    // Verify axios was called
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    
    consoleSpy.mockRestore();
  });

  test('should handle API error with response data', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const mockError = new Error('Request failed');
    mockError.response = {
      data: {
        success: false,
        message: 'Server error'
      }
    };
    mockedAxios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useCategory());

    // Should remain empty array even after error
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    
    consoleSpy.mockRestore();
  });

  test('should only call API once on mount', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: mockCategories
      }
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // Verify axios was called only once
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('should handle malformed API response', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        // Missing category field
        success: true
      }
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('should handle API response with nested category structure', async () => {
    const mockCategories = [
      { 
        _id: '1', 
        name: 'Electronics', 
        slug: 'electronics',
        products: [
          { _id: 'p1', name: 'Laptop' },
          { _id: 'p2', name: 'Phone' }
        ]
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: mockCategories
      }
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('should maintain state consistency across re-renders', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: mockCategories
      }
    });

    const { result, rerender } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // Re-render the hook
    rerender();

    // State should remain the same
    expect(result.current).toEqual(mockCategories);
    
    // API should still only be called once
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
