import { RealtimeTimetableService, getRealtimeTimetableService } from '@/lib/services/realtimeTimetableService';
import { NotificationService } from '@/lib/services/notificationService';
import { TimetableNotificationService } from '@/lib/services/timetableNotificationService';

// Define interfaces locally to avoid import issues
interface TimetableChangeEvent {
  type: 'timetable_created' | 'timetable_updated' | 'timetable_deleted' | 'entry_changed' | 'conflict_detected';
  timetableId: string;
  batchId?: string;
  changes?: {
    before: any[];
    after: any[];
    modified: any[];
    added: any[];
    removed: any[];
  };
  conflicts?: any[];
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

type StakeholderType = 'student' | 'faculty' | 'hod' | 'room_manager' | 'lab_assistant' | 'admin' | 'dean' | 'registrar' | 'parent';

// Mock console methods
const mockConsole = {
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
global.console = { ...console, ...mockConsole };

// Mock setTimeout and setInterval
jest.useFakeTimers();

// Mock NotificationService
jest.mock('@/lib/services/notificationService');
jest.mock('@/lib/services/timetableNotificationService');

const mockNotificationService = {
  sendNotification: jest.fn().mockResolvedValue({
    success: true,
    notificationId: 'notif_123',
    sentChannels: ['email'],
    failedChannels: [],
    skippedChannels: [],
    errors: []
  })
} as jest.Mocked<NotificationService>;

// Mock WebSocket
let mockWebSocketInstance: any;
global.WebSocket = jest.fn().mockImplementation(() => {
  mockWebSocketInstance = {
    send: jest.fn(),
    close: jest.fn(),
    readyState: WebSocket.OPEN,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null,
    url: '',
    protocol: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob' as BinaryType,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED
  };
  return mockWebSocketInstance;
});

describe('RealtimeTimetableService', () => {
  let service: RealtimeTimetableService;
  let mockBaseNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    mockBaseNotificationService = mockNotificationService;
    
    // Reset environment variables
    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3001/timetable';
    process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET = 'true';
  });

  afterEach(() => {
    if (service) {
      service.disconnect();
    }
    jest.clearAllTimers();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default parameters', () => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
      
      expect(service).toBeInstanceOf(RealtimeTimetableService);
      expect(service.getConnectionState()).toBe('connecting');
      expect(mockConsole.info).toHaveBeenCalledWith('🚀 Initializing RealtimeTimetableService');
    });

    it('should initialize with custom WebSocket URL', () => {
      const customUrl = 'ws://custom.example.com/timetable';
      service = new RealtimeTimetableService(mockBaseNotificationService, customUrl);
      
      expect(global.WebSocket).toHaveBeenCalledWith(customUrl);
    });

    it('should skip WebSocket initialization when disabled', () => {
      service = new RealtimeTimetableService(
        mockBaseNotificationService,
        'ws://localhost:3001/timetable',
        false
      );
      
      expect(service.getConnectionState()).toBe('disconnected');
      expect(mockConsole.info).toHaveBeenCalledWith('📱 WebSocket disabled, running in polling mode only');
    });

    it('should handle WebSocket initialization error', () => {
      global.WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('WebSocket creation failed');
      });
      
      service = new RealtimeTimetableService(mockBaseNotificationService);
      
      expect(service.getConnectionState()).toBe('error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to initialize WebSocket connection:', 
        expect.any(Error)
      );
    });
  });

  describe('WebSocket Connection Handling', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should handle WebSocket open event', () => {
      if (mockWebSocketInstance?.onopen) {
        mockWebSocketInstance.onopen({} as Event);
      }
      
      expect(service.getConnectionState()).toBe('connected');
      expect(mockConsole.log).toHaveBeenCalledWith('WebSocket connection established');
    });

    it('should handle WebSocket close event with normal closure', () => {
      if (mockWebSocketInstance?.onclose) {
        mockWebSocketInstance.onclose({ code: 1000, reason: 'Normal closure' } as CloseEvent);
      }
      
      expect(service.getConnectionState()).toBe('disconnected');
    });

    it('should handle WebSocket error event', () => {
      if (mockWebSocketInstance?.onerror) {
        mockWebSocketInstance.onerror({ type: 'error' } as Event);
      }
      
      expect(service.getConnectionState()).toBe('error');
    });

    it('should handle WebSocket message with timetable change', () => {
      const timetableChangeEvent: TimetableChangeEvent = {
        type: 'timetable_updated',
        timetableId: 'tt_123',
        batchId: 'batch_456',
        timestamp: new Date().toISOString()
      };
      
      const messageEvent = {
        data: JSON.stringify({
          type: 'timetable_change',
          payload: timetableChangeEvent,
          timestamp: new Date().toISOString()
        })
      };
      
      if (mockWebSocketInstance?.onmessage) {
        mockWebSocketInstance.onmessage(messageEvent as MessageEvent);
      }
      
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('should handle invalid WebSocket message', () => {
      const messageEvent = {
        data: 'invalid json'
      };
      
      if (mockWebSocketInstance?.onmessage) {
        mockWebSocketInstance.onmessage(messageEvent as MessageEvent);
      }
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:', 
        expect.any(Error)
      );
    });

    it('should handle unknown message type', () => {
      const messageEvent = {
        data: JSON.stringify({
          type: 'unknown_type',
          payload: {},
          timestamp: new Date().toISOString()
        })
      };
      
      if (mockWebSocketInstance?.onmessage) {
        mockWebSocketInstance.onmessage(messageEvent as MessageEvent);
      }
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Unknown WebSocket message type:', 
        'unknown_type'
      );
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should create subscription successfully', () => {
      const subscriptionId = service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] },
        ['websocket', 'email']
      );
      
      expect(subscriptionId).toMatch(/^sub_\d+_[a-z0-9]+$/);
      expect(service.getActiveSubscriptions()).toHaveLength(1);
      
      const subscription = service.getActiveSubscriptions()[0];
      expect(subscription.userId).toBe('user_123');
      expect(subscription.stakeholderType).toBe('student');
      expect(subscription.filters.batchIds).toEqual(['batch_456']);
      expect(subscription.channels).toEqual(['websocket', 'email']);
    });

    it('should create subscription with callback', () => {
      const callback = jest.fn();
      const subscriptionId = service.subscribe(
        'user_123',
        'faculty',
        { facultyIds: ['faculty_789'] },
        ['websocket'],
        callback
      );
      
      const subscription = service.getActiveSubscriptions()[0];
      expect(subscription.callback).toBe(callback);
    });

    it('should unsubscribe successfully', () => {
      const subscriptionId = service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] }
      );
      
      const result = service.unsubscribe(subscriptionId);
      
      expect(result).toBe(true);
      expect(service.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should return false when unsubscribing non-existent subscription', () => {
      const result = service.unsubscribe('non_existent_id');
      
      expect(result).toBe(false);
    });

    it('should send subscription to WebSocket when connected', () => {
      // Simulate connected state
      if (mockWebSocketInstance?.onopen) {
        mockWebSocketInstance.onopen({} as Event);
      }
      
      const subscriptionId = service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] }
      );
      
      expect(mockWebSocketInstance.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"subscribe"')
      );
    });
  });

  describe('Notification System', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should send notifications for non-websocket channels', () => {
      service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] },
        ['email', 'push']
      );
      
      const event: TimetableChangeEvent = {
        type: 'timetable_created',
        timetableId: 'tt_123',
        batchId: 'batch_456',
        timestamp: new Date().toISOString()
      };
      
      service.publishTimetableChange(event);
      
      expect(mockBaseNotificationService.sendNotification).toHaveBeenCalledWith({
        userId: 'user_123',
        type: 'timetable_update',
        title: '📅 New Timetable Published',
        message: 'A new timetable has been published for your batch.',
        channels: ['email', 'push'],
        priority: 'high',
        data: expect.objectContaining({
          timetableId: 'tt_123',
          eventType: 'timetable_created'
        })
      });
    });

    it('should not send notifications for websocket-only channels', () => {
      service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] },
        ['websocket']
      );
      
      const event: TimetableChangeEvent = {
        type: 'timetable_created',
        timetableId: 'tt_123',
        batchId: 'batch_456',
        timestamp: new Date().toISOString()
      };
      
      service.publishTimetableChange(event);
      
      expect(mockBaseNotificationService.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle notification sending errors gracefully', async () => {
      mockBaseNotificationService.sendNotification.mockRejectedValue(
        new Error('Notification failed')
      );
      
      service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] },
        ['email']
      );
      
      const event: TimetableChangeEvent = {
        type: 'timetable_created',
        timetableId: 'tt_123',
        batchId: 'batch_456',
        timestamp: new Date().toISOString()
      };
      
      expect(() => service.publishTimetableChange(event)).not.toThrow();
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to send realtime notification:', 
        expect.any(Error)
      );
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should register and call event listeners', () => {
      const listener = jest.fn();
      const unsubscribe = service.on('connection', listener);
      
      // Simulate connection event
      if (mockWebSocketInstance?.onopen) {
        mockWebSocketInstance.onopen({} as Event);
      }
      
      expect(listener).toHaveBeenCalledWith({ connected: true });
      
      // Test unsubscribe
      unsubscribe();
      if (mockWebSocketInstance?.onclose) {
        mockWebSocketInstance.onclose({ code: 1000, reason: 'Normal' } as CloseEvent);
      }
      
      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners for an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      service.on('connection', listener1);
      service.on('connection', listener2);
      
      service.off('connection');
      
      // Trigger event
      if (mockWebSocketInstance?.onopen) {
        mockWebSocketInstance.onopen({} as Event);
      }
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should handle event listener errors gracefully', () => {
      const faultyListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      service.on('connection', faultyListener);
      
      // Should not throw
      expect(() => {
        if (mockWebSocketInstance?.onopen) {
          mockWebSocketInstance.onopen({} as Event);
        }
      }).not.toThrow();
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Event listener error:', 
        expect.any(Error)
      );
    });
  });

  describe('Connection State Management', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should return correct connection state', () => {
      expect(service.getConnectionState()).toBe('connecting');
    });

    it('should provide realtime timetable data interface', () => {
      const data = service.getRealtimeTimetableData(
        'user_123',
        'student',
        { batchIds: ['batch_456'] },
        ['websocket', 'email']
      );
      
      expect(data).toHaveProperty('isConnected');
      expect(data).toHaveProperty('lastUpdate');
      expect(data).toHaveProperty('subscribe');
      expect(data).toHaveProperty('unsubscribe');
      expect(typeof data.subscribe).toBe('function');
      expect(typeof data.unsubscribe).toBe('function');
    });
  });

  describe('Cleanup and Disconnect', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should clean up all resources on disconnect', () => {
      // Set up some state
      service.subscribe('user_123', 'student', {});
      service.on('connection', jest.fn());
      
      service.disconnect();
      
      expect(service.getActiveSubscriptions()).toHaveLength(0);
      expect(service.getConnectionState()).toBe('disconnected');
      expect(mockWebSocketInstance.close).toHaveBeenCalledWith(1000, 'Client disconnect');
    });
  });

  describe('Global Singleton', () => {
    it('should create singleton instance', () => {
      const instance1 = getRealtimeTimetableService(mockBaseNotificationService);
      const instance2 = getRealtimeTimetableService();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(RealtimeTimetableService);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      service = new RealtimeTimetableService(mockBaseNotificationService);
    });

    it('should handle subscription callback errors gracefully', () => {
      const faultyCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      service.subscribe(
        'user_123',
        'student',
        { batchIds: ['batch_456'] },
        ['websocket'],
        faultyCallback
      );
      
      const event: TimetableChangeEvent = {
        type: 'timetable_created',
        timetableId: 'tt_123',
        batchId: 'batch_456',
        timestamp: new Date().toISOString()
      };
      
      expect(() => service.publishTimetableChange(event)).not.toThrow();
      expect(faultyCallback).toHaveBeenCalled();
    });

    it('should handle events without changes gracefully', () => {
      service.subscribe('user_123', 'student', {}, ['email']);
      
      const event: TimetableChangeEvent = {
        type: 'timetable_created',
        timetableId: 'tt_123',
        timestamp: new Date().toISOString()
      };
      
      expect(() => service.publishTimetableChange(event)).not.toThrow();
    });

    it('should handle subscription without filters', () => {
      const subscriptionId = service.subscribe('user_123', 'student', {});
      
      expect(subscriptionId).toBeTruthy();
      expect(service.getActiveSubscriptions()).toHaveLength(1);
    });

    it('should not send messages when WebSocket is disabled', () => {
      service = new RealtimeTimetableService(
        mockBaseNotificationService,
        'ws://localhost:3001/timetable',
        false
      );
      
      const event: TimetableChangeEvent = {
        type: 'timetable_created',
        timetableId: 'tt_123',
        timestamp: new Date().toISOString()
      };
      
      service.publishTimetableChange(event);
      
      // Should not attempt to send via WebSocket
      expect(mockConsole.warn).not.toHaveBeenCalledWith('WebSocket not connected, message queued');
    });
  });
});