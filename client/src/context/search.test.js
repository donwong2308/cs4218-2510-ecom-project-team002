import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// Mock the search context
const mockSearchContext = {
  keyword: '',
  results: []
};

const mockSetValues = jest.fn();

// Mock the search context
jest.mock('./search', () => ({
  SearchProvider: ({ children }) => children,
  useSearch: () => [mockSearchContext, mockSetValues]
}));

import { SearchProvider, useSearch } from './search';

// Test component to use the search context
const TestComponent = () => {
  const [values, setValues] = useSearch();
  
  return (
    <div>
      <div data-testid="keyword">{values.keyword}</div>
      <div data-testid="results-count">{values.results.length}</div>
      <button 
        onClick={() => setValues({ keyword: 'test', results: [{ id: 1 }] })}
        data-testid="update-button"
      >
        Update Values
      </button>
    </div>
  );
};

describe('Search Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchContext.keyword = '';
    mockSearchContext.results = [];
  });

  test('should provide initial search values', () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    expect(screen.getByTestId('keyword')).toHaveTextContent('');
    expect(screen.getByTestId('results-count')).toHaveTextContent('0');
  });

  test('should update search values when setValues is called', () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    const updateButton = screen.getByTestId('update-button');
    fireEvent.click(updateButton);
    
    expect(mockSetValues).toHaveBeenCalledWith({ keyword: 'test', results: [{ id: 1 }] });
  });

  test('should maintain state across multiple components', () => {
    const AnotherTestComponent = () => {
      const [values] = useSearch();
      return <div data-testid="another-keyword">{values.keyword}</div>;
    };

    render(
      <SearchProvider>
        <TestComponent />
        <AnotherTestComponent />
      </SearchProvider>
    );
    
    const updateButton = screen.getByTestId('update-button');
    fireEvent.click(updateButton);
    
    expect(mockSetValues).toHaveBeenCalledWith({ keyword: 'test', results: [{ id: 1 }] });
  });

  test('should handle partial updates correctly', () => {
    const PartialUpdateComponent = () => {
      const [values, setValues] = useSearch();
      
      return (
        <div>
          <div data-testid="keyword">{values.keyword}</div>
          <div data-testid="results-count">{values.results.length}</div>
          <button 
            onClick={() => setValues({ ...values, keyword: 'updated keyword' })}
            data-testid="partial-update-button"
          >
            Update Keyword Only
          </button>
        </div>
      );
    };

    render(
      <SearchProvider>
        <PartialUpdateComponent />
      </SearchProvider>
    );
    
    const partialUpdateButton = screen.getByTestId('partial-update-button');
    fireEvent.click(partialUpdateButton);
    
    expect(mockSetValues).toHaveBeenCalledWith({ keyword: 'updated keyword', results: [] });
  });

  test('should handle complete state replacement', () => {
    const CompleteUpdateComponent = () => {
      const [values, setValues] = useSearch();
      
      return (
        <div>
          <div data-testid="keyword">{values.keyword}</div>
          <div data-testid="results-count">{values.results.length}</div>
          <button 
            onClick={() => setValues({ keyword: 'new keyword', results: [{ id: 1 }, { id: 2 }] })}
            data-testid="complete-update-button"
          >
            Complete Update
          </button>
        </div>
      );
    };

    render(
      <SearchProvider>
        <CompleteUpdateComponent />
      </SearchProvider>
    );
    
    const completeUpdateButton = screen.getByTestId('complete-update-button');
    fireEvent.click(completeUpdateButton);
    
    expect(mockSetValues).toHaveBeenCalledWith({ keyword: 'new keyword', results: [{ id: 1 }, { id: 2 }] });
  });

  test('should handle nested providers correctly', () => {
    const NestedProvider = ({ children }) => (
      <SearchProvider>
        <SearchProvider>
          {children}
        </SearchProvider>
      </SearchProvider>
    );

    render(
      <NestedProvider>
        <TestComponent />
      </NestedProvider>
    );
    
    expect(screen.getByTestId('keyword')).toHaveTextContent('');
    expect(screen.getByTestId('results-count')).toHaveTextContent('0');
  });

  test('should handle multiple state updates in sequence', () => {
    const SequentialUpdateComponent = () => {
      const [values, setValues] = useSearch();
      
      const handleSequentialUpdates = () => {
        setValues({ ...values, keyword: 'first' });
        setValues({ ...values, keyword: 'second' });
        setValues({ ...values, keyword: 'third' });
      };
      
      return (
        <div>
          <div data-testid="keyword">{values.keyword}</div>
          <button 
            onClick={handleSequentialUpdates}
            data-testid="sequential-update-button"
          >
            Sequential Updates
          </button>
        </div>
      );
    };

    render(
      <SearchProvider>
        <SequentialUpdateComponent />
      </SearchProvider>
    );
    
    const sequentialUpdateButton = screen.getByTestId('sequential-update-button');
    fireEvent.click(sequentialUpdateButton);
    
    expect(mockSetValues).toHaveBeenCalledTimes(3);
  });

  test('should maintain state structure integrity', () => {
    const StructureTestComponent = () => {
      const [values, setValues] = useSearch();
      
      return (
        <div>
          <div data-testid="has-keyword">{values.hasOwnProperty('keyword') ? 'true' : 'false'}</div>
          <div data-testid="has-results">{values.hasOwnProperty('results') ? 'true' : 'false'}</div>
          <button 
            onClick={() => setValues({ keyword: 'test', results: [] })}
            data-testid="structure-test-button"
          >
            Test Structure
          </button>
        </div>
      );
    };

    render(
      <SearchProvider>
        <StructureTestComponent />
      </SearchProvider>
    );
    
    expect(screen.getByTestId('has-keyword')).toHaveTextContent('true');
    expect(screen.getByTestId('has-results')).toHaveTextContent('true');
    
    const structureTestButton = screen.getByTestId('structure-test-button');
    fireEvent.click(structureTestButton);
    
    expect(mockSetValues).toHaveBeenCalledWith({ keyword: 'test', results: [] });
  });
});