import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Create a simple in-memory storage object
const mockStorage: Record<string, string> = {};

// Mocks for Storage prototype methods
let getItemSpy: jest.SpyInstance;
let setItemSpy: jest.SpyInstance;
let removeItemSpy: jest.SpyInstance;

// Setup before running any tests
beforeAll(() => {
  // Create mocks that are compatible with both local and CI environments
  // Need to save references to the spies to use them in tests
  getItemSpy = jest.spyOn(window.localStorage, 'getItem').mockImplementation(
    (key: string) => mockStorage[key] || null
  );
  
  setItemSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation(
    (key: string, value: string) => {
      mockStorage[key] = value;
    }
  );
  
  removeItemSpy = jest.spyOn(window.localStorage, 'removeItem').mockImplementation(
    (key: string) => {
      delete mockStorage[key];
    }
  );
  
  jest.spyOn(window.localStorage, 'clear').mockImplementation(() => {
    Object.keys(mockStorage).forEach(key => {
      delete mockStorage[key];
    });
  });
});

// Clean up after all tests are done
afterAll(() => {
  jest.restoreAllMocks();
});

describe('useLocalStorage', () => {
  // Reset mocks between tests
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => {
      delete mockStorage[key];
    });
    
    // Clear all mock function calls
    jest.clearAllMocks();
  });

  test('should initialize with the initial value if no value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
    
    expect(result.current[0]).toBe('initialValue');
    expect(getItemSpy).toHaveBeenCalledWith('testKey');
  });

  test('should retrieve and return the value from localStorage if it exists', () => {
    // Manually set up the mock storage before the test
    mockStorage['testKey'] = JSON.stringify('storedValue');
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
    
    expect(result.current[0]).toBe('storedValue');
    expect(getItemSpy).toHaveBeenCalledWith('testKey');
  });

  test('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
    
    act(() => {
      result.current[1]('newValue');
    });
    
    expect(result.current[0]).toBe('newValue');
    expect(setItemSpy).toHaveBeenCalledWith('testKey', JSON.stringify('newValue'));
    expect(mockStorage['testKey']).toBe(JSON.stringify('newValue'));
  });

  test('should handle function updates', () => {
    mockStorage['counter'] = JSON.stringify(0);
    
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(setItemSpy).toHaveBeenCalledWith('counter', JSON.stringify(1));
    expect(mockStorage['counter']).toBe(JSON.stringify(1));
  });

  test('should handle objects and arrays', () => {
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialValue));
    
    act(() => {
      result.current[1]({ ...initialValue, age: 31 });
    });
    
    expect(result.current[0]).toEqual({ name: 'John', age: 31 });
    expect(setItemSpy).toHaveBeenCalledWith('user', JSON.stringify({ name: 'John', age: 31 }));
    expect(mockStorage['user']).toBe(JSON.stringify({ name: 'John', age: 31 }));
  });

  test('should handle removal of the key', () => {
    mockStorage['testKey'] = JSON.stringify('value');
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'value'));
    
    act(() => {
      result.current[2]();
    });
    
    expect(result.current[0]).toBeUndefined();
    expect(removeItemSpy).toHaveBeenCalledWith('testKey');
    expect(mockStorage['testKey']).toBeUndefined();
  });

  test('should handle errors and fallback to initial value', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Override getItem to throw an error for this test
    getItemSpy.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'fallbackValue'));
    
    expect(result.current[0]).toBe('fallbackValue');
    expect(getItemSpy).toHaveBeenCalledWith('testKey');
    expect(consoleSpy).toHaveBeenCalledWith('Error reading from localStorage', expect.any(Error));
    
    // Restore console.error
    consoleSpy.mockRestore();
  });
});
