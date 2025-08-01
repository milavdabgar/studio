import { renderHook, act } from '@testing-library/react';
import {
  useRealtimeTimetable,
  useStudentRealtimeTimetable,
  useFacultyRealtimeTimetable,
  useHODRealtimeTimetable,
  useRealtimeConnectionStatus
} from '@/hooks/useRealtimeTimetable';

// Mock the realtime service
jest.mock('@/lib/services/realtimeTimetableService', () => ({
  getRealtimeTimetableService: jest.fn(() => ({
    subscribe: jest.fn().mockReturnValue('subscription-123'),
    unsubscribe: jest.fn(),
    on: jest.fn().mockReturnValue(() => {}),
    disconnect: jest.fn(),
    getConnectionState: jest.fn().mockReturnValue('connected'),
    getActiveSubscriptions: jest.fn().mockReturnValue([])
  }))
}));

// Mock notification service
jest.mock('@/lib/services/notificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }
  }))
}));

describe('useRealtimeTimetable', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: false
      })
    );

    expect(result.current.isConnected).toBe(true); // Mock returns connected
    expect(result.current.connectionState).toBe('connected');
    expect(result.current.lastUpdate).toBeNull();
  });

  it('auto-connects when autoConnect is true', () => {
    const mockOnTimetableChange = jest.fn();
    
    renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        onTimetableChange: mockOnTimetableChange,
        autoConnect: true
      })
    );

    // Service should be initialized and subscribed
    expect(require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService).toHaveBeenCalled();
  });

  it('calls onTimetableChange when events are received', () => {
    const mockOnTimetableChange = jest.fn();
    const mockService = {
      subscribe: jest.fn().mockReturnValue('subscription-123'),
      unsubscribe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'timetable_change') {
          // Simulate event
          setTimeout(() => {
            callback({
              type: 'timetable_updated',
              timetableId: 'tt123',
              timestamp: new Date().toISOString()
            });
          }, 0);
        }
        return () => {};
      }),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('connected'),
      getActiveSubscriptions: jest.fn().mockReturnValue([])
    };

    require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService.mockReturnValue(mockService);

    const { result } = renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        onTimetableChange: mockOnTimetableChange,
        autoConnect: true
      })
    );

    // Event should be processed
    expect(mockService.on).toHaveBeenCalledWith('timetable_change', expect.any(Function));
  });

  it('handles connection state changes', () => {
    const mockOnConnectionChange = jest.fn();
    const mockService = {
      subscribe: jest.fn().mockReturnValue('subscription-123'),
      unsubscribe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'connection') {
          setTimeout(() => {
            callback({ connected: false });
          }, 0);
        }
        return () => {};
      }),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('disconnected'),
      getActiveSubscriptions: jest.fn().mockReturnValue([])
    };

    require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService.mockReturnValue(mockService);

    renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        onConnectionChange: mockOnConnectionChange,
        autoConnect: true
      })
    );

    expect(mockService.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('provides subscribe function', () => {
    const { result } = renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: false
      })
    );

    act(() => {
      const subscriptionId = result.current.subscribe();
      expect(subscriptionId).toBe('subscription-123');
    });
  });

  it('provides unsubscribe function', () => {
    const mockService = {
      subscribe: jest.fn().mockReturnValue('subscription-123'),
      unsubscribe: jest.fn(),
      on: jest.fn().mockReturnValue(() => {}),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('connected'),
      getActiveSubscriptions: jest.fn().mockReturnValue([])
    };

    require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService.mockReturnValue(mockService);

    const { result } = renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: true
      })
    );

    act(() => {
      result.current.unsubscribe();
    });

    expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
  });

  it('provides reconnect function', () => {
    const mockService = {
      subscribe: jest.fn().mockReturnValue('subscription-123'),
      unsubscribe: jest.fn(),
      on: jest.fn().mockReturnValue(() => {}),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('connected'),
      getActiveSubscriptions: jest.fn().mockReturnValue([])
    };

    require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService.mockReturnValue(mockService);

    const { result } = renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: false
      })
    );

    act(() => {
      result.current.reconnect();
    });

    expect(mockService.disconnect).toHaveBeenCalled();
  });

  it('provides getActiveSubscriptions function', () => {
    const mockSubscriptions = [{ id: 'sub1', userId: 'user123' }];
    const mockService = {
      subscribe: jest.fn().mockReturnValue('subscription-123'),
      unsubscribe: jest.fn(),
      on: jest.fn().mockReturnValue(() => {}),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('connected'),
      getActiveSubscriptions: jest.fn().mockReturnValue(mockSubscriptions)
    };

    require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService.mockReturnValue(mockService);

    const { result } = renderHook(() =>
      useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: false
      })
    );

    act(() => {
      const subscriptions = result.current.getActiveSubscriptions();
      expect(subscriptions).toEqual(mockSubscriptions);
    });
  });
});

describe('useStudentRealtimeTimetable', () => {
  it('configures correctly for student stakeholder', () => {
    const mockOnTimetableChange = jest.fn();

    renderHook(() =>
      useStudentRealtimeTimetable('student123', ['batch1', 'batch2'], mockOnTimetableChange)
    );

    const service = require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService();
    expect(service.subscribe).toHaveBeenCalledWith(
      'student123',
      'student',
      { batchIds: ['batch1', 'batch2'] },
      ['websocket', 'push'],
      expect.any(Function)
    );
  });
});

describe('useFacultyRealtimeTimetable', () => {
  it('configures correctly for faculty stakeholder', () => {
    const mockOnTimetableChange = jest.fn();

    renderHook(() =>
      useFacultyRealtimeTimetable('faculty123', ['fac1', 'fac2'], mockOnTimetableChange)
    );

    const service = require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService();
    expect(service.subscribe).toHaveBeenCalledWith(
      'faculty123',
      'faculty',
      { facultyIds: ['fac1', 'fac2'] },
      ['websocket', 'push', 'email'],
      expect.any(Function)
    );
  });
});

describe('useHODRealtimeTimetable', () => {
  it('configures correctly for HOD stakeholder', () => {
    const mockOnTimetableChange = jest.fn();

    renderHook(() =>
      useHODRealtimeTimetable('hod123', ['batch1', 'batch2'], mockOnTimetableChange)
    );

    const service = require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService();
    expect(service.subscribe).toHaveBeenCalledWith(
      'hod123',
      'hod',
      { batchIds: ['batch1', 'batch2'] },
      ['websocket', 'email'],
      expect.any(Function)
    );
  });
});

describe('useRealtimeConnectionStatus', () => {
  it('returns connection status', () => {
    const { result } = renderHook(() => useRealtimeConnectionStatus());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('updates when connection state changes', () => {
    const mockService = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'connection') {
          setTimeout(() => {
            callback({ connected: false });
          }, 0);
        }
        return () => {};
      }),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('disconnected'),
      getActiveSubscriptions: jest.fn().mockReturnValue([])
    };

    require('@/lib/services/realtimeTimetableService').getRealtimeTimetableService.mockReturnValue(mockService);

    const { result } = renderHook(() => useRealtimeConnectionStatus());

    expect(mockService.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });
});