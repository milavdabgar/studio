import { z } from 'zod';
import { ValidationService, ValidationError } from '@/lib/services/validationService';

describe('ValidationService', () => {
  let validationService: ValidationService;
  let mockLogger: {
    debug: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    
    validationService = new ValidationService({
      logger: mockLogger
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const service = new ValidationService();
      expect(service).toBeInstanceOf(ValidationService);
    });

    it('should create instance with custom config', () => {
      const customLogger = {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      
      const service = new ValidationService({ logger: customLogger });
      expect(service).toBeInstanceOf(ValidationService);
    });
  });

  describe('validate', () => {
    const userSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(0, 'Age must be positive'),
    });

    it('should return success for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const result = validationService.validate(userSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -5,
      };

      const result = validationService.validate(userSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(3);
      
      const errorMessages = result.errors!.map(e => e.message);
      expect(errorMessages).toContain('Name is required');
      expect(errorMessages).toContain('Invalid email');
      expect(errorMessages).toContain('Age must be positive');
    });

    it('should return errors for missing required fields', () => {
      const incompleteData = {
        name: 'John Doe',
        // missing email and age
      };

      const result = validationService.validate(userSchema, incompleteData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should handle validation exceptions', () => {
      const throwingSchema = {
        safeParse: jest.fn().mockImplementation(() => {
          throw new Error('Schema validation failed');
        })
      } as unknown as z.ZodSchema;

      const result = validationService.validate(throwingSchema, {});

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([{
        path: [],
        message: 'Validation failed',
        code: 'internal_error',
      }]);
      expect(mockLogger.error).toHaveBeenCalledWith('Validation error:', expect.any(Error));
    });

    it('should include error path information', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1, 'Name is required')
          })
        })
      });

      const invalidData = {
        user: {
          profile: {
            name: ''
          }
        }
      };

      const result = validationService.validate(nestedSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.errors![0].path).toEqual(['user', 'profile', 'name']);
    });
  });

  describe('validateAsync', () => {
    const asyncSchema = z.object({
      email: z.string().email().refine(async (email) => {
        // Simulate async validation
        return !email.includes('banned');
      }, 'Email is banned'),
    });

    it('should return success for valid async data', async () => {
      const validData = { email: 'user@example.com' };

      const result = await validationService.validateAsync(asyncSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should return errors for invalid async data', async () => {
      const invalidData = { email: 'user@banned.com' };

      const result = await validationService.validateAsync(asyncSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle async validation exceptions', async () => {
      const throwingSchema = {
        safeParseAsync: jest.fn().mockImplementation(async () => {
          throw new Error('Async validation failed');
        })
      } as unknown as z.ZodSchema;

      const result = await validationService.validateAsync(throwingSchema, {});

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([{
        path: [],
        message: 'Validation failed',
        code: 'internal_error',
      }]);
      expect(mockLogger.error).toHaveBeenCalledWith('Async validation error:', expect.any(Error));
    });
  });

  describe('middleware', () => {
    const requestSchema = z.object({
      body: z.object({
        name: z.string(),
      }),
      query: z.object({
        page: z.string().optional(),
      }),
      params: z.object({
        id: z.string(),
      }),
    });

    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockNext = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnValue({
          json: jest.fn()
        })
      };
    });

    it('should call next() for valid request', async () => {
      mockReq = {
        body: { name: 'test' },
        query: { page: '1' },
        params: { id: '123' },
      };

      const middleware = validationService.middleware(requestSchema);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validated).toBeDefined();
    });

    it('should return 400 for invalid request', async () => {
      mockReq = {
        body: {}, // missing name
        query: {},
        params: { id: '123' },
      };

      const middleware = validationService.middleware(requestSchema);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.status().json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array),
      });
    });

    it('should handle missing request properties', async () => {
      mockReq = {}; // no body, query, or params

      const middleware = validationService.middleware(requestSchema);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle middleware exceptions', async () => {
      mockReq = {
        body: { name: 'test' },
        query: {},
        params: { id: '123' },
      };

      // Mock validateAsync to throw
      jest.spyOn(validationService, 'validateAsync').mockImplementation(async () => {
        throw new Error('Middleware error');
      });

      const middleware = validationService.middleware(requestSchema);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.status().json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal validation error',
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Middleware validation error:', expect.any(Error));
    });
  });

  describe('custom error formatter', () => {
    it('should use custom error formatter when provided', () => {
      const customFormatter = jest.fn().mockReturnValue({
        path: ['custom'],
        message: 'Custom error message',
        code: 'custom_error',
        custom: true,
      });

      const serviceWithCustomFormatter = new ValidationService({
        formatError: customFormatter,
      });

      const schema = z.object({ name: z.string() });
      const result = serviceWithCustomFormatter.validate(schema, { name: 123 });

      expect(result.success).toBe(false);
      expect(customFormatter).toHaveBeenCalled();
      expect(result.errors![0]).toEqual({
        path: ['custom'],
        message: 'Custom error message',
        code: 'custom_error',
        custom: true,
      });
    });
  });

  describe('ValidationError class', () => {
    it('should create ValidationError with message and issues', () => {
      const issues = [
        { path: ['name'], message: 'Required', code: 'required' },
        { path: ['email'], message: 'Invalid', code: 'invalid' },
      ];

      const error = new ValidationError('Validation failed', issues);

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.issues).toEqual(issues);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined data', () => {
      const schema = z.object({ name: z.string() });
      
      const nullResult = validationService.validate(schema, null);
      const undefinedResult = validationService.validate(schema, undefined);

      expect(nullResult.success).toBe(false);
      expect(undefinedResult.success).toBe(false);
    });

    it('should handle empty objects', () => {
      const schema = z.object({});
      const result = validationService.validate(schema, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle arrays', () => {
      const schema = z.array(z.string());
      const validData = ['a', 'b', 'c'];
      const invalidData = ['a', 123, 'c'];

      const validResult = validationService.validate(schema, validData);
      const invalidResult = validationService.validate(schema, invalidData);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validData);
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    });
  });
});