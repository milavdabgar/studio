import { z } from 'zod';

export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
  code: string;
  [key: string]: unknown;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

export interface ValidationServiceConfig {
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
  formatError?: (error: z.ZodIssue) => ValidationErrorDetail;
}

export class ValidationError extends Error {
  public readonly issues: ValidationErrorDetail[];

  constructor(message: string, issues: ValidationErrorDetail[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export class ValidationService {
  private config: ValidationServiceConfig;

  constructor(config: ValidationServiceConfig = {}) {
    this.config = config;
  }

  validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        return {
          success: false,
          errors: result.error.issues.map(issue => this.formatError(issue)),
        };
      }
    } catch (error) {
      this.config.logger?.error('Validation error:', error);
      return {
        success: false,
        errors: [{
          path: [],
          message: 'Validation failed',
          code: 'internal_error',
        }],
      };
    }
  }

  async validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<ValidationResult<T>> {
    try {
      const result = await schema.safeParseAsync(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        return {
          success: false,
          errors: result.error.issues.map(issue => this.formatError(issue)),
        };
      }
    } catch (error) {
      this.config.logger?.error('Async validation error:', error);
      return {
        success: false,
        errors: [{
          path: [],
          message: 'Validation failed',
          code: 'internal_error',
        }],
      };
    }
  }

  middleware<T>(schema: z.ZodSchema<T>) {
    return async (req: unknown, res: unknown, next: (...args: unknown[]) => void) => {
      try {
        const toValidate = {
          body: (req as { body?: unknown }).body || {},
          query: (req as { query?: unknown }).query || {},
          params: (req as { params?: unknown }).params || {},
        };

        const result = await this.validateAsync(schema, toValidate);

        if (result.success) {
          (req as { validated: unknown }).validated = result.data;
          next();
        } else {
          (res as { status: (code: number) => { json: (body: unknown) => void } }).status(400).json({
            success: false,
            error: 'Validation failed',
            details: result.errors,
          });
        }
      } catch (error) {
        this.config.logger?.error('Middleware validation error:', error);
        (res as { status: (code: number) => { json: (body: unknown) => void } }).status(500).json({
          success: false,
          error: 'Internal validation error',
        });
      }
    };
  }

  private formatError(issue: z.ZodIssue): ValidationErrorDetail {
    if (this.config.formatError) {
      return this.config.formatError(issue);
    }

    return {
      path: issue.path,
      message: issue.message,
      code: issue.code,
    };
  }
}
