import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { 
  useRealtimeTimetable, 
  useStudentRealtimeTimetable,
  useFacultyRealtimeTimetable,
  useHODRealtimeTimetable,
  useRoomManagerRealtimeTimetable,
  useRealtimeConnectionStatus 
} from '../useRealtimeTimetable';

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
  NotificationService: jest.fn(() => mockNotificationService)
}));

// Mock window object
Object.defineProperty(window, 'window', {
  value: {},
  writable: true
});

describe('useRealtimeTimetable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getConnectionState.mockReturnValue('disconnected');
    mockService.on.mockReturnValue(jest.fn()); // Mock unsubscribe function
    mockService.subscribe.mockReturnValue('subscription-123');
    mockService.getActiveSubscriptions.mockReturnValue([]);
  });

  const defaultOptions = {
    userId: 'user-123',
    stakeholderType: 'student' as const,
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.lastUpdate).toBeNull();
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
    expect(typeof result.current.reconnect).toBe('function');
    expect(typeof result.current.getActiveSubscriptions).toBe('function');
  });

  it('should set up connection listener', () => {
    renderHook(() => useRealtimeTimetable(defaultOptions));

    expect(mockService.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(mockService.on).toHaveBeenCalledWith('timetable_change', expect.any(Function));
  });

  it('should update connection state when service emits connection event', () => {
    let connectionCallback: (data: { connected: boolean }) => void;
    mockService.on.mockImplementation(((event: string, callback: any) => {
      if (event === 'connection') {
        connectionCallback = callback;
      }
      return jest.fn();
    }) as any);

    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

    act(() => {
      connectionCallback({ connected: true });
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should update lastUpdate when timetable change event is received', () => {
    let timetableCallback: (event: any) => void;
    mockService.on.mockImplementation(((event: string, callback: any) => {
      if (event === 'timetable_change') {
        timetableCallback = callback;
      }
      return jest.fn();
    }) as any);

    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));
    
    const mockEvent = {
      type: 'timetable_updated' as const,
      timetableId: 'tt-123',
      timestamp: '2023-01-01T10:00:00Z'
    };

    act(() => {
      timetableCallback(mockEvent);
    });

    expect(result.current.lastUpdate).toEqual(mockEvent);
  });

  it('should call onConnectionChange callback', () => {
    const onConnectionChange = jest.fn();
    let connectionCallback: (data: { connected: boolean }) => void;
    
    mockService.on.mockImplementation(((event: string, callback: any) => {
      if (event === 'connection') {
        connectionCallback = callback;
      }
      return jest.fn();
    }) as any);

    renderHook(() => useRealtimeTimetable({
      ...defaultOptions,
      onConnectionChange
    }));

    act(() => {
      connectionCallback({ connected: true });
    });

    expect(onConnectionChange).toHaveBeenCalledWith(true);
  });

  it('should call onTimetableChange callback', () => {
    const onTimetableChange = jest.fn();
    let timetableCallback: (event: any) => void;
    
    mockService.on.mockImplementation(((event: string, callback: any) => {
      if (event === 'timetable_change') {
        timetableCallback = callback;
      }
      return jest.fn();
    }) as any);

    renderHook(() => useRealtimeTimetable({
      ...defaultOptions,
      onTimetableChange
    }));

    const mockEvent = {
      type: 'timetable_updated' as const,
      timetableId: 'tt-123',
      timestamp: '2023-01-01T10:00:00Z'
    };

    act(() => {
      timetableCallback(mockEvent);
    });

    expect(onTimetableChange).toHaveBeenCalledWith(mockEvent);
  });

  it('should auto-subscribe when autoConnect is true', () => {
    renderHook(() => useRealtimeTimetable({
      ...defaultOptions,
      autoConnect: true
    }));

    expect(mockService.subscribe).toHaveBeenCalledWith(
      'user-123',
      'student',
      {},
      ['websocket'],
      expect.any(Function)
    );
  });

  it('should not auto-subscribe when autoConnect is false', () => {
    renderHook(() => useRealtimeTimetable({
      ...defaultOptions,
      autoConnect: false
    }));

    expect(mockService.subscribe).not.toHaveBeenCalled();
  });

  it('should use custom filters and channels', () => {
    const filters = { batchIds: ['batch-1', 'batch-2'] };
    const channels = ['websocket', 'push'] as ('websocket' | 'push')[];

    renderHook(() => useRealtimeTimetable({
      ...defaultOptions,
      filters,
      channels
    }));

    expect(mockService.subscribe).toHaveBeenCalledWith(
      'user-123',
      'student',
      filters,
      channels,
      expect.any(Function)
    );
  });

  it('should handle manual subscribe', () => {
    const { result } = renderHook(() => useRealtimeTimetable({
      ...defaultOptions,
      autoConnect: false
    }));

    let subscriptionId: string | null = null;
    act(() => {
      subscriptionId = result.current.subscribe();
    });

    expect(subscriptionId).toBe('subscription-123');
    expect(mockService.subscribe).toHaveBeenCalled();
  });

  it('should handle subscribe without required params', () => {
    const { result } = renderHook(() => useRealtimeTimetable({
      userId: '',
      stakeholderType: 'student',
      autoConnect: false
    }));

    let subscriptionId: string | null = null;
    act(() => {
      subscriptionId = result.current.subscribe();
    });

    expect(subscriptionId).toBeNull();
    expect(mockService.subscribe).not.toHaveBeenCalled();
  });

  it('should handle unsubscribe', () => {
    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

    act(() => {
      result.current.unsubscribe();
    });

    expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
  });

  it('should handle reconnect', () => {
    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

    act(() => {
      result.current.reconnect();
    });

    expect(mockService.disconnect).toHaveBeenCalled();
  });

  it('should get active subscriptions', () => {
    const mockSubscriptions = [{ id: 'sub-1' }, { id: 'sub-2' }];
    mockService.getActiveSubscriptions.mockReturnValue(mockSubscriptions);

    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

    expect(result.current.getActiveSubscriptions()).toEqual(mockSubscriptions);
  });

  it('should cleanup on unmount', () => {
    const unsubscribeConnection = jest.fn();
    const unsubscribeTimetable = jest.fn();
    const unsubscribeSubscription = jest.fn();

    mockService.on
      .mockReturnValueOnce(unsubscribeConnection)
      .mockReturnValueOnce(unsubscribeTimetable);

    const { unmount } = renderHook(() => useRealtimeTimetable(defaultOptions));

    unmount();

    expect(unsubscribeConnection).toHaveBeenCalled();
    expect(unsubscribeTimetable).toHaveBeenCalled();
    expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
  });

  it('should handle window being available', () => {
    // Ensure window is available
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });

    const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
  });
});

describe('useStudentRealtimeTimetable', () => {
  it('should configure for student stakeholder', () => {
    renderHook(() => useStudentRealtimeTimetable(
      'student-123',
      ['batch-1', 'batch-2']
    ));

    expect(mockService.subscribe).toHaveBeenCalledWith(
      'student-123',
      'student',
      { batchIds: ['batch-1', 'batch-2'] },
      ['websocket', 'push'],
      expect.any(Function)
    );
  });
});

describe('useFacultyRealtimeTimetable', () => {
  it('should configure for faculty stakeholder', () => {
    renderHook(() => useFacultyRealtimeTimetable(
      'faculty-123',
      ['faculty-1']
    ));

    expect(mockService.subscribe).toHaveBeenCalledWith(
      'faculty-123',
      'faculty',
      { facultyIds: ['faculty-1'] },
      ['websocket', 'push', 'email'],
      expect.any(Function)
    );
  });
});

describe('useHODRealtimeTimetable', () => {
  it('should configure for HOD stakeholder', () => {
    renderHook(() => useHODRealtimeTimetable(
      'hod-123',
      ['batch-1']
    ));

    expect(mockService.subscribe).toHaveBeenCalledWith(
      'hod-123',
      'hod',
      { batchIds: ['batch-1'] },
      ['websocket', 'email'],
      expect.any(Function)
    );
  });
});

describe('useRoomManagerRealtimeTimetable', () => {
  it('should configure for room manager stakeholder', () => {
    renderHook(() => useRoomManagerRealtimeTimetable(
      'manager-123',
      ['room-1'],
      ['building-1']
    ));

    expect(mockService.subscribe).toHaveBeenCalledWith(
      'manager-123',
      'room_manager',
      { roomIds: ['room-1'], buildingIds: ['building-1'] },
      ['websocket', 'email'],
      expect.any(Function)
    );
  });
});

describe('useRealtimeConnectionStatus', () => {
  it('should return connection status', () => {
    mockService.getConnectionState.mockReturnValue('connected');

    const { result } = renderHook(() => useRealtimeConnectionStatus());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should update when connection changes', () => {
    let connectionCallback: (data: { connected: boolean }) => void;
    mockService.on.mockImplementation(((event: string, callback: any) => {
      if (event === 'connection') {
        connectionCallback = callback;
      }
      return jest.fn();
    }) as any);

    const { result } = renderHook(() => useRealtimeConnectionStatus());

    act(() => {
      connectionCallback({ connected: true });
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRealtimeConnectionStatus());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
  });
});