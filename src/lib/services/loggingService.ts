import winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
}

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  fileOptions?: {
    filename: string;
    maxsize?: number;
    maxFiles?: number;
  };
  enableDatabase?: boolean;
  enableRemote?: boolean;
  remoteOptions?: {
    endpoint: string;
    apiKey: string;
  };
}

export class LoggingService {
  private logger: winston.Logger;
  private config: LoggingConfig;

  constructor(config: LoggingConfig) {
    this.config = config;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            })
          ),
        })
      );
    }

    // File transport
    if (this.config.enableFile && this.config.fileOptions) {
      transports.push(
        new winston.transports.File({
          filename: this.config.fileOptions.filename,
          maxsize: this.config.fileOptions.maxsize || 5242880, // 5MB
          maxFiles: this.config.fileOptions.maxFiles || 5,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false,
    });
  }

  log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    this.logger.log(level, message, {
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });

    // Store in database if enabled
    if (this.config.enableDatabase) {
      this.storeInDatabase(entry).catch(err => {
        console.error('Failed to store log in database:', err);
      });
    }

    // Send to remote service if enabled
    if (this.config.enableRemote && this.config.remoteOptions) {
      this.sendToRemote(entry).catch(err => {
        console.error('Failed to send log to remote service:', err);
      });
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.log(LogLevel.VERBOSE, message, context);
  }

  http(message: string, context?: LogContext): void {
    this.log(LogLevel.HTTP, message, context);
  }

  silly(message: string, context?: LogContext): void {
    this.log(LogLevel.SILLY, message, context);
  }

  createChildLogger(defaultContext: LogContext): LoggingService {
    return {
      ...this,
      log: (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
        const mergedContext = { ...defaultContext, ...context };
        this.log(level, message, mergedContext, error);
      },
      error: (message: string, error?: Error, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.error(message, error, mergedContext);
      },
      warn: (message: string, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.warn(message, mergedContext);
      },
      info: (message: string, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.info(message, mergedContext);
      },
      debug: (message: string, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.debug(message, mergedContext);
      },
      verbose: (message: string, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.verbose(message, mergedContext);
      },
      http: (message: string, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.http(message, mergedContext);
      },
      silly: (message: string, context?: LogContext) => {
        const mergedContext = { ...defaultContext, ...context };
        this.silly(message, mergedContext);
      },
    } as LoggingService;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.logger.level = level;
  }

  private async storeInDatabase(entry: LogEntry): Promise<void> {
    // Implementation would depend on the database service
    // This is a placeholder for database storage
    console.log('Storing log entry in database:', entry);
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteOptions) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteOptions.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.remoteOptions.apiKey}`,
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    // This would typically query a database
    // For now, return empty array as this is a placeholder
    return [];
  }

  close(): void {
    this.logger.close();
  }
}
