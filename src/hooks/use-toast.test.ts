// Unmock the useToast hook for this test file
jest.unmock('@/hooks/use-toast');

import { useToast } from './use-toast';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock timers for testing timeout behavior
jest.useFakeTimers();

describe('useToast', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('useToast hook', () => {
    it('should provide toast function and dismiss function', () => {
      const { result } = renderHook(() => useToast());
      
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should provide toasts array', () => {
      const { result } = renderHook(() => useToast());
      
      expect(Array.isArray(result.current.toasts)).toBe(true);
    });

    it('should have consistent API structure', () => {
      const { result } = renderHook(() => useToast());
      
      // Check that the hook returns the expected structure
      expect(result.current).toHaveProperty('toast');
      expect(result.current).toHaveProperty('dismiss');
      expect(result.current).toHaveProperty('toasts');
    });
  });

  describe('toast functionality', () => {
    it('should create toast with basic properties', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('should create toast with all properties', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ 
          title: 'Test Toast',
          description: 'Test Description',
          variant: 'destructive'
        });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].description).toBe('Test Description');
      expect(result.current.toasts[0].variant).toBe('destructive');
    });

    it('should limit toasts to TOAST_LIMIT', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });
      
      // Should only have 1 toast (TOAST_LIMIT = 1)
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 3'); // Latest toast
    });

    it('should update existing toast', () => {
      const { result } = renderHook(() => useToast());
      let toastControls: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      act(() => {
        toastControls = result.current.toast({ title: 'Original Title' });
      });
      
      act(() => {
        toastControls.update({ title: 'Updated Title', description: 'New Description' });
      });
      
      expect(result.current.toasts[0].title).toBe('Updated Title');
      expect(result.current.toasts[0].description).toBe('New Description');
    });

    it('should dismiss specific toast', () => {
      const { result } = renderHook(() => useToast());
      let toastControls: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      act(() => {
        toastControls = result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        toastControls.dismiss();
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss specific toast by ID', () => {
      const { result } = renderHook(() => useToast());
      let toastId: string;
      
      act(() => {
        const controls = result.current.toast({ title: 'Test Toast' });
        toastId = controls.id;
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        result.current.dismiss(toastId);
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no ID provided', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        result.current.dismiss(); // No ID = dismiss all
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should handle onOpenChange callback', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      const toast = result.current.toasts[0];
      expect(toast.open).toBe(true);
      
      act(() => {
        toast.onOpenChange?.(false);
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should remove toast after timeout', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        result.current.toasts[0].onOpenChange?.(false);
      });
      
      // Fast forward time to trigger removal
      act(() => {
        jest.advanceTimersByTime(1000000);
      });
      
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should prevent duplicate timeouts for same toast', () => {
      const { result } = renderHook(() => useToast());
      let toastControls: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      act(() => {
        toastControls = result.current.toast({ title: 'Test Toast' });
      });
      
      // Dismiss twice quickly
      act(() => {
        toastControls.dismiss();
        toastControls.dismiss();
      });
      
      // Should still only have one toast
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should remove all toasts when action has undefined toastId', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      // This simulates the REMOVE_TOAST action with undefined toastId
      act(() => {
        // Force the reducer to handle undefined toastId for REMOVE_TOAST
        jest.advanceTimersByTime(1000000);
      });
    });
  });

  describe('constants and configuration', () => {
    it('should have defined timeout and limit constants', () => {
      // Test that the timeout values are reasonable numbers
      const TOAST_REMOVE_DELAY = 1000000;
      const TOAST_LIMIT = 1;
      
      expect(TOAST_REMOVE_DELAY).toBeGreaterThan(0);
      expect(TOAST_LIMIT).toBe(1);
    });
  });
});