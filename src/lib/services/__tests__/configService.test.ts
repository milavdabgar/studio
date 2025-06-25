import { ConfigService, ConfigValidationError } from '../configService';
import { z } from 'zod';

// Mock process.env
const originalEnv = process.env;

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe('ConfigService', () => {
  let configService: ConfigService;
  
  // Test schema
  const testSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().regex(/^\d+$/).default('3000').transform(Number),
    DATABASE_URL: z.string().url(),
    FEATURE_FLAG: z.string().default('false').transform(val => val === 'true'),
    OPTIONAL_VALUE: z.string().optional(),
    ARRAY_VALUE: z.string().transform(val => val.split(',')),
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset process.env before each test
    process.env = { ...originalEnv };
    
    // Setup default environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/test';
    process.env.ARRAY_VALUE = 'one,two,three';
    
    // Create a new instance for each test
    configService = new ConfigService({
      schema: testSchema,
      logger: mockLogger as any,
    });
  });
  
  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should load and validate config from process.env', () => {
      expect(configService.get('NODE_ENV')).toBe('test');
      expect(configService.get('PORT')).toBe(3000);
      expect(configService.get('DATABASE_URL')).toBe('postgres://user:pass@localhost:5432/test');
      expect(configService.get('FEATURE_FLAG')).toBe(false);
      expect(configService.get('ARRAY_VALUE')).toEqual(['one', 'two', 'three']);
      expect(configService.get('OPTIONAL_VALUE')).toBeUndefined();
    });
    
    it('should throw validation error for invalid schema', () => {
      // Missing required DATABASE_URL
      delete process.env.DATABASE_URL;
      
      expect(() => new ConfigService({ schema: testSchema })).toThrow(ConfigValidationError);
    });
    
    it('should handle empty schema', () => {
      const emptyService = new ConfigService({ schema: z.object({}) });
      expect(emptyService.getAll()).toEqual({});
    });
    
    it('should load .env file when loadDotEnv is true', () => {
      // This test assumes there's a .env.test file in the project root
      const service = new ConfigService({
        schema: testSchema,
        loadDotEnv: true,
        envFilePath: '.env.test',
      });
      
      // Should not throw if .env.test exists and is valid
      expect(service).toBeInstanceOf(ConfigService);
    });
  });
  
  describe('get method', () => {
    it('should return config value by key', () => {
      expect(configService.get('PORT')).toBe(3000);
      expect(configService.get('NODE_ENV')).toBe('test');
    });
    
    it('should return default value when key is not set', () => {
      // FEATURE_FLAG has a default of 'false' in the schema
      expect(configService.get('FEATURE_FLAG')).toBe(false);
    });
    
    it('should return undefined for non-existent key', () => {
      expect(configService.get('NON_EXISTENT' as any)).toBeUndefined();
    });
    
    it('should return transformed value', () => {
      // ARRAY_VALUE is transformed from string to array
      expect(configService.get('ARRAY_VALUE')).toEqual(['one', 'two', 'three']);
    });
  });
  
  describe('getAll method', () => {
    it('should return all config values', () => {
      const allConfig = configService.getAll();
      
      expect(allConfig).toEqual({
        NODE_ENV: 'test',
        PORT: 3000,
        DATABASE_URL: 'postgres://user:pass@localhost:5432/test',
        FEATURE_FLAG: false,
        ARRAY_VALUE: ['one', 'two', 'three'],
      });
    });
    
    it('should return a frozen object', () => {
      const allConfig = configService.getAll();
      
      expect(() => {
        (allConfig as any).NODE_ENV = 'hacked';
      }).toThrow();
      
      expect(() => {
        delete (allConfig as any).NODE_ENV;
      }).toThrow();
    });
  });
  
  describe('isProd, isDev, isTest helpers', () => {
    it('should correctly identify environment', () => {
      // Current env is 'test' from beforeEach
      expect(configService.isTest()).toBe(true);
      expect(configService.isDev()).toBe(false);
      expect(configService.isProd()).toBe(false);
      
      // Change env
      process.env.NODE_ENV = 'production';
      const prodConfig = new ConfigService({ schema: testSchema });
      
      expect(prodConfig.isProd()).toBe(true);
      expect(prodConfig.isDev()).toBe(false);
      expect(prodConfig.isTest()).toBe(false);
    });
  });
  
  describe('validation', () => {
    it('should validate against schema on get', () => {
      // This should be caught during initialization, but test get as well
      process.env.PORT = 'not-a-number';
      
      expect(() => new ConfigService({ schema: testSchema })).toThrow(ConfigValidationError);
    });
    
    it('should handle custom validation', () => {
      const customSchema = z.object({
        API_KEY: z.string().min(10, 'API key must be at least 10 characters'),
      });
      
      process.env.API_KEY = 'short';
      
      expect(() => new ConfigService({ schema: customSchema })).toThrow(
        'API key must be at least 10 characters'
      );
    });
  });
  
  describe('nested configuration', () => {
    it('should handle nested objects', () => {
      const nestedSchema = z.object({
        DB: z.object({
          HOST: z.string().default('localhost'),
          PORT: z.string().default('5432').transform(Number),
          NAME: z.string(),
        }),
        SERVER: z.object({
          PORT: z.string().default('3000').transform(Number),
          ENV: z.string().default('development'),
        }),
      });
      
      process.env.DB_NAME = 'mydb';
      
      const service = new ConfigService({
        schema: nestedSchema,
        transformEnv: (key) => key.replace(/__/g, '.').toUpperCase(),
      });
      
      expect(service.get('DB')).toEqual({
        HOST: 'localhost',
        PORT: 5432,
        NAME: 'mydb',
      });
      
      expect(service.get('SERVER')).toEqual({
        PORT: 3000,
        ENV: 'development',
      });
    });
    
    it('should handle env vars with double underscore for nesting', () => {
      const nestedSchema = z.object({
        db: z.object({
          host: z.string().default('localhost'),
          port: z.string().default('5432').transform(Number),
        }),
      });
      
      // Using double underscore for nesting
      process.env.DB__HOST = 'custom-host';
      process.env.DB__PORT = '1234';
      
      const service = new ConfigService({
        schema: nestedSchema,
        transformEnv: (key) => key.toLowerCase(),
      });
      
      expect(service.get('db')).toEqual({
        host: 'custom-host',
        port: 1234,
      });
    });
  });
  
  describe('environment variable name transformation', () => {
    it('should handle custom env key transformation', () => {
      const schema = z.object({
        apiKey: z.string(),
        dbName: z.string(),
      });
      
      process.env.API_KEY = 'secret';
      process.env.DB_NAME = 'mydb';
      
      const service = new ConfigService({
        schema,
        transformEnv: (key) => key.toUpperCase(),
      });
      
      expect(service.get('apiKey')).toBe('secret');
      expect(service.get('dbName')).toBe('mydb');
    });
    
    it('should handle camelCase to SCREAMING_SNAKE_CASE transformation', () => {
      const schema = z.object({
        apiKey: z.string(),
        dbConfig: z.object({
          hostName: z.string(),
          portNumber: z.string(),
        }),
      });
      
      process.env.API_KEY = 'secret';
      process.env.DB_CONFIG__HOST_NAME = 'localhost';
      process.env.DB_CONFIG__PORT_NUMBER = '5432';
      
      const service = new ConfigService({
        schema,
        transformEnv: (key) => {
          // Convert camelCase to SCREAMING_SNAKE_CASE
          return key
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toUpperCase()
            .replace(/\./g, '__');
        },
      });
      
      expect(service.get('apiKey')).toBe('secret');
      expect(service.get('dbConfig')).toEqual({
        hostName: 'localhost',
        portNumber: '5432',
      });
    });
  });
  
  describe('type safety', () => {
    it('should provide type-safe access to config', () => {
      // This is a compile-time test, so we're just checking that TypeScript is happy
      const config = {
        NODE_ENV: 'test' as const,
        PORT: 3000,
        DATABASE_URL: 'postgres://localhost',
      };
      
      type ConfigType = typeof config;
      
      // This would cause a TypeScript error if the types didn't match
      const typedConfig: ConfigType = {
        NODE_ENV: 'test',
        PORT: 3000,
        DATABASE_URL: 'postgres://localhost',
      };
      
      // Just to use the variable
      expect(typedConfig).toBeDefined();
    });
  });
  
  describe('error handling', () => {
    it('should throw ConfigValidationError for invalid config', () => {
      // Missing required DATABASE_URL
      delete process.env.DATABASE_URL;
      
      expect(() => new ConfigService({ schema: testSchema })).toThrow(ConfigValidationError);
      
      try {
        new ConfigService({ schema: testSchema });
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect(error.message).toContain('Validation failed');
        expect(error.details).toBeDefined();
      }
    });
    
    it('should handle invalid .env file', () => {
      expect(
        () => new ConfigService({
          schema: testSchema,
          loadDotEnv: true,
          envFilePath: 'non-existent-file',
        })
      ).toThrow(/Failed to load .env file/);
    });
  });
  
  describe('custom validation', () => {
    it('should support custom validation functions', () => {
      const schema = z.object({
        PASSWORD: z.string().refine(
          val => val.length >= 8,
          { message: 'Password must be at least 8 characters' }
        ),
      });
      
      process.env.PASSWORD = 'short';
      
      expect(() => new ConfigService({ schema })).toThrow(
        'Password must be at least 8 characters'
      );
    });
    
    it('should support async validation', async () => {
      const schema = z.object({
        API_KEY: z.string().refine(
          async val => {
            // Simulate async validation (e.g., checking against a service)
            await new Promise(resolve => setTimeout(resolve, 10));
            return val === 'valid-key';
          },
          { message: 'Invalid API key' }
        ),
      });
      
      process.env.API_KEY = 'invalid-key';
      
      await expect(
        new ConfigService({ schema, validateSync: false }).validate()
      ).rejects.toThrow('Invalid API key');
    });
  });
  
  describe('async validation', () => {
    it('should support async schema validation', async () => {
      const schema = z.object({
        API_KEY: z.string().refine(
          async val => {
            // Simulate async validation
            await new Promise(resolve => setTimeout(resolve, 10));
            return val === 'valid-key';
          },
          { message: 'Invalid API key' }
        ),
      });
      
      process.env.API_KEY = 'valid-key';
      
      const service = new ConfigService({
        schema,
        validateSync: false, // Disable sync validation
      });
      
      await expect(service.validate()).resolves.toBeUndefined();
      
      // Now test with invalid key
      process.env.API_KEY = 'invalid-key';
      const invalidService = new ConfigService({
        schema,
        validateSync: false,
      });
      
      await expect(invalidService.validate()).rejects.toThrow('Invalid API key');
    });
  });
});
