import { z } from 'zod';

export class ConfigValidationError extends Error {
  constructor(message: string, public field: string, public value: unknown) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export interface ConfigSchema {
  [key: string]: z.ZodType<unknown>;
}

export interface ConfigOptions {
  throwOnValidationError?: boolean;
  defaultValues?: Record<string, unknown>;
  requiredFields?: string[];
}

export class ConfigService {
  private config: Record<string, unknown> = {};
  private schema: ConfigSchema = {};
  private options: ConfigOptions;

  constructor(options: ConfigOptions = {}) {
    this.options = {
      throwOnValidationError: true,
      defaultValues: {},
      requiredFields: [],
      ...options,
    };
    this.loadConfig();
  }

  private loadConfig(): void {
    // Load from environment variables
    this.config = { ...process.env };
    
    // Apply default values
    if (this.options.defaultValues) {
      Object.entries(this.options.defaultValues).forEach(([key, value]) => {
        if (this.config[key] === undefined) {
          this.config[key] = value;
        }
      });
    }
  }

  setSchema(schema: ConfigSchema): void {
    this.schema = schema;
    this.validateConfig();
  }

  get<T = string>(key: string): T | undefined;
  get<T = string>(key: string, defaultValue: T): T;
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const value = this.config[key];
    
    if (value === undefined) {
      return defaultValue;
    }

    // Apply schema validation if available
    if (this.schema[key]) {
      try {
        return this.schema[key].parse(value) as T;
      } catch (error) {
        if (this.options.throwOnValidationError) {
          throw new ConfigValidationError(
            `Invalid value for config key "${key}": ${error}`,
            key,
            value
          );
        }
        return defaultValue;
      }
    }

    return value as T;
  }

  set(key: string, value: unknown): void {
    // Validate against schema if available
    if (this.schema[key]) {
      try {
        this.schema[key].parse(value);
      } catch (error) {
        if (this.options.throwOnValidationError) {
          throw new ConfigValidationError(
            `Invalid value for config key "${key}": ${error}`,
            key,
            value
          );
        }
        return;
      }
    }

    this.config[key] = value;
  }

  has(key: string): boolean {
    return key in this.config;
  }

  getRequired<T = string>(key: string): T {
    const value = this.get<T>(key);
    
    if (value === undefined) {
      throw new ConfigValidationError(
        `Required config key "${key}" is missing`,
        key,
        undefined
      );
    }
    
    return value;
  }

  getAll(): Record<string, unknown> {
    return { ...this.config };
  }

  validateConfig(): void {
    // Validate required fields
    if (this.options.requiredFields) {
      this.options.requiredFields.forEach(field => {
        if (!this.has(field)) {
          throw new ConfigValidationError(
            `Required config field "${field}" is missing`,
            field,
            undefined
          );
        }
      });
    }

    // Validate all fields against schema
    Object.entries(this.schema).forEach(([key, schema]) => {
      if (this.has(key)) {
        try {
          schema.parse(this.config[key]);
        } catch (error) {
          if (this.options.throwOnValidationError) {
            throw new ConfigValidationError(
              `Invalid value for config key "${key}": ${error}`,
              key,
              this.config[key]
            );
          }
        }
      }
    });
  }

  reload(): void {
    this.loadConfig();
    this.validateConfig();
  }

  // Common config getters
  getDatabaseUrl(): string {
    return this.getRequired('DATABASE_URL');
  }

  getRedisUrl(): string {
    return this.getRequired('REDIS_URL');
  }

  getPort(): number {
    return parseInt(this.get('PORT', '3000'), 10);
  }

  getNodeEnv(): string {
    return this.get('NODE_ENV', 'development');
  }

  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }

  isTest(): boolean {
    return this.getNodeEnv() === 'test';
  }
}
