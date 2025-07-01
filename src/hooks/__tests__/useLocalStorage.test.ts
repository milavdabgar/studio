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

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with the initial value if no value in localStorage', () => {
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'initialValue')
    );
    
    const [value] = result.current;
    expect(value).toBe('initialValue');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should retrieve and return the value from localStorage if it exists', () => {
    const storedValue = JSON.stringify('storedValue');
    mockLocalStorage.setItem('testKey', storedValue);
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'initialValue')
    );
    
    const [value] = result.current;
    expect(value).toBe('storedValue');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'initialValue')
    );
    
    const [, setValue] = result.current;
    
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
    const { result } = renderHook(() => 
      useLocalStorage('counter', 0)
    );
    
    const [, setValue] = result.current;
    
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
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => 
      useLocalStorage('user', initialValue)
    );
    
    const [, setValue] = result.current;
    
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
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'value')
    );
    
    const [, , remove] = result.current;
    
    act(() => {
      remove();
    });
    
    expect(result.current[0]).toBeUndefined();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
  });

  it('should handle errors and fallback to initial value', () => {
    // Mock localStorage.getItem to throw an error
    const originalGetItem = mockLocalStorage.getItem;
    mockLocalStorage.getItem = jest.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => 
      useLocalStorage('testKey', 'fallbackValue')
    );
    
    expect(result.current[0]).toBe('fallbackValue');
    
    // Restore original implementation
    mockLocalStorage.getItem = originalGetItem;
  });
});
