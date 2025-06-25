import { AnalyticsService } from '../analyticsService';
import { EventType, EventProperties, UserIdentity } from '@/types/analytics';

// Mock analytics providers
jest.mock('@segment/analytics-node');
import Analytics from '@segment/analytics-node';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockSegment: jest.Mocked<typeof Analytics>;
  
  // Test data
  const testUserId = 'user-123';
  const testEvent: { type: EventType; name: string; properties: EventProperties } = {
    type: 'track',
    name: 'Button Clicked',
    properties: { buttonId: 'cta-button', page: 'homepage' },
  };
  const testIdentity: UserIdentity = {
    userId: testUserId,
    traits: {
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new instance for each test
    analyticsService = new AnalyticsService({
      segmentWriteKey: 'test-segment-key',
      logger: mockLogger as any,
      enabled: true,
    });
    
    // Get the mock Segment client instance
    mockSegment = (Analytics as unknown) as jest.Mocked<typeof Analytics>;
    
    // Mock the identify method
    mockSegment.prototype.identify = jest.fn().mockImplementation((_msg, cb) => {
      if (cb) cb(undefined, { status: 'success' });
    });
    
    // Mock the track method
    mockSegment.prototype.track = jest.fn().mockImplementation((_msg, cb) => {
      if (cb) cb(undefined, { status: 'success' });
    });
    
    // Mock the page method
    mockSegment.prototype.page = jest.fn().mockImplementation((_msg, cb) => {
      if (cb) cb(undefined, { status: 'success' });
    });
    
    // Mock the group method
    mockSegment.prototype.group = jest.fn().mockImplementation((_msg, cb) => {
      if (cb) cb(undefined, { status: 'success' });
    });
    
    // Mock the alias method
    mockSegment.prototype.alias = jest.fn().mockImplementation((_msg, cb) => {
      if (cb) cb(undefined, { status: 'success' });
    });
    
    // Mock the flush method
    mockSegment.prototype.flush = jest.fn().mockImplementation((cb) => {
      if (cb) cb(undefined, { status: 'success' });
    });
  });
  
  afterEach(async () => {
    await analyticsService.shutdown();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      expect(analyticsService).toBeDefined();
      expect(Analytics).toHaveBeenCalledWith(
        expect.objectContaining({
          writeKey: 'test-segment-key',
          flushAt: 20,
          flushInterval: 10000,
        })
      );
    });
    
    it('should respect disabled flag', () => {
      const disabledService = new AnalyticsService({
        segmentWriteKey: 'test-key',
        enabled: false,
      });
      
      expect(disabledService.isEnabled()).toBe(false);
      disabledService.identify(testIdentity);
      expect(mockSegment.prototype.identify).not.toHaveBeenCalled();
    });
  });
  
  describe('identify', () => {
    it('should identify a user', async () => {
      await analyticsService.identify(testIdentity);
      
      expect(mockSegment.prototype.identify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          traits: testIdentity.traits,
        }),
        expect.any(Function)
      );
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Identified user',
        expect.objectContaining({ userId: testUserId })
      );
    });
    
    it('should handle identify errors', async () => {
      const error = new Error('Identify failed');
      mockSegment.prototype.identify = jest.fn().mockImplementation((_msg, cb) => {
        if (cb) cb(error);
      });
      
      await expect(analyticsService.identify(testIdentity)).rejects.toThrow('Identify failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to identify user', error);
    });
  });
  
  describe('track', () => {
    it('should track an event', async () => {
      await analyticsService.track({
        userId: testUserId,
        event: testEvent.name,
        properties: testEvent.properties,
      });
      
      expect(mockSegment.prototype.track).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          event: testEvent.name,
          properties: testEvent.properties,
        }),
        expect.any(Function)
      );
    });
    
    it('should handle anonymous events', async () => {
      const anonymousId = 'anon-123';
      await analyticsService.track({
        anonymousId,
        event: 'Anonymous Action',
        properties: { action: 'view' },
      });
      
      expect(mockSegment.prototype.track).toHaveBeenCalledWith(
        expect.objectContaining({
          anonymousId,
          event: 'Anonymous Action',
          properties: { action: 'view' },
        }),
        expect.any(Function)
      );
    });
    
    it('should handle track errors', async () => {
      const error = new Error('Track failed');
      mockSegment.prototype.track = jest.fn().mockImplementation((_msg, cb) => {
        if (cb) cb(error);
      });
      
      await expect(
        analyticsService.track({
          userId: testUserId,
          event: 'Test Event',
          properties: {},
        })
      ).rejects.toThrow('Track failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to track event', error);
    });
  });
  
  describe('page', () => {
    it('should track a page view', async () => {
      const pageProps = {
        name: 'Home',
        category: 'Marketing',
        url: 'https://example.com',
        path: '/',
        referrer: 'https://google.com',
        title: 'Welcome',
      };
      
      await analyticsService.page({
        userId: testUserId,
        ...pageProps,
      });
      
      expect(mockSegment.prototype.page).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          ...pageProps,
        }),
        expect.any(Function)
      );
    });
  });
  
  describe('group', () => {
    it('should associate a user with a group', async () => {
      const groupId = 'org-123';
      const groupTraits = {
        name: 'Acme Corp',
        industry: 'Technology',
        employees: 1000,
      };
      
      await analyticsService.group({
        userId: testUserId,
        groupId,
        traits: groupTraits,
      });
      
      expect(mockSegment.prototype.group).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          groupId,
          traits: groupTraits,
        }),
        expect.any(Function)
      );
    });
  });
  
  describe('alias', () => {
    it('should create an alias between two user IDs', async () => {
      const previousId = 'previous-user-123';
      
      await analyticsService.alias({
        previousId,
        userId: testUserId,
      });
      
      expect(mockSegment.prototype.alias).toHaveBeenCalledWith(
        expect.objectContaining({
          previousId,
          userId: testUserId,
        }),
        expect.any(Function)
      );
    });
  });
  
  describe('flush', () => {
    it('should flush pending events', async () => {
      await analyticsService.flush();
      
      expect(mockSegment.prototype.flush).toHaveBeenCalledWith(expect.any(Function));
      expect(mockLogger.debug).toHaveBeenCalledWith('Flushing analytics events');
    });
    
    it('should handle flush errors', async () => {
      const error = new Error('Flush failed');
      mockSegment.prototype.flush = jest.fn().mockImplementation((cb) => {
        if (cb) cb(error);
      });
      
      await expect(analyticsService.flush()).rejects.toThrow('Flush failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to flush analytics', error);
    });
  });
  
  describe('shutdown', () => {
    it('should flush and close the analytics client', async () => {
      await analyticsService.shutdown();
      
      expect(mockSegment.prototype.flush).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Analytics service shutdown');
    });
  });
  
  describe('middleware', () => {
    it('should create a middleware that tracks requests', async () => {
      const middleware = analyticsService.createRequestTrackingMiddleware();
      
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '192.168.1.1',
          referer: 'https://example.com',
        },
        ip: '127.0.0.1',
      } as any;
      
      const mockRes = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') callback();
        }),
        statusCode: 200,
        getHeader: jest.fn().mockReturnValue(1024),
      } as any;
      
      const mockNext = jest.fn().mockImplementation((err) => {
        if (err) throw err;
      });
      
      // Mock Date for consistent timing
      const startTime = new Date('2023-01-01T00:00:00Z');
      const endTime = new Date('2023-01-01T00:00:01Z');
      
      jest.spyOn(global, 'Date').mockImplementationOnce(() => startTime as any);
      
      // Mock track method
      const trackSpy = jest.spyOn(analyticsService, 'track');
      
      // Call middleware
      middleware(mockReq, mockRes, mockNext);
      
      // Simulate response finish
      mockRes.on.mock.calls.find(([event]) => event === 'finish')?.[1]();
      
      // Restore Date
      jest.restoreAllMocks();
      
      expect(trackSpy).toHaveBeenCalledWith({
        userId: undefined,
        event: 'API Request',
        properties: expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          statusCode: 200,
          duration: 1000, // 1 second
          userAgent: 'test-agent',
          ip: '127.0.0.1',
          referer: 'https://example.com',
          responseSize: 1, // 1KB
        }),
      });
    });
  });
  
  describe('error handling', () => {
    it('should handle initialization errors', () => {
      const error = new Error('Init failed');
      (Analytics as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });
      
      expect(
        () => new AnalyticsService({ segmentWriteKey: 'test-key' })
      ).toThrow('Init failed');
    });
    
    it('should handle missing write key in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(() => new AnalyticsService({ segmentWriteKey: '' })).toThrow(
        'Segment write key is required in production'
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('feature flags', () => {
    it('should respect feature flags', async () => {
      analyticsService.setFeatureFlag('trackClicks', false);
      
      await analyticsService.track({
        userId: testUserId,
        event: 'Button Clicked',
        properties: { buttonId: 'test' },
      });
      
      // Should not track when feature is disabled
      expect(mockSegment.prototype.track).not.toHaveBeenCalled();
      
      // Enable feature and track again
      analyticsService.setFeatureFlag('trackClicks', true);
      
      await analyticsService.track({
        userId: testUserId,
        event: 'Button Clicked',
        properties: { buttonId: 'test' },
      });
      
      // Should track when feature is enabled
      expect(mockSegment.prototype.track).toHaveBeenCalled();
    });
  });
});
