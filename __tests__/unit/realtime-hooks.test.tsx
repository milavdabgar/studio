import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useRealtimeTimetable,
  useStudentRealtimeTimetable,
  useFacultyRealtimeTimetable,
  useHODRealtimeTimetable,
  useRoomManagerRealtimeTimetable,
  useRealtimeConnectionStatus
} from '@/hooks/useRealtimeTimetable';
import { getRealtimeTimetableService } from '@/lib/services/realtimeTimetableService';
import { NotificationService } from '@/lib/services/notificationService';

// Mock dependencies
jest.mock('@/lib/services/realtimeTimetableService');
jest.mock('@/lib/services/notificationService');

const mockGetRealtimeTimetableService = getRealtimeTimetableService as jest.MockedFunction<typeof getRealtimeTimetableService>;
const mockNotificationService = NotificationService as jest.MockedFunction<typeof NotificationService>;

// Mock service instance
const mockService = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  disconnect: jest.fn(),
  getConnectionState: jest.fn(),
  getActiveSubscriptions: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

describe('Real-time Timetable Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup service mock
    mockGetRealtimeTimetableService.mockReturnValue(mockService as any);
    mockService.getConnectionState.mockReturnValue('connected');
    mockService.getActiveSubscriptions.mockReturnValue([]);
    mockService.subscribe.mockReturnValue('subscription-123');
    mockService.on.mockReturnValue(() => {});

    // Mock DOM environment
    Object.defineProperty(window, 'window', {
      value: {},
      writable: true
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('useRealtimeTimetable Hook', () => {
    const defaultOptions = {
      userId: 'user123',
      stakeholderType: 'student' as const,
      filters: { batchIds: ['batch1'] },
      channels: ['websocket' as const],
      autoConnect: true
    };

    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
      expect(result.current.lastUpdate).toBeNull();
      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.unsubscribe).toBe('function');
      expect(typeof result.current.reconnect).toBe('function');
      expect(typeof result.current.getActiveSubscriptions).toBe('function');
    });

    it('creates service instance on mount', () => {
      renderHook(() => useRealtimeTimetable(defaultOptions));
      
      expect(mockNotificationService).toHaveBeenCalledWith({
        logger: expect.objectContaining({
          info: console.info,
          error: console.error,
          debug: console.debug,
          warn: console.warn
        })
      });
      expect(mockGetRealtimeTimetableService).toHaveBeenCalled();
    });

    it('sets up event listeners', () => {
      renderHook(() => useRealtimeTimetable(defaultOptions));
      
      expect(mockService.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('timetable_change', expect.any(Function));
    });

    it('auto-subscribes when autoConnect is true', () => {
      renderHook(() => useRealtimeTimetable(defaultOptions));
      
      expect(mockService.subscribe).toHaveBeenCalledWith(
        'user123',
        'student',
        { batchIds: ['batch1'] },
        ['websocket'],
        expect.any(Function)
      );
    });

    it('does not auto-subscribe when autoConnect is false', () => {
      renderHook(() => useRealtimeTimetable({
        ...defaultOptions,
        autoConnect: false
      }));
      
      expect(mockService.subscribe).not.toHaveBeenCalled();
    });

    it('handles connection state changes', () => {
      const onConnectionChange = jest.fn();
      const { result } = renderHook(() => useRealtimeTimetable({
        ...defaultOptions,
        onConnectionChange
      }));

      // Simulate connection event
      const connectionCallback = mockService.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      act(() => {
        connectionCallback?.({ connected: false });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
      expect(onConnectionChange).toHaveBeenCalledWith(false);
    });

    it('handles timetable change events', () => {
      const onTimetableChange = jest.fn();
      const mockEvent = {
        type: 'timetable_updated' as const,
        timetableId: 'tt123',
        timestamp: '2025-08-01T10:00:00Z',
        changes: { modified: ['entry1'] }
      };

      const { result } = renderHook(() => useRealtimeTimetable({
        ...defaultOptions,
        onTimetableChange
      }));

      // Simulate timetable change event
      const timetableCallback = mockService.on.mock.calls.find(
        call => call[0] === 'timetable_change'
      )?.[1];

      act(() => {
        timetableCallback?.(mockEvent);
      });

      expect(result.current.lastUpdate).toEqual(mockEvent);
      expect(onTimetableChange).toHaveBeenCalledWith(mockEvent);
    });

    it('manually subscribes when subscribe is called', () => {
      const { result } = renderHook(() => useRealtimeTimetable({
        ...defaultOptions,
        autoConnect: false
      }));

      act(() => {
        const subscriptionId = result.current.subscribe();
        expect(subscriptionId).toBe('subscription-123');
      });

      expect(mockService.subscribe).toHaveBeenCalledWith(
        'user123',
        'student',
        { batchIds: ['batch1'] },
        ['websocket'],
        expect.any(Function)
      );
    });

    it('unsubscribes when unsubscribe is called', () => {
      const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

      act(() => {
        result.current.unsubscribe();
      });

      expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
    });

    it('reconnects when reconnect is called', () => {
      const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

      act(() => {
        result.current.reconnect();
      });

      expect(mockService.disconnect).toHaveBeenCalled();
    });

    it('returns active subscriptions', () => {
      const mockSubscriptions = [{ id: 'sub1' }, { id: 'sub2' }];
      mockService.getActiveSubscriptions.mockReturnValue(mockSubscriptions);

      const { result } = renderHook(() => useRealtimeTimetable(defaultOptions));

      const subscriptions = result.current.getActiveSubscriptions();
      expect(subscriptions).toEqual(mockSubscriptions);
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useRealtimeTimetable(defaultOptions));

      unmount();

      expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
    });

    it('resubscribes when filters change', () => {
      const { rerender } = renderHook(
        ({ filters }) => useRealtimeTimetable({ ...defaultOptions, filters }),
        { initialProps: { filters: { batchIds: ['batch1'] } } }
      );

      mockService.subscribe.mockClear();

      rerender({ filters: { batchIds: ['batch2'] } });

      expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
      expect(mockService.subscribe).toHaveBeenCalledWith(
        'user123',
        'student',
        { batchIds: ['batch2'] },
        ['websocket'],
        expect.any(Function)
      );
    });
  });

  describe('useStudentRealtimeTimetable Hook', () => {
    it('configures student-specific parameters', () => {
      const onTimetableChange = jest.fn();
      renderHook(() => useStudentRealtimeTimetable(
        'student123',
        ['batch1', 'batch2'],
        onTimetableChange
      ));

      expect(mockService.subscribe).toHaveBeenCalledWith(
        'student123',
        'student',
        { batchIds: ['batch1', 'batch2'] },
        ['websocket', 'push'],
        onTimetableChange
      );
    });

    it('returns proper hook interface', () => {
      const { result } = renderHook(() => useStudentRealtimeTimetable(
        'student123',
        ['batch1']
      ));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.unsubscribe).toBe('function');
      expect(typeof result.current.reconnect).toBe('function');
    });
  });

  describe('useFacultyRealtimeTimetable Hook', () => {
    it('configures faculty-specific parameters', () => {
      const onTimetableChange = jest.fn();
      renderHook(() => useFacultyRealtimeTimetable(
        'faculty123',
        ['faculty1'],
        onTimetableChange
      ));

      expect(mockService.subscribe).toHaveBeenCalledWith(
        'faculty123',
        'faculty',
        { facultyIds: ['faculty1'] },
        ['websocket', 'push', 'email'],
        onTimetableChange
      );
    });

    it('handles faculty-specific events', () => {
      const onTimetableChange = jest.fn();
      const mockEvent = {
        type: 'timetable_updated' as const,
        timetableId: 'faculty-tt123',
        timestamp: '2025-08-01T10:00:00Z',
        changes: { modified: ['entry1'] }
      };

      renderHook(() => useFacultyRealtimeTimetable(
        'faculty123',
        ['faculty1'],
        onTimetableChange
      ));

      // Simulate timetable change event
      const timetableCallback = mockService.on.mock.calls.find(
        call => call[0] === 'timetable_change'
      )?.[1];

      act(() => {
        timetableCallback?.(mockEvent);
      });

      expect(onTimetableChange).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('useHODRealtimeTimetable Hook', () => {
    it('configures HOD-specific parameters', () => {
      const onTimetableChange = jest.fn();
      renderHook(() => useHODRealtimeTimetable(
        'hod123',
        ['batch1', 'batch2'],
        onTimetableChange
      ));

      expect(mockService.subscribe).toHaveBeenCalledWith(
        'hod123',
        'hod',
        { batchIds: ['batch1', 'batch2'] },
        ['websocket', 'email'],
        onTimetableChange
      );
    });

    it('handles HOD-specific events', () => {
      const onTimetableChange = jest.fn();
      const mockEvent = {
        type: 'conflict_detected' as const,
        timetableId: 'dept-tt123',
        timestamp: '2025-08-01T10:00:00Z',
        conflicts: [{ type: 'faculty_overload', severity: 'high' }]
      };

      renderHook(() => useHODRealtimeTimetable(
        'hod123',
        ['batch1'],
        onTimetableChange
      ));

      // Simulate conflict event
      const timetableCallback = mockService.on.mock.calls.find(
        call => call[0] === 'timetable_change'
      )?.[1];

      act(() => {
        timetableCallback?.(mockEvent);
      });

      expect(onTimetableChange).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('useRoomManagerRealtimeTimetable Hook', () => {
    it('configures room manager-specific parameters', () => {
      const onTimetableChange = jest.fn();
      renderHook(() => useRoomManagerRealtimeTimetable(
        'rm123',
        ['room1', 'room2'],
        ['building1'],
        onTimetableChange
      ));

      expect(mockService.subscribe).toHaveBeenCalledWith(
        'rm123',
        'room_manager',
        { roomIds: ['room1', 'room2'], buildingIds: ['building1'] },
        ['websocket', 'email'],
        onTimetableChange
      );
    });
  });

  describe('useRealtimeConnectionStatus Hook', () => {
    it('provides connection status', () => {
      const { result } = renderHook(() => useRealtimeConnectionStatus());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
    });

    it('updates on connection changes', () => {
      const { result } = renderHook(() => useRealtimeConnectionStatus());

      // Simulate connection event
      const connectionCallback = mockService.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      act(() => {
        connectionCallback?.({ connected: false });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('cleans up event listeners on unmount', () => {
      const unsubscribeFn = jest.fn();
      mockService.on.mockReturnValue(unsubscribeFn);

      const { unmount } = renderHook(() => useRealtimeConnectionStatus());

      unmount();

      expect(unsubscribeFn).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles service initialization errors', () => {
      mockGetRealtimeTimetableService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: false
      }));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');

      consoleSpy.mockRestore();
    });

    it('handles subscription errors gracefully', () => {
      mockService.subscribe.mockImplementation(() => {
        throw new Error('Subscription failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        autoConnect: true
      }));

      act(() => {
        result.current.subscribe();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles event callback errors', () => {
      const onTimetableChange = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        onTimetableChange
      }));

      // Simulate timetable change event
      const timetableCallback = mockService.on.mock.calls.find(
        call => call[0] === 'timetable_change'
      )?.[1];

      act(() => {
        timetableCallback?.({
          type: 'timetable_updated',
          timetableId: 'tt123',
          timestamp: '2025-08-01T10:00:00Z'
        });
      });

      expect(onTimetableChange).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Optimizations', () => {
    it('memoizes callback functions', () => {
      const onTimetableChange = jest.fn();
      const { rerender } = renderHook(
        ({ callback }) => useRealtimeTimetable({
          userId: 'user123',
          stakeholderType: 'student',
          onTimetableChange: callback
        }),
        { initialProps: { callback: onTimetableChange } }
      );

      const initialSubscribe = mockService.subscribe;
      mockService.subscribe.mockClear();

      // Rerender with same callback
      rerender({ callback: onTimetableChange });

      // Should not resubscribe if callback reference is the same
      expect(mockService.subscribe).not.toHaveBeenCalled();
    });

    it('debounces rapid filter changes', async () => {
      const { rerender } = renderHook(
        ({ filters }) => useRealtimeTimetable({
          userId: 'user123',
          stakeholderType: 'student',
          filters
        }),
        { initialProps: { filters: { batchIds: ['batch1'] } } }
      );

      mockService.subscribe.mockClear();

      // Rapid filter changes
      rerender({ filters: { batchIds: ['batch2'] } });
      rerender({ filters: { batchIds: ['batch3'] } });
      rerender({ filters: { batchIds: ['batch4'] } });

      await waitFor(() => {
        expect(mockService.subscribe).toHaveBeenCalledTimes(1);
        expect(mockService.subscribe).toHaveBeenLastCalledWith(
          'user123',
          'student',
          { batchIds: ['batch4'] },
          ['websocket'],
          expect.any(Function)
        );
      });
    });
  });

  describe('Browser Environment Handling', () => {
    it('handles server-side rendering', () => {
      // Mock server environment
      Object.defineProperty(window, 'window', {
        value: undefined,
        writable: true
      });

      const { result } = renderHook(() => useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student'
      }));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('Memory Leak Prevention', () => {
    it('properly cleans up all subscriptions on unmount', () => {
      const { unmount } = renderHook(() => useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student',
        filters: { batchIds: ['batch1'] },
        channels: ['websocket', 'push']
      }));

      unmount();

      expect(mockService.unsubscribe).toHaveBeenCalledWith('subscription-123');
    });

    it('removes event listeners on unmount', () => {
      const unsubscribeFn1 = jest.fn();
      const unsubscribeFn2 = jest.fn();
      mockService.on
        .mockReturnValueOnce(unsubscribeFn1)
        .mockReturnValueOnce(unsubscribeFn2);

      const { unmount } = renderHook(() => useRealtimeTimetable({
        userId: 'user123',
        stakeholderType: 'student'
      }));

      unmount();

      expect(unsubscribeFn1).toHaveBeenCalled();
      expect(unsubscribeFn2).toHaveBeenCalled();
    });
  });
});