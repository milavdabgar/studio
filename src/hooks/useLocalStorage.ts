// useLocalStorage hook
import { useState } from 'react';

/**
 * Custom hook for working with localStorage
 * Provides a state value that stays in sync with localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value if no localStorage value exists
 * @returns [storedValue, setValue, removeValue]
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error('Error reading from localStorage', error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
        
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Handle errors
      console.error('Error writing to localStorage', error);
    }
  };

  // Remove the key from localStorage
  const remove = () => {
    try {
      // Update state
      setStoredValue(undefined as T);
      
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from localStorage', error);
    }
  };

  return [storedValue, setValue, remove] as const;
};
