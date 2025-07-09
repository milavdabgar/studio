// API utility functions

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || response.statusText);
  }

  return response;
};

export const handleApiError = (error: unknown): { status: number; message: string; isNetworkError: boolean } => {
  if (error instanceof ApiError) {
    return {
      status: error.statusCode,
      message: error.message,
      isNetworkError: false,
    };
  }
  
  if (error && typeof error === 'object' && 'response' in error) {
    const errorWithResponse = error as { response: { status?: number; data?: { message?: string } } };
    return {
      status: errorWithResponse.response.status || 0,
      message: errorWithResponse.response.data?.message || 'API Error',
      isNetworkError: false,
    };
  }
  
  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message,
      isNetworkError: true,
    };
  }
  
  return {
    status: 0,
    message: 'An unknown error occurred',
    isNetworkError: false,
  };
};

export const transformResponse = <T>(
  data: unknown, 
  transformer?: (data: unknown) => T,
  isPaginated = false
): T => {
  if (transformer) {
    return transformer(data);
  }
  
  if (isPaginated && data && typeof data === 'object') {
    // Handle paginated response transformation
    const paginatedData = data as { items?: unknown[]; data?: unknown[]; total?: number; page?: number; limit?: number };
    return {
      data: paginatedData.items || paginatedData.data || [],
      meta: {
        total: paginatedData.total || 0,
        page: paginatedData.page || 1,
        limit: paginatedData.limit || 10,
        totalPages: Math.ceil((paginatedData.total || 0) / (paginatedData.limit || 10)),
      },
    } as T;
  }
  
  return data as T;
};

export const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

export const createApiUrl = (
  endpoint: string, 
  params?: Record<string, unknown>, 
  baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || ''
): string => {
  const url = new URL(endpoint, baseUrl);
  
  if (params) {
    const queryString = createQueryString(params);
    if (queryString) {
      url.search = queryString;
    }
  }
  
  return url.toString();
};

export const createQueryString = (params: Record<string, unknown>): string => {
  const parts: string[] = [];
  
  const addParam = (key: string, value: unknown, prefix = '') => {
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        parts.push(`${paramKey}[]=${encodeURIComponent(String(item))}`);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        addParam(nestedKey, nestedValue, paramKey);
      });
    } else if (value !== undefined && value !== null) {
      parts.push(`${paramKey}=${encodeURIComponent(String(value))}`);
    }
  };
  
  Object.entries(params).forEach(([key, value]) => {
    addParam(key, value);
  });
  
  return parts.join('&').replace(/%5B/g, '[').replace(/%5D/g, ']');
};
