import { renderHook, waitFor } from '@testing-library/react';
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
    expect(global.fetch).toHaveBeenCalledWith(mockUrl);
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
});
