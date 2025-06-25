import { NextResponse } from 'next/server';
import { ApiResponse } from '../apiResponse';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      ...init,
      json: () => Promise.resolve(data),
    })),
  },
}));

describe('ApiResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = ApiResponse.success({ data });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data,
        },
        { status: 200 }
      );
    });

    it('should include meta data when provided', () => {
      const data = { items: [1, 2, 3] };
      const meta = { total: 3, page: 1, limit: 10 };
      
      ApiResponse.success({ data, meta });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data,
          meta,
        },
        { status: 200 }
      );
    });

    it('should use custom status code when provided', () => {
      ApiResponse.success({ data: {}, status: 201 });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.any(Object),
        { status: 201 }
      );
    });
  });

  describe('error', () => {
    it('should return error response with message', () => {
      const message = 'Something went wrong';
      
      ApiResponse.error({ message });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
        },
        { status: 400 }
      );
    });

    it('should include error details when provided', () => {
      const message = 'Validation failed';
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];
      
      ApiResponse.error({ 
        message, 
        errors,
        status: 422,
      });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
          errors,
        },
        { status: 422 }
      );
    });
  });

  describe('notFound', () => {
    it('should return 404 response with message', () => {
      const message = 'Resource not found';
      
      ApiResponse.notFound({ message });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
        },
        { status: 404 }
      );
    });
  });

  describe('unauthorized', () => {
    it('should return 401 response with message', () => {
      const message = 'Authentication required';
      
      ApiResponse.unauthorized({ message });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    });
  });

  describe('forbidden', () => {
    it('should return 403 response with message', () => {
      const message = 'Insufficient permissions';
      
      ApiResponse.forbidden({ message });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
        },
        { status: 403 }
      );
    });
  });

  describe('badRequest', () => {
    it('should return 400 response with message', () => {
      const message = 'Invalid input';
      
      ApiResponse.badRequest({ message });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
        },
        { status: 400 }
      );
    });
  });

  describe('serverError', () => {
    it('should return 500 response with message', () => {
      const message = 'Internal server error';
      
      ApiResponse.serverError({ message });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'error',
          message,
        },
        { status: 500 }
      );
    });
  });

  describe('created', () => {
    it('should return 201 response with data', () => {
      const data = { id: 1, name: 'New Item' };
      
      ApiResponse.created({ data });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data,
        },
        { status: 201 }
      );
    });
  });

  describe('noContent', () => {
    it('should return 204 response with no content', () => {
      const response = ApiResponse.noContent();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        null,
        { status: 204 }
      );
    });
  });

  describe('withHeaders', () => {
    it('should include custom headers in the response', () => {
      const headers = {
        'X-Custom-Header': 'value',
        'Cache-Control': 'no-cache',
      };
      
      ApiResponse.success({
        data: {},
        headers,
      });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.any(Object),
        {
          status: 200,
          headers: expect.objectContaining(headers),
        }
      );
    });
  });

  describe('pagination', () => {
    it('should include pagination links in meta', () => {
      const data = Array(10).fill(0).map((_, i) => ({ id: i + 1 }));
      const meta = {
        total: 100,
        page: 2,
        limit: 10,
        url: new URL('http://example.com/api/items?page=2&limit=10'),
      };
      
      ApiResponse.paginated({ data, ...meta });
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          status: 'success',
          data,
          meta: expect.objectContaining({
            total: 100,
            page: 2,
            limit: 10,
            totalPages: 10,
            hasNextPage: true,
            hasPreviousPage: true,
            nextPage: 'http://example.com/api/items?page=3&limit=10',
            previousPage: 'http://example.com/api/items?page=1&limit=10',
          }),
        },
        { status: 200 }
      );
    });

    it('should handle first page correctly', () => {
      const meta = {
        total: 100,
        page: 1,
        limit: 10,
        url: new URL('http://example.com/api/items?page=1&limit=10'),
      };
      
      ApiResponse.paginated({ data: [], ...meta });
      
      const responseMeta = (NextResponse.json as jest.Mock).mock.calls[0][0].meta;
      expect(responseMeta.hasPreviousPage).toBe(false);
      expect(responseMeta.previousPage).toBeNull();
    });

    it('should handle last page correctly', () => {
      const meta = {
        total: 100,
        page: 10,
        limit: 10,
        url: new URL('http://example.com/api/items?page=10&limit=10'),
      };
      
      ApiResponse.paginated({ data: [], ...meta });
      
      const responseMeta = (NextResponse.json as jest.Mock).mock.calls[0][0].meta;
      expect(responseMeta.hasNextPage).toBe(false);
      expect(responseMeta.nextPage).toBeNull();
    });
  });
});
