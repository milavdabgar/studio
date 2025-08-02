import { z } from 'zod';
import { ConfigService, ConfigValidationError } from '@/lib/services/configService';

describe('ConfigService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor and initialization', () => {
    it('should create instance with default options', () => {
      const config = new ConfigService();
      expect(config).toBeInstanceOf(ConfigService);
    });

    it('should load environment variables', () => {
      process.env.TEST_VAR = 'test_value';
      const config = new ConfigService();
      
      expect(config.get('TEST_VAR')).toBe('test_value');
    });

    it('should apply default values', () => {
      const config = new ConfigService({
        defaultValues: {
          DEFAULT_KEY: 'default_value',
          EXISTING_KEY: 'should_not_override'
        }
      });

      process.env.EXISTING_KEY = 'existing_value';
      config.reload();

      expect(config.get('DEFAULT_KEY')).toBe('default_value');
      expect(config.get('EXISTING_KEY')).toBe('existing_value');
    });

    it('should create service with custom options', () => {
      const config = new ConfigService({
        throwOnValidationError: false,
        defaultValues: { TEST: 'default' },
        requiredFields: []
      });
      expect(config.get('TEST')).toBe('default');
    });
  });

  describe('get method', () => {
    let config: ConfigService;

    beforeEach(() => {
      config = new ConfigService();
    });

    it('should return environment variable value', () => {
      process.env.TEST_GET = 'test_value';
      config.reload();
      
      expect(config.get('TEST_GET')).toBe('test_value');
    });

    it('should return undefined for non-existent key', () => {
      expect(config.get('NON_EXISTENT_KEY')).toBeUndefined();
    });

    it('should return default value for non-existent key', () => {
      expect(config.get('NON_EXISTENT_KEY', 'default')).toBe('default');
    });

    it('should validate value against schema', () => {
      process.env.NUMERIC_VALUE = '123';
      config.setSchema({
        NUMERIC_VALUE: z.string().transform(val => parseInt(val, 10))
      });
      config.reload();

      expect(config.get<number>('NUMERIC_VALUE')).toBe(123);
    });

    it('should apply schema transformation correctly', () => {
      config.setSchema({
        TRANSFORM_VALUE: z.string().transform(val => val.toUpperCase())
      });
      config.set('TRANSFORM_VALUE', 'hello');

      expect(config.get('TRANSFORM_VALUE')).toBe('HELLO');
    });

    it('should return default value on validation error when throwOnValidationError is false', () => {
      const configNoThrow = new ConfigService({ throwOnValidationError: false });
      process.env.INVALID_NUMBER = 'not_a_number';
      configNoThrow.setSchema({
        INVALID_NUMBER: z.number()
      });
      configNoThrow.reload();

      expect(configNoThrow.get('INVALID_NUMBER', 'default')).toBe('default');
    });
  });

  describe('set method', () => {
    let config: ConfigService;

    beforeEach(() => {
      config = new ConfigService();
    });

    it('should set config value', () => {
      config.set('NEW_KEY', 'new_value');
      expect(config.get('NEW_KEY')).toBe('new_value');
    });

    it('should validate value against schema before setting', () => {
      config.setSchema({
        VALIDATED_KEY: z.string().min(5)
      });

      expect(() => {
        config.set('VALIDATED_KEY', 'abc'); // Too short
      }).toThrow(ConfigValidationError);
    });

    it('should not set value on validation error when throwOnValidationError is false', () => {
      const configNoThrow = new ConfigService({ throwOnValidationError: false });
      configNoThrow.setSchema({
        VALIDATED_KEY: z.string().min(5)
      });

      configNoThrow.set('VALIDATED_KEY', 'abc');
      expect(configNoThrow.get('VALIDATED_KEY')).toBeUndefined();
    });

    it('should set valid value according to schema', () => {
      config.setSchema({
        VALIDATED_KEY: z.string().min(5)
      });

      config.set('VALIDATED_KEY', 'valid_value');
      expect(config.get('VALIDATED_KEY')).toBe('valid_value');
    });
  });

  describe('has method', () => {
    let config: ConfigService;

    beforeEach(() => {
      config = new ConfigService();
    });

    it('should return true for existing key', () => {
      process.env.EXISTING_KEY = 'value';
      config.reload();
      
      expect(config.has('EXISTING_KEY')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(config.has('NON_EXISTENT_KEY')).toBe(false);
    });

    it('should return true for key set via set method', () => {
      config.set('SET_KEY', 'value');
      expect(config.has('SET_KEY')).toBe(true);
    });
  });

  describe('getRequired method', () => {
    let config: ConfigService;

    beforeEach(() => {
      config = new ConfigService();
    });

    it('should return value for existing required key', () => {
      process.env.REQUIRED_KEY = 'required_value';
      config.reload();
      
      expect(config.getRequired('REQUIRED_KEY')).toBe('required_value');
    });

    it('should throw error for missing required key', () => {
      expect(() => {
        config.getRequired('MISSING_REQUIRED_KEY');
      }).toThrow(ConfigValidationError);
    });
  });

  describe('getAll method', () => {
    it('should return copy of all config values', () => {
      process.env.KEY1 = 'value1';
      process.env.KEY2 = 'value2';
      
      const config = new ConfigService();
      const allConfig = config.getAll();
      
      expect(allConfig.KEY1).toBe('value1');
      expect(allConfig.KEY2).toBe('value2');
      
      // Should be a copy, not the original
      allConfig.KEY1 = 'modified';
      expect(config.get('KEY1')).toBe('value1');
    });
  });

  describe('setSchema method', () => {
    let config: ConfigService;

    beforeEach(() => {
      config = new ConfigService({ throwOnValidationError: false });
    });

    it('should set schema and validate existing config', () => {
      process.env.VALID_STRING = 'valid';
      process.env.INVALID_NUMBER = 'not_a_number';
      config.reload();

      expect(() => {
        config.setSchema({
          VALID_STRING: z.string(),
          INVALID_NUMBER: z.number()
        });
      }).not.toThrow();
    });

    it('should throw validation error for invalid existing config when throwOnValidationError is true', () => {
      const configThrow = new ConfigService({ throwOnValidationError: true });
      process.env.INVALID_NUMBER = 'not_a_number';
      configThrow.reload();

      expect(() => {
        configThrow.setSchema({
          INVALID_NUMBER: z.number()
        });
      }).toThrow(ConfigValidationError);
    });
  });

  describe('validateConfig method', () => {
    it('should validate all required fields', () => {
      process.env.REQUIRED_FIELD = 'value';
      const config = new ConfigService({
        requiredFields: ['REQUIRED_FIELD']
      });

      expect(() => config.validateConfig()).not.toThrow();
    });

    it('should throw for missing required fields', () => {
      const config = new ConfigService({
        requiredFields: ['MISSING_FIELD'],
        throwOnValidationError: true
      });

      expect(() => config.validateConfig()).toThrow(ConfigValidationError);
    });
  });

  describe('reload method', () => {
    it('should reload config from environment', () => {
      const config = new ConfigService();
      
      expect(config.get('NEW_ENV_VAR')).toBeUndefined();
      
      process.env.NEW_ENV_VAR = 'new_value';
      config.reload();
      
      expect(config.get('NEW_ENV_VAR')).toBe('new_value');
    });
  });

  describe('common config getters', () => {
    let config: ConfigService;

    beforeEach(() => {
      config = new ConfigService();
    });

    describe('getDatabaseUrl', () => {
      it('should return DATABASE_URL', () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/test';
        config.reload();
        
        expect(config.getDatabaseUrl()).toBe('postgres://localhost:5432/test');
      });

      it('should throw if DATABASE_URL is missing', () => {
        delete process.env.DATABASE_URL;
        config.reload();
        
        expect(() => config.getDatabaseUrl()).toThrow(ConfigValidationError);
      });
    });

    describe('getRedisUrl', () => {
      it('should return REDIS_URL', () => {
        process.env.REDIS_URL = 'redis://localhost:6379';
        config.reload();
        
        expect(config.getRedisUrl()).toBe('redis://localhost:6379');
      });

      it('should throw if REDIS_URL is missing', () => {
        delete process.env.REDIS_URL;
        config.reload();
        
        expect(() => config.getRedisUrl()).toThrow(ConfigValidationError);
      });
    });

    describe('getPort', () => {
      it('should return PORT as number', () => {
        process.env.PORT = '8080';
        config.reload();
        
        expect(config.getPort()).toBe(8080);
      });

      it('should return default port 3000 if PORT is not set', () => {
        delete process.env.PORT;
        config.reload();
        
        expect(config.getPort()).toBe(3000);
      });
    });

    describe('getNodeEnv', () => {
      it('should return NODE_ENV', () => {
        process.env.NODE_ENV = 'production';
        config.reload();
        
        expect(config.getNodeEnv()).toBe('production');
      });

      it('should return development as default', () => {
        delete process.env.NODE_ENV;
        config.reload();
        
        expect(config.getNodeEnv()).toBe('development');
      });
    });

    describe('environment checks', () => {
      it('should detect production environment', () => {
        process.env.NODE_ENV = 'production';
        config.reload();
        
        expect(config.isProduction()).toBe(true);
        expect(config.isDevelopment()).toBe(false);
        expect(config.isTest()).toBe(false);
      });

      it('should detect development environment', () => {
        process.env.NODE_ENV = 'development';
        config.reload();
        
        expect(config.isProduction()).toBe(false);
        expect(config.isDevelopment()).toBe(true);
        expect(config.isTest()).toBe(false);
      });

      it('should detect test environment', () => {
        process.env.NODE_ENV = 'test';
        config.reload();
        
        expect(config.isProduction()).toBe(false);
        expect(config.isDevelopment()).toBe(false);
        expect(config.isTest()).toBe(true);
      });
    });
  });

  describe('ConfigValidationError', () => {
    it('should create error with field and value information', () => {
      const error = new ConfigValidationError('Invalid config', 'TEST_FIELD', 'invalid_value');
      
      expect(error.name).toBe('ConfigValidationError');
      expect(error.message).toBe('Invalid config');
      expect(error.field).toBe('TEST_FIELD');
      expect(error.value).toBe('invalid_value');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('edge cases', () => {
    it('should handle empty environment', () => {
      process.env = {};
      const config = new ConfigService();
      
      expect(config.getAll()).toEqual({});
    });

    it('should handle complex schema types', () => {
      const config = new ConfigService();
      
      config.setSchema({
        JSON_CONFIG: z.string().transform(val => JSON.parse(val))
      });

      process.env.JSON_CONFIG = '{"key": "value"}';
      config.reload();

      expect(config.get('JSON_CONFIG')).toEqual({ key: 'value' });
    });

    it('should handle boolean environment variables', () => {
      const config = new ConfigService();
      
      config.setSchema({
        ENABLE_FEATURE: z.string().transform(val => val === 'true')
      });

      process.env.ENABLE_FEATURE = 'true';
      config.reload();

      expect(config.get('ENABLE_FEATURE')).toBe(true);
    });
  });
});