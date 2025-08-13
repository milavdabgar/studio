import { useState, useEffect, useCallback } from 'react';
import { clientCache, cacheTTL } from '@/lib/cache/client-cache';

interface UseCachedApiOptions {
  ttl?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface UseCachedApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useCachedApi<T>(
  key: string,
  apiCall: () => Promise<T>,
  options: UseCachedApiOptions = {}
): UseCachedApiResult<T> {
  const {
    ttl = cacheTTL.MEDIUM,
    enabled = true,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await clientCache.getOrSet(key, apiCall, ttl);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, apiCall, ttl, enabled, onError, onSuccess]);

  const invalidate = useCallback(() => {
    clientCache.delete(key);
  }, [key]);

  const refetch = useCallback(async () => {
    invalidate();
    await fetchData();
  }, [invalidate, fetchData]);

  useEffect(() => {
    if (enabled) {
      // Check cache first
      const cached = clientCache.get<T>(key);
      if (cached) {
        setData(cached);
        setLoading(false);
      } else {
        fetchData();
      }
    }
  }, [key, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

// Specialized hook for user data
export function useCachedUser(userId: string) {
  return useCachedApi(
    `user:${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    { ttl: cacheTTL.MEDIUM }
  );
}

// Specialized hook for students data
export function useCachedStudents(departmentId?: string) {
  const key = departmentId ? `students:${departmentId}` : 'students:all';
  
  return useCachedApi(
    key,
    async () => {
      const url = departmentId 
        ? `/api/students?departmentId=${departmentId}`
        : '/api/students';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    { ttl: cacheTTL.MEDIUM }
  );
}

// Specialized hook for courses data
export function useCachedCourses(programId?: string) {
  const key = programId ? `courses:${programId}` : 'courses:all';
  
  return useCachedApi(
    key,
    async () => {
      const url = programId 
        ? `/api/courses?programId=${programId}`
        : '/api/courses';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    { ttl: cacheTTL.LONG }
  );
}

// Hook for batch invalidation
export function useCacheInvalidation() {
  const invalidateStudents = useCallback((departmentId?: string) => {
    if (departmentId) {
      clientCache.delete(`students:${departmentId}`);
    } else {
      clientCache.invalidatePattern('^students:');
    }
  }, []);

  const invalidateCourses = useCallback((programId?: string) => {
    if (programId) {
      clientCache.delete(`courses:${programId}`);
    } else {
      clientCache.invalidatePattern('^courses:');
    }
  }, []);

  const invalidateAll = useCallback(() => {
    clientCache.clear();
  }, []);

  return {
    invalidateStudents,
    invalidateCourses,
    invalidateAll,
    invalidatePattern: clientCache.invalidatePattern.bind(clientCache)
  };
}