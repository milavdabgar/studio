import { jest } from '@jest/globals';

// Mock the services
const mockService = {
  getConnectionState: jest.fn(),
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  disconnect: jest.fn(),
  getActiveSubscriptions: jest.fn()
};

const mockNotificationService = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
};

jest.mock('@/lib/services/realtimeTimetableService', () => ({
  getRealtimeTimetableService: jest.fn(() => mockService)
}));

jest.mock('@/lib/services/notificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => mockNotificationService)
}));

describe('useRealtimeTimetable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getConnectionState.mockReturnValue('disconnected');
    mockService.on.mockReturnValue(jest.fn());
    mockService.subscribe.mockReturnValue('subscription-123');
    mockService.getActiveSubscriptions.mockReturnValue([]);
  });

  it('should import hooks without error', () => {
    expect(() => {
      const hooks = require('../useRealtimeTimetable');
      expect(hooks.useRealtimeTimetable).toBeDefined();
      expect(hooks.useStudentRealtimeTimetable).toBeDefined();
      expect(hooks.useFacultyRealtimeTimetable).toBeDefined();
      expect(hooks.useHODRealtimeTimetable).toBeDefined();
      expect(hooks.useRoomManagerRealtimeTimetable).toBeDefined();
      expect(hooks.useRealtimeConnectionStatus).toBeDefined();
    }).not.toThrow();
  });

  it('should verify mock services are properly configured', () => {
    expect(mockService.getConnectionState).toHaveBeenCalledTimes(0);
    expect(mockService.on).toHaveBeenCalledTimes(0);
    expect(mockService.subscribe).toHaveBeenCalledTimes(0);
    expect(mockService.unsubscribe).toHaveBeenCalledTimes(0);
    expect(mockService.disconnect).toHaveBeenCalledTimes(0);
    expect(mockService.getActiveSubscriptions).toHaveBeenCalledTimes(0);
  });

  it('should pass basic hook validation', () => {
    const hooks = require('../useRealtimeTimetable');
    
    // Verify hook functions are defined
    expect(typeof hooks.useRealtimeTimetable).toBe('function');
    expect(typeof hooks.useStudentRealtimeTimetable).toBe('function');
    expect(typeof hooks.useFacultyRealtimeTimetable).toBe('function');
    expect(typeof hooks.useHODRealtimeTimetable).toBe('function');
    expect(typeof hooks.useRoomManagerRealtimeTimetable).toBe('function');
    expect(typeof hooks.useRealtimeConnectionStatus).toBe('function');
  });
});