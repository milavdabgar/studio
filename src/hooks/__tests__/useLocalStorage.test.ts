import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock the localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Save original localStorage
const originalLocalStorage = window.localStorage;

// Setup mock before each test
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', { 
    value: mockLocalStorage,
    writable: true 
  });
});

// Restore original after all tests
afterAll(() => {
  Object.defineProperty(window, 'localStorage', { 
    value: originalLocalStorage,
    writable: true 
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with the initial value if no value in localStorage', () => {
    // Ensure getItem returns null to simulate empty localStorage
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'initialValue')
    );
    
    const [value] = result.current;
    expect(value).toBe('initialValue');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should retrieve and return the value from localStorage if it exists', () => {
    // Mock the localStorage to return a specific value
    const storedValue = JSON.stringify('storedValue');
    mockLocalStorage.getItem.mockReturnValueOnce(storedValue);
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'initialValue')
    );
    
    const [value] = result.current;
    expect(value).toBe('storedValue');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should update localStorage when value changes', () => {
    // Initial setup
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'initialValue')
    );
    
    const [, setValue] = result.current;
    
    // Reset mocks to clearly see the setItem call
    jest.clearAllMocks();
    
    act(() => {
      setValue('newValue');
    });
    
    expect(result.current[0]).toBe('newValue');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'testKey', 
      JSON.stringify('newValue')
    );
  });

  it('should handle function updates', () => {
    // Initial setup
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(0));
    
    const { result } = renderHook(() => 
      useLocalStorage('counter', 0)
    );
    
    const [, setValue] = result.current;
    
    // Reset mocks to clearly see the setItem call
    jest.clearAllMocks();
    
    act(() => {
      setValue(prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'counter', 
      JSON.stringify(1)
    );
  });

  it('should handle objects and arrays', () => {
    // Initial setup
    const initialValue = { name: 'John', age: 30 };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(initialValue));
    
    const { result } = renderHook(() => 
      useLocalStorage('user', initialValue)
    );
    
    const [, setValue] = result.current;
    
    // Reset mocks to clearly see the setItem call
    jest.clearAllMocks();
    
    act(() => {
      setValue({ ...initialValue, age: 31 });
    });
    
    expect(result.current[0]).toEqual({ name: 'John', age: 31 });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user', 
      JSON.stringify({ name: 'John', age: 31 })
    );
  });

  it('should handle removal of the key', () => {
    // Initial setup
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify('value'));
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'value')
    );
    
    const [, , remove] = result.current;
    
    // Reset mocks to clearly see the removeItem call
    jest.clearAllMocks();
    
    act(() => {
      remove();
    });
    
    expect(result.current[0]).toBeUndefined();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
  });

  it('should handle errors and fallback to initial value', () => {
    // Mock localStorage.getItem to throw an error
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'fallbackValue')
    );
    
    expect(result.current[0]).toBe('fallbackValue');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });
});
