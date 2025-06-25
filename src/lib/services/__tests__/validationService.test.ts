import { ValidationService, ValidationError } from '../validationService';
import { z } from 'zod';

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('ValidationService', () => {
  let validationService: ValidationService;
  
  // Test schemas
  const userSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(2).max(100),
    age: z.number().int().positive().optional(),
    role: z.enum(['user', 'admin', 'moderator']).default('user'),
    tags: z.array(z.string()).max(5).optional(),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.date().optional(),
  });
  
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    rememberMe: z.boolean().optional(),
  });
  
  const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  });
  
  // Custom validators
  const isStrongPassword = (value: string) => {
    return (
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  };
  
  const passwordSchema = z.string().refine(isStrongPassword, {
    message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    validationService = new ValidationService({
      logger: mockLogger as any,
    });
  });
  
  describe('schema validation', () => {
    it('should validate data against a schema', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        role: 'admin',
        tags: ['premium', 'verified'],
        createdAt: new Date(),
      };
      
      const result = validationService.validate(userSchema, validUser);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...validUser,
        // Should have added default role
        role: 'admin',
      });
      expect(result.errors).toBeUndefined();
    });
    
    it('should return validation errors for invalid data', () => {
      const invalidUser = {
        id: 'not-a-uuid',
        email: 'invalid-email',
        name: 'A', // Too short
        age: -5, // Negative age
        role: 'invalid-role',
        tags: Array(10).fill('tag'), // Too many tags
      };
      
      const result = validationService.validate(userSchema, invalidUser);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      
      // Should have multiple validation errors
      const errorMessages = result.errors?.map(e => e.message);
      expect(errorMessages).toContain('Invalid uuid');
      expect(errorMessages).toContain('Invalid email');
      expect(errorMessages).toContain('String must contain at least 2 character(s)');
      expect(errorMessages).toContain('Number must be greater than 0');
      expect(errorMessages).toContain("Invalid enum value. Expected 'user' | 'admin' | 'moderator'");
      expect(errorMessages).toContain('Array must contain at most 5 element(s)');
    });
    
    it('should handle optional fields and defaults', () => {
      const minimalUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'minimal@example.com',
        name: 'Minimal User',
      };
      
      const result = validationService.validate(userSchema, minimalUser);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...minimalUser,
        role: 'user', // Default value
        // Other optional fields should be undefined
        age: undefined,
        tags: undefined,
        metadata: undefined,
        createdAt: undefined,
      });
    });
  });
  
  describe('validation with custom error messages', () => {
    it('should use custom error messages', () => {
      const schema = z.object({
        username: z.string({
          required_error: 'Username is required',
          invalid_type_error: 'Username must be a string',
        }).min(3, 'Username must be at least 3 characters'),
        password: z.string().refine(
          val => val.length >= 8,
          { message: 'Password must be at least 8 characters' }
        ),
      });
      
      const result1 = validationService.validate(schema, { username: 'ab' });
      expect(result1.success).toBe(false);
      expect(result1.errors?.[0].message).toBe('Username must be at least 3 characters');
      
      const result2 = validationService.validate(schema, { username: 'valid', password: 'short' });
      expect(result2.success).toBe(false);
      expect(result2.errors?.[0].message).toBe('Password must be at least 8 characters');
    });
  });
  
  describe('async validation', () => {
    it('should validate data asynchronously', async () => {
      // Simulate an async check (e.g., checking if username is taken)
      const isUsernameAvailable = async (username: string) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return !['admin', 'root', 'system'].includes(username);
      };
      
      const asyncSchema = z.object({
        username: z.string()
          .min(3)
          .refine(
            async (val) => await isUsernameAvailable(val),
            { message: 'Username is already taken' }
          ),
      });
      
      // Test with taken username
      const result1 = await validationService.validateAsync(asyncSchema, { username: 'admin' });
      expect(result1.success).toBe(false);
      expect(result1.errors?.[0].message).toBe('Username is already taken');
      
      // Test with available username
      const result2 = await validationService.validateAsync(asyncSchema, { username: 'newuser' });
      expect(result2.success).toBe(true);
    });
  });
  
  describe('validation context', () => {
    it('should pass context to validators', () => {
      const schema = z.object({
        newPassword: z.string(),
        confirmPassword: z.string(),
      }).refine(
        (data) => data.newPassword === data.confirmPassword,
        {
          message: 'Passwords do not match',
          path: ['confirmPassword'], // Point to the field with the error
        }
      );
      
      const result = validationService.validate(schema, {
        newPassword: 'password123',
        confirmPassword: 'different',
      });
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0].path).toEqual(['confirmPassword']);
      expect(result.errors?.[0].message).toBe('Passwords do not match');
    });
  });
  
  describe('custom validation rules', () => {
    it('should validate with custom validators', () => {
      const schema = z.object({
        password: passwordSchema,
      });
      
      // Test weak password
      const result1 = validationService.validate(schema, { password: 'weak' });
      expect(result1.success).toBe(false);
      expect(result1.errors?.[0].message).toContain('Password must be at least 8 characters');
      
      // Test strong password
      const result2 = validationService.validate(schema, { password: 'Str0ngP@ss' });
      expect(result2.success).toBe(true);
    });
    
    it('should validate with multiple custom validators', () => {
      const schema = z.object({
        username: z.string()
          .min(3)
          .refine(val => /^[a-z0-9_]+$/.test(val), {
            message: 'Username can only contain lowercase letters, numbers, and underscores',
          })
          .refine(val => !val.startsWith('_'), {
            message: 'Username cannot start with an underscore',
          }),
      });
      
      const result1 = validationService.validate(schema, { username: 'valid_user123' });
      expect(result1.success).toBe(true);
      
      const result2 = validationService.validate(schema, { username: 'Invalid-User' });
      expect(result2.success).toBe(false);
      expect(result2.errors?.[0].message).toContain('lowercase letters');
      
      const result3 = validationService.validate(schema, { username: '_invalid' });
      expect(result3.success).toBe(false);
      expect(result3.errors?.[0].message).toContain('cannot start with an underscore');
    });
  });
  
  describe('validation error formatting', () => {
    it('should format validation errors consistently', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(3),
            age: z.number().min(18),
          }),
        }),
      });
      
      const result = validationService.validate(schema, {
        user: {
          profile: {
            name: 'AB',
            age: 15,
          },
        },
      });
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      
      const nameError = result.errors?.find(e => e.path.join('.') === 'user.profile.name');
      const ageError = result.errors?.find(e => e.path.join('.') === 'user.profile.age');
      
      expect(nameError).toBeDefined();
      expect(nameError?.message).toContain('at least 3 character(s)');
      
      expect(ageError).toBeDefined();
      expect(ageError?.message).toContain('greater than or equal to 18');
    });
    
    it('should handle nested arrays in error paths', () => {
      const schema = z.object({
        users: z.array(z.object({
          id: z.string().uuid(),
          roles: z.array(z.string().min(3)),
        })),
      });
      
      const result = validationService.validate(schema, {
        users: [
          { id: '550e8400-e29b-41d4-a716-446655440000', roles: ['admin', 'a'] },
          { id: 'invalid', roles: ['user', 'mod'] },
        ],
      });
      
      expect(result.success).toBe(false);
      
      // Should have errors for:
      // - users[0].roles[1] (string too short)
      // - users[1].id (invalid uuid)
      expect(result.errors).toHaveLength(2);
      
      const roleError = result.errors?.find(e => 
        e.path.join('.') === 'users.0.roles.1'
      );
      const idError = result.errors?.find(e => 
        e.path.join('.') === 'users.1.id'
      );
      
      expect(roleError).toBeDefined();
      expect(roleError?.message).toContain('at least 3 character(s)');
      
      expect(idError).toBeDefined();
      expect(idError?.message).toContain('Invalid uuid');
    });
  });
  
  describe('strict validation', () => {
    it('should strip unknown fields by default', () => {
      const schema = z.object({
        name: z.string(),
      });
      
      const result = validationService.validate(schema, {
        name: 'John',
        extraField: 'should be removed',
      });
      
      expect(result.success).toBe(true);
      expect((result.data as any).extraField).toBeUndefined();
    });
    
    it('should reject unknown fields in strict mode', () => {
      const schema = z.object({
        name: z.string(),
      }).strict();
      
      const result = validationService.validate(schema, {
        name: 'John',
        extraField: 'not allowed',
      });
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toContain('Unrecognized key(s) in object');
    });
  });
  
  describe('coercion and transformation', () => {
    it('should coerce primitive types', () => {
      const schema = z.object({
        id: z.coerce.number(),
        isActive: z.coerce.boolean(),
        createdAt: z.coerce.date(),
      });
      
      const result = validationService.validate(schema, {
        id: '123',
        isActive: 'true',
        createdAt: '2025-01-01T00:00:00.000Z',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 123,
        isActive: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });
    
    it('should transform data during validation', () => {
      const schema = z.object({
        email: z.string().email().transform(val => val.toLowerCase().trim()),
        name: z.string().transform(val => val.trim()),
      });
      
      const result = validationService.validate(schema, {
        email: 'Test@Example.COM',
        name: '  John Doe  ',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
      });
    });
  });
  
  describe('custom error handling', () => {
    it('should use custom error formatter', () => {
      const customService = new ValidationService({
        formatError: (error) => ({
          field: error.path.join('.'),
          code: error.code,
          message: `Validation failed: ${error.message}`,
        }),
      });
      
      const schema = z.object({
        email: z.string().email(),
      });
      
      const result = customService.validate(schema, { email: 'invalid' });
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toEqual({
        field: 'email',
        code: 'invalid_string',
        message: 'Validation failed: Invalid email',
      });
    });
    
    it('should handle validation errors in async validation', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      
      // Test with invalid email (synchronous error)
      const result1 = await validationService.validateAsync(schema, { email: 'invalid' });
      expect(result1.success).toBe(false);
      expect(result1.errors?.[0].message).toContain('Invalid email');
      
      // Test with valid email
      const result2 = await validationService.validateAsync(schema, { email: 'valid@example.com' });
      expect(result2.success).toBe(true);
    });
  });
  
  describe('validation middleware', () => {
    it('should create an Express middleware for request validation', async () => {
      const schema = z.object({
        body: z.object({
          username: z.string().min(3),
          password: z.string().min(8),
        }),
        query: z.object({
          debug: z.enum(['true', 'false']).optional(),
        }),
        params: z.object({
          id: z.string().uuid(),
        }),
      });
      
      const middleware = validationService.middleware(schema);
      
      // Mock Express request/response/next
      const req = {
        body: { username: 'john', password: 'password123' },
        query: { debug: 'true' },
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      const next = jest.fn();
      
      // Execute middleware
      await middleware(req as any, res as any, next);
      
      // Should call next() without errors
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined(); // No error passed to next()
      
      // Request should be augmented with validated data
      expect(req).toHaveProperty('validated');
      expect(req.validated).toEqual({
        body: { username: 'john', password: 'password123' },
        query: { debug: 'true' },
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
    });
    
    it('should handle validation errors in middleware', async () => {
      const schema = z.object({
        body: z.object({
          email: z.string().email(),
        }),
      });
      
      const middleware = validationService.middleware(schema);
      
      const req = {
        body: { email: 'invalid' },
        query: {},
        params: {},
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      const next = jest.fn();
      
      // Execute middleware
      await middleware(req as any, res as any, next);
      
      // Should not call next() (it should end the request)
      expect(next).not.toHaveBeenCalled();
      
      // Should send error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['body', 'email'],
            message: 'Invalid email',
          }),
        ]),
      });
    });
  });
});
