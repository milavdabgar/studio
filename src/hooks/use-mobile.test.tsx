// React import not needed for hooks tests
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock window.matchMedia
const mockMatchMedia = jest.fn();

// Define the mock with proper typing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('useIsMobile', () => {
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  };

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList);
    
    // Reset window.innerWidth to default desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for desktop screen sizes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop size
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('should return true for mobile screen sizes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Mobile size
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  it('should return true for screen sizes just under the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767, // Just under 768px breakpoint
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  it('should return false for screen sizes at the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // Exactly at breakpoint
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });

  it('should add and remove event listener on mount and unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );

    unmount();

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should update state when media query changes', () => {
    // Start with desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);

    // Simulate media query change to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      // Call the change handler that was registered
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1] as () => void;
      changeHandler();
    });

    expect(result.current).toBe(true);
  });

  it('should handle rapid screen size changes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);

    // Multiple rapid changes
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1] as () => void;
      changeHandler();
    });

    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1] as () => void;
      changeHandler();
    });

    expect(result.current).toBe(false);
  });

  it('should use 768px as the mobile breakpoint', () => {
    renderHook(() => useIsMobile());
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('should handle edge cases with very small screen sizes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1, // Very small
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  it('should handle edge cases with very large screen sizes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 5000, // Very large
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });

  it('should convert undefined state to boolean', () => {
    // The hook initially sets state to undefined, then updates it
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    
    // Should always return a boolean, never undefined
    expect(typeof result.current).toBe('boolean');
    expect(result.current).toBe(false);
  });
});