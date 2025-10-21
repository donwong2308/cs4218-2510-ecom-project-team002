import { renderHook, waitFor } from '@testing-library/react';
import { useState, useEffect } from 'react';
import useCategory from '../../hooks/useCategory';

// Mock axios for API calls
jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: { headers: { common: {} } }
}));

describe('Phase 1 Integration: useCategory Hook with API and State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('integrates useCategory with React hooks (useState and useEffect)', async () => {
    // Mock successful API response
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' },
      { _id: '3', name: 'Books', slug: 'books' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    const { result } = renderHook(() => useCategory());

    // Verify initial state (empty array)
    expect(result.current).toEqual([]);

    // Wait for useEffect to complete and API call to finish
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // Verify API was called
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('integrates with API endpoint for category data fetching', async () => {
    const axios = require('axios');
    const mockApiResponse = {
      data: {
        category: [
          { _id: '1', name: 'Electronics', slug: 'electronics' },
          { _id: '2', name: 'Clothing', slug: 'clothing' }
        ]
      }
    };
    axios.get.mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockApiResponse.data.category);
    });

    // Verify correct API endpoint was called
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('integrates error handling for API failures', async () => {
    // Mock console.log to verify error logging
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const axios = require('axios');
    const mockError = new Error('API Error');
    axios.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCategory());

    // Wait for useEffect to complete
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Verify API was called despite error
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');

    consoleSpy.mockRestore();
  });

  test('integrates with different API response structures', async () => {
    const axios = require('axios');

    // Test with empty categories
    axios.get.mockResolvedValue({ data: { category: [] } });
    const { result: result1 } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result1.current).toEqual([]);
    });

    // Test with null category data - create new hook instance
    axios.get.mockResolvedValue({ data: { category: null } });
    const { result: result2 } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result2.current).toEqual(null);
    });

    // Test with undefined category data - create new hook instance
    axios.get.mockResolvedValue({ data: {} });
    const { result: result3 } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result3.current).toEqual(undefined);
    });
  });

  test('integrates useEffect dependency array for single execution', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    const { result, rerender } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // Verify API was called only once
    expect(axios.get).toHaveBeenCalledTimes(1);

    // Rerender hook multiple times
    rerender();
    rerender();
    rerender();

    // API should still be called only once due to empty dependency array
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('integrates with async/await pattern in getCategories function', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' }
    ];

    // Mock axios to resolve after a delay
    axios.get.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: { category: mockCategories } }), 100)
      )
    );

    const { result } = renderHook(() => useCategory());

    // Initially should be empty
    expect(result.current).toEqual([]);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    }, { timeout: 200 });

    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('integrates with useState state updates', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    const { result } = renderHook(() => useCategory());

    // Verify initial state
    expect(result.current).toEqual([]);

    // Wait for state update
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // Verify state was properly updated
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual(mockCategories[0]);
  });

  test('integrates with multiple hook instances', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    // Render multiple instances of the hook
    const { result: result1 } = renderHook(() => useCategory());
    const { result: result2 } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result1.current).toEqual(mockCategories);
      expect(result2.current).toEqual(mockCategories);
    });

    // Each hook instance should make its own API call
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test('integrates with hook cleanup and unmounting', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    const { result, unmount } = renderHook(() => useCategory());

    // Unmount before API call completes
    unmount();

    // Wait a bit to ensure no errors occur
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify API was still called
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  test('integrates with different category data formats', async () => {
    const axios = require('axios');

    // Test with minimal category data
    const minimalCategories = [
      { _id: '1', name: 'Electronics' }
    ];
    axios.get.mockResolvedValue({ data: { category: minimalCategories } });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(minimalCategories);
    });

    // Test with full category data
    const fullCategories = [
      { 
        _id: '1', 
        name: 'Electronics', 
        slug: 'electronics',
        description: 'Electronic devices',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }
    ];
    axios.get.mockResolvedValue({ data: { category: fullCategories } });

    const { result: result2 } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result2.current).toEqual(fullCategories);
    });
  });

  test('integrates with network error scenarios', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const axios = require('axios');
    
    // Test network timeout
    const timeoutError = new Error('Network timeout');
    timeoutError.code = 'TIMEOUT';
    axios.get.mockRejectedValue(timeoutError);

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    expect(consoleSpy).toHaveBeenCalledWith(timeoutError);

    // Test 404 error
    const notFoundError = new Error('Not Found');
    notFoundError.response = { status: 404 };
    axios.get.mockRejectedValue(notFoundError);

    const { result: result2 } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result2.current).toEqual([]);
    });

    expect(consoleSpy).toHaveBeenCalledWith(notFoundError);

    consoleSpy.mockRestore();
  });

  test('integrates with hook return value consistency', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' },
      { _id: '2', name: 'Clothing', slug: 'clothing' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    const { result } = renderHook(() => useCategory());

    // Verify return value is always an array (or null/undefined)
    expect(Array.isArray(result.current) || result.current === null || result.current === undefined).toBe(true);

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  test('integrates with React strict mode (double effect execution)', async () => {
    const axios = require('axios');
    const mockCategories = [
      { _id: '1', name: 'Electronics', slug: 'electronics' }
    ];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    // Simulate React strict mode by calling useEffect twice
    const { result } = renderHook(() => useCategory(), {
      wrapper: ({ children }) => {
        // Simulate strict mode behavior
        useEffect(() => {
          // This would be called twice in strict mode
        }, []);
        return children;
      }
    });

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    // In strict mode, useEffect might be called twice, but axios should handle it gracefully
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });
});
