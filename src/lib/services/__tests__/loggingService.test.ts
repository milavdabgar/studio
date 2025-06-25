import { LoggingService, LogLevel, LogContext } from '../loggingService';
import winston from 'winston';
import Transport from 'winston-transport';

// Mock winston
jest.mock('winston', () => {
  const format = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    errors: jest.fn(),
  };

  return {
    format,
    createLogger: jest.fn().mockReturnValue({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      log: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      close: jest.fn(),
    }),
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
      Http: jest.fn(),
      Stream: jest.fn(),
    },
    addColors: jest.fn(),
  };
});

describe('LoggingService', () => {
  let loggingService: LoggingService;
  let mockLogger: jest.Mocked<winston.Logger>;
  
  // Test data
  const testMessage = 'Test log message';
  const testContext: LogContext = {
    userId: 'user-123',
    requestId: 'req-456',
    metadata: { key: 'value' },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock logger instance
    mockLogger = winston.createLogger() as jest.Mocked<winston.Logger>;
    
    // Create a new instance for each test
    loggingService = new LoggingService({
      level: 'info',
      defaultMeta: { service: 'test-service' },
      enableConsole: true,
    });
    
    // Replace the internal logger with our mock
    (loggingService as any).logger = mockLogger;
  });
  
  describe('initialization', () => {
    it('should initialize with default options', () => {
      const service = new LoggingService();
      
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          defaultMeta: {},
          levels: expect.any(Object),
          format: expect.anything(),
          transports: expect.any(Array),
        })
      );
    });
    
    it('should initialize with custom options', () => {
      const customMeta = { service: 'custom-service', version: '1.0.0' };
      const service = new LoggingService({
        level: 'debug',
        defaultMeta: customMeta,
        enableConsole: false,
      });
      
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          defaultMeta: customMeta,
        })
      );
    });
    
    it('should add console transport when enabled', () => {
      new LoggingService({ enableConsole: true });
      
      const loggerInstance = (winston.createLogger as jest.Mock).mock.results[0].value;
      expect(loggerInstance.add).toHaveBeenCalledWith(expect.any(winston.transports.Console));
    });
    
    it('should add file transport when configured', () => {
      new LoggingService({
        file: {
          filename: 'app.log',
          dirname: '/var/log',
          maxSize: '20m',
          maxFiles: '14d',
        },
      });
      
      const loggerInstance = (winston.createLogger as jest.Mock).mock.results[0].value;
      expect(loggerInstance.add).toHaveBeenCalledWith(expect.any(winston.transports.File));
    });
  });
  
  describe('log levels', () => {
    const testCases: Array<{ level: LogLevel; method: keyof LoggingService }> = [
      { level: 'error', method: 'error' },
      { level: 'warn', method: 'warn' },
      { level: 'info', method: 'info' },
      { level: 'http', method: 'http' },
      { level: 'verbose', method: 'verbose' },
      { level: 'debug', method: 'debug' },
      { level: 'silly', method: 'silly' },
    ];
    
    testCases.forEach(({ level, method }) => {
      it(`should log ${level} level messages`, () => {
        loggingService[method](testMessage, testContext);
        
        expect(mockLogger.log).toHaveBeenCalledWith(
          level,
          testMessage,
          expect.objectContaining({
            ...testContext,
            timestamp: expect.any(String),
          })
        );
      });
    });
    
    it('should use the log method with explicit level', () => {
      loggingService.log('warn', testMessage, testContext);
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'warn',
        testMessage,
        expect.objectContaining(testContext)
      );
    });
    
    it('should handle errors with stack traces', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      loggingService.error('Operation failed', { ...testContext, error });
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Operation failed',
        expect.objectContaining({
          ...testContext,
          stack: error.stack,
        })
      );
    });
  });
  
  describe('context handling', () => {
    it('should merge context with default metadata', () => {
      const service = new LoggingService({
        defaultMeta: { service: 'test', env: 'test' },
      });
      
      (service as any).logger = mockLogger;
      
      service.info(testMessage, { userId: 'user-123' });
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        testMessage,
        expect.objectContaining({
          service: 'test',
          env: 'test',
          userId: 'user-123',
        })
      );
    });
    
    it('should handle circular references in context', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      loggingService.info('Circular ref test', { circularObj });
      
      // Should not throw and should handle circular reference
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('child loggers', () => {
    it('should create a child logger with additional context', () => {
      const childLogger = loggingService.child({ module: 'auth' });
      
      // The child logger should have the same interface
      childLogger.info('Child logger test');
      
      expect(mockLogger.child).toHaveBeenCalledWith(
        { module: 'auth' },
        expect.any(Boolean)
      );
    });
    
    it('should maintain parent context in child logger', () => {
      const parentContext = { requestId: 'req-123' };
      const parentLogger = new LoggingService({ defaultMeta: parentContext });
      
      const mockChildLogger = {
        ...mockLogger,
        defaultMeta: { ...parentContext, module: 'auth' },
      };
      
      mockLogger.child.mockReturnValue(mockChildLogger as any);
      
      const childLogger = parentLogger.child({ module: 'auth' });
      childLogger.info('Test with parent context');
      
      expect(mockLogger.child).toHaveBeenCalledWith(
        { module: 'auth' },
        true // merge with parent
      );
    });
  });
  
  describe('transport management', () => {
    it('should add a custom transport', () => {
      const customTransport = new Transport({
        log: jest.fn(),
      });
      
      loggingService.addTransport(customTransport);
      
      expect(mockLogger.add).toHaveBeenCalledWith(customTransport);
    });
    
    it('should remove a transport', () => {
      const transport = new Transport({
        log: jest.fn(),
      });
      
      loggingService.removeTransport(transport);
      
      expect(mockLogger.remove).toHaveBeenCalledWith(transport);
    });
    
    it('should clear all transports', () => {
      loggingService.clearTransports();
      
      expect(mockLogger.clear).toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should handle logging errors', () => {
      const error = new Error('Logging failed');
      mockLogger.log.mockImplementationOnce(() => {
        throw error;
      });
      
      // Should not throw
      expect(() => {
        loggingService.info('This should not throw');
      }).not.toThrow();
    });
    
    it('should handle transport errors', () => {
      const error = new Error('Transport error');
      
      // Simulate transport error
      const errorHandler = mockLogger.on.mock.calls.find(
        ([event]) => event === 'error'
      )?.[1] as (err: Error) => void;
      
      errorHandler?.(error);
      
      // Should log the transport error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Transport error',
        { error },
        expect.any(Function)
      );
    });
  });
  
  describe('shutdown', () => {
    it('should close all transports on shutdown', async () => {
      const mockClose = jest.fn().mockResolvedValue(undefined);
      mockLogger.close = mockClose;
      
      await loggingService.shutdown();
      
      expect(mockClose).toHaveBeenCalled();
    });
    
    it('should handle shutdown errors', async () => {
      const error = new Error('Failed to close');
      mockLogger.close = jest.fn().mockRejectedValue(error);
      
      await expect(loggingService.shutdown()).rejects.toThrow('Failed to close');
    });
  });
  
  describe('performance logging', () => {
    it('should log execution time', async () => {
      const operation = () => new Promise(resolve => setTimeout(resolve, 100));
      
      await loggingService.time('test-operation', operation);
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'debug',
        'Operation test-operation completed',
        expect.objectContaining({
          durationMs: expect.any(Number),
          operation: 'test-operation',
        })
      );
      
      // Verify duration is approximately 100ms (with some tolerance)
      const duration = (mockLogger.log as jest.Mock).mock.calls[0][2].durationMs;
      expect(duration).toBeGreaterThanOrEqual(90);
      expect(duration).toBeLessThan(200);
    });
    
    it('should log operation failures', async () => {
      const error = new Error('Operation failed');
      const failingOperation = () => Promise.reject(error);
      
      await expect(
        loggingService.time('failing-operation', failingOperation)
      ).rejects.toThrow('Operation failed');
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Operation failing-operation failed',
        expect.objectContaining({
          operation: 'failing-operation',
          error,
          durationMs: expect.any(Number),
        })
      );
    });
  });
  
  describe('request logging middleware', () => {
    it('should log HTTP requests', () => {
      const req = {
        method: 'GET',
        url: '/test',
        headers: {
          'user-agent': 'test-agent',
          'x-request-id': 'req-123',
        },
        ip: '127.0.0.1',
      } as any;
      
      const res = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') callback();
          return res;
        }),
        statusCode: 200,
        getHeader: jest.fn().mockReturnValue(1024), // Content-Length
      } as any;
      
      const next = jest.fn();
      
      const middleware = loggingService.requestLogger();
      middleware(req, res, next);
      
      // Simulate response finish
      res.on.mock.calls.find(([event]) => event === 'finish')?.[1]();
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'http',
        'HTTP request',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          statusCode: 200,
          responseSize: 1, // 1KB
          durationMs: expect.any(Number),
          userAgent: 'test-agent',
          ip: '127.0.0.1',
          requestId: 'req-123',
        })
      );
      
      expect(next).toHaveBeenCalled();
    });
  });
});
