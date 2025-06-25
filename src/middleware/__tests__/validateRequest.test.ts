import { NextResponse } from 'next/server';
import { validateRequest } from '../validateRequest';
import * as yup from 'yup';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

describe('validateRequest Middleware', () => {
  const mockRequest = (body: any = {}, query: any = {}, params: any = {}) => ({
    json: () => Promise.resolve(body),
    nextUrl: {
      searchParams: new URLSearchParams(query),
    },
    params,
  });

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  const mockNext = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate request body', async () => {
    const schema = yup.object({
      name: yup.string().required(),
      email: yup.string().email().required(),
    });

    const req = mockRequest({ name: 'John', email: 'john@example.com' });
    const res = mockResponse();

    await validateRequest({
      body: schema,
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 for invalid request body', async () => {
    const schema = yup.object({
      name: yup.string().required('Name is required'),
      email: yup.string().email('Invalid email').required('Email is required'),
    });

    const req = mockRequest({ name: '', email: 'invalid-email' });
    const res = mockResponse();

    await validateRequest({
      body: schema,
    })(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'name',
          message: 'Name is required',
        }),
        expect.objectContaining({
          path: 'email',
          message: 'Invalid email',
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate query parameters', async () => {
    const schema = yup.object({
      page: yup.number().required().positive().integer(),
      limit: yup.number().required().positive().integer().max(100),
    });

    const req = mockRequest({}, { page: '1', limit: '10' });
    const res = mockResponse();

    await validateRequest({
      query: schema,
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate route parameters', async () => {
    const schema = yup.object({
      id: yup.string().uuid('Invalid UUID'),
    });

    const req = mockRequest({}, {}, { id: '123e4567-e89b-12d3-a456-426614174000' });
    const res = mockResponse();

    await validateRequest({
      params: schema,
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate multiple schemas together', async () => {
    const bodySchema = yup.object({
      title: yup.string().required(),
      content: yup.string().required(),
    });

    const querySchema = yup.object({
      draft: yup.boolean().default(false),
    });

    const req = mockRequest(
      { title: 'Test', content: 'Content' },
      { draft: 'true' }
    );
    const res = mockResponse();

    await validateRequest({
      body: bodySchema,
      query: querySchema,
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should transform values according to schema', async () => {
    const schema = yup.object({
      age: yup.number().transform((value) => (isNaN(value) ? undefined : value)),
      isActive: yup.boolean().default(false),
    });

    const req = mockRequest({ age: '25', isActive: 'true' });
    const res = mockResponse();

    const middleware = validateRequest({
      body: schema,
    });

    await middleware(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext.mock.calls[0][0].body).toEqual({
      age: 25,
      isActive: true,
    });
  });

  it('should handle async validation', async () => {
    const schema = yup.object({
      email: yup
        .string()
        .email()
        .test('unique', 'Email already exists', async (value) => {
          // Simulate async check (e.g., database lookup)
          await new Promise((resolve) => setTimeout(resolve, 10));
          return value === 'available@example.com';
        }),
    });

    const req = mockRequest({ email: 'taken@example.com' });
    const res = mockResponse();

    await validateRequest({
      body: schema,
    })(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'email',
          message: 'Email already exists',
        }),
      ]),
    });
  });

  it('should handle empty request gracefully', async () => {
    const schema = yup.object({
      optional: yup.string(),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await validateRequest({
      body: schema,
    })(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle custom error messages', async () => {
    const schema = yup.object({
      username: yup
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username cannot be longer than 20 characters'),
    });

    const req = mockRequest({ username: 'a'.repeat(25) });
    const res = mockResponse();

    await validateRequest({
      body: schema,
    })(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'username',
          message: 'Username cannot be longer than 20 characters',
        }),
      ]),
    });
  });

  it('should handle nested objects in validation', async () => {
    const schema = yup.object({
      user: yup.object({
        name: yup.string().required(),
        address: yup.object({
          street: yup.string().required(),
          city: yup.string().required(),
          zip: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
        }),
      }),
    });

    const validRequest = mockRequest({
      user: {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          zip: '12345',
        },
      },
    });

    const res = mockResponse();
    await validateRequest({
      body: schema,
    })(validRequest as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalled();

    // Test with invalid nested data
    mockNext.mockClear();
    const invalidRequest = mockRequest({
      user: {
        name: 'John',
        address: {
          street: '',
          city: '',
          zip: 'invalid',
        },
      },
    });

    await validateRequest({
      body: schema,
    })(invalidRequest as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    const responseJson = (res.json as jest.Mock).mock.calls[0][0];
    expect(responseJson.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'user.address.street',
          message: 'user.address.street is a required field',
        }),
        expect.objectContaining({
          path: 'user.address.city',
          message: 'user.address.city is a required field',
        }),
        expect.objectContaining({
          path: 'user.address.zip',
          message: 'Invalid ZIP code',
        }),
      ])
    );
  });
});
