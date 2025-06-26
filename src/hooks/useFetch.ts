// useFetch hook
import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: !url ? false : true,
    error: !url ? 'No URL provided' : null,
  });

  const fetchData = useCallback(async (abortController?: AbortController) => {
    if (!url) {
      setState({
        data: null,
        loading: false,
        error: 'No URL provided',
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Don't update state if request was aborted
      }
      
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [url, options]);

  useEffect(() => {
    if (!url) return;
    
    const abortController = new AbortController();
    fetchData(abortController);

    return () => {
      abortController.abort();
    };
  }, [fetchData, url]);

  const refetch = useCallback(() => {
    if (url) {
      fetchData();
    }
  }, [fetchData, url]);

  return { ...state, refetch };
};
