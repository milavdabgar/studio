import {
  fetchWithAuth,
  handleApiError,
  transformResponse,
  createApiUrl,
  createQueryString,
  buildQueryString,
  ApiError,
} from '../apiUtils';

// Mock the global fetch
global.fetch = jest.fn();

const mockResponse = (status: number, data: unknown, ok: boolean) => ({
  ok,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
});

describe('API Utilities', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  describe('fetchWithAuth', () => {
    const mockToken = 'test-token';
    const testUrl = '/api/test';
    const testData = { id: 1, name: 'Test' };

    beforeEach(() => {
      localStorage.setItem('authToken', mockToken);
    });

    it('makes a GET request with auth headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, testData, true)
      );

      const response = await fetchWithAuth(testUrl);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(data).toEqual(testData);
    });

    it('handles POST requests with body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(201, { ...testData, id: 2 }, true)
      );

      const postData = { name: 'New Item' };
      const response = await fetchWithAuth(testUrl, {
        method: 'POST',
        body: JSON.stringify(postData),
      });
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(data).toEqual({ ...testData, id: 2 });
    });

    it('throws ApiError for non-2xx responses', async () => {
      const errorMessage = 'Not Found';
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(404, { message: errorMessage }, false)
      );

      await expect(fetchWithAuth(testUrl)).rejects.toThrow(
        new ApiError(404, errorMessage)
      );
    });

    it('throws ApiError with status text when no error message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(fetchWithAuth(testUrl)).rejects.toThrow(
        new ApiError(500, 'Internal Server Error')
      );
    });

    it('works without auth token', async () => {
      localStorage.removeItem('authToken');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, testData, true)
      );

      const response = await fetchWithAuth(testUrl);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        testUrl,
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
      expect(data).toEqual(testData);
    });
  });

  describe('handleApiError', () => {
    it('handles ApiError instances', () => {
      const error = new ApiError(400, 'Bad Request');
      const result = handleApiError(error);
      
      expect(result).toEqual({
        status: 400,
        message: 'Bad Request',
        isNetworkError: false,
      });
    });

    it('handles network errors', () => {
      const error = new Error('Network error');
      const result = handleApiError(error);
      
      expect(result).toEqual({
        status: 0,
        message: 'Network error',
        isNetworkError: true,
      });
    });

    it('handles unknown errors', () => {
      const result = handleApiError('Unknown error');
      
      expect(result).toEqual({
        status: 0,
        message: 'An unknown error occurred',
        isNetworkError: false,
      });
    });

    it('handles errors with response property', () => {
      const errorWithResponse = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      
      const result = handleApiError(errorWithResponse);
      
      expect(result).toEqual({
        status: 500,
        message: 'Internal Server Error',
        isNetworkError: false,
      });
    });

    it('handles errors with response property but no status', () => {
      const errorWithResponse = {
        response: {
          data: { message: 'Server Error' }
        }
      };
      
      const result = handleApiError(errorWithResponse);
      
      expect(result).toEqual({
        status: 0,
        message: 'Server Error',
        isNetworkError: false,
      });
    });

    it('handles errors with response property but no message', () => {
      const errorWithResponse = {
        response: {
          status: 503,
          data: {}
        }
      };
      
      const result = handleApiError(errorWithResponse);
      
      expect(result).toEqual({
        status: 503,
        message: 'API Error',
        isNetworkError: false,
      });
    });
  });

  describe('transformResponse', () => {
    it('transforms response data with default transformer', async () => {
      const response = {
        data: { id: 1, name: 'Test' },
        meta: { total: 10 },
      };
      const transformed = transformResponse(response);
      
      expect(transformed).toEqual({
        data: { id: 1, name: 'Test' },
        meta: { total: 10 },
      });
    });

    it('applies custom transformer function', async () => {
      const response = {
        id: 1,
        name: 'Test',
        createdAt: '2023-01-01T00:00:00Z',
      };
      
      const transformer = (data: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...data,
        createdAt: new Date(data.createdAt),
      });
      
      const transformed = transformResponse(response, transformer);
      
      expect(transformed).toEqual({
        id: 1,
        name: 'Test',
        createdAt: new Date('2023-01-01T00:00:00Z'),
      });
    });

    it('handles paginated responses', () => {
      const paginatedResponse = {
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        limit: 10,
      };
      
      const transformed = transformResponse(paginatedResponse, undefined, true);
      
      expect(transformed).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('handles paginated responses with data property instead of items', () => {
      const paginatedResponse = {
        data: [{ id: 3 }, { id: 4 }],
        total: 25,
        page: 2,
        limit: 10,
      };
      
      const transformed = transformResponse(paginatedResponse, undefined, true);
      
      expect(transformed).toEqual({
        data: [{ id: 3 }, { id: 4 }],
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      });
    });

    it('handles paginated responses with missing properties', () => {
      const paginatedResponse = {
        items: [{ id: 5 }],
      };
      
      const transformed = transformResponse(paginatedResponse, undefined, true);
      
      expect(transformed).toEqual({
        data: [{ id: 5 }],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });

    it('handles paginated response when data is not an object', () => {
      const nonObjectData = 'not an object';
      
      const transformed = transformResponse(nonObjectData, undefined, true);
      
      expect(transformed).toBe('not an object');
    });
  });

  describe('createApiUrl', () => {
    const baseUrl = 'https://api.example.com';
    
    it('creates URL with path', () => {
      const url = createApiUrl('/users', {}, baseUrl);
      expect(url).toBe('https://api.example.com/users');
    });

    it('creates URL without parameters', () => {
      const url = createApiUrl('/users', undefined, baseUrl);
      expect(url).toBe('https://api.example.com/users');
    });
    
    it('creates URL with query parameters', () => {
      const url = createApiUrl('/users', { page: 1, limit: 10 }, baseUrl);
      expect(url).toBe('https://api.example.com/users?page=1&limit=10');
    });
    
    it('handles array parameters', () => {
      const url = createApiUrl('/search', { ids: [1, 2, 3] }, baseUrl);
      expect(url).toBe('https://api.example.com/search?ids[]=1&ids[]=2&ids[]=3');
    });
    
    it('handles nested objects', () => {
      const url = createApiUrl(
        '/search', 
        { filter: { name: 'test', active: true } },
        baseUrl
      );
      expect(url).toBe('https://api.example.com/search?filter[name]=test&filter[active]=true');
    });
  });

  describe('createQueryString', () => {
    it('creates query string from object', () => {
      const params = { page: 1, search: 'test' };
      expect(createQueryString(params)).toBe('page=1&search=test');
    });
    
    it('handles arrays', () => {
      const params = { ids: [1, 2, 3] };
      expect(createQueryString(params)).toBe('ids[]=1&ids[]=2&ids[]=3');
    });
    
    it('handles nested objects', () => {
      const params = { filter: { name: 'test', active: true } };
      expect(createQueryString(params)).toBe('filter[name]=test&filter[active]=true');
    });
    
    it('skips undefined and null values', () => {
      const params = { page: 1, search: undefined, filter: null };
      expect(createQueryString(params)).toBe('page=1');
    });
    
    it('handles empty object', () => {
      expect(createQueryString({})).toBe('');
    });
  });

  describe('buildQueryString', () => {
    it('builds query string from simple parameters', () => {
      const params = { page: 1, search: 'test', active: true };
      const result = buildQueryString(params);
      expect(result).toBe('page=1&search=test&active=true');
    });

    it('handles undefined and null values', () => {
      const params = { page: 1, search: undefined, filter: null, active: true };
      const result = buildQueryString(params);
      expect(result).toBe('page=1&active=true');
    });

    it('handles boolean values', () => {
      const params = { active: true, disabled: false };
      const result = buildQueryString(params);
      expect(result).toBe('active=true&disabled=false');
    });

    it('handles number values', () => {
      const params = { page: 1, limit: 10, rating: 4.5 };
      const result = buildQueryString(params);
      expect(result).toBe('page=1&limit=10&rating=4.5');
    });

    it('handles empty object', () => {
      const result = buildQueryString({});
      expect(result).toBe('');
    });

    it('handles object with all undefined values', () => {
      const params = { search: undefined, filter: null };
      const result = buildQueryString(params);
      expect(result).toBe('');
    });

    it('handles string values with special characters', () => {
      const params = { search: 'hello world', filter: 'a&b=c' };
      const result = buildQueryString(params);
      expect(result).toBe('search=hello+world&filter=a%26b%3Dc');
    });
  });
});
