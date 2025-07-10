import { NextResponse } from 'next/server';
import { ApiResponse } from '../apiResponse';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

describe('ApiResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should return success response with default status 200', () => {
      const testData = { id: 1, name: 'test' };
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: true, data: testData },
        { status: 200 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should return success response with custom status', () => {
      const testData = { id: 1, name: 'test' };
      const customStatus = 201;
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.success(testData, customStatus);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: true, data: testData },
        { status: customStatus }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle null data', () => {
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.success(null);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: true, data: null },
        { status: 200 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle array data', () => {
      const testData = [{ id: 1 }, { id: 2 }];
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: true, data: testData },
        { status: 200 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('error', () => {
    it('should return error response with default status 400', () => {
      const errorMessage = 'Something went wrong';
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.error(errorMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: errorMessage },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should return error response with custom status', () => {
      const errorMessage = 'Server error';
      const customStatus = 500;
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.error(errorMessage, customStatus);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: errorMessage },
        { status: customStatus }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle empty error message', () => {
      const errorMessage = '';
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.error(errorMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: errorMessage },
        { status: 400 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('notFound', () => {
    it('should return not found response with default message', () => {
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.notFound();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should return not found response with custom message', () => {
      const customMessage = 'User not found';
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.notFound(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: customMessage },
        { status: 404 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('unauthorized', () => {
    it('should return unauthorized response with default message', () => {
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.unauthorized();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should return unauthorized response with custom message', () => {
      const customMessage = 'Invalid token';
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.unauthorized(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: customMessage },
        { status: 401 }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('forbidden', () => {
    it('should return forbidden response with default message', () => {
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.forbidden();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
      expect(result).toBe(mockResponse);
    });

    it('should return forbidden response with custom message', () => {
      const customMessage = 'Access denied';
      const mockResponse = { json: jest.fn() };
      mockNextResponse.json.mockReturnValue(mockResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = ApiResponse.forbidden(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { success: false, error: customMessage },
        { status: 403 }
      );
      expect(result).toBe(mockResponse);
    });
  });
});
