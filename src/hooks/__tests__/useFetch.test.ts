import { renderHook, waitFor, act } from '@testing-library/react';
import { useFetch } from '../useFetch';

// Mock the global fetch API
global.fetch = jest.fn();

const mockData = { id: 1, name: 'Test Data' };
const mockUrl = '/api/test';

describe('useFetch', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should fetch data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFetch(mockUrl));

    // Initial state
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for the hook to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After fetch
    expect(global.fetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
      signal: expect.any(AbortSignal)
    }));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Network error';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useFetch(mockUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should not fetch if URL is not provided', () => {
    const { result } = renderHook(() => useFetch(''));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('No URL provided');
  });

  it('should handle non-ok responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useFetch(mockUrl));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP error! status: 404');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('should abort fetch on unmount', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    const { unmount } = renderHook(() => useFetch(mockUrl));
    unmount();

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle AbortError without updating state', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useFetch(mockUrl));

    // Wait a moment for the fetch to be attempted
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // The state should remain in loading state for AbortError
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle refetch when URL is empty', () => {
    const { result } = renderHook(() => useFetch(''));

    // Call refetch on empty URL - should not cause fetch
    act(() => {
      result.current.refetch();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('No URL provided');
  });

  it('should handle refetch with valid URL', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, name: 'Refetched Data' }),
      });

    const { result } = renderHook(() => useFetch(mockUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);

    // Clear mock to track refetch call
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockData, name: 'Refetched Data' }),
    });

    // Call refetch wrapped in act
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle non-Error exceptions', async () => {
    const uniqueUrl = '/api/error-test';
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useFetch(uniqueUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('An error occurred');
  });

  it('should handle fetchData when called without URL', async () => {
    // Test the hook's initial state when URL is empty
    const { result } = renderHook(() => useFetch(''));

    // Should immediately set error state for empty URL
    expect(result.current.error).toBe('No URL provided');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });
});
