import { AnalyticsService, EventProperties, UserIdentity } from '../analyticsService';

// Mock Google Analytics
const mockGtag = jest.fn();
(global as any).window = { gtag: mockGtag };

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  
  // Test data
  const testUserId = 'user-123';
  const testEvent = {
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
    mockGtag.mockClear();
    
    // Create a new instance for each test
    analyticsService = new AnalyticsService();
    analyticsService.addGoogleAnalytics('GA_MEASUREMENT_ID');
  });

  describe('initialization', () => {
    it('should initialize analytics service', () => {
      expect(analyticsService).toBeDefined();
    });
    
    it('should add providers correctly', () => {
      const newService = new AnalyticsService();
      newService.addGoogleAnalytics('test-id');
      newService.addMixpanel('test-token');
      expect(newService).toBeDefined();
    });
  });
  
  describe('identify', () => {
    it('should identify a user', async () => {
      await analyticsService.identify(testIdentity);
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA_MEASUREMENT_ID', {
        user_id: testUserId,
        custom_map: testIdentity.traits,
      });
    });
    
    it('should handle identify with minimal data', async () => {
      await analyticsService.identify({ userId: testUserId });
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA_MEASUREMENT_ID', {
        user_id: testUserId,
        custom_map: undefined,
      });
    });
  });
  
  describe('track', () => {
    it('should track an event', async () => {
      await analyticsService.track('Button Clicked', testEvent.properties, { userId: testUserId });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'Button Clicked', {
        event_category: 'engagement',
        event_label: undefined,
        value: undefined,
        user_id: testUserId,
        buttonId: 'cta-button',
        page: 'homepage',
      });
    });
    
    it('should track event with current user', async () => {
      await analyticsService.identify(testIdentity);
      await analyticsService.track('Page View', { url: '/test' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'Page View', {
        event_category: 'engagement',
        event_label: undefined,
        value: undefined,
        user_id: testUserId,
        url: '/test',
      });
    });
    
    it('should handle track with minimal data', async () => {
      await analyticsService.track('Simple Event');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'Simple Event', {
        event_category: 'engagement',
        event_label: undefined,
        value: undefined,
        user_id: undefined,
      });
    });
  });
  
  describe('page tracking', () => {
    it('should track page views via analytics providers', async () => {
      const pageProps = {
        title: 'Home Page',
        url: 'https://example.com',
      };
      
      await analyticsService.page(pageProps);
      
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA_MEASUREMENT_ID', {
        page_title: 'Home Page',
        page_location: 'https://example.com',
      });
    });
  });
});
